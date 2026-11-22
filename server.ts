/// <reference types="node" />
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { prepareConversationPayload } from './src/utils/assistantPrompt.ts';
import { extractVerifiedSources } from './src/utils/grounding.ts';
import {
  isQuotaOrRateLimitError,
  parseStructuredAssistantReply,
} from './src/utils/groundingPolicy.ts';

const PRIMARY_MODEL = 'gemini-4-hydrogen';
const BACKUP_MODEL = 'gemini-3.1-flash-lite';
const PORT = Number(process.env.PORT || 3000);

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Concise 1-2 sentence overview or clarifying question.',
    },
    action_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Practical step-by-step advice bullets or clarifying questions.',
    },
    confidence_level: {
      type: Type.STRING,
      description: 'One of HIGH, MEDIUM, or LOW.',
    },
    verified_sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          uri: { type: Type.STRING },
        },
      },
      description: 'Verified web source links when live search is active; empty otherwise.',
    },
  },
  required: ['summary', 'action_steps', 'confidence_level', 'verified_sources'],
};

function extractReadableApiError(err: unknown): string {
  const rawMsg =
    err instanceof Error ? err.message : 'Unable to get a response right now.';
  try {
    const parsed = JSON.parse(rawMsg) as { error?: { message?: string } };
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Non-JSON error message; return raw text below.
  }
  return rawMsg;
}

function isTransientUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const record = err as Record<string, unknown>;
  const status = Number(record.status ?? record.code ?? 0);
  if (status === 503) return true;
  const msg = typeof record.message === 'string' ? record.message.toLowerCase() : '';
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded')
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s (503)`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function createServerGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
    if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.too.large') {
      res.status(413).json({ error: 'Request payload is too large.' });
      return;
    }
    next(err);
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object.' });
      return;
    }

    let prepared;
    try {
      prepared = prepareConversationPayload(
        body.messages,
        typeof body.context === 'object' && body.context !== null
          ? (body.context as Record<string, unknown>)
          : undefined
      );
    } catch (validationErr: unknown) {
      res.status(400).json({
        error:
          validationErr instanceof Error
            ? validationErr.message
            : 'Invalid chat request.',
      });
      return;
    }

    const apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
    if (!apiKey) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured. Please check your key in Settings > Secrets.',
      });
      return;
    }

    const ai = createServerGeminiClient(apiKey);

    const invokeModel = async (
      model: string,
      options: {
        withSearch: boolean;
        withJsonSchema: boolean;
        systemInstruction: string;
      }
    ) => {
      return ai.models.generateContent({
        model,
        contents: prepared.contents,
        config: {
          systemInstruction: options.systemInstruction,
          ...(model === PRIMARY_MODEL
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
          ...(options.withSearch ? { tools: [{ googleSearch: {} }] } : {}),
          ...(options.withJsonSchema
            ? {
                responseMimeType: 'application/json',
                responseSchema: RESPONSE_SCHEMA,
              }
            : {}),
        },
      });
    };

    let preferBackupModel = false;

    const runGenerate = async (options: {
      withSearch: boolean;
      withJsonSchema: boolean;
      systemInstruction: string;
    }) => {
      if (!preferBackupModel) {
        try {
          return await withTimeout(
            invokeModel(PRIMARY_MODEL, options),
            10000,
            PRIMARY_MODEL
          );
        } catch (err: unknown) {
          if (isTransientUnavailableError(err)) {
            preferBackupModel = true;
          } else {
            throw err;
          }
        }
      }

      try {
        return await withTimeout(
          invokeModel(BACKUP_MODEL, options),
          18000,
          BACKUP_MODEL
        );
      } catch (backupErr: unknown) {
        if (isTransientUnavailableError(backupErr)) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          return await withTimeout(
            invokeModel(BACKUP_MODEL, options),
            18000,
            BACKUP_MODEL
          );
        }
        throw backupErr;
      }
    };

    let response;
    let isFallback = false;
    let searchUsed = prepared.useSearch;

    try {
      if (prepared.useSearch) {
        try {
          response = await runGenerate({
            withSearch: true,
            withJsonSchema: true,
            systemInstruction: prepared.systemInstruction,
          });
        } catch (primaryErr: unknown) {
          if (isQuotaOrRateLimitError(primaryErr)) {
            isFallback = true;
            searchUsed = false;
            response = await runGenerate({
              withSearch: false,
              withJsonSchema: true,
              systemInstruction: prepared.fallbackSystemInstruction,
            });
          } else {
            const errStatus =
              typeof primaryErr === 'object' && primaryErr !== null && 'status' in primaryErr
                ? Number((primaryErr as { status?: unknown }).status)
                : 0;
            if (errStatus === 400) {
              try {
                response = await runGenerate({
                  withSearch: true,
                  withJsonSchema: false,
                  systemInstruction: prepared.systemInstruction,
                });
              } catch (searchOnlyErr: unknown) {
                if (isQuotaOrRateLimitError(searchOnlyErr)) {
                  isFallback = true;
                  searchUsed = false;
                  response = await runGenerate({
                    withSearch: false,
                    withJsonSchema: true,
                    systemInstruction: prepared.fallbackSystemInstruction,
                  });
                } else {
                  throw searchOnlyErr;
                }
              }
            } else {
              throw primaryErr;
            }
          }
        }
      } else {
        response = await runGenerate({
          withSearch: false,
          withJsonSchema: true,
          systemInstruction: prepared.systemInstruction,
        });
      }
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      if (status === 400 || status === 403) {
        res.status(status).json({
          error:
            'Unable to reach Gemini due to API key configuration. Please verify GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }
      if (isQuotaOrRateLimitError(err)) {
        res.status(429).json({
          error:
            'Assistant quota is temporarily busy even without live search. Please wait a moment and click Retry.',
        });
        return;
      }
      res.status(502).json({ error: extractReadableApiError(err) });
      return;
    }

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      res.status(502).json({
        error: 'Assistant returned an empty response. Please try rephrasing your question.',
      });
      return;
    }

    const groundingMeta = response.candidates?.[0]?.groundingMetadata;
    const groundedSources = searchUsed ? extractVerifiedSources(groundingMeta) : [];
    const structured = parseStructuredAssistantReply(rawText, {
      isFallback,
      searchUsed,
      groundedSources,
    });

    res.json({
      ...structured,
      piiRedacted: prepared.piiRedacted,
      piiTypes: prepared.piiTypes,
    });
  });

  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distDir, 'index.html');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JoziHelper server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();

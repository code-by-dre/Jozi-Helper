import {
  type ChatContextInput,
  type IncomingChatMessage,
} from '../utils/assistantPrompt';
import { type StructuredAssistantResponse } from '../utils/groundingPolicy';
import { type PiiType } from '../utils/popia';

export interface JoziHelperReply extends StructuredAssistantResponse {
  piiRedacted: boolean;
  piiTypes: PiiType[];
}

export async function askJoziHelper(
  messages: IncomingChatMessage[],
  context: ChatContextInput
): Promise<JoziHelperReply> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  const rawBody = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    const candidate = JSON.parse(rawBody);
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      parsed = candidate as Record<string, unknown>;
    }
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const apiError =
      parsed && typeof parsed.error === 'string' && parsed.error.trim()
        ? parsed.error.trim()
        : `Unable to reach JoziHelper server (HTTP ${response.status}).`;
    throw new Error(apiError);
  }

  if (!parsed) {
    throw new Error('Server returned an unexpected non-JSON response. Please try again.');
  }

  return parsed as unknown as JoziHelperReply;
}

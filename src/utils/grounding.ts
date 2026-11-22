export interface GroundingSource {
  title: string;
  uri: string;
  domain: string;
}

interface RawGroundingChunk {
  web?: {
    uri?: unknown;
    title?: unknown;
  };
}

interface RawGroundingMetadata {
  groundingChunks?: RawGroundingChunk[];
  webSearchQueries?: unknown;
}

export function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function extractVerifiedSources(groundingMetadata: unknown): GroundingSource[] {
  if (!groundingMetadata || typeof groundingMetadata !== 'object') {
    return [];
  }

  const meta = groundingMetadata as RawGroundingMetadata;
  if (!Array.isArray(meta.groundingChunks)) {
    return [];
  }

  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of meta.groundingChunks) {
    const uri = typeof chunk?.web?.uri === 'string' ? chunk.web.uri.trim() : '';
    if (!uri || !isSafeHttpUrl(uri) || seen.has(uri)) {
      continue;
    }

    seen.add(uri);
    const domain = extractDomain(uri);
    const rawTitle = typeof chunk?.web?.title === 'string' ? chunk.web.title.trim() : '';
    const title = rawTitle || domain || 'Verified source';

    sources.push({
      title,
      uri,
      domain,
    });
  }

  return sources;
}

import { isSafeHttpUrl, extractDomain, type GroundingSource } from './grounding.ts';

export type LiveSearchMode = 'auto' | 'always' | 'off';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface StructuredAssistantResponse {
  summary: string;
  action_steps: string[];
  confidence_level: ConfidenceLevel;
  verified_sources: GroundingSource[];
  searchModeUsed?: 'grounded' | 'fallback' | 'direct';
}

const KNOWN_SUBURB_OR_CORRIDOR_TOKENS = [
  'soweto',
  'sandton',
  'randburg',
  'roodepoort',
  'midrand',
  'alexandra',
  'rosebank',
  'melville',
  'braamfontein',
  'cbd',
  'joburg south',
  'johannesburg south',
  'orlando',
  'diepkloof',
  'naledi',
  'fourways',
  'bryanston',
  'parktown',
  'auckland park',
  'yeoville',
  'hillbrow',
  'berea',
  'eldorado',
  'orange farm',
  'diepsloot',
  'ivory park',
  'lenasia',
  'bedfordview',
  'kempton',
  'germiston',
  'park station',
  'gandhi square',
  'marlboro',
  'rhodesfield',
  'hatfield',
  'or tambo',
  'florida',
  'mondeor',
  'southgate',
  'northcliff',
  'brixton',
  'newtown',
  'ferndale',
  'hyde park',
  'benmore',
];

const CITYWIDE_SYSTEM_TOKENS = [
  'gautrain',
  'rea vaya',
  'putco',
  'metrobus',
  'metrorail',
  'prasa',
  'city power',
  'joburg water',
  'johannesburg water',
  'pikitup',
  'eskom',
  'esp',
  'expanded social package',
  'sassa',
  'pirb',
  'ecasa',
  'lpgas',
  'lpgsasa',
];

const FACTUAL_QUERY_TOKENS = [
  'hour',
  'hours',
  'open',
  'opening',
  'close',
  'closing',
  'schedule',
  'schedules',
  'timetable',
  'fare',
  'fares',
  'price',
  'prices',
  'cost',
  'costs',
  'tariff',
  'tariffs',
  'outage',
  'outages',
  'contact',
  'contacts',
  'number',
  'numbers',
  'phone',
  'clinic',
  'clinics',
  'home affairs',
  'plumber',
  'plumbing',
  'electrician',
  'electrical',
  'handyman',
  'repair',
  'appliance',
  'gas',
  'rebate',
  'rates',
  'licensing',
  'bus',
  'train',
  'route',
  'routes',
  'verify',
  'latest',
  'current',
  'today',
  'service',
  'services',
  'provider',
  'providers',
];

const VAGUE_NEAR_ME_PATTERN = /\b(near me|my area|my suburb|around here|closest|nearest)\b/i;

export function shouldAttachGoogleSearch(input: {
  mode: LiveSearchMode;
  latestMessage: string;
  suburb?: string;
}): {
  useSearch: boolean;
  reason:
    | 'manual_off'
    | 'manual_always'
    | 'clarify_missing_suburb'
    | 'factual_local_query'
    | 'general_guidance';
} {
  if (input.mode === 'off') {
    return { useSearch: false, reason: 'manual_off' };
  }
  if (input.mode === 'always') {
    return { useSearch: true, reason: 'manual_always' };
  }

  const text = input.latestMessage.trim().toLowerCase();
  const hasSelectedSuburb = Boolean(
    input.suburb &&
      input.suburb.trim() &&
      input.suburb !== 'Not specified (ask me first)'
  );
  const mentionsSuburb = KNOWN_SUBURB_OR_CORRIDOR_TOKENS.some((t) => text.includes(t));
  const mentionsCitywideAuthority = CITYWIDE_SYSTEM_TOKENS.some((t) => text.includes(t));
  const isFactualQuery = FACTUAL_QUERY_TOKENS.some((t) => text.includes(t));

  // If the user hasn't picked a suburb and didn't name one (nor a city-wide system),
  // skip search on this turn so JoziHelper can clarify the missing suburb first.
  if (!hasSelectedSuburb && !mentionsSuburb) {
    if (VAGUE_NEAR_ME_PATTERN.test(text) || !mentionsCitywideAuthority) {
      return { useSearch: false, reason: 'clarify_missing_suburb' };
    }
  }

  if (isFactualQuery || mentionsCitywideAuthority) {
    return { useSearch: true, reason: 'factual_local_query' };
  }

  return { useSearch: false, reason: 'general_guidance' };
}

export function isQuotaOrRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const record = err as Record<string, unknown>;
  const status = Number(record.status ?? record.code ?? 0);
  if (status === 429) {
    return true;
  }
  const msg = typeof record.message === 'string' ? record.message.toLowerCase() : '';
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

const FALLBACK_NOTICE =
  'Live search is temporarily unavailable, so I cannot verify live hours or prices right now.';

export function stripJsonCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const embeddedFence = /```(?:json)?\s*\n?([\s\S]*?)\n?```/i.exec(trimmed);
  if (embeddedFence) {
    return embeddedFence[1].trim();
  }
  return trimmed
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

function normalizeConfidence(value: unknown, fallbackDefault: ConfidenceLevel): ConfidenceLevel {
  if (typeof value !== 'string') return fallbackDefault;
  const upper = value.trim().toUpperCase();
  if (upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW') {
    return upper;
  }
  return fallbackDefault;
}

export function parseStructuredAssistantReply(
  rawText: string,
  options: {
    isFallback: boolean;
    searchUsed: boolean;
    groundedSources: GroundingSource[];
  }
): StructuredAssistantResponse {
  const cleaned = stripJsonCodeFence(rawText);
  let parsed: Record<string, unknown> | null = null;

  try {
    const candidate = JSON.parse(cleaned);
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      parsed = candidate as Record<string, unknown>;
    }
  } catch {
    parsed = null;
  }

  let summary = '';
  let actionSteps: string[] = [];
  let confidence: ConfidenceLevel = options.isFallback
    ? 'LOW'
    : options.groundedSources.length > 0
      ? 'HIGH'
      : 'MEDIUM';

  if (parsed) {
    if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
      summary = parsed.summary.trim();
    }
    if (Array.isArray(parsed.action_steps)) {
      actionSteps = parsed.action_steps
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim());
    }
    if (!options.isFallback) {
      confidence = normalizeConfidence(parsed.confidence_level, confidence);
    }
  } else {
    // Plain text fallback: render cleanly inside the summary card without throwing
    summary = rawText.trim() || 'Here is practical guidance for Johannesburg residents.';
    actionSteps = [];
  }

  if (options.isFallback) {
    confidence = 'LOW';
    if (!summary.toLowerCase().includes('live search is temporarily unavailable')) {
      summary = summary ? `${FALLBACK_NOTICE} ${summary}` : FALLBACK_NOTICE;
    }
    return {
      summary,
      action_steps: actionSteps,
      confidence_level: 'LOW',
      verified_sources: [],
      searchModeUsed: 'fallback',
    };
  }

  let finalSources: GroundingSource[] = [];
  if (options.searchUsed) {
    if (options.groundedSources.length > 0) {
      finalSources = options.groundedSources;
    } else if (parsed && Array.isArray(parsed.verified_sources)) {
      const seen = new Set<string>();
      for (const item of parsed.verified_sources) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        const uri = typeof rec.uri === 'string' ? rec.uri.trim() : '';
        if (!uri || !isSafeHttpUrl(uri) || seen.has(uri)) continue;
        seen.add(uri);
        const domain = extractDomain(uri);
        const title =
          typeof rec.title === 'string' && rec.title.trim()
            ? rec.title.trim()
            : domain || 'Verified source';
        finalSources.push({ title, uri, domain });
      }
    }
  }

  return {
    summary: summary || 'Please share a bit more detail so I can help accurately.',
    action_steps: actionSteps,
    confidence_level: confidence,
    verified_sources: finalSources,
    searchModeUsed: options.searchUsed ? 'grounded' : 'direct',
  };
}

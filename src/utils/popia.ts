export type PiiType = 'sa_id' | 'phone' | 'email' | 'address' | 'bank';

export interface PiiScanResult {
  hasPii: boolean;
  types: PiiType[];
  redactedText: string;
  summary: string;
}

const PII_LABELS: Record<PiiType, string> = {
  sa_id: 'SA ID number',
  phone: 'phone number',
  email: 'email address',
  address: 'street address',
  bank: 'banking or card details',
};

const SA_ID_REGEX = /\b\d{6}[\s-]?\d{4}[\s-]?\d{3}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const SA_PHONE_REGEX =
  /(?:\+27|0)(?:[\s-]?\d){9}\b/g;
const CARD_REGEX = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g;
const BANK_KEYWORD_REGEX =
  /\b(?:account(?:\s+no|\s+number)?|acc(?:\s+no)?|iban|branch\s+code|card(?:\s+no|\s+number)?)\s*[:#-]?\s*\d{6,16}\b/gi;
const STREET_ADDRESS_REGEX =
  /\b\d{1,5}\s+(?!(?:min(?:ute)?s?|hours?|hrs?|km|m|rand|rands|days?|weeks?|months?|years?)\b)(?:[A-Za-z][A-Za-z'-]{1,24}\s+){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Crescent|Cres|Close|Cl|Boulevard|Blvd|Lane|Ln)\b\.?/gi;

export function detectAndRedactPii(input: string): PiiScanResult {
  if (!input || !input.trim()) {
    return {
      hasPii: false,
      types: [],
      redactedText: input,
      summary: '',
    };
  }

  const found = new Set<PiiType>();
  let redacted = input;

  if (CARD_REGEX.test(redacted)) {
    found.add('bank');
    redacted = redacted.replace(CARD_REGEX, '[CARD REDACTED]');
  }
  CARD_REGEX.lastIndex = 0;

  if (BANK_KEYWORD_REGEX.test(redacted)) {
    found.add('bank');
    redacted = redacted.replace(BANK_KEYWORD_REGEX, '[BANK DETAILS REDACTED]');
  }
  BANK_KEYWORD_REGEX.lastIndex = 0;

  if (SA_ID_REGEX.test(redacted)) {
    found.add('sa_id');
    redacted = redacted.replace(SA_ID_REGEX, '[ID NUMBER REDACTED]');
  }
  SA_ID_REGEX.lastIndex = 0;

  if (EMAIL_REGEX.test(redacted)) {
    found.add('email');
    redacted = redacted.replace(EMAIL_REGEX, '[EMAIL REDACTED]');
  }
  EMAIL_REGEX.lastIndex = 0;

  if (SA_PHONE_REGEX.test(redacted)) {
    found.add('phone');
    redacted = redacted.replace(SA_PHONE_REGEX, '[PHONE REDACTED]');
  }
  SA_PHONE_REGEX.lastIndex = 0;

  if (STREET_ADDRESS_REGEX.test(redacted)) {
    found.add('address');
    redacted = redacted.replace(STREET_ADDRESS_REGEX, '[ADDRESS REDACTED]');
  }
  STREET_ADDRESS_REGEX.lastIndex = 0;

  const types = Array.from(found);
  const summary =
    types.length > 0
      ? `Detected ${types.map((t) => PII_LABELS[t]).join(', ')}`
      : '';

  return {
    hasPii: types.length > 0,
    types,
    redactedText: redacted,
    summary,
  };
}

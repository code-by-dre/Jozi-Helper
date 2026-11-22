export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; label: string; href: string };

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; tokens: InlineToken[] }
  | { type: 'paragraph'; tokens: InlineToken[] }
  | { type: 'ul'; items: InlineToken[][] }
  | { type: 'ol'; items: InlineToken[][] };

function isSafeLinkHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:[^()\s]+|\([^)]*\))+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const segment = match[0];
    if (segment.startsWith('**') && segment.endsWith('**')) {
      tokens.push({ type: 'bold', value: segment.slice(2, -2) });
    } else if (segment.startsWith('`') && segment.endsWith('`')) {
      tokens.push({ type: 'code', value: segment.slice(1, -1) });
    } else if (segment.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\((.+)\)$/.exec(segment);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (isSafeLinkHref(href.trim())) {
          tokens.push({ type: 'link', label, href: href.trim() });
        } else {
          tokens.push({ type: 'text', value: label });
        }
      } else {
        tokens.push({ type: 'text', value: segment });
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }];
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({
        type: 'heading',
        level,
        tokens: parseInlineTokens(headingMatch[2]),
      });
      i += 1;
      continue;
    }

    if (/^(?:[-*•])\s+/.test(trimmed)) {
      const items: InlineToken[][] = [];
      while (i < lines.length) {
        const line = lines[i].trim();
        const bulletMatch = /^(?:[-*•])\s+(.+)$/.exec(line);
        if (!bulletMatch) break;
        items.push(parseInlineTokens(bulletMatch[1]));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: InlineToken[][] = [];
      while (i < lines.length) {
        const line = lines[i].trim();
        const numMatch = /^\d+\.\s+(.+)$/.exec(line);
        if (!numMatch) break;
        items.push(parseInlineTokens(numMatch[1]));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const line = lines[i].trim();
      if (
        !line ||
        /^(#{1,3})\s+/.test(line) ||
        /^(?:[-*•])\s+/.test(line) ||
        /^\d+\.\s+/.test(line)
      ) {
        break;
      }
      paragraphLines.push(line);
      i += 1;
    }
    blocks.push({
      type: 'paragraph',
      tokens: parseInlineTokens(paragraphLines.join(' ')),
    });
  }

  return blocks;
}

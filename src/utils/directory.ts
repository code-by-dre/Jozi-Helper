import { detectAndRedactPii } from './popia.ts';

export interface FilterableItem {
  category: string;
  name: string;
  description: string;
  scope: string;
}

export function filterDirectoryItems<T extends FilterableItem>(
  items: T[],
  activeCategory: string,
  searchTerm: string
): T[] {
  const q = searchTerm.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.scope.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

export interface ServiceReviewNote {
  id: string;
  rating: number;
  suburb: string;
  comment: string;
  createdAt: string;
  piiRedacted: boolean;
}

export function createPopiaSafeReviewNote(input: {
  rating: number;
  suburb: string;
  comment: string;
  id?: string;
  createdAt?: string;
}): ServiceReviewNote {
  const boundedRating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const cleanedComment = input.comment.trim().slice(0, 280);
  if (!cleanedComment) {
    throw new Error('Please write a brief review note before submitting.');
  }

  const scan = detectAndRedactPii(cleanedComment);
  const safeSuburb =
    input.suburb && input.suburb !== 'Not specified (ask me first)'
      ? input.suburb
      : 'Johannesburg';

  return {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rating: boundedRating,
    suburb: safeSuburb,
    comment: scan.redactedText,
    createdAt: input.createdAt ?? 'Session preview',
    piiRedacted: scan.hasPii,
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { createPopiaSafeReviewNote, filterDirectoryItems } from './directory.ts';

test('filterDirectoryItems filters by category and search term', () => {
  const items = [
    {
      category: 'plumbing',
      name: 'Plumbing Services',
      description: 'Burst pipes and geysers',
      scope: 'PIRB registered',
    },
    {
      category: 'electrical',
      name: 'Electrical Services',
      description: 'DB boards and CoC',
      scope: 'ECA(SA) registered',
    },
  ];

  assert.equal(filterDirectoryItems(items, 'all', '').length, 2);
  assert.equal(filterDirectoryItems(items, 'plumbing', '').length, 1);
  assert.equal(filterDirectoryItems(items, 'all', 'coc').length, 1);
  assert.equal(filterDirectoryItems(items, 'plumbing', 'coc').length, 0);
});

test('createPopiaSafeReviewNote clamps rating and redacts PII', () => {
  const note = createPopiaSafeReviewNote({
    rating: 7,
    suburb: 'Randburg',
    comment: 'Quick geyser fix, call 082 555 1234 for quote.',
    id: 'rev-1',
    createdAt: 'Session preview',
  });

  assert.equal(note.rating, 5);
  assert.equal(note.suburb, 'Randburg');
  assert.equal(note.piiRedacted, true);
  assert.equal(note.comment.includes('082 555 1234'), false);
  assert.equal(note.comment.includes('[PHONE REDACTED]'), true);
});

test('createPopiaSafeReviewNote rejects empty comment', () => {
  assert.throws(
    () =>
      createPopiaSafeReviewNote({
        rating: 4,
        suburb: 'Soweto',
        comment: '   ',
      }),
    /Please write a brief review note/
  );
});

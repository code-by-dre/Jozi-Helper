import test from 'node:test';
import assert from 'node:assert/strict';
import { extractVerifiedSources, isSafeHttpUrl } from './grounding.ts';

test('extractVerifiedSources filters unsafe URLs and deduplicates', () => {
  const metadata = {
    groundingChunks: [
      { web: { uri: 'https://www.citypower.co.za/outages', title: 'City Power Outages' } },
      { web: { uri: 'https://www.citypower.co.za/outages', title: 'Duplicate' } },
      { web: { uri: 'javascript:alert(1)', title: 'Bad Link' } },
      { web: { uri: 'https://gautrain.co.za/fares' } },
    ],
  };

  const sources = extractVerifiedSources(metadata);
  assert.equal(sources.length, 2);
  assert.deepEqual(sources[0], {
    title: 'City Power Outages',
    uri: 'https://www.citypower.co.za/outages',
    domain: 'citypower.co.za',
  });
  assert.deepEqual(sources[1], {
    title: 'gautrain.co.za',
    uri: 'https://gautrain.co.za/fares',
    domain: 'gautrain.co.za',
  });
});

test('isSafeHttpUrl rejects javascript and data schemes', () => {
  assert.equal(isSafeHttpUrl('https://joburg.org.za'), true);
  assert.equal(isSafeHttpUrl('http://example.com'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,hi'), false);
  assert.equal(isSafeHttpUrl('not-a-url'), false);
});

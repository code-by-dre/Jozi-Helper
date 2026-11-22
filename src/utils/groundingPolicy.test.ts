import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isQuotaOrRateLimitError,
  parseStructuredAssistantReply,
  shouldAttachGoogleSearch,
  stripJsonCodeFence,
} from './groundingPolicy.ts';

test('shouldAttachGoogleSearch skips search when suburb is missing and query is vague', () => {
  const res = shouldAttachGoogleSearch({
    mode: 'auto',
    latestMessage: 'What clinic is open near me?',
    suburb: 'Not specified (ask me first)',
  });
  assert.equal(res.useSearch, false);
  assert.equal(res.reason, 'clarify_missing_suburb');
});

test('shouldAttachGoogleSearch enables search when suburb is set and query asks for hours/prices/services', () => {
  const res = shouldAttachGoogleSearch({
    mode: 'auto',
    latestMessage: 'What are the public clinic opening hours?',
    suburb: 'Soweto',
  });
  assert.equal(res.useSearch, true);
  assert.equal(res.reason, 'factual_local_query');
});

test('shouldAttachGoogleSearch enables search for city-wide transit authorities even without suburb', () => {
  const res = shouldAttachGoogleSearch({
    mode: 'auto',
    latestMessage: 'What are the current Gautrain airport fares?',
    suburb: 'Not specified (ask me first)',
  });
  assert.equal(res.useSearch, true);
  assert.equal(res.reason, 'factual_local_query');
});

test('shouldAttachGoogleSearch respects manual off and always modes', () => {
  assert.equal(
    shouldAttachGoogleSearch({
      mode: 'off',
      latestMessage: 'Gautrain fares today',
      suburb: 'Sandton',
    }).useSearch,
    false
  );
  assert.equal(
    shouldAttachGoogleSearch({
      mode: 'always',
      latestMessage: 'Hello',
      suburb: 'Not specified (ask me first)',
    }).useSearch,
    true
  );
});

test('isQuotaOrRateLimitError identifies 429 status and quota messages', () => {
  assert.equal(isQuotaOrRateLimitError({ status: 429 }), true);
  assert.equal(
    isQuotaOrRateLimitError(new Error('RESOURCE_EXHAUSTED: quota exceeded')),
    true
  );
  assert.equal(isQuotaOrRateLimitError({ status: 500, message: 'Server error' }), false);
});

test('stripJsonCodeFence strips markdown json fences cleanly', () => {
  const fenced = '```json\n{"summary":"Hello","action_steps":[]}\n```';
  assert.equal(stripJsonCodeFence(fenced), '{"summary":"Hello","action_steps":[]}');
});

test('parseStructuredAssistantReply handles code-fenced JSON and plain text without throwing', () => {
  const fencedReply = '```json\n{"summary":"Clinic info","action_steps":["Arrive early"],"confidence_level":"MEDIUM","verified_sources":[]}\n```';
  const parsedFenced = parseStructuredAssistantReply(fencedReply, {
    isFallback: false,
    searchUsed: false,
    groundedSources: [],
  });
  assert.equal(parsedFenced.summary, 'Clinic info');
  assert.deepEqual(parsedFenced.action_steps, ['Arrive early']);

  const plainReply = 'Which Johannesburg suburb are you in?\n- Share your general area\n- Share your budget';
  const parsedPlain = parseStructuredAssistantReply(plainReply, {
    isFallback: false,
    searchUsed: false,
    groundedSources: [],
  });
  assert.equal(parsedPlain.summary, plainReply);
  assert.deepEqual(parsedPlain.action_steps, []);
});

test('parseStructuredAssistantReply enforces LOW confidence and empty sources in fallback mode', () => {
  const payload = parseStructuredAssistantReply(
    JSON.stringify({
      summary: 'General clinic guidance for Soweto.',
      action_steps: ['Arrive early before 07:30', 'Bring your green clinic card'],
      confidence_level: 'HIGH',
      verified_sources: [{ title: 'Fake', uri: 'https://example.com' }],
    }),
    {
      isFallback: true,
      searchUsed: false,
      groundedSources: [{ title: 'Stale', uri: 'https://stale.example', domain: 'stale.example' }],
    }
  );

  assert.equal(payload.confidence_level, 'LOW');
  assert.deepEqual(payload.verified_sources, []);
  assert.equal(
    payload.summary.includes('Live search is temporarily unavailable, so I cannot verify live hours or prices right now.'),
    true
  );
  assert.equal(payload.action_steps.length, 2);
  assert.equal(payload.searchModeUsed, 'fallback');
});

test('parseStructuredAssistantReply preserves grounded sources when search succeeds', () => {
  const payload = parseStructuredAssistantReply(
    JSON.stringify({
      summary: 'Gautrain operates daily across Johannesburg.',
      action_steps: ['Check station departure boards before boarding'],
      confidence_level: 'HIGH',
      verified_sources: [],
    }),
    {
      isFallback: false,
      searchUsed: true,
      groundedSources: [
        { title: 'Gautrain Official', uri: 'https://www.gautrain.co.za/', domain: 'gautrain.co.za' },
      ],
    }
  );

  assert.equal(payload.confidence_level, 'HIGH');
  assert.equal(payload.verified_sources.length, 1);
  assert.equal(payload.verified_sources[0].uri, 'https://www.gautrain.co.za/');
  assert.equal(payload.searchModeUsed, 'grounded');
});

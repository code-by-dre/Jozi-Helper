import test from 'node:test';
import assert from 'node:assert/strict';
import { detectAndRedactPii } from './popia.ts';

test('detects and redacts 13-digit SA ID numbers', () => {
  const res = detectAndRedactPii('My ID is 900101 5009 087 for SASSA.');
  assert.equal(res.hasPii, true);
  assert.deepEqual(res.types, ['sa_id']);
  assert.equal(res.redactedText, 'My ID is [ID NUMBER REDACTED] for SASSA.');
});

test('detects and redacts South African phone numbers', () => {
  const res1 = detectAndRedactPii('Call me on 082 555 1234 please');
  assert.equal(res1.hasPii, true);
  assert.deepEqual(res1.types, ['phone']);
  assert.equal(res1.redactedText, 'Call me on [PHONE REDACTED] please');

  const res2 = detectAndRedactPii('Reach me at +27 11 407 6111.');
  assert.equal(res2.hasPii, true);
  assert.deepEqual(res2.types, ['phone']);
  assert.equal(res2.redactedText, 'Reach me at [PHONE REDACTED].');
});

test('detects and redacts street addresses without triggering on durations or budgets', () => {
  const addr = detectAndRedactPii('I stay at 45 Jan Smuts Avenue in Rosebank.');
  assert.equal(addr.hasPii, true);
  assert.deepEqual(addr.types, ['address']);
  assert.equal(addr.redactedText, 'I stay at [ADDRESS REDACTED] in Rosebank.');

  const safe = detectAndRedactPii('I have R1500 budget and 20 minutes to spare in Soweto.');
  assert.equal(safe.hasPii, false);
  assert.deepEqual(safe.types, []);
  assert.equal(safe.redactedText, 'I have R1500 budget and 20 minutes to spare in Soweto.');
});

test('detects and redacts banking and email details', () => {
  const res = detectAndRedactPii('Account number: 62012345678 and email me@jozi.org.za');
  assert.equal(res.hasPii, true);
  assert.equal(res.types.includes('bank'), true);
  assert.equal(res.types.includes('email'), true);
  assert.equal(res.redactedText.includes('62012345678'), false);
  assert.equal(res.redactedText.includes('me@jozi.org.za'), false);
});

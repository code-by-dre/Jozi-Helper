import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdownBlocks, parseInlineTokens } from './markdown.ts';

test('parses headings, bullet lists, and paragraphs cleanly', () => {
  const md = `## City Power Steps

- Check your **suburb block** schedule
- Log a fault via [City Power](https://www.citypower.co.za)

Stay safe.`;

  const blocks = parseMarkdownBlocks(md);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[1].type, 'ul');
  if (blocks[1].type === 'ul') {
    assert.equal(blocks[1].items.length, 2);
  }
  assert.equal(blocks[2].type, 'paragraph');
});

test('strips unsafe javascript links while keeping safe https links', () => {
  const tokens = parseInlineTokens('Click [bad](javascript:alert(1)) or [good](https://joburg.org.za)');
  assert.deepEqual(tokens, [
    { type: 'text', value: 'Click ' },
    { type: 'text', value: 'bad' },
    { type: 'text', value: ' or ' },
    { type: 'link', label: 'good', href: 'https://joburg.org.za' },
  ]);
});

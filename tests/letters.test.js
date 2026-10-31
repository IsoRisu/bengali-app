import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const letters = JSON.parse(readFileSync(new URL('../src/data/letters.json', import.meta.url), 'utf-8'));
const FIELDS = ['id', 'glyph', 'name', 'transliteration', 'type', 'exampleWord', 'exampleTransliteration', 'exampleTranslation', 'order'];
const bare = (g) => g.normalize('NFC').replace(/\u25CC/g, '');

test('letters.json is a flat array with the full schema', () => {
  assert.ok(Array.isArray(letters));
  for (const l of letters) for (const f of FIELDS) assert.ok(f in l, `${l.id} lacks ${f}`);
});

test('no duplicate ids, glyphs or order values', () => {
  for (const key of ['id', 'order']) {
    assert.equal(new Set(letters.map((l) => l[key])).size, letters.length, `duplicate ${key}`);
  }
  assert.equal(new Set(letters.map((l) => bare(l.glyph))).size, letters.length, 'duplicate glyph');
});

test('conjunct examples actually contain the conjunct', () => {
  const types = ['conjunct', 'conjunct_adv', 'phala_conjunct', 'reph'];
  for (const l of letters.filter((x) => types.includes(x.type) && x.id !== 'reph')) {
    assert.ok(l.exampleWord.normalize('NFC').includes(bare(l.glyph)), `${l.id}: ${l.exampleWord} lacks ${l.glyph}`);
  }
});

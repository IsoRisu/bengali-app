// Splits content/words.source.json into small deck files that the app fetches at runtime
// (public/data/words/). Keeps the 2.5 MB dictionary out of the JS bundle.
//
//   - Words keep their original order, so the "most useful first" ordering still holds.
//   - Exact copies (same id and same content) are written once.
//   - Different words that share an id get a numbered id (shob, shob_2, ...) so progress
//     is tracked per word. The first one keeps its id, so saved progress stays valid.
//   - Nothing else is dropped or edited.
import fs from 'node:fs';
import path from 'node:path';

const DECK_SIZE = 200;
const src = path.resolve('content/words.source.json');
const outDir = path.resolve('public/data/words');

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const firstDeckName = raw.deck || 'First words';

const seenExact = new Set();
const usedIds = new Set();
const words = [];
let exactCopies = 0;
let renamed = 0;

for (const item of raw.items) {
  const exact = JSON.stringify(item);
  if (seenExact.has(exact)) { exactCopies++; continue; }
  seenExact.add(exact);
  let id = item.id;
  if (usedIds.has(id)) {
    let n = 2;
    while (usedIds.has(`${item.id}_${n}`)) n++;
    id = `${item.id}_${n}`;
    renamed++;
  }
  usedIds.add(id);
  words.push({ ...item, id });
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const pad = (n) => String(n).padStart(2, '0');
const decks = [];
for (let i = 0, d = 1; i < words.length; i += DECK_SIZE, d++) {
  const items = words.slice(i, i + DECK_SIZE);
  const id = `d${pad(d)}`;
  const title = d === 1 ? firstDeckName : `Words ${i + 1}–${i + items.length}`;
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify({ id, title, items }));
  decks.push({ id, title, count: items.length, ids: items.map((w) => w.id) });
}
fs.writeFileSync(path.join(outDir, 'index.json'),
  JSON.stringify({ total: words.length, decks }));

console.log(`words: ${raw.items.length} in source -> ${words.length} in ${decks.length} decks ` +
  `(${exactCopies} exact copies written once, ${renamed} ids made unique)`);

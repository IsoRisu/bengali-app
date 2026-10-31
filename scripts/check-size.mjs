// Reports the gzipped size of every file in dist/ against the brief's ~200KB budget.
// Usage: npm run build && npm run size   (optional argument: another folder)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const BUDGET = 200 * 1024;
const dir = process.argv[2] || 'dist';

function walk(d) {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let files;
try {
  files = walk(dir);
} catch {
  console.error(`No "${dir}" folder. Run "npm run build" first.`);
  process.exit(2);
}

const rows = files
  .map((f) => {
    const raw = readFileSync(f);
    return { file: relative(dir, f), raw: raw.length, gz: gzipSync(raw, { level: 9 }).length };
  })
  .sort((a, b) => b.gz - a.gz);

const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
console.log('gzip      raw       file');
for (const r of rows) console.log(`${kb(r.gz)} ${kb(r.raw)}  ${r.file}`);

const total = rows.reduce((t, r) => t + r.gz, 0);
console.log(`\nTotal gzipped: ${(total / 1024).toFixed(1)} KB of ${BUDGET / 1024} KB`);
if (total > BUDGET) {
  console.error('OVER BUDGET. Largest files are listed first.');
  process.exit(1);
}
if (total > BUDGET * 0.8) console.warn('Warning: above 80% of the budget.');

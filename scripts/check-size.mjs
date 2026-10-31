import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGET = 200 * 1024;
const WARN_THRESHOLD = 0.8 * BUDGET;
const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) results = results.concat(getFiles(fullPath));
    else results.push(fullPath);
  }
  return results;
}

const files = getFiles(distDir);
const fileSizes = files.map((file) => {
  const content = fs.readFileSync(file);
  const gz = zlib.gzipSync(content);
  return {
    path: path.relative(distDir, file),
    gzSize: gz.length,
  };
});

fileSizes.sort((a, b) => b.gzSize - a.gzSize);

console.log('\n--- Build Size Breakdown (gzipped) ---');
let totalGz = 0;
for (const f of fileSizes) {
  totalGz += f.gzSize;
  console.log(`${(f.gzSize / 1024).toFixed(2).padStart(8)} KB  ${f.path}`);
}

const totalKb = (totalGz / 1024).toFixed(2);
const budgetKb = (BUDGET / 1024).toFixed(2);
console.log('--------------------------------------');
console.log(`Total gzipped: ${totalKb} KB / ${budgetKb} KB (${((totalGz / BUDGET) * 100).toFixed(1)}%)\n`);

if (totalGz > BUDGET) {
  console.error(`❌ Build size exceeds budget of ${budgetKb} KB!`);
  process.exit(1);
} else if (totalGz >= WARN_THRESHOLD) {
  console.warn(`⚠️  Warning: Build size is above 80% of budget.`);
} else {
  console.log(`✅ Build size is well within the 200 KB budget.`);
}
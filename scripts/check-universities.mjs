// 校验 src/game/universities.ts 的数据完整性。
// 用法：node scripts/check-universities.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, 'src', 'game', 'universities.ts');
const text = fs.readFileSync(file, 'utf8');

const entries = [...text.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*short:\s*'([^']+)',\s*type:\s*'([^']+)',\s*level:\s*'([^']+)',\s*city:\s*'([^']+)',\s*majors:\s*\[([^\]]+)\],\s*description:\s*'([^']+)',\s*threshold:\s*(\d+)(?:,\s*rank:\s*(\d+)(?:,\s*rankYear:\s*(\d+))?)?,\s*color:\s*'([^']+)',\s*source:\s*'([^']+)'\s*\}/g)].map(m => ({
  id: m[1], name: m[2], short: m[3], type: m[4], level: m[5], city: m[6],
  majors: m[7].split(',').length, description: m[8], threshold: Number(m[9]),
  rank: m[10] ? Number(m[10]) : null, rankYear: m[11] ? Number(m[11]) : null, color: m[12], source: m[13]
}));

let failed = 0;
const fail = msg => { failed++; console.log('FAIL', msg); };
console.log('entries:', entries.length);

const ids = new Set();
for (const e of entries) {
  if (ids.has(e.id)) fail(`duplicate id ${e.id}`);
  ids.add(e.id);
  if (!/^(985|211|双一流|本科)$/.test(e.type)) fail(`${e.name}: bad type ${e.type}`);
  if (!/^(公办|民办|中外合作)$/.test(e.level)) fail(`${e.name}: bad level ${e.level}`);
  if (e.majors !== 4) fail(`${e.name}: ${e.majors} majors`);
  if (e.threshold < 100 || e.threshold > 750) fail(`${e.name}: threshold ${e.threshold}`);
  if (!/^#[0-9a-f]{6}$/i.test(e.color)) fail(`${e.name}: bad color ${e.color}`);
  if (!/^https?:\/\//.test(e.source)) fail(`${e.name}: bad source ${e.source}`);
  if (e.rankYear !== null && e.rankYear !== 2025 && e.rankYear !== 2026) fail(`${e.name}: bad rankYear ${e.rankYear}`);
  if (e.rank !== null && (e.rank < 1 || e.rank > 200000)) fail(`${e.name}: rank ${e.rank}`);
}
const typeCount = {};
for (const e of entries) typeCount[e.type] = (typeCount[e.type] || 0) + 1;
console.log('types:', typeCount);
const withRank = entries.filter(e => e.rank !== null).length;
console.log('with rank:', withRank);
if (failed) {
  console.log(`\n${failed} problem(s) found.`);
  process.exit(1);
}
console.log('all checks passed.');

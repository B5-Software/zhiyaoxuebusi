import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('.test-build', { recursive: true });
await build({ entryPoints: ['tests/world.test.ts', 'tests/romance.test.ts', 'tests/updates.test.ts', 'tests/guide-graduate.test.ts', 'tests/life.test.ts','tests/life-v31.test.ts'], outdir: '.test-build', outExtension: { '.js': '.mjs' }, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const result = spawnSync(process.execPath, ['--test', '.test-build/world.test.mjs', '.test-build/romance.test.mjs', '.test-build/updates.test.mjs', '.test-build/guide-graduate.test.mjs', '.test-build/life.test.mjs','.test-build/life-v31.test.mjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;

import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('.test-build', { recursive: true });
await build({ entryPoints: ['tests/world.test.ts'], outfile: '.test-build/world.test.mjs', bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const result = spawnSync(process.execPath, ['--test', '.test-build/world.test.mjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;

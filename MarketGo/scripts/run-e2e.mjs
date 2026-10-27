import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const env = {
  ...process.env,
  EXPO_PUBLIC_SUPABASE_URL: 'https://marketgo-test.supabase.co',
  EXPO_PUBLIC_SUPABASE_KEY: 'public-test-key',
};
const expo = join(dirname(require.resolve('expo/package.json')), 'bin/cli');
let result = spawnSync(
  process.execPath,
  [expo, 'export', '--platform', 'web', '--output-dir', 'dist-e2e', '--max-workers', '2'],
  { env, stdio: 'inherit' },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const cli = join(dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
result = spawnSync(process.execPath, [cli, 'test'], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);

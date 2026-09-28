import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

/** A fictional, reserved-style domain (not the deck's real host, if any): lets
 * the e2e suite exercise the "site URL configured" QR/share path without
 * pointing at anything real. See tests/e2e/deck.spec.js's own file:// build
 * (SITE_URL unset) for the "no site configured" fallback path. */
const E2E_SITE_URL = 'https://lintang-tankworks-deck.example/';

/**
 * Build the deck before the e2e suite runs, so `npm run test:e2e` is
 * self-sufficient even without a preceding `npm run build`.
 */
export default async function globalSetup() {
  execFileSync(process.execPath, ['build.mjs'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, SITE_URL: E2E_SITE_URL },
  });
}

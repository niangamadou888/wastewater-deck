import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

/**
 * global-setup.js builds dist/ with a fictional e2e SITE_URL. Rebuild it
 * afterwards with the caller's own environment, so `npm run check` leaves
 * dist/index.html exactly as `npm run build` would, never carrying the test
 * domain in its QR code, share link or link-preview tags.
 */
export default async function globalTeardown() {
  execFileSync(process.execPath, ['build.mjs'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

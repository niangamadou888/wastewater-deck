/**
 * Renders the portfolio images in this folder from the built deck:
 *
 *   npm run build && npm run portfolio:images
 *
 * - cover-desktop.png, selector-desktop.png, drawing-desktop.png: sheets 01,
 *   10 (filled in) and 07 at 1440 x 900 CSS px, device scale factor 2.
 * - phone-trio.png: sheets 01, 10 and 05 at 390 x 844 phone size, side by side
 *   on the deck's ground colour, 1600 px wide, laid out by a tiny HTML page.
 *
 * The deck is served at a site URL through a Playwright route, so the title
 * block's QR code encodes that URL exactly as it would when hosted. The URL is
 * SITE_URL, else the built deck's own og:url, else a fictional .example
 * address. Every other request is blocked and fails the run: the deck must
 * render with no network. Motion is reduced so every capture is repeatable.
 */
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST_HTML = path.resolve(HERE, '..', 'dist', 'index.html');
const FALLBACK_URL = 'https://lintang-tankworks-deck.example/';
const GROUND = '#1d232c';
const FRAME = 'rgb(232 236 239 / 0.34)';
const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const TRIO = { width: 1600, pad: 72, gap: 48, radius: 30 };
const SELECTOR = { pe: '20', toggle: 'Deep burial', model: 'LF-20V' };
const SETTLE_MS = 300;

const DESKTOP_SHOTS = [
  { file: 'cover-desktop.png', sheet: 1 },
  { file: 'selector-desktop.png', sheet: 10, fill: true },
  { file: 'drawing-desktop.png', sheet: 7 },
];
const PHONE_SHOTS = [
  { sheet: 1, alt: 'Sheet 01, cover, on a phone' },
  { sheet: 10, fill: true, alt: 'Sheet 10, the selector with LF-20V drawn, on a phone' },
  { sheet: 5, alt: 'Sheet 05, how the bio-filter works, on a phone' },
];

/** The deck's own og:url, SITE_URL, or the fictional default, as an http(s) folder URL. */
function resolveSiteUrl(html) {
  const fromMeta = html.match(/<meta property="og:url" content="([^"]+)">/)?.[1];
  const raw = process.env.SITE_URL || fromMeta || FALLBACK_URL;
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || !url.pathname.endsWith('/')) {
    throw new Error(`Site URL must be http(s) and end with a slash, got "${raw}".`);
  }
  return url.href;
}

async function loadDeck() {
  try {
    const html = await readFile(DIST_HTML, 'utf8');
    return { html, siteUrl: resolveSiteUrl(html) };
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('dist/index.html is missing. Run npm run build first.');
    throw error;
  }
}

/** A problem log that never mutates a shared array: add() swaps in a new copy. */
function problemLog(label) {
  let entries = [];
  return {
    add: (message) => { entries = [...entries, `${label}: ${message}`]; },
    list: () => entries,
  };
}

/** Serves the deck at its site URL and blocks every other request. */
async function serveDeck(context, deck, problems) {
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url === deck.siteUrl) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: deck.html });
    }
    problems.add(`blocked request to ${url}`);
    return route.abort();
  });
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.activeElement?.blur();
    window.getSelection()?.removeAllRanges();
  });
  await page.waitForTimeout(SETTLE_MS);
}

/** Types a PE and a site condition, as a visitor would, and waits for the model. */
async function fillSelector(page, size) {
  await page.locator('#selector-pe').fill(SELECTOR.pe);
  await page.locator('label.toggle', { hasText: SELECTOR.toggle }).click();
  await page.locator('[data-selector-result]').filter({ hasText: SELECTOR.model }).waitFor();
  if (size === 'phone') {
    await page.locator('label[for="selector-pe"]').evaluate((label) => {
      window.scrollTo(0, label.getBoundingClientRect().top + window.scrollY - 20);
    });
  }
}

/** Opens one sheet in a fresh context and returns its screenshot as a PNG buffer. */
async function captureSheet(browser, deck, size, shot) {
  const context = await browser.newContext({ ...SIZES[size], reducedMotion: 'reduce' });
  const problems = problemLog(`${size} sheet ${shot.sheet}`);
  try {
    await serveDeck(context, deck, problems);
    const page = await context.newPage();
    page.on('pageerror', (error) => problems.add(`page error ${error.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') problems.add(`console ${msg.text()}`); });
    await page.goto(`${deck.siteUrl}#${shot.sheet}`);
    await page.waitForFunction((i) => document.querySelector('[data-deck]')?.dataset.index === String(i), shot.sheet - 1);
    if (shot.fill) await fillSelector(page, size);
    await settle(page);
    const png = await page.screenshot({ path: shot.file ? path.join(HERE, shot.file) : undefined });
    return { png, problems: problems.list() };
  } finally {
    await context.close();
  }
}

function trioHtml(phones) {
  const { width, pad, gap, radius } = TRIO;
  const images = phones
    .map(({ png, alt }) => `<img src="data:image/png;base64,${png.toString('base64')}" alt="${alt}">`)
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Phone trio</title><style>
html, body { margin: 0; background: ${GROUND}; }
.trio { box-sizing: border-box; width: ${width}px; padding: ${pad}px; display: flex; gap: ${gap}px; }
.trio img { flex: 1 1 0; min-width: 0; height: auto; display: block; border-radius: ${radius}px;
  box-shadow: 0 0 0 1px ${FRAME}, 0 24px 48px -20px rgb(0 0 0 / 0.55); }
</style></head><body><main class="trio">${images}</main></body></html>`;
}

/** Lays the phone captures out side by side and writes phone-trio.png. */
async function renderTrio(browser, phones) {
  const context = await browser.newContext({ viewport: { width: TRIO.width, height: 900 }, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    await page.setContent(trioHtml(phones), { waitUntil: 'load' });
    await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
    await page.locator('.trio').screenshot({ path: path.join(HERE, 'phone-trio.png') });
  } finally {
    await context.close();
  }
}

/** Runs fn over items one at a time (one browser context open at once), collecting results. */
function mapInSeries(items, fn) {
  return items.reduce(async (done, item) => [...(await done), await fn(item)], Promise.resolve([]));
}

async function captureAll(browser, deck) {
  const desktop = await mapInSeries(DESKTOP_SHOTS, (shot) => captureSheet(browser, deck, 'desktop', shot));
  const phones = await mapInSeries(PHONE_SHOTS, async (shot) => ({
    ...(await captureSheet(browser, deck, 'phone', shot)),
    alt: shot.alt,
  }));
  await renderTrio(browser, phones);
  return [...desktop, ...phones].flatMap((result) => result.problems);
}

async function main() {
  const deck = await loadDeck();
  const browser = await chromium.launch();
  try {
    const problems = await captureAll(browser, deck);
    if (problems.length > 0) throw new Error(`Captures ran with problems:\n${problems.join('\n')}`);
    const files = [...DESKTOP_SHOTS.map((shot) => shot.file), 'phone-trio.png'];
    console.log(`Wrote ${files.map((file) => `portfolio/${file}`).join(', ')} (QR encodes ${deck.siteUrl}).`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

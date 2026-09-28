import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, '..', '..', 'dist', 'index.html');
const DECK_URL = `file://${DIST_PATH}`;

async function getIndex(page) {
  return page.locator('[data-deck]').getAttribute('data-index');
}

/**
 * A copy of the built dist/index.html with `data-share-url` cleared, as it
 * ships by default (no SITE_URL configured, see deck.config.json): exercises
 * the file:// "no site configured" fallback (tests/e2e's own build sets
 * SITE_URL so the rest of the suite can test the QR/share-link path too, see
 * global-setup.js). Caller must rm(dir, {recursive: true, force: true}).
 */
async function buildNoSiteUrlCopy() {
  const html = await readFile(DIST_PATH, 'utf8');
  const stripped = html.replace(/data-share-url="[^"]*"/, 'data-share-url=""');
  const dir = await mkdtemp(path.join(tmpdir(), 'wastewater-deck-no-site-'));
  const file = path.join(dir, 'index.html');
  await writeFile(file, stripped, 'utf8');
  return { dir, url: `file://${file}` };
}

async function dispatchSwipe(page, { startX, startY, endX, endY, startSelector = '[data-deck]' }) {
  await page.evaluate(
    ({ startX, startY, endX, endY, startSelector }) => {
      const startEl = document.querySelector(startSelector);
      const startTouch = new Touch({ identifier: 1, target: startEl, clientX: startX, clientY: startY });
      const endTouch = new Touch({ identifier: 1, target: startEl, clientX: endX, clientY: endY });
      startEl.dispatchEvent(
        new TouchEvent('touchstart', { touches: [startTouch], changedTouches: [startTouch], bubbles: true, cancelable: true })
      );
      startEl.dispatchEvent(
        new TouchEvent('touchend', { touches: [], changedTouches: [endTouch], bubbles: true, cancelable: true })
      );
    },
    { startX, startY, endX, endY, startSelector }
  );
}

test.describe('link preview metadata', () => {
  test('og:url is an absolute URL when SITE_URL is configured (this e2e build sets one)', async ({ page }) => {
    await page.goto(DECK_URL);
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toMatch(/^https:\/\/[^/]+\/$/);
  });

  test('og:image is an absolute URL to the cover, which ships beside the page with its provenance', async ({ page }) => {
    await page.goto(DECK_URL);
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toMatch(/^https:\/\/[^/]+\/og-cover\.jpg$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    expect(existsSync(path.join(path.dirname(DIST_PATH), 'og-cover.jpg'))).toBe(true);
    expect(existsSync(path.resolve(__dirname, '..', '..', 'src', 'assets', 'og-cover.jpg.json'))).toBe(true);
  });
});

test.describe('keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DECK_URL);
  });

  test('ArrowRight, ArrowDown and PageDown advance to the next slide', async ({ page }) => {
    await expect.poll(() => getIndex(page)).toBe('0');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe('1');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => getIndex(page)).toBe('2');
    await page.keyboard.press('Home');
    await page.keyboard.press('PageDown');
    await expect.poll(() => getIndex(page)).toBe('1');
  });

  test('Space advances, Shift+Space goes back', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect.poll(() => getIndex(page)).toBe('1');
    await page.keyboard.press('Shift+Space');
    await expect.poll(() => getIndex(page)).toBe('0');
  });

  test('ArrowLeft, ArrowUp and PageUp go to the previous slide', async ({ page }) => {
    await page.keyboard.press('End');
    await expect.poll(() => getIndex(page)).toBe('11');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => getIndex(page)).toBe('10');
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => getIndex(page)).toBe('9');
    await page.keyboard.press('End');
    await page.keyboard.press('PageUp');
    await expect.poll(() => getIndex(page)).toBe('10');
  });

  test('Home and End jump to the first and last slide', async ({ page }) => {
    await page.keyboard.press('End');
    await expect.poll(() => getIndex(page)).toBe('11');
    await page.keyboard.press('Home');
    await expect.poll(() => getIndex(page)).toBe('0');
  });

  test('typing in the PE input does not navigate the deck', async ({ page }) => {
    await page.evaluate(() => {
      window.location.hash = '#10'; // "Find your model" (the selector slide)
    });
    await expect.poll(() => getIndex(page)).toBe('9');
    const input = page.locator('#selector-pe');
    await input.fill(''); // the sheet opens on an example PE; start from a blank field
    await input.type('12');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => getIndex(page)).toBe('9');
    await expect(input).toHaveValue('12');
  });
});

test.describe('slide menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DECK_URL);
  });

  test('G opens the menu, Escape closes it, and clicking an item navigates', async ({ page }) => {
    const menu = page.locator('dialog[data-menu]');
    await expect(menu).not.toBeVisible();

    await page.keyboard.press('g');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();

    await page.keyboard.press('g');
    await expect(menu).toBeVisible();

    await menu.getByRole('button', { name: 'Find your model' }).click();
    await expect(menu).not.toBeVisible();
    await expect.poll(() => getIndex(page)).toBe('9');
  });

  test('a hashchange while the menu is open keeps it open, updates the index, and never drops focus to <body>', async ({
    page,
  }) => {
    const menu = page.locator('dialog[data-menu]');
    await page.keyboard.press('g');
    await expect(menu).toBeVisible();

    const items = menu.locator('[data-menu-goto]');
    await items.nth(1).focus();
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.dataset?.menuGoto))
      .toBe('1');

    // Simulate a browser Back/Forward navigation: it fires 'hashchange'
    // without any user gesture on the page.
    await page.evaluate(() => {
      window.location.hash = '#3';
    });

    await expect(menu).toBeVisible();
    await expect.poll(() => getIndex(page)).toBe('2');
    const activeTag = await page.evaluate(() => document.activeElement.tagName);
    expect(activeTag).not.toBe('BODY');
  });
});

test.describe('fullscreen', () => {
  test('F calls requestFullscreen', async ({ page }) => {
    await page.addInitScript(() => {
      window.__fullscreenCalls = 0;
      Element.prototype.requestFullscreen = function stubRequestFullscreen() {
        window.__fullscreenCalls += 1;
        return Promise.resolve();
      };
    });
    await page.goto(DECK_URL);
    await page.keyboard.press('f');
    await expect.poll(() => page.evaluate(() => window.__fullscreenCalls)).toBe(1);
  });

  test('the fullscreen button aria-pressed tracks fullscreenchange events', async ({ page }) => {
    await page.addInitScript(() => {
      let fullscreenElement = null;
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => fullscreenElement,
      });
      Element.prototype.requestFullscreen = function stubRequestFullscreen() {
        fullscreenElement = this;
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      };
      document.exitFullscreen = function stubExitFullscreen() {
        fullscreenElement = null;
        document.dispatchEvent(new Event('fullscreenchange'));
        return Promise.resolve();
      };
    });
    await page.goto(DECK_URL);

    const button = page.locator('[data-action="fullscreen"]');
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('marks data-fullscreen="unsupported" and hides the button when no Fullscreen API exists', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      delete Element.prototype.requestFullscreen;
      delete Element.prototype.webkitRequestFullscreen;
    });
    await page.goto(DECK_URL);

    await expect(page.locator('[data-deck]')).toHaveAttribute('data-fullscreen', 'unsupported');
    await expect(page.locator('[data-action="fullscreen"]')).toBeHidden();
  });
});

test.describe('pointer edge clicks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DECK_URL);
  });

  test('clicking the right/left 15% edge navigates on a fine-pointer device', async ({ page }) => {
    await expect.poll(() => getIndex(page)).toBe('0');

    const box = await page.locator('[data-deck]').boundingBox();
    const y = box.y + 50;

    await page.mouse.click(box.x + box.width - 5, y);
    await expect.poll(() => getIndex(page)).toBe('1');

    await page.mouse.click(box.x + 5, y);
    await expect.poll(() => getIndex(page)).toBe('0');
  });

  test('clicking an interactive element inside the edge zone does not navigate', async ({ page }) => {
    await expect.poll(() => getIndex(page)).toBe('0');

    await page.evaluate(() => {
      const activeSlide = document.querySelector('[data-slide].is-active');
      const link = document.createElement('a');
      link.href = '#';
      link.id = 'edge-zone-probe';
      link.textContent = 'ignore me';
      link.style.position = 'fixed';
      link.style.left = '0';
      link.style.top = '0';
      link.style.zIndex = '9999';
      activeSlide.appendChild(link);
    });

    await page.locator('#edge-zone-probe').click();
    await expect.poll(() => getIndex(page)).toBe('0');
  });
});

test.describe('keyboard navigation is blocked by any open dialog', () => {
  test('ArrowRight does not navigate the deck while the share dialog is open', async ({ page }) => {
    await page.goto(DECK_URL);
    await expect.poll(() => getIndex(page)).toBe('0');

    await page.locator('[data-chrome] [data-action="share"]').click();
    await expect(page.locator('dialog[data-share]')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe('0');

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[data-share]')).not.toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe('1');
  });
});

test.describe('focus management', () => {
  test('navigating away from a slide that has focus moves focus into the new slide, not <body>', async ({
    page,
  }) => {
    await page.goto(DECK_URL);

    await page.evaluate(() => {
      const activeSlide = document.querySelector('[data-slide].is-active');
      const link = document.createElement('a');
      link.href = '#';
      link.id = 'focus-probe';
      link.textContent = 'focus me';
      activeSlide.appendChild(link);
      link.focus();
    });
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id))
      .toBe('focus-probe');

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe('1');

    const activeTag = await page.evaluate(() => document.activeElement.tagName);
    expect(activeTag).not.toBe('BODY');
  });
});

test.describe('hash deep links', () => {
  test('loading #3 opens the third slide', async ({ page }) => {
    await page.goto(`${DECK_URL}#3`);
    await expect.poll(() => getIndex(page)).toBe('2');
  });
});

test.describe('touch swipe', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('swiping left advances, swiping right goes back', async ({ page }) => {
    await page.goto(DECK_URL);
    await expect.poll(() => getIndex(page)).toBe('0');

    await dispatchSwipe(page, { startX: 300, startY: 400, endX: 50, endY: 400 });
    await expect.poll(() => getIndex(page)).toBe('1');

    await dispatchSwipe(page, { startX: 50, startY: 400, endX: 300, endY: 400 });
    await expect.poll(() => getIndex(page)).toBe('0');
  });

  test('a swipe starting in a horizontally scrollable table does not navigate', async ({ page }) => {
    await page.goto(DECK_URL);
    await page.evaluate(() => {
      window.location.hash = '#10'; // "Find your model" (the selector slide)
    });
    await expect.poll(() => getIndex(page)).toBe('9');

    const cell = page.locator('table[data-model-table] tbody td').first();
    await expect(cell).toHaveCount(1);

    await dispatchSwipe(page, {
      startX: 300,
      startY: 400,
      endX: 50,
      endY: 400,
      startSelector: 'table[data-model-table] tbody td',
    });

    await expect.poll(() => getIndex(page)).toBe('9');
  });
});

test.describe('product selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DECK_URL);
    await page.evaluate(() => {
      window.location.hash = '#10'; // "Find your model" (the selector slide)
    });
    await expect.poll(() => getIndex(page)).toBe('9');
  });

  test('recommends LP-8 for 8 PE with no conditions', async ({ page }) => {
    await page.locator('#selector-pe').fill('8');
    await expect(page.locator('[data-selector-result]')).toContainText('LP-8');
  });

  test('recommends LF-20V for 20 PE', async ({ page }) => {
    await page.locator('#selector-pe').fill('20');
    await expect(page.locator('[data-selector-result]')).toContainText('LF-20V');
  });

  test('keeps LP-8 for 8 PE with a high water table: both bio-filter series suit it', async ({ page }) => {
    await page.locator('#selector-pe').fill('8');
    await page.locator('input[name="highWaterTable"]').check();
    const result = page.locator('[data-selector-result]');
    await expect(result.locator('.result-model')).toHaveText('LP-8');
    await expect(result).toContainText('both bio-filter series suit it');
  });

  test('recommends LF-8H for 8 PE with deep burial, as the maker\'s guide rule', async ({ page }) => {
    await page.locator('#selector-pe').fill('8');
    await page.locator('input[name="deepBurial"]').check();
    const result = page.locator('[data-selector-result]');
    await expect(result.locator('.result-model')).toHaveText('LF-8H');
    await expect(result).toContainText("Lintang Tankworks' guide rule");
  });

  test('recommends LT-40 for 35 PE', async ({ page }) => {
    await page.locator('#selector-pe').fill('35');
    await expect(page.locator('[data-selector-result]')).toContainText('LT-40');
  });

  test('shows an out-of-range message for 200 PE', async ({ page }) => {
    await page.locator('#selector-pe').fill('200');
    const result = page.locator('[data-selector-result]');
    await expect(result).toContainText('engineers');
    await expect(result).not.toContainText('LT-');
  });

  test('the WhatsApp enquiry link href contains the recommended model code, recipientless (no real company number)', async ({ page }) => {
    await page.locator('#selector-pe').fill('8');
    await expect(page.locator('[data-selector-result]')).toContainText('LP-8');
    const href = await page.locator('[data-whatsapp-enquiry]').first().getAttribute('href');
    expect(href).toContain('LP-8');
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
});

test.describe('share dialog', () => {
  test('renders an SVG QR code when a site URL is configured', async ({ page }) => {
    await page.goto(DECK_URL);
    await page.locator('[data-chrome] [data-action="share"]').click();
    const dialog = page.locator('dialog[data-share]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-qr] svg')).toHaveCount(1);
    await expect(dialog.locator('[data-share-url-text]')).toHaveText(/^https:\/\//);
  });

  test('clicking Copy link shows success/failure feedback text, then reverts', async ({ page }) => {
    await page.goto(DECK_URL);
    await page.locator('[data-chrome] [data-action="share"]').click();

    const button = page.locator('[data-copy-link]');
    await expect(button).toHaveText('Copy link');

    await button.click();
    await expect(button).toHaveText(/^(Link copied|Copy failed — copy the link manually)$/);

    await expect(button).toHaveText('Copy link', { timeout: 4000 });
  });

  test('with no site URL configured, file:// shows a "host the deck" message instead of a QR to a wrong site', async ({
    page,
  }) => {
    const { dir, url } = await buildNoSiteUrlCopy();
    try {
      await page.goto(url);
      await page.locator('[data-chrome] [data-action="share"]').click();
      const dialog = page.locator('dialog[data-share]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[data-qr] svg')).toHaveCount(0);
      await expect(dialog.locator('[data-share-url-text]')).toHaveText('Host the deck to share a link.');
      await expect(dialog.locator('[data-copy-link]')).toBeDisabled();
      await expect(dialog.locator('[data-share-whatsapp]')).toHaveAttribute('aria-disabled', 'true');
      // A disabled primary is an outline with muted ink, never the live cyan fill.
      const sendLook = await dialog.locator('[data-share-whatsapp]').evaluate((el) => {
        const cs = getComputedStyle(el);
        return { background: cs.backgroundColor, color: cs.color };
      });
      expect(sendLook.background).toBe('rgba(0, 0, 0, 0)');
      expect(sendLook.color).not.toBe('rgb(29, 35, 44)');
      await expect(page.locator('[data-qr-mini] svg')).toHaveCount(0);
      // The empty QR tiles read as a labelled XREF placeholder, never a blank white square.
      const tile = await page.locator('[data-qr-mini]').evaluate((el) => {
        const after = getComputedStyle(el, '::after').content;
        return { after, background: getComputedStyle(el).backgroundColor };
      });
      expect(tile.after).toContain('QR once hosted');
      expect(tile.background).not.toBe('rgb(232, 236, 239)');
      await expect(page.locator('.tb-qr-scan')).toBeHidden();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

test.describe('network and console hygiene', () => {
  test('makes zero requests to non-file URLs and logs zero console errors', async ({ page }) => {
    const badRequests = [];
    const consoleErrors = [];

    page.on('request', (request) => {
      if (!request.url().startsWith('file://')) {
        badRequests.push(request.url());
      }
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(DECK_URL);
    await page.evaluate(() => {
      window.location.hash = '#10'; // "Find your model" (the selector slide)
    });
    await page.locator('#selector-pe').fill('8');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('g');
    await page.keyboard.press('Escape');
    await page.locator('[data-chrome] [data-action="share"]').click();
    await page.locator('[data-copy-link]').click();
    await page.locator('dialog[data-share] [data-action="close"]').click();

    expect(badRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe('no horizontal overflow at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('every slide fits within the viewport width', async ({ page }) => {
    await page.goto(DECK_URL);
    const total = await page.locator('[data-slide]').count();

    for (let i = 0; i < total; i += 1) {
      await page.evaluate((index) => {
        window.location.hash = `#${index + 1}`;
      }, i);
      await expect.poll(() => getIndex(page)).toBe(String(i));

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `slide ${i} overflows horizontally`).toBeLessThanOrEqual(clientWidth);
    }
  });
});

test.describe('title block chrome', () => {
  test('sheet title, two-digit counter and drawing number update on navigation', async ({ page }) => {
    await page.goto(DECK_URL);
    const sheetTitle = page.locator('[data-sheet-title]');
    const counter = page.locator('[data-counter]');
    const drg = page.locator('[data-drg]');

    await expect(sheetTitle).toHaveText('Wastewater & sanitation systems');
    await expect(counter).toHaveText('01of12');
    await expect(counter.locator('.of')).toHaveText('of');
    await expect(drg).toHaveText('WW-P1-01');

    await page.evaluate(() => {
      window.location.hash = '#10';
    });
    await expect.poll(() => getIndex(page)).toBe('9');
    await expect(sheetTitle).toHaveText('Find your model');
    await expect(counter).toHaveText('10of12');
    await expect(drg).toHaveText('WW-P1-10');
  });

  test('renders a mini QR code alongside the share dialog QR code', async ({ page }) => {
    await page.goto(DECK_URL);
    // Both render at load (same makeQrSvg() output, per docs/SHEET-KIT.md);
    // the share dialog itself is just hidden (native <dialog>) until opened.
    await expect(page.locator('[data-qr-mini] svg')).toHaveCount(1);
    await expect(page.locator('dialog[data-share] [data-qr] svg')).toHaveCount(1);

    await page.locator('[data-chrome] [data-action="share"]').click();
    await expect(page.locator('dialog[data-share]')).toBeVisible();
    await expect(page.locator('dialog[data-share] [data-qr] svg')).toHaveCount(1);
  });
});

test.describe('legend isolate', () => {
  test('clicking a legend button isolates its layer, pressing it again clears it, and so does Escape', async ({
    page,
  }) => {
    await page.goto(DECK_URL);
    await page.evaluate(() => {
      const slide = document.querySelector('[data-slide].is-active');
      slide.insertAdjacentHTML(
        'beforeend',
        `<figure class="dwg-figure" id="legend-test-figure">
          <svg class="dwg" viewBox="0 0 10 10">
            <g data-layer="a"><rect width="1" height="1"/></g>
            <g data-layer="b"><rect width="1" height="1"/></g>
          </svg>
          <div class="legend" role="group" aria-label="test layers">
            <button class="legend-item" type="button" aria-pressed="false" data-isolate="a">A</button>
            <button class="legend-item" type="button" aria-pressed="false" data-isolate="b">B</button>
          </div>
        </figure>`
      );
    });

    const figure = page.locator('#legend-test-figure');
    const svg = figure.locator('svg.dwg');
    const layerA = svg.locator('[data-layer="a"]');
    const layerB = svg.locator('[data-layer="b"]');
    const buttonA = figure.locator('[data-isolate="a"]');

    await buttonA.click();
    await expect(buttonA).toHaveAttribute('aria-pressed', 'true');
    await expect(svg).toHaveAttribute('data-isolating', '');
    await expect(layerA).toHaveClass(/is-isolated/);
    await expect(layerB).not.toHaveClass(/is-isolated/);

    await buttonA.click(); // pressing the active button again clears the isolate
    await expect(buttonA).toHaveAttribute('aria-pressed', 'false');
    expect(await svg.getAttribute('data-isolating')).toBeNull();
    await expect(layerA).not.toHaveClass(/is-isolated/);

    await buttonA.click();
    await expect(buttonA).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(buttonA).toHaveAttribute('aria-pressed', 'false');
    expect(await svg.getAttribute('data-isolating')).toBeNull();
  });
});

test.describe('selector live drawing and PE marker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DECK_URL);
    await page.evaluate(() => {
      window.location.hash = '#10'; // "Find your model" (the selector slide)
    });
    await expect.poll(() => getIndex(page)).toBe('9');
  });

  test('the sheet opens on a labelled example, 8 PE drawn as LP-8, and typing a PE replaces it', async ({ page }) => {
    const input = page.locator('#selector-pe');
    const container = page.locator('[data-live-drawing]');
    await expect(input).toHaveValue('8');
    await expect(input).toBeEditable();
    await expect(page.locator('[data-selector-result] .result-model')).toHaveText('LP-8');
    await expect(page.locator('[data-live-drawing] svg.dwg')).toHaveCount(1);
    await expect(container).toHaveAttribute('data-example', '');
    await expect(page.locator('[data-live-title]')).toHaveText('Example: LP-8, 8 PE');
    await expect(page.locator('[data-pe-marker] text')).toHaveText('8 PE');
    await expect(page.locator('.s10-help-example')).toBeVisible();
    await expect(page.locator('.s10-live-empty')).toBeHidden();

    await input.fill('12');
    await expect(page.locator('[data-live-title]')).toHaveText('Section: LP-12, 12 PE');
    await expect(container).not.toHaveAttribute('data-example', /.*/);
    await expect(page.locator('.s10-help-example')).toBeHidden();
    await expect(page.locator('.s10-help-own')).toBeVisible();
  });

  test('the PE marker moves to the entered PE, and the live drawing renders the chosen model', async ({ page }) => {
    await page.locator('#selector-pe').fill('20');

    await expect(page.locator('[data-pe-marker] line')).toHaveAttribute('x1', '13.333333333333334%');
    await expect(page.locator('[data-pe-marker] text')).toHaveText('20 PE');

    await expect(page.locator('[data-live-drawing] svg.dwg')).toHaveCount(1);
    await expect(page.locator('[data-live-title]')).toHaveText('Section: LF-20V, 20 PE');
    await expect(page.locator('[data-live-drawing] svg.dwg title')).toContainText('LF-20V');

    // A parsed root without the SVG namespace renders as loose text, not a drawing.
    const drawing = page.locator('[data-live-drawing] svg.dwg');
    await expect.poll(() => drawing.evaluate((el) => el.namespaceURI)).toBe('http://www.w3.org/2000/svg');
    const box = await drawing.boundingBox();
    expect(box && box.width).toBeGreaterThan(100);
    expect(box && box.height).toBeGreaterThan(50);

    // Pipes are drawn at the series' real size (FRP: 150 mm) against the 2300 mm tank.
    const boreToHeight = await drawing.evaluate((svg) => {
      const bore = svg.querySelector('[data-layer="inlet"] .ly-knockout').getBBox().height;
      const shell = svg.querySelector('[data-layer="shell"] rect.ly-wall').getBBox().height;
      return bore / shell;
    });
    expect(Math.abs(boreToHeight - 150 / 2300)).toBeLessThan(0.004);
  });

  test('clearing the PE parks the marker at 0% and keeps the last section as a ghost under the note', async ({ page }) => {
    const container = page.locator('[data-live-drawing]');
    await page.locator('#selector-pe').fill('20');
    await expect(container.locator('svg')).toHaveCount(1);
    await expect(container).toHaveAttribute('data-state', 'drawn');

    await page.locator('#selector-pe').fill('');
    await expect(container).toHaveAttribute('data-state', 'ghost');
    await expect(container.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.s10-live-empty')).toBeVisible();
    await expect(page.locator('[data-live-title]')).toHaveText('Live section');
    await expect(page.locator('[data-pe-marker] line')).toHaveAttribute('x1', '0%');

    await page.locator('#selector-pe').fill('35');
    await expect(container).toHaveAttribute('data-state', 'drawn');
    await expect(container.locator('svg')).not.toHaveAttribute('aria-hidden', /.*/);
    await expect(page.locator('.s10-live-empty')).toBeHidden();
  });
});

test.describe('selector result kit structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DECK_URL);
    await page.evaluate(() => {
      window.location.hash = '#10'; // "Find your model" (the selector slide)
    });
    await expect.poll(() => getIndex(page)).toBe('9');
  });

  test('an ok result renders the kit structure: dims, why-this-model, actions and disclaimer', async ({ page }) => {
    await page.locator('#selector-pe').fill('20');

    const result = page.locator('[data-selector-result]');
    await expect(result).toHaveAttribute('data-status', 'ok');
    await expect(result).not.toHaveClass(/is-empty/);
    await expect(result.locator('.result-model')).toHaveText('LF-20V');
    await expect(result.locator('.result-series')).toContainText('rated 20 PE');
    await expect(result.locator('dl.result-dims > div')).toHaveCount(4);
    await expect(result.locator('.notes.is-plain')).toContainText('Why this model');
    await expect(result.locator('.result-actions a[data-whatsapp-enquiry]')).toHaveCount(1);
    await expect(result.locator('.result-disclaimer')).toContainText('Selection guide only');
  });

  test('an out-of-range PE renders a warn line, and blanking the PE resets to the empty state', async ({ page }) => {
    const input = page.locator('#selector-pe');
    const result = page.locator('[data-selector-result]');

    await input.fill('200');
    await expect(result).toHaveAttribute('data-status', 'out-of-range');
    await expect(result.locator('p.warn')).toContainText('engineers');

    await input.fill('');
    await expect(result).toHaveClass(/is-empty/);
  });
});

test.describe('end-of-set controls', () => {
  test('Prev is marked unavailable on sheet 01, and Next on the last sheet reads "Back to 01" and goes there', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${DECK_URL}#1`);
    const prev = page.locator('.titleblock .tb-prev');
    const next = page.locator('.titleblock .tb-next');
    await expect(prev).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-label', 'Next sheet');
    await expect(next).toContainText('Next');

    await page.goto(`${DECK_URL}#12`);
    await expect.poll(() => getIndex(page)).toBe('11');
    await expect(prev).not.toHaveAttribute('aria-disabled', /.*/);
    await expect(next).toHaveAttribute('aria-label', 'Back to sheet 01');
    await expect(next.locator('.tb-first-label')).toBeVisible();
    await expect(next.locator('.tb-next-label')).toBeHidden();
    await next.click();
    await expect.poll(() => getIndex(page)).toBe('0');
    await expect(next.locator('.tb-next-label')).toBeVisible();
  });
});

test.describe('contact sheet enquiry', () => {
  test('reads "Send a general enquiry" until a model is picked, then names it as on sheet 10', async ({ page }) => {
    await page.goto(`${DECK_URL}#12`);
    const cta = page.locator('[data-enquiry-cta]');
    await expect(cta.locator('[data-enquiry-label]')).toHaveText('Send a general enquiry');
    expect(await cta.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=Hello%20Lintang%20Tankworks/);
    expect(await cta.getAttribute('href')).not.toContain('LP-8');

    await page.goto(`${DECK_URL}#10`);
    await page.locator('#selector-pe').fill('20');
    await expect(page.locator('[data-selector-result] .result-model')).toHaveText('LF-20V');
    await expect(cta.locator('[data-enquiry-label]')).toHaveText('LF-20V, 20 PE');
    expect(await cta.getAttribute('href')).toContain('LF-20V');

    await page.locator('#selector-pe').fill('');
    await expect(cta.locator('[data-enquiry-label]')).toHaveText('Send a general enquiry');
  });
});

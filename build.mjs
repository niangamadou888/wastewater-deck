#!/usr/bin/env node
/**
 * Build script for the Lintang Tankworks portfolio deck. Bundles
 * src/js/main.js and src/css/main.css with esbuild, resolves
 * <!-- @include --> partials in src/index.html, and inlines everything into
 * a single self-contained dist/index.html. No dependencies beyond esbuild
 * (already a devDependency).
 *
 * Usage:
 *   node build.mjs           one-shot build
 *   node build.mjs --watch   rebuild on any change under src/
 */
import { readFile, writeFile, copyFile, mkdir, stat, rm } from 'node:fs/promises';
import { existsSync, watch as fsWatch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const HTML_ENTRY = path.join(SRC_DIR, 'index.html');
const JS_ENTRY = path.join(SRC_DIR, 'js', 'main.js');
const CSS_ENTRY = path.join(SRC_DIR, 'css', 'main.css');
const OUT_FILE = path.join(DIST_DIR, 'index.html');
/** The link-preview raster: shipped beside the page, named in og:image. */
const OG_COVER_NAME = 'og-cover.jpg';
const OG_COVER_SRC = path.join(SRC_DIR, 'assets', OG_COVER_NAME);
/** Its provenance sidecar (FINISH: every shipping raster carries one). */
const OG_COVER_PROVENANCE = `${OG_COVER_SRC}.json`;
const OG_COVER_OUT = path.join(DIST_DIR, OG_COVER_NAME);
/** Build-time settings: `siteUrl` is the public base URL dist/ is published at. */
const CONFIG_FILE = path.join(__dirname, 'deck.config.json');

const INCLUDE_PATTERN = /<!--\s*@include\s+(\S+)\s*-->/g;

const JS_BUILD_OPTIONS = {
  entryPoints: [JS_ENTRY],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  write: false,
  loader: { '.json': 'json' },
};

const CSS_BUILD_OPTIONS = {
  entryPoints: [CSS_ENTRY],
  bundle: true,
  minify: true,
  write: false,
  loader: {
    '.woff2': 'dataurl',
    '.woff': 'dataurl',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.webp': 'dataurl',
  },
};

/**
 * Recursively resolve <!-- @include relative/path.html --> directives,
 * erroring on a missing file or an include cycle.
 * @param {string} content
 * @param {string} baseDir directory the includes in `content` resolve from
 * @param {string[]} stack absolute paths of files currently being expanded
 * @returns {Promise<string>}
 */
export async function resolveIncludes(content, baseDir, stack) {
  const matches = [...content.matchAll(INCLUDE_PATTERN)];
  if (matches.length === 0) {
    return content;
  }

  let result = content;
  for (const match of matches) {
    const [placeholder, relativePath] = match;
    const absolutePath = path.resolve(baseDir, relativePath);

    if (!existsSync(absolutePath)) {
      throw new Error(`@include not found: "${relativePath}" (resolved to ${absolutePath})`);
    }
    if (stack.includes(absolutePath)) {
      const cycle = [...stack, absolutePath].map((p) => path.relative(SRC_DIR, p)).join(' -> ');
      throw new Error(`@include cycle detected: ${cycle}`);
    }

    const partial = await readFile(absolutePath, 'utf8');
    const expanded = await resolveIncludes(partial, path.dirname(absolutePath), [...stack, absolutePath]);
    // Replacer function, not a plain string: String.prototype.replace treats
    // a string replacement as a $-pattern template ($$, $&, $`, $', $<n>),
    // which would silently corrupt `expanded` if it ever contained one of
    // those two-character sequences. A function return value is inserted
    // verbatim, with no pattern interpretation.
    result = result.replace(placeholder, () => expanded);
  }

  return result;
}

/**
 * Pick the public base URL the deck is published at: the SITE_URL environment
 * value when set, otherwise `siteUrl` from deck.config.json. Link previews
 * (WhatsApp, the deck's main channel) only load an absolute og:image, so a
 * value that is not an absolute http(s) URL fails the build. A trailing slash
 * is added so `og-cover.jpg` can be appended as-is.
 * @param {string|undefined} envValue SITE_URL
 * @param {string|undefined} configValue deck.config.json `siteUrl`
 * @returns {string} the base URL, or '' when neither is set
 */
export function resolveSiteUrl(envValue, configValue) {
  const pick = [envValue, configValue]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find((value) => value !== '');
  if (!pick) {
    return '';
  }
  if (!/^https?:\/\/[^/\s]+/i.test(pick)) {
    throw new Error(
      `Site URL "${pick}" must be an absolute http(s) URL (set SITE_URL or siteUrl in deck.config.json).`
    );
  }
  return pick.endsWith('/') ? pick : `${pick}/`;
}

/**
 * Read `siteUrl` from the build config file. A missing file means no setting;
 * a file that is not valid JSON fails the build and names the file.
 * @param {string} [file]
 * @returns {Promise<string>}
 */
export async function readSiteUrlSetting(file = CONFIG_FILE) {
  if (!existsSync(file)) {
    return '';
  }
  const raw = await readFile(file, 'utf8');
  try {
    const config = JSON.parse(raw);
    return typeof config?.siteUrl === 'string' ? config.siteUrl : '';
  } catch (error) {
    throw new Error(`${path.basename(file)} is not valid JSON: ${error.message}`);
  }
}

/**
 * Resolve the Open Graph `og:url` and `og:image` values from the site URL
 * (see resolveSiteUrl). Link previews only load an absolute og:image, so with
 * no site URL both are left empty: the build stays relocatable and never
 * emits a relative image path, or a canonical URL pointing nowhere real.
 * Author SITE_URL with a trailing slash (resolveSiteUrl adds one); it is
 * concatenated with the cover's file name as-is.
 * @param {string|undefined} siteUrl
 * @returns {{ogUrlTag: string, ogImage: string}} ogImage is '' when unset
 */
export function resolveOgMeta(siteUrl) {
  const trimmed = typeof siteUrl === 'string' ? siteUrl.trim() : '';
  if (!trimmed) {
    return { ogUrlTag: '', ogImage: '' };
  }
  return {
    ogUrlTag: `<meta property="og:url" content="${trimmed}">`,
    ogImage: `${trimmed}${OG_COVER_NAME}`,
  };
}

/**
 * Replace the `<!-- @og-url -->`, `<!-- @og-image -->` and
 * `<!-- @twitter-card -->` placeholders in the HTML template with
 * site-URL-derived link-preview tags. og:image is written only when it is
 * absolute (a site URL is set) and the cover ships beside the page;
 * otherwise it is left out, and the twitter card falls back to a plain
 * `summary` rather than promising a large image that isn't there. Uses
 * replacer functions (see injectAssets's doc comment) so a literal
 * $-pattern in the URL is never misinterpreted by String.prototype.replace.
 * @param {string} template
 * @param {string|undefined} siteUrl
 * @param {{hasCover?: boolean}} [options]
 * @returns {string}
 */
export function injectOgTags(template, siteUrl, { hasCover = true } = {}) {
  const { ogUrlTag, ogImage } = resolveOgMeta(siteUrl);
  const shipsImage = Boolean(hasCover && ogImage);
  const ogImageTag = shipsImage ? `<meta property="og:image" content="${ogImage}">` : '';
  const cardTag = `<meta name="twitter:card" content="${shipsImage ? 'summary_large_image' : 'summary'}">`;
  return template
    .replace('<!-- @og-url -->', () => ogUrlTag)
    .replace('<!-- @og-image -->', () => ogImageTag)
    .replace('<!-- @twitter-card -->', () => cardTag);
}

const SHARE_URL_PLACEHOLDER = '@@SITE_URL@@';

/**
 * Replace the `data-share-url="@@SITE_URL@@"` placeholder in the HTML
 * template with the resolved site URL (see resolveSiteUrl), or with an
 * empty string when no site URL is configured. An empty `data-share-url`
 * is a deliberate, honest state: the deck has no real URL to encode in its
 * QR code or share dialog until it is actually hosted somewhere (see
 * resolveShareUrl / initShareUi, which fall back to the page's own
 * http(s) URL, or a "host the deck to share a link" message on file://).
 * Uses a replacer function (see injectAssets's doc comment) so a literal
 * $-pattern in the URL is never misinterpreted by String.prototype.replace.
 * @param {string} template
 * @param {string|undefined} siteUrl
 * @returns {string}
 */
export function injectShareUrl(template, siteUrl) {
  const trimmed = typeof siteUrl === 'string' ? siteUrl.trim() : '';
  return template.replace(SHARE_URL_PLACEHOLDER, () => trimmed);
}

/**
 * Copy src/assets/og-cover.jpg to dist/og-cover.jpg, beside the page that
 * links to it, and warn when it has no provenance sidecar. When the source
 * is absent, a stale dist copy is removed and injectOgTags leaves og:image
 * out, so no preview ever points at a missing or outdated file.
 * @returns {Promise<boolean>} whether the cover ships
 */
async function copyOgCover() {
  if (!existsSync(OG_COVER_SRC)) {
    await rm(OG_COVER_OUT, { force: true });
    console.warn(`Warning: src/assets/${OG_COVER_NAME} is missing; og:image is left out.`);
    return false;
  }
  if (!existsSync(OG_COVER_PROVENANCE)) {
    console.warn(`Warning: src/assets/${OG_COVER_NAME} has no provenance sidecar (${OG_COVER_NAME}.json).`);
  }
  await mkdir(DIST_DIR, { recursive: true });
  await copyFile(OG_COVER_SRC, OG_COVER_OUT);
  return true;
}

/**
 * The base URL for this build (SITE_URL, else deck.config.json), with a
 * warning when neither is set, because og:url and og:image are then left out.
 * @returns {Promise<string>}
 */
async function buildSiteUrl() {
  const siteUrl = resolveSiteUrl(process.env.SITE_URL, await readSiteUrlSetting());
  if (!siteUrl) {
    console.warn('Warning: no siteUrl (deck.config.json or SITE_URL); og:url and og:image are left out, so link previews show no image.');
  }
  return siteUrl;
}

/**
 * Bundle src/js/main.js into a single minified IIFE, with products.json
 * inlined via esbuild's json loader.
 * @returns {Promise<string>}
 */
async function buildScript() {
  const result = await esbuild.build(JS_BUILD_OPTIONS);
  return result.outputFiles[0].text;
}

/**
 * Bundle src/css/main.css (which @imports engine.css and, later, the design
 * stylesheet), inlining fonts and images as data URLs so the build has no
 * external asset references.
 * @returns {Promise<string>}
 */
async function buildStyles() {
  const result = await esbuild.build(CSS_BUILD_OPTIONS);
  return result.outputFiles[0].text;
}

/**
 * Inline bundled CSS/JS into the template's `<!-- @styles -->` and
 * `<!-- @scripts -->` placeholders.
 *
 * Uses replacer functions rather than plain-string replacements: a string
 * argument to String.prototype.replace is interpreted as a $-pattern
 * template ($$, $&, $`, $', $<n>), which would silently corrupt `css`/`js`
 * if either ever contained one of those sequences (esbuild's minifier can
 * emit bare `$` identifiers). A function's return value is always inserted
 * verbatim.
 * @param {string} template
 * @param {string} css
 * @param {string} js
 * @returns {string}
 */
export function injectAssets(template, css, js) {
  return template
    .replace('<!-- @styles -->', () => `<style>${css}</style>`)
    .replace('<!-- @scripts -->', () => `<script>${js}</script>`);
}

/**
 * Assemble the final self-contained HTML document: expand includes, then
 * inject the bundled CSS and JS at their placeholders.
 * @returns {Promise<string>}
 */
async function assembleHtml({ siteUrl, hasCover }) {
  const [template, css, js] = await Promise.all([
    readFile(HTML_ENTRY, 'utf8'),
    buildStyles(),
    buildScript(),
  ]);

  const withIncludes = await resolveIncludes(template, SRC_DIR, [HTML_ENTRY]);
  const withOg = injectOgTags(withIncludes, siteUrl, { hasCover });
  const withShareUrl = injectShareUrl(withOg, siteUrl);

  return injectAssets(withShareUrl, css, js);
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

async function build() {
  const siteUrl = await buildSiteUrl();
  const hasCover = await copyOgCover();
  const html = await assembleHtml({ siteUrl, hasCover });
  await mkdir(DIST_DIR, { recursive: true });
  await writeFile(OUT_FILE, html, 'utf8');
  const { size } = await stat(OUT_FILE);
  console.log(`Built ${path.relative(__dirname, OUT_FILE)} (${formatBytes(size)})`);
}

/**
 * Build a rebuild function that regenerates dist/index.html from the given
 * esbuild contexts and the current HTML template on disk. Coalesces any
 * rebuild requests that arrive while a build is already in flight into a
 * single trailing rebuild, so a burst of file-watcher events never queues
 * more than one extra run.
 * @param {{jsContext: import('esbuild').BuildContext, cssContext: import('esbuild').BuildContext}} contexts
 * @returns {() => Promise<void>}
 */
function createRebuilder({ jsContext, cssContext }) {
  let building = false;
  let pending = false;

  const rebuild = async () => {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    try {
      const [jsResult, cssResult, template] = await Promise.all([
        jsContext.rebuild(),
        cssContext.rebuild(),
        readFile(HTML_ENTRY, 'utf8'),
      ]);
      const withIncludes = await resolveIncludes(template, SRC_DIR, [HTML_ENTRY]);
      const siteUrl = await buildSiteUrl();
      const hasCover = await copyOgCover();
      const withOg = injectOgTags(withIncludes, siteUrl, { hasCover });
      const withShareUrl = injectShareUrl(withOg, siteUrl);
      const html = injectAssets(withShareUrl, cssResult.outputFiles[0].text, jsResult.outputFiles[0].text);
      await mkdir(DIST_DIR, { recursive: true });
      await writeFile(OUT_FILE, html, 'utf8');
      const { size } = await stat(OUT_FILE);
      console.log(`Rebuilt ${path.relative(__dirname, OUT_FILE)} (${formatBytes(size)})`);
    } catch (error) {
      console.error('Build failed:', error.message);
    } finally {
      building = false;
      if (pending) {
        pending = false;
        await rebuild();
      }
    }
  };

  return rebuild;
}

/**
 * Rebuild on every change under src/. Uses esbuild's incremental context
 * for the JS/CSS bundles and a plain fs.watch for the HTML template and
 * slide includes, since those aren't esbuild entry points.
 */
async function watch() {
  const jsContext = await esbuild.context(JS_BUILD_OPTIONS);
  const cssContext = await esbuild.context(CSS_BUILD_OPTIONS);
  const rebuild = createRebuilder({ jsContext, cssContext });

  await rebuild();

  fsWatch(SRC_DIR, { recursive: true }, (_event, filename) => {
    if (filename) {
      rebuild();
    }
  });

  console.log(`Watching ${path.relative(__dirname, SRC_DIR)}/ for changes... (Ctrl+C to stop)`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
  const isWatch = process.argv.includes('--watch');
  if (isWatch) {
    await watch();
  } else {
    await build();
  }
}

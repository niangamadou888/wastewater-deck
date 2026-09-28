import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  resolveIncludes,
  injectAssets,
  resolveOgMeta,
  injectOgTags,
  resolveSiteUrl,
  readSiteUrlSetting,
  injectShareUrl,
} from '../../build.mjs';

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

async function withTempDir(run) {
  const dir = await mkdtemp(path.join(tmpdir(), 'wastewater-deck-build-test-'));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('resolveIncludes: expands a simple include', async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, 'partial.html'), 'PARTIAL CONTENT', 'utf8');
    const result = await resolveIncludes(
      'BEFORE <!-- @include partial.html --> AFTER',
      dir,
      []
    );
    assert.equal(result, 'BEFORE PARTIAL CONTENT AFTER');
  });
});

test('resolveIncludes: preserves a literal $& in included content verbatim', async () => {
  await withTempDir(async (dir) => {
    await writeFile(
      path.join(dir, 'partial.html'),
      'contains a literal $& and $$ sequence',
      'utf8'
    );
    const result = await resolveIncludes(
      'BEFORE <!-- @include partial.html --> AFTER',
      dir,
      []
    );
    assert.equal(result, 'BEFORE contains a literal $& and $$ sequence AFTER');
  });
});

test('resolveIncludes: preserves $`, $\' and $<digit> patterns verbatim', async () => {
  await withTempDir(async (dir) => {
    await writeFile(
      path.join(dir, 'partial.html'),
      "price is $1 not $` or $' today",
      'utf8'
    );
    const result = await resolveIncludes(
      'X <!-- @include partial.html --> Y',
      dir,
      []
    );
    assert.equal(result, "X price is $1 not $` or $' today Y");
  });
});

test('resolveIncludes: throws on a missing include', async () => {
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => resolveIncludes('<!-- @include missing.html -->', dir, []),
      /@include not found/
    );
  });
});

test('resolveIncludes: throws on an include cycle', async () => {
  await withTempDir(async (dir) => {
    const aPath = path.join(dir, 'a.html');
    const bPath = path.join(dir, 'b.html');
    await writeFile(aPath, '<!-- @include b.html -->', 'utf8');
    await writeFile(bPath, '<!-- @include a.html -->', 'utf8');
    await assert.rejects(
      () => resolveIncludes('<!-- @include a.html -->', dir, [aPath]),
      /@include cycle detected/
    );
  });
});

test('injectAssets: inlines CSS and JS at their placeholders', () => {
  const template = '<head><!-- @styles --></head><body><!-- @scripts --></body>';
  const result = injectAssets(template, '.x{color:red}', 'console.log(1)');
  assert.equal(
    result,
    '<head><style>.x{color:red}</style></head><body><script>console.log(1)</script></body>'
  );
});

test('injectAssets: preserves a literal $& / $$ sequence in bundled CSS verbatim', () => {
  const template = '<!-- @styles --><!-- @scripts -->';
  const result = injectAssets(template, 'content: "$& and $$"', 'const x = 1;');
  assert.equal(
    result,
    '<style>content: "$& and $$"</style><script>const x = 1;</script>'
  );
});

test('injectAssets: preserves a literal $& / $$ sequence in bundled JS verbatim', () => {
  const template = '<!-- @styles --><!-- @scripts -->';
  const result = injectAssets(template, 'body{}', 'const re = /$&/; const bare = "$$";');
  assert.equal(
    result,
    '<style>body{}</style><script>const re = /$&/; const bare = "$$";</script>'
  );
});

test('resolveOgMeta: unset SITE_URL omits both og:url and og:image (never a relative image path)', () => {
  assert.deepEqual(resolveOgMeta(undefined), { ogUrlTag: '', ogImage: '' });
});

test('resolveOgMeta: blank/whitespace-only SITE_URL is treated as unset', () => {
  assert.deepEqual(resolveOgMeta(''), { ogUrlTag: '', ogImage: '' });
  assert.deepEqual(resolveOgMeta('   '), { ogUrlTag: '', ogImage: '' });
});

test('resolveOgMeta: a set SITE_URL becomes og:url, and og:image is SITE_URL + og-cover.jpg', () => {
  const result = resolveOgMeta('https://example.com/');
  assert.equal(result.ogUrlTag, '<meta property="og:url" content="https://example.com/">');
  assert.equal(result.ogImage, 'https://example.com/og-cover.jpg');
});

test('resolveOgMeta: trims surrounding whitespace from SITE_URL', () => {
  const result = resolveOgMeta('  https://example.com/  ');
  assert.equal(result.ogImage, 'https://example.com/og-cover.jpg');
});

test('injectOgTags: with no SITE_URL, drops both placeholders even when the cover ships', () => {
  const template = '<head><!-- @og-url --><!-- @og-image --></head>';
  assert.equal(injectOgTags(template, undefined), '<head></head>');
  assert.equal(injectOgTags(template, '', { hasCover: true }), '<head></head>');
});

test('injectOgTags: with SITE_URL set, writes both og:url and an absolute og:image', () => {
  const template = '<head><!-- @og-url --><!-- @og-image --></head>';
  const result = injectOgTags(template, 'https://deck.example/');
  assert.equal(
    result,
    '<head><meta property="og:url" content="https://deck.example/">' +
      '<meta property="og:image" content="https://deck.example/og-cover.jpg"></head>'
  );
});

test('injectOgTags: preserves a literal $& / $$ sequence in SITE_URL verbatim', () => {
  const template = '<!-- @og-url --><!-- @og-image -->';
  const result = injectOgTags(template, 'https://example.com/$&/');
  assert.equal(
    result,
    '<meta property="og:url" content="https://example.com/$&/">' +
      '<meta property="og:image" content="https://example.com/$&/og-cover.jpg">'
  );
});

test('injectOgTags: a large-image twitter card is declared only when og:image ships', () => {
  const template = '<!-- @og-image --><!-- @twitter-card -->';
  assert.equal(
    injectOgTags(template, 'https://deck.example/'),
    '<meta property="og:image" content="https://deck.example/og-cover.jpg">' +
      '<meta name="twitter:card" content="summary_large_image">'
  );
});

test('injectOgTags: with no og:image (no site URL or no cover), the twitter card is a plain summary', () => {
  const template = '<!-- @og-image --><!-- @twitter-card -->';
  const plain = '<meta name="twitter:card" content="summary">';
  assert.equal(injectOgTags(template, undefined), plain);
  assert.equal(injectOgTags(template, 'https://deck.example/', { hasCover: false }), plain);
});

test('injectOgTags: without a cover image beside the page, writes no og:image at all', () => {
  const template = '<head><!-- @og-url --><!-- @og-image --></head>';
  const result = injectOgTags(template, 'https://example.com/', { hasCover: false });
  assert.equal(result, '<head><meta property="og:url" content="https://example.com/"></head>');
});

test('resolveSiteUrl: the SITE_URL environment value wins over the deck.config.json setting', () => {
  assert.equal(resolveSiteUrl('https://env.example/', 'https://config.example/'), 'https://env.example/');
});

test('resolveSiteUrl: falls back to the deck.config.json setting when SITE_URL is unset or blank', () => {
  assert.equal(resolveSiteUrl(undefined, 'https://config.example/'), 'https://config.example/');
  assert.equal(resolveSiteUrl('   ', 'https://config.example/'), 'https://config.example/');
});

test('resolveSiteUrl: adds the trailing slash og-cover.jpg is appended to', () => {
  assert.equal(resolveSiteUrl(undefined, 'https://config.example/deck'), 'https://config.example/deck/');
});

test('resolveSiteUrl: returns an empty string when neither value is set', () => {
  assert.equal(resolveSiteUrl(undefined, undefined), '');
  assert.equal(resolveSiteUrl('', ''), '');
});

test('resolveSiteUrl: rejects a relative or non-http base URL (link previews need an absolute URL)', () => {
  assert.throws(() => resolveSiteUrl('deck/', undefined), /absolute http/);
  assert.throws(() => resolveSiteUrl(undefined, 'file:///tmp/deck/'), /absolute http/);
});

test('readSiteUrlSetting: reads siteUrl from a config file, and tolerates a missing file', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'deck.config.json');
    await writeFile(file, JSON.stringify({ siteUrl: 'https://config.example/' }), 'utf8');
    assert.equal(await readSiteUrlSetting(file), 'https://config.example/');
    assert.equal(await readSiteUrlSetting(path.join(dir, 'missing.json')), '');
  });
});

test('readSiteUrlSetting: a malformed config file fails the build with the file named', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'deck.config.json');
    await writeFile(file, '{ siteUrl: nope', 'utf8');
    await assert.rejects(() => readSiteUrlSetting(file), /deck\.config\.json/);
  });
});

test('deck.config.json: site URL is empty (relocatable build) or an absolute https URL ending in a slash', async () => {
  const config = JSON.parse(await readFile(path.join(PROJECT_ROOT, 'deck.config.json'), 'utf8'));
  const siteUrl = resolveSiteUrl(undefined, config.siteUrl);
  if (siteUrl === '') return;
  assert.match(siteUrl, /^https:\/\/[^\s/]+\.[^\s/]+\/$/);
});

test('deck.config.json: holds only the site URL setting, so no brand or contact detail can ride along in it', async () => {
  const config = JSON.parse(await readFile(path.join(PROJECT_ROOT, 'deck.config.json'), 'utf8'));
  assert.deepEqual(Object.keys(config), ['siteUrl']);
});

test('injectShareUrl: replaces the data-share-url placeholder with the resolved site URL', () => {
  const template = '<main data-share-url="@@SITE_URL@@">';
  assert.equal(
    injectShareUrl(template, 'https://example.com/'),
    '<main data-share-url="https://example.com/">'
  );
});

test('injectShareUrl: an unset site URL leaves data-share-url empty rather than pointing anywhere', () => {
  const template = '<main data-share-url="@@SITE_URL@@">';
  assert.equal(injectShareUrl(template, undefined), '<main data-share-url="">');
  assert.equal(injectShareUrl(template, ''), '<main data-share-url="">');
  assert.equal(injectShareUrl(template, '   '), '<main data-share-url="">');
});

test('injectShareUrl: preserves a literal $& / $$ sequence in the site URL verbatim', () => {
  const template = '<main data-share-url="@@SITE_URL@@">';
  assert.equal(
    injectShareUrl(template, 'https://example.com/$&/'),
    '<main data-share-url="https://example.com/$&/">'
  );
});

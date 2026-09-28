import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQrSvg } from '../../src/js/lib/qr.js';

test('makeQrSvg: returns an svg element string', () => {
  const svg = makeQrSvg('https://example.com/');
  assert.match(svg, /^<svg[\s>]/);
  assert.match(svg, /<\/svg>$/);
});

test('makeQrSvg: uses a viewBox instead of fixed width/height', () => {
  const svg = makeQrSvg('https://example.com/');
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
});

test('makeQrSvg: sets crisp-edges shape rendering', () => {
  const svg = makeQrSvg('https://example.com/');
  assert.match(svg, /shape-rendering="crispEdges"/);
});

test('makeQrSvg: sets an img role and non-empty aria-label', () => {
  const svg = makeQrSvg('https://example.com/');
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="[^"]+"/);
});

test('makeQrSvg: never uses an inline style attribute', () => {
  const svg = makeQrSvg('https://example.com/');
  assert.doesNotMatch(svg, /\sstyle="/);
});

test('makeQrSvg: default margin of 0 sizes the viewBox to the module count', () => {
  const svg = makeQrSvg('A');
  const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  assert.ok(match);
  assert.equal(match[1], match[2]);
});

test('makeQrSvg: a positive margin grows the viewBox on both axes', () => {
  const plain = makeQrSvg('A', { margin: 0 });
  const padded = makeQrSvg('A', { margin: 4 });
  const plainSize = Number(plain.match(/viewBox="0 0 (\d+) \d+"/)[1]);
  const paddedSize = Number(padded.match(/viewBox="0 0 (\d+) \d+"/)[1]);
  assert.equal(paddedSize, plainSize + 8);
});

test('makeQrSvg: different text produces different output', () => {
  const a = makeQrSvg('https://example.com/a');
  const b = makeQrSvg('https://example.com/b-longer-path');
  assert.notEqual(a, b);
});

test('makeQrSvg: accepts explicit ecc levels', () => {
  assert.doesNotThrow(() => makeQrSvg('hello', { ecc: 'L' }));
  assert.doesNotThrow(() => makeQrSvg('hello', { ecc: 'Q' }));
  assert.doesNotThrow(() => makeQrSvg('hello', { ecc: 'H' }));
});

test('makeQrSvg: falls back to M for an unrecognised ecc value', () => {
  assert.doesNotThrow(() => makeQrSvg('hello', { ecc: 'not-a-level' }));
});

test('makeQrSvg: throws for an empty string', () => {
  assert.throws(() => makeQrSvg(''));
});

test('makeQrSvg: throws for a non-string value', () => {
  assert.throws(() => makeQrSvg(undefined));
  assert.throws(() => makeQrSvg(42));
});

test('makeQrSvg: works without an options argument', () => {
  assert.doesNotThrow(() => makeQrSvg('https://example.com/'));
});

test('makeQrSvg: contains at least one drawing path for a non-trivial payload', () => {
  const svg = makeQrSvg('https://example.com/some/long/path?with=query');
  assert.match(svg, /<path d="M/);
});

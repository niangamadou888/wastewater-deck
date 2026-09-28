import test from 'node:test';
import assert from 'node:assert/strict';
import { tankSectionSvg } from '../../src/js/lib/tank-drawing.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../../src/js/lib/tank-layout.js';

const VERTICAL_PE = { code: 'LP-12', pe: 12, orientation: 'vertical', diameter: 1700, length: null, height: 2170, waterLevel: 1870, capacityL: 4240 };
const HORIZONTAL_PE = { code: 'LP-6H', pe: 6, orientation: 'horizontal', diameter: 1300, length: 2550, height: 1300, waterLevel: 1050, capacityL: 2930 };
const LT_MODEL = { code: 'LT-40', pe: 40, orientation: 'horizontal', width: 2300, length: 1600, height: 2500, waterLevel: 1900, capacityL: 6990 };

function attr(svg, tag, name) {
  const tagMatch = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'i').exec(svg);
  assert.ok(tagMatch, `expected a <${tag}> element in the SVG`);
  const attrMatch = new RegExp(`${name}="([^"]*)"`).exec(tagMatch[0]);
  return attrMatch ? attrMatch[1] : null;
}

function firstRectDims(svg) {
  const match = /<rect class="ly-wall"[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/.exec(svg);
  assert.ok(match, 'expected a ly-wall rect');
  return { width: Number(match[1]), height: Number(match[2]) };
}

test('tankSectionSvg: returns a role=img SVG with a title and desc', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.equal(attr(svg, 'svg', 'role'), 'img');
  assert.equal(attr(svg, 'svg', 'class'), 'dwg');
  assert.match(svg, /<title id="live-dwg-title">/);
  assert.match(svg, /<desc id="live-dwg-desc">/);
  assert.equal(attr(svg, 'svg', 'aria-labelledby'), 'live-dwg-title live-dwg-desc');
});

test('tankSectionSvg: declares the SVG namespace so DOMParser (image/svg+xml) yields real SVG elements', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.equal(attr(svg, 'svg', 'xmlns'), 'http://www.w3.org/2000/svg');
});

test('tankSectionSvg: carries the drawing-contract layer groups', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.match(svg, /<g data-layer="shell">/);
  assert.match(svg, /<g data-layer="water">/);
  assert.match(svg, /<g data-layer="flow">/);
  assert.match(svg, /<g data-layer="dims">/);
});

test('tankSectionSvg: the title and desc name the model and its real dimensions', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.match(svg, /<title id="live-dwg-title">Typical section: LP-12, PE Bio-Filter, drawn to this model&apos;s real proportions.<\/title>/);
  assert.match(svg, /<desc id="live-dwg-desc">LP-12: D 1700 mm, H1 2170 mm, H2 1870 mm\./);
});

test('tankSectionSvg: the model name is left to the sheet view title, not drawn as text', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  assert.ok(!texts.some((text) => text.includes('LP-12')), texts.join(' | '));
});

test('tankSectionSvg: a vertical model is dimensioned by diameter (D), with no extra footprint label', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.match(svg, /D 1700/);
  assert.match(svg, /H1 2170/);
  assert.match(svg, /H2 1870/);
  assert.doesNotMatch(svg, /L 1700/);
});

test('tankSectionSvg: a horizontal model is dimensioned by length (L) with diameter (D) as an extra label', () => {
  const svg = tankSectionSvg(HORIZONTAL_PE, 'pe');
  assert.match(svg, /L 2550/);
  assert.match(svg, /D 1300/);
  assert.match(svg, /H1 1300/);
  assert.match(svg, /H2 1050/);
});

test('tankSectionSvg: an LT box-ended model is dimensioned by length (L) with width (W) as an extra label', () => {
  const svg = tankSectionSvg(LT_MODEL, 'lt');
  assert.match(svg, /L 1600/);
  assert.match(svg, /W 2300/);
  assert.match(svg, /H1 2500/);
  assert.match(svg, /H2 1900/);
});

test('tankSectionSvg: the drawn shell rect is proportional to the real footprint : height ratio', () => {
  const svg = tankSectionSvg(HORIZONTAL_PE, 'pe');
  const { width, height } = firstRectDims(svg);
  const drawnRatio = width / height;
  const realRatio = HORIZONTAL_PE.length / HORIZONTAL_PE.height;
  assert.ok(Math.abs(drawnRatio - realRatio) < 0.01, `drawn ratio ${drawnRatio} should match real ratio ${realRatio}`);
});

test('tankSectionSvg: a vertical model draws a taller-than-wide shell when height exceeds diameter', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  const { width, height } = firstRectDims(svg);
  assert.ok(height > width, 'a vertical tank should be drawn taller than it is wide');
});

test('tankSectionSvg: two different models produce different drawn dimensions', () => {
  const small = tankSectionSvg(VERTICAL_PE, 'pe');
  const big = tankSectionSvg(LT_MODEL, 'lt');
  const smallDims = firstRectDims(small);
  const bigDims = firstRectDims(big);
  assert.notDeepEqual(smallDims, bigDims);
});

test('tankSectionSvg: escapes a model code containing XML-significant characters', () => {
  const dangerous = { ...VERTICAL_PE, code: 'MF<script>&"\'' };
  const svg = tankSectionSvg(dangerous, 'pe');
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /MF&lt;script&gt;&amp;&quot;&apos;/);
});

test('tankSectionSvg: falls back to a generic series label for an unknown seriesId', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'unknown-series');
  assert.match(svg, /Tank, drawn to this model&apos;s real proportions/);
});

test('tankSectionSvg: labels each known series', () => {
  assert.match(tankSectionSvg(VERTICAL_PE, 'pe'), /PE Bio-Filter/);
  assert.match(tankSectionSvg(HORIZONTAL_PE, 'frp'), /FRP Bio-Filter/);
  assert.match(tankSectionSvg(LT_MODEL, 'lt'), /LT, drawn to this model&apos;s real proportions/);
});

test('tankSectionSvg: throws a TypeError for a missing model', () => {
  assert.throws(() => tankSectionSvg(null, 'pe'), TypeError);
  assert.throws(() => tankSectionSvg(undefined, 'pe'), TypeError);
});

test('tankSectionSvg: throws a TypeError when height is not finite', () => {
  const bad = { ...VERTICAL_PE, height: null };
  assert.throws(() => tankSectionSvg(bad, 'pe'), TypeError);
});

test('tankSectionSvg: throws a TypeError when neither diameter nor length is finite', () => {
  const bad = { ...VERTICAL_PE, diameter: null, length: null };
  assert.throws(() => tankSectionSvg(bad, 'pe'), TypeError);
});

// The contract with sheet 10's CSS (.s10-live-box aspect-ratio: 480 / 352):
// one fixed viewBox for every model, never cropped. tank-drawing-fit.test.js
// checks every model's lines and labels stay inside it.
test('tankSectionSvg: always draws the fixed 480 x 352 live-drawing viewBox, regardless of model', () => {
  assert.equal(VIEWBOX_WIDTH, 480);
  assert.equal(VIEWBOX_HEIGHT, 352);
  for (const [model, series] of [[VERTICAL_PE, 'pe'], [HORIZONTAL_PE, 'frp'], [LT_MODEL, 'lt']]) {
    assert.equal(attr(tankSectionSvg(model, series), 'svg', 'viewBox'), '0 0 480 352');
  }
});

test('tankSectionSvg: the sheet 10 box keeps the same 480 / 352 aspect ratio as the viewBox', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../../src/css/slides/10.css', import.meta.url), 'utf8');
  assert.match(css, /\.s10-live-box\s*\{[^}]*aspect-ratio:\s*480\s*\/\s*352;/);
});

test('tankSectionSvg: draws a water line and fill when waterLevel is present', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.match(svg, /<rect class="ly-water"/);
  assert.match(svg, /<line class="ly-waterline"/);
});

test('tankSectionSvg: contains no unescaped bare "&" (would break DOMParser image/svg+xml parsing)', () => {
  const svg = tankSectionSvg(HORIZONTAL_PE, 'frp');
  const bareAmpersand = /&(?!amp;|lt;|gt;|quot;|apos;)/;
  assert.doesNotMatch(svg, bareAmpersand);
});

test('tankSectionSvg: the H2 dimension runs from the base to the water line, not to the top of the shell', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  const waterY = Number(/<line class="ly-waterline"[^>]*y1="([\d.]+)"/.exec(svg)[1]);
  const verticalDims = [...svg.matchAll(/<path class="ly-dim" d="M([\d.]+) ([\d.]+)V([\d.]+)"\/>/g)]
    .map((m) => ({ x: Number(m[1]), top: Number(m[2]), bottom: Number(m[3]) }))
    .sort((a, b) => a.x - b.x);
  assert.equal(verticalDims.length, 2, 'expected an H1 and an H2 vertical dimension line');
  const [h1, h2] = verticalDims;
  assert.equal(h2.top, waterY, 'H2 should stop at the top water level');
  assert.ok(h1.top < h2.top, 'H1 (overall height) should reach higher than H2 (water level)');
  assert.equal(h1.bottom, h2.bottom);
});

test('tankSectionSvg: only the wall ring is hatched; the interior is left open for the water tint', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.doesNotMatch(svg, /<rect class="ly-wall-hatch"/, 'a filled hatch rect would hatch the whole interior');
  assert.match(svg, /<path class="ly-wall-hatch" fill-rule="evenodd" d="M[^"]+ZM[^"]+Z"\/>/);
  const walls = [...svg.matchAll(/<rect class="ly-wall"/g)];
  assert.equal(walls.length, 2, 'outer and inner wall faces');
});

test('tankSectionSvg: the water body is clipped to the inner wall face', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  assert.match(svg, /<clipPath id="live-dwg-inner">/);
  assert.match(svg, /<rect class="ly-water" clip-path="url\(#live-dwg-inner\)"/);
});

test('tankSectionSvg: the H2 extension line reaches the tank wall (no gap at the tick)', () => {
  const svg = tankSectionSvg(VERTICAL_PE, 'pe');
  const shellX = Number(/<rect class="ly-wall" x="([\d.]+)"/.exec(svg)[1]);
  const waterY = /<line class="ly-waterline"[^>]*y1="([\d.]+)"/.exec(svg)[1];
  const ext = new RegExp(`M([\\d.]+) ${waterY.replace('.', '\\.')}H`).exec(svg);
  assert.ok(ext, 'expected an extension line at the water level');
  assert.ok(shellX - Number(ext[1]) <= 3, `extension starts ${shellX - Number(ext[1])} units short of the wall`);
});

test('tankSectionSvg: an LT drawing puts the inlet at the right above TWL and the outlet at the left below it', () => {
  const svg = tankSectionSvg(LT_MODEL, 'lt');
  const waterY = Number(/<line class="ly-waterline"[^>]*y1="([\d.]+)"/.exec(svg)[1]);
  const flows = [...svg.matchAll(/<path class="ly-flow" d="M([\d.]+) ([\d.]+)H([\d.]+)"\/>/g)].map((m) => ({
    from: Number(m[1]),
    y: Number(m[2]),
    to: Number(m[3]),
  }));
  assert.equal(flows.length, 2);
  const [inlet, outlet] = flows;
  assert.ok(inlet.from > inlet.to, 'inlet flows right to left');
  assert.ok(inlet.y < waterY, 'inlet above top water level');
  assert.ok(outlet.from > outlet.to, 'outlet leaves to the left');
  assert.ok(outlet.y > waterY, 'outlet below top water level');
});

test('tankSectionSvg: draws the series pipe size to scale (a 150 mm pipe is drawn bigger than a 100 mm one)', () => {
  const bore = (svg) => {
    const m = /<g data-layer="inlet"><path class="ly-knockout" d="M[\d.]+ ([\d.]+)H[\d.]+V([\d.]+)/.exec(svg);
    assert.ok(m, 'expected the inlet pipe knockout');
    return Number(m[2]) - Number(m[1]);
  };
  const small = bore(tankSectionSvg(VERTICAL_PE, 'pe', { pipeMm: 100 }));
  const large = bore(tankSectionSvg(VERTICAL_PE, 'pe', { pipeMm: 150 }));
  assert.ok(large > small, `150 mm bore ${large} should exceed 100 mm bore ${small}`);
});

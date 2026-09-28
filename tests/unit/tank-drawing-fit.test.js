/**
 * The live section's viewBox contract (src/js/lib/tank-layout.js, sheet 10's
 * CSS): the engine always draws a fixed 480 x 352 viewBox and every model's
 * geometry and annotation sits inside it, at the largest text sizes sheet 10's
 * CSS may give the drawing, so the box can show the whole viewBox and never
 * crops. Text is also checked for collisions with other text.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../../src/data/products.json' with { type: 'json' };
import { tankSectionSvg } from '../../src/js/lib/tank-drawing.js';
import { TEXT_SIZE } from '../../src/js/lib/tank-layout.js';
import { textWidth } from '../../src/js/lib/svg-markup.js';

const WIDTH = 480;
const HEIGHT = 352;
const SIZE_BY_CLASS = { 'ly-note': TEXT_SIZE.note, 'ly-label-long': TEXT_SIZE.label, 'ly-dim-text': TEXT_SIZE.dim };
const ALL_MODELS = data.series.flatMap((series) =>
  series.models.map((model) => ({ model, seriesId: series.id, pipeMm: series.pipeMm }))
);
/** Each model drawn as sheet 10 draws it: with its series' real pipe size. */
const draw = ({ model, seriesId, pipeMm }) => tankSectionSvg(model, seriesId, { pipeMm });

function attrsOf(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

/** Every vertex of a path's data (absolute and relative M, L, H, V, C, A, Z). */
function pathPoints(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, A: 7, Z: 0 };
  const points = [];
  let cmd = 'M';
  let cur = { x: 0, y: 0 };
  let i = 0;
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      cmd = tokens[i];
      i += 1;
      if (cmd.toUpperCase() === 'Z') continue;
    }
    const n = arity[cmd.toUpperCase()];
    const args = tokens.slice(i, i + n).map(Number);
    i += n;
    const rel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();
    if (upper === 'H') cur = { x: rel ? cur.x + args[0] : args[0], y: cur.y };
    else if (upper === 'V') cur = { x: cur.x, y: rel ? cur.y + args[0] : args[0] };
    else {
      const [x, y] = args.slice(-2);
      cur = rel ? { x: cur.x + x, y: cur.y + y } : { x, y };
    }
    points.push(cur);
  }
  return points;
}

/** Estimated bounding box of a <text> at the largest size the CSS may set. */
function textBox(tag, content) {
  const a = attrsOf(tag);
  const size = SIZE_BY_CLASS[a.class];
  assert.ok(size, `unexpected text class ${a.class}`);
  const w = textWidth(content, size);
  const rotated = /rotate\(-90\)/.exec(a.transform ?? '');
  if (rotated) {
    const [tx, ty] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(a.transform).slice(1).map(Number);
    return { text: content, x1: tx - size * 0.75, x2: tx + size * 0.2, y1: ty - w / 2, y2: ty + w / 2 };
  }
  const x = Number(a.x);
  const y = Number(a.y);
  const anchor = a['text-anchor'] ?? 'start';
  const x1 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { text: content, x1, x2: x1 + w, y1: y - size * 0.75, y2: y + size * 0.2 };
}

function geometryPoints(svg) {
  const body = svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '');
  const pts = [];
  for (const m of body.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)) pts.push(...pathPoints(m[1]));
  for (const m of body.matchAll(/<rect\b[^>]*>/g)) {
    const a = attrsOf(m[0]);
    pts.push({ x: +a.x, y: +a.y }, { x: +a.x + +a.width, y: +a.y + +a.height });
  }
  for (const m of body.matchAll(/<line\b[^>]*>/g)) {
    const a = attrsOf(m[0]);
    pts.push({ x: +a.x1, y: +a.y1 }, { x: +a.x2, y: +a.y2 });
  }
  for (const m of body.matchAll(/<circle\b[^>]*>/g)) {
    const a = attrsOf(m[0]);
    pts.push({ x: +a.cx - +a.r, y: +a.cy - +a.r }, { x: +a.cx + +a.r, y: +a.cy + +a.r });
  }
  return pts;
}

function textBoxes(svg) {
  return [...svg.matchAll(/(<text\b[^>]*>)([^<]*)<\/text>/g)].map((m) => textBox(m[1], m[2]));
}

/** Points along a flow path (absolute M, H, V, L, C), about every 2 units. */
function flowSamples(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+/g) ?? [];
  const samples = [];
  let cur = { x: 0, y: 0 };
  let cmd = 'M';
  let i = 0;
  const line = (to) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - cur.x, to.y - cur.y) / 2));
    for (let k = 1; k <= steps; k += 1) samples.push({ x: cur.x + ((to.x - cur.x) * k) / steps, y: cur.y + ((to.y - cur.y) * k) / steps });
    cur = to;
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const n = { M: 2, L: 2, H: 1, V: 1, C: 6 }[cmd];
    assert.ok(n, `flow paths use absolute M, L, H, V, C only (got ${cmd})`);
    const a = tokens.slice(i, i + n).map(Number);
    i += n;
    if (cmd === 'M') {
      cur = { x: a[0], y: a[1] };
      samples.push(cur);
    } else if (cmd === 'H') line({ x: a[0], y: cur.y });
    else if (cmd === 'V') line({ x: cur.x, y: a[0] });
    else if (cmd === 'L') line({ x: a[0], y: a[1] });
    else {
      const p0 = cur;
      for (let k = 1; k <= 24; k += 1) {
        const t = k / 24;
        const u = 1 - t;
        samples.push({
          x: u ** 3 * p0.x + 3 * u * u * t * a[0] + 3 * u * t * t * a[2] + t ** 3 * a[4],
          y: u ** 3 * p0.y + 3 * u * u * t * a[1] + 3 * u * t * t * a[3] + t ** 3 * a[5],
        });
      }
      cur = { x: a[4], y: a[5] };
    }
  }
  return samples;
}

function overlaps(a, b) {
  return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
}

test('live section: the viewBox is the fixed 480 x 352 contract for every model', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS) {
    const svg = draw({ model, seriesId, pipeMm });
    assert.match(svg, /^<svg[^>]*\bviewBox="0 0 480 352"/, model.code);
  }
});

test('live section: every model draws all its geometry inside the viewBox', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS) {
    for (const p of geometryPoints(draw({ model, seriesId, pipeMm }))) {
      assert.ok(p.x >= 0 && p.x <= WIDTH && p.y >= 0 && p.y <= HEIGHT, `${model.code}: point ${p.x},${p.y} outside the viewBox`);
    }
  }
});

test('live section: every text fits inside the viewBox at the largest size the sheet CSS sets', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS) {
    for (const box of textBoxes(draw({ model, seriesId, pipeMm }))) {
      const inside = box.x1 >= 0 && box.x2 <= WIDTH && box.y1 >= 0 && box.y2 <= HEIGHT;
      assert.ok(inside, `${model.code}: "${box.text}" ${JSON.stringify(box)} leaves the viewBox`);
    }
  }
});

test('live section: no two texts collide, at the largest size the sheet CSS sets', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS) {
    const boxes = textBoxes(draw({ model, seriesId, pipeMm }));
    boxes.forEach((a, i) => {
      boxes.slice(i + 1).forEach((b) => {
        assert.ok(!overlaps(a, b), `${model.code}: "${a.text}" collides with "${b.text}"`);
      });
    });
  }
});

test('live section: no flow arrow or centreline runs through a label, at the largest size the sheet CSS sets', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS) {
    const svg = draw({ model, seriesId, pipeMm });
    const samples = [...svg.matchAll(/<path class="ly-(?:flow|center)" d="([^"]+)"/g)].flatMap((m) => flowSamples(m[1]));
    assert.ok(samples.length > 0, `${model.code}: expected flow and centre lines`);
    for (const box of textBoxes(svg)) {
      const hit = samples.find((p) => p.x > box.x1 && p.x < box.x2 && p.y > box.y1 && p.y < box.y2);
      assert.ok(!hit, `${model.code}: a flow or centre line crosses "${box.text}" at ${hit && `${hit.x.toFixed(1)},${hit.y.toFixed(1)}`}`);
    }
  }
});

test('live section: an LT labels both chambers and the blowers; a bio-filter labels its top water level and ground', () => {
  const lt = draw({ model: data.series.find((s) => s.id === 'lt').models[0], seriesId: 'lt', pipeMm: 150 });
  for (const label of ['ART', 'FST', 'BLOWERS', 'TWL', 'GL']) assert.match(lt, new RegExp(`>${label}</text>`));
  const pe = draw({ model: data.series.find((s) => s.id === 'pe').models[2], seriesId: 'pe', pipeMm: 100 });
  for (const label of ['TWL', 'GL', 'IL']) assert.match(pe, new RegExp(`>${label}</text>`));
});

test('textWidth: scales with the text length and the font size', () => {
  assert.equal(textWidth('', 15), 0);
  assert.ok(textWidth('BLOWERS', 15) > textWidth('GL', 15));
  assert.ok(Math.abs(textWidth('AB', 20) - 2 * textWidth('AB', 10)) < 1e-9);
});

const byCode = (code) => ALL_MODELS.find(({ model }) => model.code === code);
const groundLineY = (svg) => Number(/<path class="ly-ground" d="M0 ([\d.]+)H/.exec(svg)[1]);

test('live section: a bio-filter keeps only a slim band above ground (no blowers), so its tank draws larger than under an LT band', () => {
  assert.ok(groundLineY(draw(byCode('LP-8'))) <= 26, 'LP-8 ground line should sit near the top of the sheet');
  const lt = byCode('LT-40');
  assert.ok(groundLineY(draw(lt)) >= 50, 'an LT keeps the band for its blower housing');
});

test('live section: an LT air main drops down the ART manhole centreline, never a hair beside it', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS.filter((m) => m.seriesId === 'lt')) {
    const svg = draw({ model, seriesId, pipeMm });
    const steel = /<path class="ly-steel" d="M[\d.]+ [\d.]+V[\d.]+H([\d.]+)V[\d.]+"\/>/.exec(svg);
    assert.ok(steel, `${model.code}: expected the air main`);
    const centres = [...svg.matchAll(/<path class="ly-center" d="M([\d.]+) /g)].map((m) => Number(m[1]));
    assert.equal(Number(steel[1]), centres[1], `${model.code}: air drop should follow the ART neck centreline`);
  }
});

test('live section: SETTLING sits between the settling flow line and the filter chamber wall at its largest size, or is left out', () => {
  let drawn = 0;
  for (const { model, seriesId, pipeMm } of ALL_MODELS.filter((m) => m.seriesId !== 'lt')) {
    const svg = draw({ model, seriesId, pipeMm });
    const tag = /(<text\b[^>]*>)SETTLING<\/text>/.exec(svg);
    if (!tag) continue;
    drawn += 1;
    const box = textBox(tag[1], 'SETTLING');
    const wallX = Number(/<g data-layer="media"><path class="ly-wall-hatch" d="M([\d.]+) /.exec(svg)[1]);
    assert.ok(box.x2 < wallX, `${model.code}: SETTLING (to ${box.x2.toFixed(1)}) runs into the chamber wall at ${wallX}`);
  }
  assert.ok(drawn >= 10, `SETTLING should label most bio-filter sections (drawn on ${drawn})`);
  assert.match(draw(byCode('LP-8')), />SETTLING<\/text>/, 'the sheet opens on LP-8, which should name its settling zone');
});

/** The pit outline (trench walls and floor) from the first ly-ground path: M topL top L botL bottom H botR L topR top. */
function pitOf(svg) {
  const m = /<path class="ly-ground" d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)H([\d.]+)L([\d.]+) [\d.]+"/.exec(svg);
  assert.ok(m, 'expected the pit outline');
  const [topL, top, botL, bottom, botR, topR] = m.slice(1).map(Number);
  const at = (y, a, b) => a + ((b - a) * (y - top)) / (bottom - top);
  return { left: (y) => at(y, topL, botL), right: (y) => at(y, topR, botR) };
}

test('live section: both IL notes sit outside the trench wall, clear of the wall, the tank and the pipe', () => {
  for (const { model, seriesId, pipeMm } of ALL_MODELS) {
    const svg = draw({ model, seriesId, pipeMm });
    const pit = pitOf(svg);
    const notes = [...svg.matchAll(/(<text\b[^>]*>)IL<\/text>/g)].map((m) => textBox(m[1], 'IL'));
    assert.equal(notes.length, 2, `${model.code}: expected two IL notes`);
    const [left, right] = [...notes].sort((a, b) => a.x1 - b.x1);
    for (const y of [left.y1, left.y2]) {
      assert.ok(left.x2 < pit.left(y) - 1, `${model.code}: the left IL note (to ${left.x2.toFixed(1)}) reaches the trench wall`);
    }
    for (const y of [right.y1, right.y2]) {
      assert.ok(right.x1 > pit.right(y) + 1, `${model.code}: the right IL note (from ${right.x1.toFixed(1)}) reaches the trench wall`);
    }
    const marks = [...svg.matchAll(/<path class="ly-invert" d="M([\d.]+) ([\d.]+)l/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
    for (const mark of marks) {
      const note = notes.find((n) => n.x1 < mark.x && n.x2 > mark.x);
      assert.ok(note && note.y1 > mark.y + 8, `${model.code}: the IL note should hang below its invert mark, under the pipe`);
    }
  }
});

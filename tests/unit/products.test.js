import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import data from '../../src/data/products.json' with { type: 'json' };
import {
  LINE_UP,
  deriveModel,
  deriveSeriesModels,
  drawnCapacityL,
  segmentArea,
  targetLitres,
} from '../../scripts/product-rule.mjs';
import { formatProducts, withDerivedModels } from '../../scripts/derive-products.mjs';

const readSrc = (rel) => readFile(new URL(`../../src/${rel}`, import.meta.url), 'utf8');
const allModels = data.series.flatMap((series) => series.models);

test('products.json: every series is exactly what the authored sizing rule derives', () => {
  for (const series of data.series) {
    assert.deepEqual(series.models, deriveSeriesModels(series.id), `series ${series.id}`);
  }
});

test('products.json: the file on disk is the derive script output, byte for byte', async () => {
  const onDisk = await readSrc('data/products.json');
  assert.equal(onDisk, formatProducts(withDerivedModels(data)));
});

test('products.json: every capacity is the drawn liquid volume, to the nearest 10 L', () => {
  for (const model of allModels) {
    assert.equal(model.capacityL, drawnCapacityL(model), model.code);
  }
});

test('products.json: every capacity holds at least the rule target for its PE', () => {
  for (const series of data.series) {
    for (const model of series.models) {
      assert.ok(model.capacityL >= targetLitres(series.id, model.pe) - 10, `${model.code} ${model.capacityL} L`);
    }
  }
});

test('products.json: capacity and every drawn dimension grow with PE inside each orientation', () => {
  for (const series of data.series) {
    for (const orientation of ['horizontal', 'vertical']) {
      const models = series.models.filter((m) => m.orientation === orientation);
      for (let i = 1; i < models.length; i += 1) {
        assert.ok(models[i].capacityL > models[i - 1].capacityL, `${models[i].code} capacity`);
        const span = (m) => m.length ?? m.diameter;
        assert.ok(span(models[i]) >= span(models[i - 1]), `${models[i].code} footprint`);
      }
    }
  }
});

test('products.json: the LT line-up has eight models, 22 across the three series', () => {
  assert.equal(LINE_UP.lt.length, 8);
  assert.equal(allModels.length, 22);
});

test('segmentArea: an empty, half-full and full circle', () => {
  const full = Math.PI * 500 ** 2;
  assert.equal(segmentArea(1000, 0), 0);
  assert.ok(Math.abs(segmentArea(1000, 500) - full / 2) < 1e-6);
  assert.ok(Math.abs(segmentArea(1000, 1000) - full) < 1e-6);
  assert.ok(Math.abs(segmentArea(1000, 1400) - full) < 1e-6, 'a depth past the crown is clamped');
});

test('drawnCapacityL: vertical, horizontal and LT volumes', () => {
  assert.equal(drawnCapacityL({ orientation: 'vertical', diameter: 2000, waterLevel: 1000 }), 3140);
  assert.equal(drawnCapacityL({ orientation: 'horizontal', diameter: 2000, length: 1000, waterLevel: 1000 }), 1570);
  assert.equal(drawnCapacityL({ orientation: 'horizontal', width: 2000, length: 1000, waterLevel: 1000 }), 2000);
});

test('deriveModel: a vertical tank keeps the series freeboard above top water level', () => {
  const model = deriveModel('frp', ['LF-X', 20, 'vertical']);
  assert.equal(model.height - model.waterLevel, 350);
  assert.equal(model.length, null);
});

function scheduleRows(html) {
  return [...html.matchAll(/<tr[^>]*><th scope="row">([A-Z]+-\d+[A-Z]?)(?:<span[^<]*<\/span>)?<\/th>(.*?)<\/tr>/g)].map(
    ([, code, cells]) => ({
      code,
      values: Object.fromEntries([...cells.matchAll(/data-label="([^"]+)">([^<]*)</g)].map(([, k, v]) => [k, v])),
    }),
  );
}

function expectedCells(model) {
  const cells = { H1: String(model.height), H2: String(model.waterLevel), 'Cap.': String(model.capacityL) };
  if (typeof model.width === 'number') {
    return { ...cells, W: String(model.width), L: String(model.length) };
  }
  return { ...cells, D: String(model.diameter), L: model.length === null ? '&ndash;' : String(model.length) };
}

for (const [sheet, seriesId] of [['06-pe-series', 'pe'], ['07-frp-series', 'frp'], ['09-lt-schedule', 'lt']]) {
  test(`sheet ${sheet}: the schedule rows match products.json`, async () => {
    const rows = scheduleRows(await readSrc(`slides/${sheet}.html`));
    const models = data.series.find((series) => series.id === seriesId).models;
    assert.deepEqual(rows.map((row) => row.code), models.map((model) => model.code));
    rows.forEach((row, i) => assert.deepEqual(row.values, expectedCells(models[i]), row.code));
  });
}

test('sheet 10: the "all models" button counts every model in products.json', async () => {
  const html = await readSrc('slides/10-selector.html');
  const counts = [...html.matchAll(/All (\d+) models/g)].map(([, n]) => Number(n));
  assert.ok(counts.length > 0);
  counts.forEach((n) => assert.equal(n, allModels.length));
});

test('sheet 06: the two 6 PE sections are labelled with their schedule dimensions', async () => {
  const html = await readSrc('slides/06-pe-series.html');
  const [h, v] = ['LP-6H', 'LP-6V'].map((code) => allModels.find((m) => m.code === code));
  for (const label of [`L ${h.length}`, `H1 ${h.height}`, `H2 ${h.waterLevel}`, `D ${v.diameter}`, `H1 ${v.height}`, `H2 ${v.waterLevel}`]) {
    assert.ok(html.includes(`>${label}</text>`), label);
  }
  assert.ok(html.includes(`LP-6H stands ${v.height - h.height}&nbsp;mm lower`));
  assert.ok(html.includes(`LP-6V is ${h.length - v.diameter}&nbsp;mm shorter on plan`));
});

test('sheet 04: the series comparison and the scale title count each series\' models from products.json', async () => {
  const html = await readSrc('slides/04-range.html');
  const counts = data.series.map((series) => series.models.length);
  assert.ok(html.includes(`<tr><th scope="row">Models</th>${counts.map((n) => `<td>${n}</td>`).join('')}</tr>`));
  const [pe, frp, lt] = counts;
  assert.ok(html.includes(`6 to 18 PE with ${pe} models, FRP Bio-Filter 8 to 30 PE with ${frp} models, LT 40 to 150 PE with ${lt} models.`));
});

test('sheet 04: one station circle marks each LT rating inside the range ends', async () => {
  const html = await readSrc('slides/04-range.html');
  const lt = data.series.find((series) => series.id === 'lt').models.map((m) => m.pe).slice(1, -1);
  const stations = [...html.matchAll(/<circle class="s04-station" cx="([\d.]+)%" cy="193"/g)].map(([, x]) => Number(x));
  assert.deepEqual(stations, lt.map((pe) => Math.round((pe / 150) * 100 * 1000) / 1000));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../../src/data/products.json' with { type: 'json' };
import { recommend, DISCLAIMER } from '../../src/js/lib/selector.js';

const baseInput = {
  pe: 8,
  highWaterTable: false,
  deepBurial: false,
  limitedFootprint: false,
  powerAvailable: true,
};

test('DISCLAIMER is exported and mentions a PE calculation', () => {
  assert.equal(typeof DISCLAIMER, 'string');
  assert.match(DISCLAIMER, /PE calculation/i);
});

// --- invalid ---

test('recommend: rejects non-integer pe', () => {
  const result = recommend({ ...baseInput, pe: 8.5 }, data);
  assert.equal(result.status, 'invalid');
  assert.equal(result.model, null);
  assert.equal(result.seriesId, null);
  assert.deepEqual(result.alternatives, []);
  assert.ok(result.reasons.length > 0);
});

test('recommend: rejects zero', () => {
  assert.equal(recommend({ ...baseInput, pe: 0 }, data).status, 'invalid');
});

test('recommend: rejects negative numbers', () => {
  assert.equal(recommend({ ...baseInput, pe: -5 }, data).status, 'invalid');
});

test('recommend: rejects NaN', () => {
  assert.equal(recommend({ ...baseInput, pe: NaN }, data).status, 'invalid');
});

test('recommend: rejects Infinity', () => {
  assert.equal(recommend({ ...baseInput, pe: Infinity }, data).status, 'invalid');
});

test('recommend: rejects a string pe', () => {
  assert.equal(recommend({ ...baseInput, pe: '8' }, data).status, 'invalid');
});

test('recommend: rejects a missing pe', () => {
  const { pe, ...rest } = baseInput;
  assert.equal(recommend(rest, data).status, 'invalid');
});

test('recommend: rejects a null pe', () => {
  assert.equal(recommend({ ...baseInput, pe: null }, data).status, 'invalid');
});

// --- out of range ---

test('recommend: pe of 151 is out-of-range', () => {
  const result = recommend({ ...baseInput, pe: 151 }, data);
  assert.equal(result.status, 'out-of-range');
  assert.equal(result.model, null);
  assert.match(result.reasons.join(' '), /engineer/i);
});

test('recommend: pe of 200 is out-of-range', () => {
  assert.equal(recommend({ ...baseInput, pe: 200 }, data).status, 'out-of-range');
});

// --- LT branch ---

test('recommend: 35 PE recommends LT-40 (smallest LT model that covers it)', () => {
  const result = recommend({ ...baseInput, pe: 35 }, data);
  assert.equal(result.status, 'ok');
  assert.equal(result.seriesId, 'lt');
  assert.equal(result.model.code, 'LT-40');
});

test('recommend: exactly 150 PE recommends LT-150 with no 149 PE warning (sample data, no real licence schedule)', () => {
  const result = recommend({ ...baseInput, pe: 150 }, data);
  assert.equal(result.model.code, 'LT-150');
  assert.ok(!result.warnings.some((w) => /149/.test(w)));
});

test('recommend: 149 PE also recommends LT-150, same as 150 PE', () => {
  const result = recommend({ ...baseInput, pe: 149 }, data);
  assert.equal(result.model.code, 'LT-150');
  assert.ok(!result.warnings.some((w) => /149/.test(w)));
});

test('recommend: LT without power available adds a power warning', () => {
  const result = recommend({ ...baseInput, pe: 40, powerAvailable: false }, data);
  assert.ok(result.warnings.some((w) => /power/i.test(w)));
});

test('recommend: LT with power available has no power warning', () => {
  const result = recommend({ ...baseInput, pe: 40, powerAvailable: true }, data);
  assert.ok(!result.warnings.some((w) => /power/i.test(w)));
});

test('recommend: pe exactly 31 rounds up to LT-40', () => {
  const result = recommend({ ...baseInput, pe: 31 }, data);
  assert.equal(result.model.code, 'LT-40');
});

test('recommend: pe exactly 30 stays in the FRP series (not LT)', () => {
  const result = recommend({ ...baseInput, pe: 30 }, data);
  assert.equal(result.seriesId, 'frp');
});

// --- PE vs FRP branch ---

test('recommend: 8 PE with no conditions recommends LP-8', () => {
  const result = recommend({ ...baseInput, pe: 8 }, data);
  assert.equal(result.status, 'ok');
  assert.equal(result.seriesId, 'pe');
  assert.equal(result.model.code, 'LP-8');
});

test('recommend: 20 PE recommends LF-20V (over the PE series limit)', () => {
  const result = recommend({ ...baseInput, pe: 20 }, data);
  assert.equal(result.seriesId, 'frp');
  assert.equal(result.model.code, 'LF-20V');
  assert.match(result.reasons.join(' '), /18 PE/);
});

// A high water table does not change the series: sheet 06 says the PE series
// suits high water-table areas, and sheet 07 says the same of FRP. It adds an
// anchoring note instead (sheet 11: base and anchors, set and strap).
test('recommend: 8 PE with a high water table keeps the PE series (LP-8)', () => {
  const result = recommend({ ...baseInput, pe: 8, highWaterTable: true }, data);
  assert.equal(result.status, 'ok');
  assert.equal(result.seriesId, 'pe');
  assert.equal(result.model.code, 'LP-8');
});

test('recommend: a high water table on a septic tank says both series suit it and to anchor the tank', () => {
  const result = recommend({ ...baseInput, pe: 8, highWaterTable: true }, data);
  const reason = result.reasons.find((text) => /water table/i.test(text));
  assert.ok(reason, 'expected a high water table reason');
  assert.match(reason, /both bio-filter series/i);
  assert.match(reason, /anchor/i);
  assert.doesNotMatch(reason, /FRP/, 'must not steer a high water table to FRP');
  assert.doesNotMatch(reason, /\bneed/i, 'must not claim the site needs a particular series');
});

test('recommend: a high water table never changes the model, at any PE', () => {
  for (const pe of [1, 6, 8, 12, 18, 19, 25, 30, 35, 90, 150]) {
    for (const limitedFootprint of [false, true]) {
      const dry = recommend({ ...baseInput, pe, limitedFootprint }, data);
      const wet = recommend({ ...baseInput, pe, limitedFootprint, highWaterTable: true }, data);
      assert.equal(wet.model.code, dry.model.code, `${pe} PE, limitedFootprint ${limitedFootprint}`);
    }
  }
});

test('recommend: a high water table on an LT adds the anchoring note and keeps the model', () => {
  const result = recommend({ ...baseInput, pe: 40, highWaterTable: true }, data);
  assert.equal(result.model.code, 'LT-40');
  assert.ok(result.reasons.some((text) => /water table/i.test(text) && /anchor/i.test(text)));
});

test('recommend: no high water table means no water table note', () => {
  const result = recommend({ ...baseInput, pe: 8 }, data);
  assert.ok(!result.reasons.some((text) => /water table/i.test(text)));
});

test('recommend: 8 PE with deep burial recommends the FRP series', () => {
  const result = recommend({ ...baseInput, pe: 8, deepBurial: true }, data);
  assert.equal(result.seriesId, 'frp');
  assert.equal(result.model.code, 'LF-8H');
  assert.match(result.reasons.join(' '), /deep burial/i);
});

// Deep burial steering to FRP is the fictional maker's own guide rule (for
// the fibreglass shell's flexural strength, sheets 04 and 07), not a
// standard, and the reason says so.
test('recommend: the deep burial FRP steer is labelled a Lintang Tankworks guide rule, for flexural strength', () => {
  const result = recommend({ ...baseInput, pe: 8, deepBurial: true }, data);
  const reason = result.reasons.find((text) => /deep burial/i.test(text));
  assert.ok(reason, 'expected a deep burial reason');
  assert.match(reason, /Lintang Tankworks/);
  assert.match(reason, /guide rule/i);
  assert.match(reason, /flexural strength/i);
});

test('recommend: deep burial does not change an LT model', () => {
  const result = recommend({ ...baseInput, pe: 40, deepBurial: true }, data);
  assert.equal(result.seriesId, 'lt');
  assert.equal(result.model.code, 'LT-40');
});

test('recommend: 8 PE with deep burial and limited footprint picks the vertical FRP model', () => {
  const result = recommend({ ...baseInput, pe: 8, deepBurial: true, limitedFootprint: true }, data);
  assert.equal(result.model.code, 'LF-8V');
  assert.equal(result.model.orientation, 'vertical');
  assert.equal(result.alternatives.length, 1);
  assert.equal(result.alternatives[0].code, 'LF-8H');
});

test('recommend: 8 PE with deep burial and no footprint constraint picks the horizontal FRP model', () => {
  const result = recommend({ ...baseInput, pe: 8, deepBurial: true, limitedFootprint: false }, data);
  assert.equal(result.model.code, 'LF-8H');
  assert.equal(result.model.orientation, 'horizontal');
  assert.equal(result.alternatives.length, 1);
  assert.equal(result.alternatives[0].code, 'LF-8V');
});

test('recommend: 8 PE with a high water table and deep burial goes FRP for the burial, with both notes', () => {
  const result = recommend({ ...baseInput, pe: 8, deepBurial: true, highWaterTable: true }, data);
  assert.equal(result.seriesId, 'frp');
  assert.ok(result.reasons.some((text) => /deep burial/i.test(text)));
  assert.ok(result.reasons.some((text) => /water table/i.test(text)));
});

test('recommend: 6 PE with limited footprint picks the vertical PE model LP-6V', () => {
  const result = recommend({ ...baseInput, pe: 6, limitedFootprint: true }, data);
  assert.equal(result.seriesId, 'pe');
  assert.equal(result.model.code, 'LP-6V');
  assert.equal(result.alternatives[0].code, 'LP-6H');
});

test('recommend: 6 PE without a footprint constraint picks the horizontal PE model LP-6H', () => {
  const result = recommend({ ...baseInput, pe: 6, limitedFootprint: false }, data);
  assert.equal(result.model.code, 'LP-6H');
  assert.equal(result.alternatives[0].code, 'LP-6V');
});

test('recommend: pe of 18 stays in the PE series (boundary, not over)', () => {
  const result = recommend({ ...baseInput, pe: 18 }, data);
  assert.equal(result.seriesId, 'pe');
  assert.equal(result.model.code, 'LP-18');
});

test('recommend: pe of 19 moves to the FRP series (just over the PE limit)', () => {
  const result = recommend({ ...baseInput, pe: 19 }, data);
  assert.equal(result.seriesId, 'frp');
});

test('recommend: pe below the smallest model still returns the smallest model', () => {
  const result = recommend({ ...baseInput, pe: 1 }, data);
  assert.equal(result.status, 'ok');
  assert.equal(result.seriesId, 'pe');
  assert.ok(result.model.pe >= 1);
});

test('recommend: reasons are non-empty plain strings for a valid selection', () => {
  const result = recommend({ ...baseInput, pe: 12 }, data);
  assert.ok(result.reasons.length > 0);
  result.reasons.forEach((reason) => assert.equal(typeof reason, 'string'));
});

test('recommend: does not mutate the input object', () => {
  const input = { ...baseInput, pe: 8, highWaterTable: true, deepBurial: true };
  const snapshot = { ...input };
  recommend(input, data);
  assert.deepEqual(input, snapshot);
});

test('recommend: no tie means no orientation reason and no alternatives', () => {
  const result = recommend({ ...baseInput, pe: 12 }, data);
  assert.deepEqual(result.alternatives, []);
});

test('recommend: does not mutate the input data object', () => {
  const snapshot = JSON.parse(JSON.stringify(data));
  recommend({ ...baseInput, pe: 8 }, data);
  recommend({ ...baseInput, pe: 40 }, data);
  assert.deepEqual(data, snapshot);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { peToPercent, PE_SCALE_MAX } from '../../src/js/lib/scale.js';

test('peToPercent: exports the 150 PE scale max', () => {
  assert.equal(PE_SCALE_MAX, 150);
});

test('peToPercent: 0 PE is 0%', () => {
  assert.equal(peToPercent(0), 0);
});

test('peToPercent: 150 PE is 100%', () => {
  assert.equal(peToPercent(150), 100);
});

test('peToPercent: 75 PE is 50%', () => {
  assert.equal(peToPercent(75), 50);
});

test('peToPercent: 20 PE matches the kit reference (13.333...%)', () => {
  assert.ok(Math.abs(peToPercent(20) - 13.333333333333334) < 1e-9);
});

test('peToPercent: clamps above the max to 100%', () => {
  assert.equal(peToPercent(200), 100);
});

test('peToPercent: clamps negative values to 0%', () => {
  assert.equal(peToPercent(-10), 0);
});

test('peToPercent: NaN is treated as 0%', () => {
  assert.equal(peToPercent(NaN), 0);
});

test('peToPercent: undefined is treated as 0%', () => {
  assert.equal(peToPercent(undefined), 0);
});

test('peToPercent: Infinity clamps to 100%', () => {
  assert.equal(peToPercent(Infinity), 100);
});

test('peToPercent: respects a custom max', () => {
  assert.equal(peToPercent(50, 100), 50);
});

test('peToPercent: a non-finite max returns 0', () => {
  assert.equal(peToPercent(50, 0), 0);
  assert.equal(peToPercent(50, NaN), 0);
  assert.equal(peToPercent(50, -10), 0);
});

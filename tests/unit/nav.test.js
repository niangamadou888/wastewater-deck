import test from 'node:test';
import assert from 'node:assert/strict';
import { clampIndex, formatHash, parseHash, keyToAction, classifySwipe, sheetPosition } from '../../src/js/lib/nav.js';

test('clampIndex: within range returns the same index', () => {
  assert.equal(clampIndex(2, 5), 2);
});

test('clampIndex: negative index clamps to 0', () => {
  assert.equal(clampIndex(-3, 5), 0);
});

test('clampIndex: index past the end clamps to total-1', () => {
  assert.equal(clampIndex(9, 5), 4);
});

test('clampIndex: single slide deck clamps to 0', () => {
  assert.equal(clampIndex(4, 1), 0);
});

test('clampIndex: total of 0 returns 0', () => {
  assert.equal(clampIndex(3, 0), 0);
});

test('clampIndex: NaN index falls back to 0', () => {
  assert.equal(clampIndex(NaN, 5), 0);
});

test('clampIndex: floors non-integer input', () => {
  assert.equal(clampIndex(2.9, 5), 2);
});

test('formatHash: converts a 0-based index to a 1-based hash', () => {
  assert.equal(formatHash(0), '#1');
  assert.equal(formatHash(2), '#3');
  assert.equal(formatHash(9), '#10');
});

test('parseHash: accepts plain #3 form', () => {
  assert.equal(parseHash('#3', 10), 2);
});

test('parseHash: accepts #/3 form', () => {
  assert.equal(parseHash('#/3', 10), 2);
});

test('parseHash: accepts #slide-3 form', () => {
  assert.equal(parseHash('#slide-3', 10), 2);
});

test('parseHash: is case-insensitive for the slide- prefix', () => {
  assert.equal(parseHash('#Slide-3', 10), 2);
});

test('parseHash: accepts hash without leading #', () => {
  assert.equal(parseHash('3', 10), 2);
});

test('parseHash: rejects index below 1', () => {
  assert.equal(parseHash('#0', 10), null);
});

test('parseHash: rejects index above total', () => {
  assert.equal(parseHash('#11', 10), null);
});

test('parseHash: rejects junk', () => {
  assert.equal(parseHash('#about', 10), null);
});

test('parseHash: rejects decimals', () => {
  assert.equal(parseHash('#3.5', 10), null);
});

test('parseHash: rejects trailing junk after digits', () => {
  assert.equal(parseHash('#3abc', 10), null);
});

test('parseHash: rejects empty hash', () => {
  assert.equal(parseHash('', 10), null);
  assert.equal(parseHash('#', 10), null);
});

test('parseHash: rejects negative numbers', () => {
  assert.equal(parseHash('#-3', 10), null);
});

test('parseHash: rejects a non-string hash', () => {
  assert.equal(parseHash(null, 10), null);
  assert.equal(parseHash(undefined, 10), null);
  assert.equal(parseHash(3, 10), null);
});

test('parseHash: boundary at exactly total is accepted', () => {
  assert.equal(parseHash('#10', 10), 9);
});

test('keyToAction: ArrowRight is next', () => {
  assert.equal(keyToAction({ key: 'ArrowRight' }), 'next');
});

test('keyToAction: ArrowDown is next', () => {
  assert.equal(keyToAction({ key: 'ArrowDown' }), 'next');
});

test('keyToAction: PageDown is next', () => {
  assert.equal(keyToAction({ key: 'PageDown' }), 'next');
});

test('keyToAction: Space without shift is next', () => {
  assert.equal(keyToAction({ key: ' ', shiftKey: false }), 'next');
});

test('keyToAction: ArrowLeft is prev', () => {
  assert.equal(keyToAction({ key: 'ArrowLeft' }), 'prev');
});

test('keyToAction: ArrowUp is prev', () => {
  assert.equal(keyToAction({ key: 'ArrowUp' }), 'prev');
});

test('keyToAction: PageUp is prev', () => {
  assert.equal(keyToAction({ key: 'PageUp' }), 'prev');
});

test('keyToAction: Shift+Space is prev', () => {
  assert.equal(keyToAction({ key: ' ', shiftKey: true }), 'prev');
});

test('keyToAction: Home is first', () => {
  assert.equal(keyToAction({ key: 'Home' }), 'first');
});

test('keyToAction: End is last', () => {
  assert.equal(keyToAction({ key: 'End' }), 'last');
});

test('keyToAction: g and G open the menu', () => {
  assert.equal(keyToAction({ key: 'g' }), 'menu');
  assert.equal(keyToAction({ key: 'G' }), 'menu');
});

test('keyToAction: f and F toggle fullscreen', () => {
  assert.equal(keyToAction({ key: 'f' }), 'fullscreen');
  assert.equal(keyToAction({ key: 'F' }), 'fullscreen');
});

test('keyToAction: Escape closes', () => {
  assert.equal(keyToAction({ key: 'Escape' }), 'close');
});

test('keyToAction: unknown key returns null', () => {
  assert.equal(keyToAction({ key: 'q' }), null);
});

test('keyToAction: ctrlKey modifier suppresses every action, including Escape', () => {
  assert.equal(keyToAction({ key: 'ArrowRight', ctrlKey: true }), null);
  assert.equal(keyToAction({ key: 'Escape', ctrlKey: true }), null);
});

test('keyToAction: altKey modifier suppresses action', () => {
  assert.equal(keyToAction({ key: 'ArrowRight', altKey: true }), null);
});

test('keyToAction: metaKey modifier suppresses action', () => {
  assert.equal(keyToAction({ key: 'ArrowRight', metaKey: true }), null);
});

test('keyToAction: editable target suppresses navigation keys', () => {
  assert.equal(keyToAction({ key: 'ArrowRight', isEditableTarget: true }), null);
  assert.equal(keyToAction({ key: 'g', isEditableTarget: true }), null);
});

test('keyToAction: editable target still allows Escape', () => {
  assert.equal(keyToAction({ key: 'Escape', isEditableTarget: true }), 'close');
});

test('keyToAction: menu open blocks navigation keys other than menu/close', () => {
  assert.equal(keyToAction({ key: 'ArrowRight', isMenuOpen: true }), null);
  assert.equal(keyToAction({ key: 'f', isMenuOpen: true }), null);
});

test('keyToAction: menu open still allows g to toggle and Escape to close', () => {
  assert.equal(keyToAction({ key: 'g', isMenuOpen: true }), 'menu');
  assert.equal(keyToAction({ key: 'Escape', isMenuOpen: true }), 'close');
});

test('keyToAction: shift does not change non-space keys', () => {
  assert.equal(keyToAction({ key: 'ArrowRight', shiftKey: true }), 'next');
});

test('classifySwipe: short left swipe with default threshold returns next', () => {
  assert.equal(classifySwipe({ dx: -60, dy: 0 }, { threshold: 50 }), 'next');
});

test('classifySwipe: right swipe returns prev', () => {
  assert.equal(classifySwipe({ dx: 60, dy: 0 }, { threshold: 50 }), 'prev');
});

test('classifySwipe: swipe shorter than threshold returns null', () => {
  assert.equal(classifySwipe({ dx: -20, dy: 0 }, { threshold: 50 }), null);
});

test('classifySwipe: exactly at threshold counts as a swipe', () => {
  assert.equal(classifySwipe({ dx: -50, dy: 0 }, { threshold: 50 }), 'next');
});

test('classifySwipe: more vertical than horizontal returns null', () => {
  assert.equal(classifySwipe({ dx: -60, dy: 70 }, { threshold: 50 }), null);
});

test('classifySwipe: equal horizontal and vertical distance returns null', () => {
  assert.equal(classifySwipe({ dx: -60, dy: 60 }, { threshold: 50 }), null);
});

test('classifySwipe: uses default threshold when options omitted', () => {
  assert.equal(classifySwipe({ dx: -55, dy: 0 }), 'next');
  assert.equal(classifySwipe({ dx: -10, dy: 0 }), null);
});

test('classifySwipe: zero movement returns null', () => {
  assert.equal(classifySwipe({ dx: 0, dy: 0 }), null);
});

test('sheetPosition: first, middle and last sheets of a set', () => {
  assert.equal(sheetPosition(0, 12), 'first');
  assert.equal(sheetPosition(5, 12), 'middle');
  assert.equal(sheetPosition(11, 12), 'last');
});

test('sheetPosition: a one-sheet set is its own last sheet', () => {
  assert.equal(sheetPosition(0, 1), 'last');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { isEditableEventTarget } from '../../src/js/dom/edit-target.js';

/**
 * @param {{tagName: string, isContentEditable?: boolean, role?: string|null}} config
 */
function fakeTarget({ tagName, isContentEditable = false, role = null }) {
  return {
    tagName,
    isContentEditable,
    getAttribute: (name) => (name === 'role' ? role : null),
  };
}

test('isEditableEventTarget: null target is not editable', () => {
  assert.equal(isEditableEventTarget(null, 'a'), false);
});

test('isEditableEventTarget: a target without a tagName is not editable', () => {
  assert.equal(isEditableEventTarget({}, 'a'), false);
});

test('isEditableEventTarget: INPUT is always editable, regardless of key', () => {
  const input = fakeTarget({ tagName: 'INPUT' });
  assert.equal(isEditableEventTarget(input, 'ArrowRight'), true);
  assert.equal(isEditableEventTarget(input, 'a'), true);
});

test('isEditableEventTarget: TEXTAREA and SELECT are always editable', () => {
  assert.equal(isEditableEventTarget(fakeTarget({ tagName: 'TEXTAREA' }), 'ArrowLeft'), true);
  assert.equal(isEditableEventTarget(fakeTarget({ tagName: 'SELECT' }), 'g'), true);
});

test('isEditableEventTarget: contenteditable elements are always editable', () => {
  const target = fakeTarget({ tagName: 'DIV', isContentEditable: true });
  assert.equal(isEditableEventTarget(target, 'ArrowRight'), true);
});

test('isEditableEventTarget: role="slider" elements are always editable', () => {
  const target = fakeTarget({ tagName: 'DIV', role: 'slider' });
  assert.equal(isEditableEventTarget(target, 'ArrowRight'), true);
});

test('isEditableEventTarget: a focused BUTTON is editable only for Space/Enter, not arrow keys', () => {
  const button = fakeTarget({ tagName: 'BUTTON' });
  assert.equal(isEditableEventTarget(button, ' '), true);
  assert.equal(isEditableEventTarget(button, 'Enter'), true);
  assert.equal(isEditableEventTarget(button, 'ArrowRight'), false);
  assert.equal(isEditableEventTarget(button, 'g'), false);
});

test('isEditableEventTarget: a focused A is editable only for Space/Enter, not arrow keys', () => {
  const link = fakeTarget({ tagName: 'A' });
  assert.equal(isEditableEventTarget(link, 'Enter'), true);
  assert.equal(isEditableEventTarget(link, ' '), true);
  assert.equal(isEditableEventTarget(link, 'ArrowLeft'), false);
});

test('isEditableEventTarget: a focused SUMMARY is editable only for Space/Enter, not other keys', () => {
  const summary = fakeTarget({ tagName: 'SUMMARY' });
  assert.equal(isEditableEventTarget(summary, ' '), true);
  assert.equal(isEditableEventTarget(summary, 'Home'), false);
});

test('isEditableEventTarget: a plain DIV is never editable', () => {
  const div = fakeTarget({ tagName: 'DIV' });
  assert.equal(isEditableEventTarget(div, ' '), false);
  assert.equal(isEditableEventTarget(div, 'Enter'), false);
  assert.equal(isEditableEventTarget(div, 'ArrowRight'), false);
});

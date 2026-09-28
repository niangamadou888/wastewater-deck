/**
 * Direction-independent navigation helpers: index math, hash (de)serialisation,
 * keyboard-to-action mapping and swipe gesture classification. No DOM access.
 */

/**
 * Clamp a slide index into the valid [0, total-1] range.
 * @param {number} index
 * @param {number} total
 * @returns {number}
 */
export function clampIndex(index, total) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const safeIndex = Number.isFinite(index) ? Math.floor(index) : 0;
  return Math.min(Math.max(safeIndex, 0), total - 1);
}

/**
 * Format a 0-based slide index as a 1-based location hash, e.g. 0 -> '#1'.
 * @param {number} index
 * @returns {string}
 */
export function formatHash(index) {
  return `#${index + 1}`;
}

const HASH_PATTERN = /^\/?(?:slide-)?(\d+)$/i;

/**
 * Parse a location hash into a 0-based slide index.
 * Accepts '#3', '#/3', '#slide-3' (case-insensitive), with or without the
 * leading '#'. Returns null for out-of-range or unrecognised input.
 * @param {string} hash
 * @param {number} total
 * @returns {number|null}
 */
export function parseHash(hash, total) {
  if (typeof hash !== 'string') {
    return null;
  }
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  const match = HASH_PATTERN.exec(body);
  if (!match) {
    return null;
  }
  const oneBased = Number(match[1]);
  if (!Number.isFinite(oneBased) || oneBased < 1 || oneBased > total) {
    return null;
  }
  return oneBased - 1;
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);

function resolveBaseAction(key, shiftKey) {
  if (NEXT_KEYS.has(key)) {
    return 'next';
  }
  if (PREV_KEYS.has(key)) {
    return 'prev';
  }
  if (key === ' ' || key === 'Spacebar') {
    return shiftKey ? 'prev' : 'next';
  }
  if (key === 'Home') {
    return 'first';
  }
  if (key === 'End') {
    return 'last';
  }
  if (key === 'g' || key === 'G') {
    return 'menu';
  }
  if (key === 'f' || key === 'F') {
    return 'fullscreen';
  }
  if (key === 'Escape') {
    return 'close';
  }
  return null;
}

/**
 * Map a keyboard event's relevant fields to a deck action, honouring
 * modifiers, editable targets and open-menu constraints.
 * @param {object} input
 * @param {string} input.key
 * @param {boolean} [input.shiftKey]
 * @param {boolean} [input.altKey]
 * @param {boolean} [input.ctrlKey]
 * @param {boolean} [input.metaKey]
 * @param {boolean} [input.isEditableTarget]
 * @param {boolean} [input.isMenuOpen]
 * @returns {'next'|'prev'|'first'|'last'|'menu'|'fullscreen'|'close'|null}
 */
export function keyToAction({
  key,
  shiftKey = false,
  altKey = false,
  ctrlKey = false,
  metaKey = false,
  isEditableTarget = false,
  isMenuOpen = false,
} = {}) {
  if (ctrlKey || altKey || metaKey) {
    return null;
  }

  const action = resolveBaseAction(key, shiftKey);
  if (action === null) {
    return null;
  }

  if (isEditableTarget && action !== 'close') {
    return null;
  }

  if (isMenuOpen && action !== 'menu' && action !== 'close') {
    return null;
  }

  return action;
}

/**
 * Classify a touch swipe as navigation. Horizontal swipes past the threshold
 * that are not more vertical than horizontal count; everything else is null.
 * @param {object} delta
 * @param {number} delta.dx
 * @param {number} delta.dy
 * @param {object} [options]
 * @param {number} [options.threshold]
 * @returns {'next'|'prev'|null}
 */
export function classifySwipe({ dx, dy }, { threshold = 50 } = {}) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < threshold) {
    return null;
  }

  if (absDy >= absDx) {
    return null;
  }

  return dx < 0 ? 'next' : 'prev';
}

/**
 * Where a sheet sits in the set, for the end-of-set controls: the last sheet
 * wins when there is only one.
 * @param {number} index 0-based sheet index
 * @param {number} total number of sheets
 * @returns {'first'|'middle'|'last'}
 */
export function sheetPosition(index, total) {
  if (index >= total - 1) {
    return 'last';
  }
  return index <= 0 ? 'first' : 'middle';
}

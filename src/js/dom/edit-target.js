/**
 * Decide whether a keyboard event target should be treated as "editable"
 * for the purposes of nav.js's keyToAction: normal form controls always
 * are, and BUTTON/A/SUMMARY are editable only for Space/Enter so their own
 * default activation isn't double-triggered by deck navigation.
 */

const ALWAYS_EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const ACTIVATION_TAGS = new Set(['BUTTON', 'A', 'SUMMARY']);
const ACTIVATION_KEYS = new Set([' ', 'Enter']);

/**
 * @param {EventTarget|null} target
 * @param {string} key
 * @returns {boolean}
 */
export function isEditableEventTarget(target, key) {
  if (!target || typeof target.tagName !== 'string') {
    return false;
  }

  const tag = target.tagName;

  if (ALWAYS_EDITABLE_TAGS.has(tag)) {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (typeof target.getAttribute === 'function' && target.getAttribute('role') === 'slider') {
    return true;
  }

  return ACTIVATION_TAGS.has(tag) && ACTIVATION_KEYS.has(key);
}

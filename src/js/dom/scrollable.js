/**
 * Detect elements that actually scroll horizontally (as opposed to merely
 * being styled overflow-x: auto with nothing to scroll), so the touch layer
 * can leave them alone.
 */

/**
 * @param {Element} element
 * @returns {boolean}
 */
export function isHorizontallyScrollable(element) {
  if (!(element instanceof Element)) {
    return false;
  }
  const { overflowX } = window.getComputedStyle(element);
  const scrolls = overflowX === 'auto' || overflowX === 'scroll';
  return scrolls && element.scrollWidth > element.clientWidth + 1;
}

/**
 * Walk up from `target` to (and excluding) `root`, true if any ancestor
 * (inclusive of `target`) is horizontally scrollable.
 * @param {Element} target
 * @param {Element} root
 * @returns {boolean}
 */
export function hasHorizontallyScrollableAncestor(target, root) {
  let node = target;
  while (node && node !== root && node.nodeType === 1) {
    if (isHorizontallyScrollable(node)) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

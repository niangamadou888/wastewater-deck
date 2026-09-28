const IGNORED_SELECTOR =
  'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable], table, dialog, [data-no-nav]';

function isFinePointer() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
}

function isIgnoredClickTarget(target) {
  return target instanceof Element && Boolean(target.closest(IGNORED_SELECTOR));
}

/**
 * Click the outer 15% left/right edge of the deck to navigate, on
 * fine-pointer devices only, ignoring interactive elements/tables/dialogs.
 * @param {HTMLElement} root
 * @param {{next: () => void, prev: () => void}} controller
 * @returns {() => void} teardown
 */
export function wirePointerEdgeClicks(root, controller) {
  function onClick(event) {
    if (!isFinePointer() || isIgnoredClickTarget(event.target)) {
      return;
    }

    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const edge = rect.width * 0.15;

    if (x <= edge) {
      controller.prev();
    } else if (x >= rect.width - edge) {
      controller.next();
    }
  }

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

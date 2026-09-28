import { classifySwipe } from '../lib/nav.js';
import { hasHorizontallyScrollableAncestor } from './scrollable.js';

const SWIPE_THRESHOLD = 50;
const IGNORED_START_SELECTOR = '[data-no-swipe], input, textarea, select, button, option, dialog[open]';

function shouldIgnoreSwipeStart(target, root) {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest(IGNORED_START_SELECTOR)) {
    return true;
  }
  return hasHorizontallyScrollableAncestor(target, root);
}

/**
 * Wire touchstart/touchend swipe navigation on the deck root.
 * @param {HTMLElement} root
 * @param {{next: () => void, prev: () => void}} controller
 * @returns {() => void} teardown
 */
export function wireTouchSwipe(root, controller) {
  let start = null;

  function onTouchStart(event) {
    if (event.touches.length !== 1 || shouldIgnoreSwipeStart(event.target, root)) {
      start = null;
      return;
    }
    const touch = event.touches[0];
    start = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event) {
    if (!start) {
      return;
    }
    const touch = event.changedTouches[0];
    const origin = start;
    start = null;
    if (!touch) {
      return;
    }

    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const action = classifySwipe({ dx, dy }, { threshold: SWIPE_THRESHOLD });

    if (action === 'next') {
      controller.next();
    } else if (action === 'prev') {
      controller.prev();
    }
  }

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    root.removeEventListener('touchstart', onTouchStart);
    root.removeEventListener('touchend', onTouchEnd);
  };
}

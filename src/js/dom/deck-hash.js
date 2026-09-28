import { parseHash, formatHash } from '../lib/nav.js';

/**
 * @param {number} total
 * @returns {number|null}
 */
export function readHashIndex(total) {
  return parseHash(window.location.hash, total);
}

/** @param {number} index */
export function writeHash(index) {
  const hash = formatHash(index);
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', hash);
  }
}

/**
 * Keep the deck in sync with hashchange events (back/forward, manual edits).
 * @param {{getTotal: () => number, goTo: (index: number, opts?: object) => void}} controller
 * @returns {() => void} teardown
 */
export function wireHashSync(controller) {
  function onHashChange() {
    const index = readHashIndex(controller.getTotal());
    if (index !== null) {
      controller.goTo(index, { updateHash: false });
    }
  }

  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
}

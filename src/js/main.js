/**
 * Build entry point. Bundled by esbuild into a single minified IIFE;
 * products.json is inlined here via esbuild's JSON loader so the deck
 * works fully offline from one file.
 */
import data from '../data/products.json';
import { initDeck } from './deck.js';
import { initShareUi } from './share-ui.js';
import { initSelectorUi } from './selector-ui.js';
import { wireLegendIsolate } from './dom/legend-isolate.js';

function init() {
  const root = document.querySelector('[data-deck]');
  if (!root) {
    return;
  }
  initDeck(root);
  initShareUi(root);
  initSelectorUi(root, data);
  wireLegendIsolate(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

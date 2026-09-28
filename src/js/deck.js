/**
 * Deck engine: wires slide navigation (keyboard, pointer edges, touch
 * swipe, hash deep links), fullscreen and the slide menu dialog onto a
 * `[data-deck]` root. Direction-independent — no visual design here.
 */
import { wireKeyboard } from './dom/deck-keyboard.js';
import { wirePointerEdgeClicks } from './dom/deck-pointer.js';
import { wireTouchSwipe } from './dom/deck-touch.js';
import { wireHashSync, readHashIndex } from './dom/deck-hash.js';
import { initFullscreenSupport, wireFullscreenButton } from './dom/deck-fullscreen.js';
import { wireMenu } from './dom/deck-menu.js';
import { createDeckController } from './dom/deck-controller.js';

function wireActionButtons(root, controller) {
  const buttons = root.querySelectorAll('[data-action]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => controller.dispatch(button.dataset.action));
  });
}

/**
 * Initialise the deck engine.
 * @param {HTMLElement} root a `[data-deck]` element
 * @returns {{getIndex: () => number, getTotal: () => number, goTo: Function, next: Function, prev: Function, first: Function, last: Function, dispatch: Function}}
 */
export function initDeck(root) {
  const slides = Array.from(root.querySelectorAll('[data-slide]'));
  const total = slides.length;
  const counterEl = root.querySelector('[data-counter]');
  const liveEl = root.querySelector('[data-live]');
  const sheetTitleEl = root.querySelector('[data-sheet-title]');
  const drgEl = root.querySelector('[data-drg]');
  const shareDialog = root.querySelector('dialog[data-share]');

  const { controller, renderInitial } = createDeckController(root, {
    slides,
    total,
    counterEl,
    liveEl,
    sheetTitleEl,
    drgEl,
    shareDialog,
  });

  initFullscreenSupport(root);
  wireFullscreenButton(root);
  wireKeyboard(root, controller);
  wirePointerEdgeClicks(root, controller);
  wireTouchSwipe(root, controller);
  wireHashSync(controller);
  wireMenu(root, controller);
  wireActionButtons(root, controller);

  renderInitial(readHashIndex(total) ?? 0);

  return controller;
}

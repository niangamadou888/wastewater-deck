/**
 * Builds the deck controller: the render/goTo state machine and the public
 * action-dispatch API that every input adapter (keyboard, pointer, touch,
 * hash, menu, action buttons) wires against. Extracted out of initDeck so
 * that function stays focused on wiring, not state.
 */
import { clampIndex } from '../lib/nav.js';
import {
  applyActiveSlide,
  updateCounter,
  updateLiveRegion,
  updateSheetTitle,
  updateDrawingNumber,
  updateEndControls,
} from './slide-state.js';
import { writeHash } from './deck-hash.js';
import { renderMenu, isMenuOpen, openMenu, closeMenu } from './deck-menu.js';
import { openDialog, closeDialog, isDialogOpen } from './dialog.js';
import { toggleFullscreen } from './deck-fullscreen.js';

function dispatchChange(root, index, previousIndex, slide) {
  root.dispatchEvent(
    new CustomEvent('deck:change', { detail: { index, previous: previousIndex, slide } })
  );
}

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {object} config
 * @param {HTMLElement[]} config.slides
 * @param {number} config.total
 * @param {HTMLElement|null} config.counterEl
 * @param {HTMLElement|null} config.liveEl
 * @param {HTMLElement|null} config.sheetTitleEl
 * @param {HTMLElement|null} config.drgEl
 * @param {HTMLDialogElement|null} config.shareDialog
 * @returns {{controller: object, renderInitial: (initialIndex: number) => void}}
 */
export function createDeckController(
  root,
  { slides, total, counterEl, liveEl, sheetTitleEl, drgEl, shareDialog }
) {
  let index = 0;

  function render(previousIndex) {
    applyActiveSlide(root, slides, index);
    updateCounter(counterEl, index, total);
    const title = slides[index]?.dataset.title ?? '';
    updateSheetTitle(sheetTitleEl, title);
    updateDrawingNumber(drgEl, index);
    updateEndControls(root, index, total);
    updateLiveRegion(liveEl, index, total, title);
    renderMenu(root, slides, index);
    dispatchChange(root, index, previousIndex, slides[index] ?? null);
  }

  function goTo(nextIndex, { updateHash: shouldUpdateHash = true } = {}) {
    const clamped = clampIndex(nextIndex, total);
    if (clamped === index) {
      return;
    }
    const previousIndex = index;
    index = clamped;
    render(previousIndex);
    if (shouldUpdateHash) {
      writeHash(index);
    }
  }

  const controller = {
    getIndex: () => index,
    getTotal: () => total,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
    first: () => goTo(0),
    last: () => goTo(total - 1),
    isMenuOpen: () => isMenuOpen(root),
    // Gates keyboard navigation (and any other input adapter) on *any* open
    // modal dialog, not just the menu — otherwise pressing arrow keys while
    // the share dialog is open navigates the deck behind the open modal.
    isAnyDialogOpen: () => isMenuOpen(root) || isDialogOpen(shareDialog),
    closeMenu: () => closeMenu(root),
    toggleMenu: () => (isMenuOpen(root) ? closeMenu(root) : openMenu(root)),
    toggleShare: () => (isDialogOpen(shareDialog) ? closeDialog(shareDialog) : openDialog(shareDialog)),
    closeShare: () => closeDialog(shareDialog),
    toggleFullscreen: () => toggleFullscreen(root),
    dispatch(action) {
      const handlers = {
        next: controller.next,
        prev: controller.prev,
        first: controller.first,
        last: controller.last,
        menu: controller.toggleMenu,
        fullscreen: controller.toggleFullscreen,
        share: controller.toggleShare,
        close: () => {
          controller.closeMenu();
          controller.closeShare();
        },
      };
      handlers[action]?.();
    },
  };

  /**
   * Force the very first render, bypassing goTo's no-op-on-same-index
   * guard so the deck always paints its initial slide.
   * @param {number} initialIndex
   */
  function renderInitial(initialIndex) {
    index = clampIndex(initialIndex, total);
    render(-1);
  }

  return { controller, renderInitial };
}

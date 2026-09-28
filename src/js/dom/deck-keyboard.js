import { keyToAction } from '../lib/nav.js';
import { isEditableEventTarget } from './edit-target.js';

/**
 * Wire document-level keydown handling to deck actions via keyToAction.
 * Navigation keys are suppressed while *any* modal dialog is open (menu or
 * share), not just the menu — otherwise arrow keys would navigate the deck
 * behind an open share dialog.
 * @param {HTMLElement} root
 * @param {{dispatch: (action: string) => void, isAnyDialogOpen: () => boolean}} controller
 * @returns {() => void} teardown
 */
export function wireKeyboard(root, controller) {
  function onKeyDown(event) {
    const editable = isEditableEventTarget(event.target, event.key);
    const action = keyToAction({
      key: event.key,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      isEditableTarget: editable,
      isMenuOpen: controller.isAnyDialogOpen(),
    });

    if (!action) {
      return;
    }

    event.preventDefault();
    controller.dispatch(action);
  }

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}

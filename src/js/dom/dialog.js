/**
 * Thin wrappers around the native <dialog> element, shared by the slide
 * menu and the share dialog.
 */

/** @param {HTMLDialogElement|null} dialog */
export function openDialog(dialog) {
  if (dialog && typeof dialog.showModal === 'function' && !dialog.open) {
    dialog.showModal();
  }
}

/** @param {HTMLDialogElement|null} dialog */
export function closeDialog(dialog) {
  if (dialog && dialog.open) {
    dialog.close();
  }
}

/**
 * @param {HTMLDialogElement|null} dialog
 * @returns {boolean}
 */
export function isDialogOpen(dialog) {
  return Boolean(dialog && dialog.open);
}

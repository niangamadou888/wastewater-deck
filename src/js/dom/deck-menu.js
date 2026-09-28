import { openDialog, closeDialog, isDialogOpen } from './dialog.js';

function getMenuDialog(root) {
  return root.querySelector('dialog[data-menu]');
}

/** A PE range in a sheet title ("40-150 PE"): kept on one line in the index. */
const PE_RANGE = /(\d+-\d+ PE)/;

/**
 * The title as one element (the button is a grid: counter, then title), with
 * any PE range wrapped so it never breaks at its hyphen.
 * @param {string} title
 * @returns {HTMLSpanElement}
 */
function buildMenuTitle(title) {
  const span = document.createElement('span');
  span.className = 'menu-title';
  title.split(PE_RANGE).forEach((part, index) => {
    if (!part) {
      return;
    }
    if (index % 2 === 1) {
      const range = document.createElement('span');
      range.className = 'nobr';
      range.textContent = part;
      span.appendChild(range);
    } else {
      span.appendChild(document.createTextNode(part));
    }
  });
  return span;
}

/**
 * Build the `<li><button data-menu-goto></button></li>` items once from
 * each slide's data-title. The slide set is fixed for the lifetime of a
 * deck instance, so this only actually rebuilds the list the first time
 * (an empty <ul>); on every later call it's a cheap no-op that returns the
 * existing buttons.
 *
 * This matters beyond performance: rebuilding on every render (as before)
 * discarded and recreated every menu item on every navigation, including
 * hashchange-driven navigation (e.g. browser back/forward) that can fire
 * while the menu dialog is still open and one of its items has focus.
 * Destroying the focused element drops `document.activeElement` to
 * `<body>`, breaking the open modal's focus containment. Reusing the same
 * button elements and only toggling aria-current avoids that entirely.
 * @param {HTMLUListElement} list
 * @param {HTMLElement[]} slides
 * @returns {HTMLButtonElement[]}
 */
function ensureMenuItems(list, slides) {
  if (list.children.length === slides.length) {
    return Array.from(list.querySelectorAll('[data-menu-goto]'));
  }

  list.replaceChildren(
    ...slides.map((slide, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.menuGoto = String(index);
      button.appendChild(buildMenuTitle(slide.dataset.title || `Slide ${index + 1}`));
      item.appendChild(button);
      return item;
    })
  );
  return Array.from(list.querySelectorAll('[data-menu-goto]'));
}

/**
 * Sync the menu dialog's item list with the current slide index, marking
 * the current slide with aria-current. See ensureMenuItems for why this
 * never discards existing (possibly focused) button elements.
 * @param {HTMLElement} root
 * @param {HTMLElement[]} slides
 * @param {number} currentIndex
 */
export function renderMenu(root, slides, currentIndex) {
  const list = getMenuDialog(root)?.querySelector('[data-menu-list]');
  if (!list) {
    return;
  }

  const buttons = ensureMenuItems(list, slides);
  buttons.forEach((button, index) => {
    if (index === currentIndex) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

/**
 * Wire clicks on menu items to navigate and close the menu.
 * @param {HTMLElement} root
 * @param {{goTo: (index: number) => void, closeMenu: () => void}} controller
 * @returns {() => void} teardown
 */
export function wireMenu(root, controller) {
  const menu = getMenuDialog(root);
  if (!menu) {
    return () => {};
  }

  function onListClick(event) {
    const button = event.target.closest('[data-menu-goto]');
    if (!button) {
      return;
    }
    controller.goTo(Number(button.dataset.menuGoto));
    controller.closeMenu();
  }

  menu.addEventListener('click', onListClick);
  return () => menu.removeEventListener('click', onListClick);
}

/** @param {HTMLElement} root */
export function openMenu(root) {
  openDialog(getMenuDialog(root));
}

/** @param {HTMLElement} root */
export function closeMenu(root) {
  closeDialog(getMenuDialog(root));
}

/**
 * @param {HTMLElement} root
 * @returns {boolean}
 */
export function isMenuOpen(root) {
  return isDialogOpen(getMenuDialog(root));
}

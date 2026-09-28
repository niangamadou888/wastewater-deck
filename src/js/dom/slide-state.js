/**
 * DOM application for "which slide is active". These functions write to
 * the DOM (unavoidable for a presentation engine) but never keep or mutate
 * any state object of their own — callers own the index.
 */
import { sheetPosition } from '../lib/nav.js';

/**
 * @param {HTMLElement[]} slides
 * @param {number} activeIndex
 * @returns {boolean} whether document.activeElement is inside one of the
 *   slides that's about to be deactivated (and thus made inert)
 */
function focusIsInsideAnOutgoingSlide(slides, activeIndex) {
  return slides.some(
    (slide, slideIndex) => slideIndex !== activeIndex && slide.contains(document.activeElement)
  );
}

/**
 * Move focus into the newly active slide so it never falls back to
 * `<body>`. Setting inert on the outgoing slide (in applyActiveSlide)
 * detaches it from the accessibility tree and, per the HTML spec, forces
 * any focus it held to reset to `<body>` — silently breaking keyboard/
 * screen-reader users' position in the document on every navigation
 * performed while focus was inside the outgoing slide's content.
 * @param {HTMLElement} activeSlide
 */
function refocusActiveSlide(activeSlide) {
  if (!activeSlide.hasAttribute('tabindex')) {
    activeSlide.setAttribute('tabindex', '-1');
  }
  activeSlide.focus({ preventScroll: true });
}

/**
 * Toggle is-active/data-state/aria-hidden/inert across every slide, and
 * update the deck root's --deck-progress custom property and data-index.
 * @param {HTMLElement} root
 * @param {HTMLElement[]} slides
 * @param {number} index
 */
export function applyActiveSlide(root, slides, index) {
  const activeSlide = slides[index] ?? null;
  const shouldRefocus = Boolean(activeSlide) && focusIsInsideAnOutgoingSlide(slides, index);

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === index;
    slide.classList.toggle('is-active', isActive);
    slide.dataset.state = isActive ? 'active' : 'inactive';
    if (isActive) {
      slide.removeAttribute('aria-hidden');
      slide.removeAttribute('inert');
    } else {
      slide.setAttribute('aria-hidden', 'true');
      slide.setAttribute('inert', '');
    }
  });

  const total = slides.length;
  root.dataset.index = String(index);
  const progress = total > 1 ? index / (total - 1) : 0;
  root.style.setProperty('--deck-progress', String(progress));

  if (shouldRefocus) {
    refocusActiveSlide(activeSlide);
  }
}

/**
 * Zero-pad a sheet number to two digits, e.g. 6 -> '06'. Sheet counts past
 * 99 are outside this deck's scope, so no wider padding is needed.
 * @param {number} n
 * @returns {string}
 */
function twoDigit(n) {
  return String(n).padStart(2, '0');
}

/**
 * Write the title-block sheet counter as two-digit "06" + <span class="of">
 * of</span> + "12" (docs/SHEET-KIT.md). Rebuilds the .of span each render —
 * cheap, static content with no focus/state to preserve (unlike the slide
 * menu's items; see deck-menu.js's ensureMenuItems for why that one differs).
 * @param {HTMLElement|null} counterEl
 * @param {number} index
 * @param {number} total
 */
export function updateCounter(counterEl, index, total) {
  if (!counterEl) {
    return;
  }
  const of = document.createElement('span');
  of.className = 'of';
  of.textContent = 'of';
  counterEl.replaceChildren(
    document.createTextNode(twoDigit(index + 1)),
    of,
    document.createTextNode(twoDigit(total))
  );
}

/**
 * Write the title block's drawing-title cell from the active slide's
 * data-title (docs/SHEET-KIT.md [data-sheet-title]).
 * @param {HTMLElement|null} sheetTitleEl
 * @param {string} title
 */
export function updateSheetTitle(sheetTitleEl, title) {
  if (!sheetTitleEl) {
    return;
  }
  sheetTitleEl.textContent = title;
}

/**
 * Write the title block's drawing-number cell as "WW-P1-" + the two-digit
 * sheet number (docs/SHEET-KIT.md [data-drg]).
 * @param {HTMLElement|null} drgEl
 * @param {number} index
 */
export function updateDrawingNumber(drgEl, index) {
  if (!drgEl) {
    return;
  }
  drgEl.textContent = `WW-P1-${twoDigit(index + 1)}`;
}

/**
 * @param {HTMLElement|null} liveEl
 * @param {number} index
 * @param {number} total
 * @param {string} title
 */
export function updateLiveRegion(liveEl, index, total, title) {
  if (!liveEl) {
    return;
  }
  liveEl.textContent = `Slide ${index + 1} of ${total}: ${title}`;
}

/**
 * End-of-set controls: Prev on the first sheet is marked aria-disabled (the
 * CSS mutes it), and Next on the last sheet becomes "Back to 01" by switching
 * its action to `first`. The root's data-position drives the label swap in CSS.
 * @param {HTMLElement} root
 * @param {number} index
 * @param {number} total
 */
export function updateEndControls(root, index, total) {
  const position = sheetPosition(index, total);
  root.dataset.position = position;
  root.querySelectorAll('[data-end-prev]').forEach((button) => {
    if (position === 'first') {
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-disabled');
    }
  });
  root.querySelectorAll('[data-end-next]').forEach((button) => {
    const last = position === 'last';
    button.dataset.action = last ? 'first' : 'next';
    button.setAttribute('aria-label', last ? 'Back to sheet 01' : 'Next sheet');
  });
}

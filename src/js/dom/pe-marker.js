/**
 * Moves the measured PE scale's cyan marker ([data-pe-marker], see
 * docs/SHEET-KIT.md "Measured PE scale") to the current PE value, with
 * setAttribute — never a CSS transform — so the marker's own SVG geometry
 * (x1/x2 on its <line>, x on its <text>) always matches the value it names.
 */
import { peToPercent } from '../lib/scale.js';

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {number} pe a whole PE value, or any non-finite value to park the
 *   marker at the scale's zero end (e.g. an empty/invalid form field)
 */
export function updatePeMarker(root, pe) {
  const marker = root.querySelector('[data-pe-marker]');
  if (!marker) {
    return;
  }

  const percent = `${peToPercent(pe)}%`;
  const line = marker.querySelector('line');
  if (line) {
    line.setAttribute('x1', percent);
    line.setAttribute('x2', percent);
  }

  const text = marker.querySelector('text');
  if (text) {
    text.setAttribute('x', percent);
    text.textContent = Number.isFinite(pe) && pe > 0 ? `${pe} PE` : '';
  }
}

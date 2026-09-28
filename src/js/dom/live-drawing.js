/**
 * Renders the selector's live tank-section drawing (tankSectionSvg, a pure
 * string builder) into `[data-live-drawing]`. DOMParser produces a detached
 * document from the SVG string — no innerHTML with data, per the engine's
 * markup contract — and only its root element is attached to the page.
 *
 * - The view title (`[data-live-title]`) names the drawn model, as a CAD
 *   view title does; textContent only.
 * - While the PE field still holds its authored example value (sheet 10
 *   opens on one, so it is a drawing from the start), the container carries
 *   `data-example` and the title says "Example".
 * - With no model to draw (blank, invalid or out-of-range PE) the last
 *   section stays as a ghost (`data-state="ghost"`, hidden from assistive
 *   tech) under the sheet's "enter a PE" note, so the sheet never turns into
 *   an empty box. Before any section has been drawn the container is empty.
 * - Pipes are drawn at the model's series pipe size (products.json
 *   `pipeMm`), so the section keeps its real proportions.
 */
import data from '../../data/products.json';
import { tankSectionSvg } from '../lib/tank-drawing.js';

const IDLE_TITLE = 'Live section';

/**
 * @param {string} svgString
 * @returns {Element}
 */
function parseSvg(svgString) {
  return new DOMParser().parseFromString(svgString, 'image/svg+xml').documentElement;
}

/**
 * @param {string} seriesId
 * @returns {number|undefined} the series' pipe size in mm
 */
function seriesPipeMm(seriesId) {
  return data.series.find((series) => series.id === seriesId)?.pipeMm;
}

/**
 * @param {HTMLElement} root
 * @returns {boolean} true while the PE field holds its authored (example) value
 */
function isExampleValue(root) {
  const field = root.querySelector('form[data-selector] [name="pe"]');
  return Boolean(field) && field.value !== '' && field.value === field.defaultValue;
}

/**
 * @param {HTMLElement} root
 * @param {string} text
 */
function setViewTitle(root, text) {
  const title = root.querySelector('[data-live-title]');
  if (title) {
    title.textContent = text;
  }
}

/**
 * Keep the last section as a ghost behind the "enter a PE" note.
 * @param {HTMLElement} container
 */
function ghostDrawing(container) {
  const svg = container.firstElementChild;
  container.removeAttribute('data-example');
  if (!svg) {
    container.removeAttribute('data-state');
    return;
  }
  svg.setAttribute('aria-hidden', 'true');
  container.dataset.state = 'ghost';
}

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {object|null} model the recommended model, or null when there is none
 * @param {string|null} seriesId
 */
export function renderLiveDrawing(root, model, seriesId) {
  const container = root.querySelector('[data-live-drawing]');
  if (!container) {
    return;
  }
  if (!model) {
    ghostDrawing(container);
    setViewTitle(root, IDLE_TITLE);
    return;
  }
  const example = isExampleValue(root);
  container.replaceChildren(parseSvg(tankSectionSvg(model, seriesId, { pipeMm: seriesPipeMm(seriesId) })));
  container.dataset.state = 'drawn';
  container.toggleAttribute('data-example', example);
  setViewTitle(root, `${example ? 'Example' : 'Section'}: ${model.code}, ${model.pe} PE`);
}

/**
 * Layer-isolate wiring for legend buttons (docs/SHEET-KIT.md "Layer legend
 * (isolate buttons)"). Each `button.legend-item[data-isolate]` toggles its
 * own aria-pressed and isolates the matching `[data-layer]` group in the
 * nearest `svg.dwg` (the one sharing its `<figure>`). Escape, or pressing
 * the active button again, clears the isolate.
 */

const LEGEND_BUTTON_SELECTOR = '.legend-item[data-isolate]';

/**
 * @param {HTMLElement} button
 * @returns {SVGElement|null} the svg.dwg sharing the button's figure
 */
function findTargetSvg(button) {
  const figure = button.closest('figure') ?? button.parentElement;
  return figure ? figure.querySelector('svg.dwg') : null;
}

/**
 * @param {HTMLElement} button
 * @returns {HTMLElement|null}
 */
function findLegendGroup(button) {
  return button.closest('.legend');
}

/**
 * @param {SVGElement|null} svg
 */
function clearIsolate(svg) {
  if (!svg) {
    return;
  }
  svg.removeAttribute('data-isolating');
  svg.querySelectorAll('[data-layer].is-isolated').forEach((el) => el.classList.remove('is-isolated'));
}

/**
 * @param {SVGElement|null} svg
 * @param {string} layerName
 */
function setIsolate(svg, layerName) {
  if (!svg) {
    return;
  }
  svg.setAttribute('data-isolating', '');
  svg.querySelectorAll('[data-layer]').forEach((el) => {
    el.classList.toggle('is-isolated', el.getAttribute('data-layer') === layerName);
  });
}

/**
 * @param {HTMLElement} group
 * @param {HTMLElement|null} activeButton
 */
function setPressedState(group, activeButton) {
  group.querySelectorAll(LEGEND_BUTTON_SELECTOR).forEach((button) => {
    button.setAttribute('aria-pressed', button === activeButton ? 'true' : 'false');
  });
}

/**
 * @param {HTMLElement} group
 * @param {SVGElement|null} svg
 */
function clearGroup(group, svg) {
  setPressedState(group, null);
  clearIsolate(svg);
}

/**
 * @param {MouseEvent} event
 */
function handleLegendClick(event) {
  const button = event.target instanceof Element ? event.target.closest(LEGEND_BUTTON_SELECTOR) : null;
  if (!button) {
    return;
  }

  const group = findLegendGroup(button);
  if (!group) {
    return;
  }
  const svg = findTargetSvg(button);
  const wasActive = button.getAttribute('aria-pressed') === 'true';

  if (wasActive) {
    clearGroup(group, svg);
    return;
  }

  setPressedState(group, button);
  setIsolate(svg, button.dataset.isolate);
}

/**
 * @param {KeyboardEvent} event
 */
function handleEscape(event) {
  if (event.key !== 'Escape') {
    return;
  }
  document.querySelectorAll('.legend[role="group"]').forEach((group) => {
    const activeButton = group.querySelector(`${LEGEND_BUTTON_SELECTOR}[aria-pressed="true"]`);
    if (!activeButton) {
      return;
    }
    clearGroup(group, findTargetSvg(activeButton));
  });
}

/**
 * Wire every legend group's isolate buttons under `root`.
 * @param {HTMLElement} root
 * @returns {() => void} teardown
 */
export function wireLegendIsolate(root) {
  root.addEventListener('click', handleLegendClick);
  document.addEventListener('keydown', handleEscape);
  return () => {
    root.removeEventListener('click', handleLegendClick);
    document.removeEventListener('keydown', handleEscape);
  };
}

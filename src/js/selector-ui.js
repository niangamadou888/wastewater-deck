/**
 * Selector form wiring: reads [data-selector], calls recommend(), renders
 * the result, keeps the latest valid selection in module state (and
 * sessionStorage) and keeps every [data-whatsapp-enquiry] link's href in
 * sync with the current selection.
 */
import { recommend, DISCLAIMER } from './lib/selector.js';
import { buildWhatsAppUrl, buildEnquiryText } from './lib/share.js';
import { renderEmptyState, renderDirectionState, renderOkState } from './dom/selector-render.js';
import { renderModelTable } from './dom/model-table.js';
import { updatePeMarker } from './dom/pe-marker.js';
import { renderLiveDrawing } from './dom/live-drawing.js';
import { updateResultPeek, wireResultPeek } from './dom/result-peek.js';
import { updateEnquiryCta } from './dom/enquiry-cta.js';

const STORAGE_KEY = 'wastewater-deck:selection';

function readFormInput(form) {
  const formData = new FormData(form);
  const peRaw = formData.get('pe');
  return {
    pe: peRaw === null || peRaw === '' ? NaN : Number(peRaw),
    highWaterTable: formData.has('highWaterTable'),
    deepBurial: formData.has('deepBurial'),
    limitedFootprint: formData.has('limitedFootprint'),
    powerAvailable: formData.has('powerAvailable'),
  };
}

function describeConditions(input) {
  const conditions = [];
  if (input.highWaterTable) conditions.push('high water table');
  if (input.deepBurial) conditions.push('deep burial');
  if (input.limitedFootprint) conditions.push('limited footprint');
  if (input.powerAvailable === false) conditions.push('no mains power available');
  return conditions;
}

function findSeriesName(data, seriesId) {
  return data.series.find((series) => series.id === seriesId)?.name ?? '';
}

function persistSelection(selection) {
  try {
    if (selection) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('sessionStorage unavailable, selection will not persist', error);
  }
}

function updateWhatsAppLinks(root, selection) {
  const href = buildWhatsAppUrl(root.dataset.whatsapp || '', buildEnquiryText(selection));
  root.querySelectorAll('[data-whatsapp-enquiry]').forEach((link) => {
    link.setAttribute('href', href);
  });
}

function buildSelection(data, result, input) {
  return {
    modelCode: result.model.code,
    pe: result.model.pe,
    seriesName: findSeriesName(data, result.seriesId),
    conditions: describeConditions(input),
  };
}

/**
 * Evaluate the current form input and render the result. Returns a new
 * module-state object rather than mutating the one passed in — the latest
 * valid selection (or null) is what the caller keeps as current state.
 * @param {HTMLElement} root
 * @param {object} data
 * @param {{input: object, peRaw: string}} state
 * @returns {{selection: object|null}}
 */
function evaluateAndRender(root, data, state) {
  const container = root.querySelector('[data-selector-result]');
  const result = recommend(state.input, data);

  updatePeMarker(root, state.input.pe);
  const seriesName = result.status === 'ok' ? findSeriesName(data, result.seriesId) : '';
  updateResultPeek(root, result, seriesName, state.peRaw);

  if (result.status === 'ok') {
    if (container) renderOkState(container, result, seriesName, DISCLAIMER);
    renderLiveDrawing(root, result.model, result.seriesId);
    return { selection: buildSelection(data, result, state.input) };
  }

  renderLiveDrawing(root, null, null);
  if (container) {
    if (result.status === 'invalid' && state.peRaw === '') {
      renderEmptyState(container);
    } else {
      renderDirectionState(container, result.status, result.reasons, DISCLAIMER);
    }
  }
  return { selection: null };
}

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {object} data products.json
 */
export function initSelectorUi(root, data) {
  renderModelTable(root, data);

  const form = root.querySelector('form[data-selector]');
  if (!form) {
    return;
  }

  let state = { selection: null };

  // `touched` is false until the visitor changes the form: the authored
  // example (8 PE) is shown on sheet 10 but is not their pick for sheet 12.
  function handleChange({ touched }) {
    const input = readFormInput(form);
    const peField = form.elements.namedItem('pe');
    state = evaluateAndRender(root, data, { input, peRaw: peField ? peField.value : '' });
    updateWhatsAppLinks(root, state.selection);
    updateEnquiryCta(root, touched ? state.selection : null);
    persistSelection(state.selection);
  }

  wireResultPeek(root);
  form.addEventListener('input', () => handleChange({ touched: true }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleChange({ touched: true });
  });

  handleChange({ touched: false });
}

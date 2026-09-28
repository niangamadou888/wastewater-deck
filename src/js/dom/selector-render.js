/**
 * Render the selector result panel with textContent/DOM APIs only — never
 * innerHTML with data — emitting the kit structure from docs/SHEET-KIT.md
 * ("Recommendation result"): .result[data-status] with .result-model,
 * .result-series, dl.result-dims, a .notes.is-plain reasons block, .warn
 * per warning, .result-actions with the WhatsApp CTA, .result-disclaimer;
 * .is-empty before a PE is entered.
 */

const DIM_FIELDS = [
  { key: 'diameter', sym: 'D', label: 'Diameter' },
  { key: 'width', sym: 'W', label: 'Width' },
  { key: 'length', sym: 'L', label: 'Length' },
  { key: 'height', sym: 'H1', label: 'Height' },
  { key: 'waterLevel', sym: 'H2', label: 'Water' },
];

function clearElement(el) {
  el.replaceChildren();
}

function buildDimEntry(sym, label, value, unit) {
  const div = document.createElement('div');
  const dt = document.createElement('dt');
  if (sym) {
    const symSpan = document.createElement('span');
    symSpan.className = 'sym';
    symSpan.textContent = sym;
    dt.appendChild(symSpan);
  }
  dt.appendChild(document.createTextNode(label));

  const dd = document.createElement('dd');
  dd.appendChild(document.createTextNode(String(value)));
  const small = document.createElement('small');
  small.textContent = unit;
  dd.appendChild(small);

  div.append(dt, dd);
  return div;
}

/**
 * @param {HTMLElement} container
 * @param {object} model
 */
function appendDimsList(container, model) {
  const dl = document.createElement('dl');
  dl.className = 'result-dims';
  DIM_FIELDS.forEach(({ key, sym, label }) => {
    if (Number.isFinite(model[key])) {
      dl.appendChild(buildDimEntry(sym, label, model[key], 'mm'));
    }
  });
  if (Number.isFinite(model.capacityL)) {
    dl.appendChild(buildDimEntry(null, 'Capacity', model.capacityL, 'L'));
  }
  container.appendChild(dl);
}

/**
 * A `.notes.is-plain` block (sentence-case reasons, per docs/SHEET-KIT.md),
 * reused for both "Why this model" and "Alternative model".
 * @param {HTMLElement} container
 * @param {string} headingId
 * @param {string} headingText
 * @param {string[]} items
 */
function appendNotesBlock(container, headingId, headingText, items) {
  const section = document.createElement('section');
  section.className = 'notes is-plain';
  section.setAttribute('aria-labelledby', headingId);

  const h4 = document.createElement('h4');
  h4.className = 'notes-title';
  h4.id = headingId;
  h4.textContent = headingText;

  const ol = document.createElement('ol');
  items.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    ol.appendChild(li);
  });

  section.append(h4, ol);
  container.appendChild(section);
}

/**
 * @param {HTMLElement} container
 * @param {string[]} warnings
 */
function appendWarnings(container, warnings) {
  warnings.forEach((text) => {
    const p = document.createElement('p');
    p.className = 'warn';
    p.textContent = text;
    container.appendChild(p);
  });
}

/**
 * @param {HTMLElement} container
 * @param {object} model
 */
function appendResultActions(container, model) {
  const p = document.createElement('p');
  p.className = 'result-actions';

  const a = document.createElement('a');
  a.className = 'btn btn-primary btn-cell';
  a.setAttribute('data-whatsapp-enquiry', '');
  a.setAttribute('href', '#');
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener');

  const small = document.createElement('small');
  small.textContent = 'Enquire on WhatsApp';
  const strong = document.createElement('strong');
  strong.textContent = `${model.code}, ${model.pe} PE`;
  a.append(small, strong);

  p.appendChild(a);
  container.appendChild(p);
}

/**
 * @param {HTMLElement} container
 * @param {string} disclaimer
 */
function appendDisclaimer(container, disclaimer) {
  const p = document.createElement('p');
  p.className = 'result-disclaimer';
  p.textContent = disclaimer;
  container.appendChild(p);
}

/**
 * Initial/blank-field state: no PE entered yet. No disclaimer — there is no
 * result yet to disclaim. Drops aria-labelledby: nothing with id
 * "result-model" exists in this state, and referencing a missing id is
 * itself an accessibility bug (also flagged by html-validate).
 * @param {HTMLElement} container
 */
export function renderEmptyState(container) {
  container.classList.add('is-empty');
  container.removeAttribute('data-status');
  container.removeAttribute('aria-labelledby');
  clearElement(container);
  const p = document.createElement('p');
  p.textContent = 'Enter a PE to see the certified model.';
  container.appendChild(p);
}

/**
 * Shared renderer for the invalid and out-of-range states: recommend()'s
 * reason(s), each as a `.warn` line, plus the disclaimer.
 * @param {HTMLElement} container
 * @param {'invalid'|'out-of-range'} status
 * @param {string[]} reasons
 * @param {string} disclaimer
 */
export function renderDirectionState(container, status, reasons, disclaimer) {
  container.classList.remove('is-empty');
  container.dataset.status = status;
  container.removeAttribute('aria-labelledby');
  clearElement(container);
  appendWarnings(container, reasons);
  appendDisclaimer(container, disclaimer);
}

/**
 * A valid recommendation: model, series, key dimensions, reasons, warnings,
 * alternatives, the WhatsApp enquiry CTA and the disclaimer.
 * @param {HTMLElement} container
 * @param {object} result recommend() output with status 'ok'
 * @param {string} seriesName
 * @param {string} disclaimer
 */
export function renderOkState(container, result, seriesName, disclaimer) {
  container.classList.remove('is-empty');
  container.dataset.status = 'ok';
  container.setAttribute('aria-labelledby', 'result-model');
  clearElement(container);

  const h3 = document.createElement('h3');
  h3.className = 'result-model';
  h3.id = 'result-model';
  h3.textContent = result.model.code;
  container.appendChild(h3);

  const series = document.createElement('p');
  series.className = 'result-series';
  series.textContent = `${seriesName}, rated ${result.model.pe} PE, ${result.model.orientation}`;
  container.appendChild(series);

  appendDimsList(container, result.model);

  if (result.reasons.length > 0) {
    appendNotesBlock(container, 'result-why', 'Why this model', result.reasons);
  }

  appendWarnings(container, result.warnings);

  if (result.alternatives.length > 0) {
    appendNotesBlock(
      container,
      'result-alt',
      'Alternative model',
      result.alternatives.map((model) => `${model.code} (${model.orientation})`)
    );
  }

  appendResultActions(container, result.model);
  appendDisclaimer(container, disclaimer);
}

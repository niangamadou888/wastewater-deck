/**
 * Result peek: a one-line summary of the current recommendation directly
 * under the PE input ([data-result-peek]). On phones the result card sits
 * below the site conditions, a long way down the page; the peek shows the
 * chosen model where the user is typing and scrolls to the full result on
 * request. CSS shows it on phones only. Text is set with textContent only.
 */

const OUT_OF_RANGE_TEXT = 'Above 150 PE: a full treatment plant';
const INVALID_TEXT = 'Enter a whole number of PE';

/**
 * @param {HTMLElement} peek
 * @param {string} model
 * @param {string} detail
 */
function fillPeek(peek, model, detail) {
  const modelEl = peek.querySelector('[data-peek-model]');
  const detailEl = peek.querySelector('[data-peek-detail]');
  if (modelEl) modelEl.textContent = model;
  if (detailEl) detailEl.textContent = detail;
  peek.hidden = false;
}

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {{status: string, model?: {code: string, pe: number}}} result recommend() output
 * @param {string} seriesName
 * @param {string} peRaw the PE field's raw value
 */
export function updateResultPeek(root, result, seriesName, peRaw) {
  const peek = root.querySelector('[data-result-peek]');
  if (!peek) {
    return;
  }
  if (result.status === 'ok' && result.model) {
    fillPeek(peek, result.model.code, `${result.model.pe} PE, ${seriesName}`);
    peek.dataset.status = 'ok';
    return;
  }
  if (peRaw === '') {
    peek.hidden = true;
    peek.removeAttribute('data-status');
    return;
  }
  fillPeek(peek, '', result.status === 'out-of-range' ? OUT_OF_RANGE_TEXT : INVALID_TEXT);
  peek.dataset.status = result.status;
}

/**
 * Wire the peek's button to bring the full result card into view.
 * @param {HTMLElement} root a `[data-deck]` element
 * @returns {() => void} teardown
 */
export function wireResultPeek(root) {
  const button = root.querySelector('[data-peek-go]');
  const result = root.querySelector('[data-selector-result]');
  if (!button || !result) {
    return () => {};
  }
  function onClick() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    result.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  button.addEventListener('click', onClick);
  return () => button.removeEventListener('click', onClick);
}

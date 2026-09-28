/**
 * Populate the "all models" comparison table from products.json — the
 * single source of truth — so the table can never drift from the data.
 */

function buildRow(series, model) {
  const tr = document.createElement('tr');
  const widthValue = model.diameter ?? model.width ?? '';
  const cellValues = [
    series.name,
    model.code,
    String(model.pe),
    model.orientation,
    String(widthValue),
    String(model.height ?? ''),
    String(model.capacityL ?? ''),
  ];
  cellValues.forEach((text) => {
    const td = document.createElement('td');
    td.textContent = text;
    tr.appendChild(td);
  });
  return tr;
}

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {object} data products.json
 */
export function renderModelTable(root, data) {
  const tbody = root.querySelector('table[data-model-table] tbody');
  if (!tbody) {
    return;
  }
  const rows = data.series.flatMap((series) => series.models.map((model) => buildRow(series, model)));
  tbody.replaceChildren(...rows);
}

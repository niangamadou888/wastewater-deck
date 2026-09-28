/**
 * QR code rendering as an inline SVG string, built on the bundled MIT
 * `qrcode-generator` library. No DOM access: this module only builds markup
 * as a string so it can be used to inline QR codes into a dialog.
 */
import qrcodeFactory from 'qrcode-generator';

const VALID_ECC_LEVELS = new Set(['L', 'M', 'Q', 'H']);

function escapeAttribute(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildModulePath(qr, margin) {
  const count = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        const x = col + margin;
        const y = row + margin;
        path += `M${x} ${y}h1v1h-1z`;
      }
    }
  }
  return { path, count };
}

/**
 * Render a QR code encoding `text` as a self-contained <svg> string.
 * @param {string} text
 * @param {object} [options]
 * @param {'L'|'M'|'Q'|'H'} [options.ecc] error correction level, default 'M'
 * @param {number} [options.margin] quiet zone in modules, default 0
 * @returns {string}
 */
export function makeQrSvg(text, options = {}) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new TypeError('makeQrSvg requires a non-empty string');
  }

  const ecc = VALID_ECC_LEVELS.has(options.ecc) ? options.ecc : 'M';
  const margin = Number.isFinite(options.margin) && options.margin >= 0 ? options.margin : 0;

  const qr = qrcodeFactory(0, ecc);
  qr.addData(text);
  qr.make();

  const { path, count } = buildModulePath(qr, margin);
  const size = count + margin * 2;
  const label = escapeAttribute('QR code');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `role="img" aria-label="${label}" shape-rendering="crispEdges">` +
    `<path d="${path}" fill="#000000"/>` +
    '</svg>'
  );
}

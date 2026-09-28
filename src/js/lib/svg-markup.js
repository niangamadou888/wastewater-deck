/**
 * Small string helpers shared by the live tank-section drawing modules.
 * Pure functions, no DOM access: the output is parsed by DOMParser in
 * src/js/dom/live-drawing.js.
 */

/**
 * Round to one decimal place: SVG coordinates need no more precision than
 * that, and it keeps the output short and stable for tests.
 * @param {number} n
 * @returns {number}
 */
export function fmt(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Escape text before it is embedded in the SVG string: required for valid
 * XML (a bare "&" or "<" in a model code would break DOMParser's
 * image/svg+xml parsing), not just as a defensive habit.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Advance of one B612 capital or figure, with the drawings' 0.04em tracking,
 * per unit of font size (measured in the browser at 0.615).
 */
const CHAR_ADVANCE_EM = 0.62;

/**
 * Estimated drawn width of a one-line label, for fit and collision decisions.
 * @param {string} text
 * @param {number} size font size in viewBox units
 * @returns {number}
 */
export function textWidth(text, size) {
  return String(text).length * CHAR_ADVANCE_EM * size;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * A closed rectangle as path data (walls and knockouts are paths so that
 * the only `rect.ly-wall` elements are the tank's two wall faces).
 */
export function rectPath(x, y, w, h) {
  return `M${fmt(x)} ${fmt(y)}H${fmt(x + w)}V${fmt(y + h)}H${fmt(x)}Z`;
}

/**
 * A closed rounded-rectangle path (clockwise), for the even-odd wall hatch.
 * @param {{x: number, y: number, w: number, h: number, rx: number}} b
 * @returns {string}
 */
export function roundedRectPath(b) {
  const r = fmt(b.rx);
  const right = b.x + b.w;
  const bottom = b.y + b.h;
  return (
    `M${fmt(b.x + b.rx)} ${fmt(b.y)}H${fmt(right - b.rx)}A${r} ${r} 0 0 1 ${fmt(right)} ${fmt(b.y + b.rx)}` +
    `V${fmt(bottom - b.rx)}A${r} ${r} 0 0 1 ${fmt(right - b.rx)} ${fmt(bottom)}` +
    `H${fmt(b.x + b.rx)}A${r} ${r} 0 0 1 ${fmt(b.x)} ${fmt(bottom - b.rx)}` +
    `V${fmt(b.y + b.rx)}A${r} ${r} 0 0 1 ${fmt(b.x + b.rx)} ${fmt(b.y)}Z`
  );
}

/**
 * @param {{x: number, y: number, w: number, h: number, rx: number}} b
 * @returns {string} rect attributes
 */
export function rectAttrs(b) {
  return `x="${fmt(b.x)}" y="${fmt(b.y)}" width="${fmt(b.w)}" height="${fmt(b.h)}" rx="${fmt(b.rx)}"`;
}

/**
 * The CAD break mark that closes a cut pipe: an S between its two edges,
 * scaled from the 16-unit pipes on the sheet 05 section.
 * @param {number} x
 * @param {number} top
 * @param {number} bottom
 * @returns {string}
 */
export function pipeBreakPath(x, top, bottom) {
  const d = bottom - top;
  const mid = top + d / 2;
  const bulge = Math.max(3, d * 0.375);
  return (
    `M${fmt(x)} ${fmt(top)}C${fmt(x + bulge)} ${fmt(top + d * 0.19)} ${fmt(x + bulge)} ${fmt(top + d * 0.31)} ${fmt(x)} ${fmt(mid)}` +
    `C${fmt(x - bulge)} ${fmt(mid + d * 0.19)} ${fmt(x - bulge)} ${fmt(mid + d * 0.31)} ${fmt(x)} ${fmt(bottom)}`
  );
}

/**
 * An invert-level mark: the red triangle hanging under a pipe invert.
 * @param {number} x
 * @param {number} invertY
 * @returns {string}
 */
export function invertMark(x, invertY) {
  return `<path class="ly-invert" d="M${fmt(x)} ${fmt(invertY)}l-4.5 8h9z"/>`;
}

/**
 * A text element; `text` is escaped here, exactly once.
 * @param {string} cls
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {string} [anchor]
 * @returns {string}
 */
export function textEl(cls, x, y, text, anchor) {
  const anchorAttr = anchor ? ` text-anchor="${anchor}"` : '';
  return `<text class="${cls}" x="${fmt(x)}" y="${fmt(y)}"${anchorAttr}>${escapeXml(text)}</text>`;
}

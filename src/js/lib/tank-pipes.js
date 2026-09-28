/**
 * Pipe runs for the live tank section: two pipe walls from a cut end (with
 * the CAD break mark) into the tank, and a knockout over the stretch outside
 * the tank so the sand and the tank wall read as cut by the pipe.
 */
import { fmt, rectPath, pipeBreakPath, invertMark, textEl } from './svg-markup.js';
import { pitEdgeX } from './tank-layout.js';

/** The invert mark sits this far outside the trench wall, so its IL note clears the wall. */
export const IL_CLEAR = 12;
/** The pipe runs on this far past the invert mark to its cut end. */
export const IL_STUB = 6;
/** Baseline of the IL note under the invert mark: the 8-unit mark, a gap, then the cap height. */
const IL_NOTE_DROP = 21;

/**
 * @param {{cutX: number, wallX: number, endX: number, top: number, bottom: number}} run
 *   cutX: the cut end outside the pit; wallX: the tank's inner wall face;
 *   endX: where the pipe stops inside the tank
 * @returns {string}
 */
export function pipeRunMarkup({ cutX, wallX, endX, top, bottom }) {
  const knockLeft = Math.min(cutX, wallX);
  const knockW = Math.abs(wallX - cutX);
  return (
    `<path class="ly-knockout" d="${rectPath(knockLeft, top, knockW, bottom - top)}"/>` +
    `<path class="ly-wall" d="M${fmt(cutX)} ${fmt(top)}H${fmt(endX)}M${fmt(cutX)} ${fmt(bottom)}H${fmt(endX)}"/>` +
    `<path class="ly-wall" d="${pipeBreakPath(cutX, top, bottom)}"/>`
  );
}

/**
 * Where a pipe's invert mark and cut end sit: outside the trench wall on the
 * pipe's side, so neither the mark nor its note touches the wall or the tank.
 * @param {{top: number, bottom: number, topL: number, botL: number, topR: number, botR: number}} pit
 * @param {number} invertY
 * @param {'left'|'right'} side
 * @returns {{markX: number, cutX: number}}
 */
export function invertPlacement(pit, invertY, side) {
  const out = side === 'left' ? -1 : 1;
  const markX = pitEdgeX(pit, invertY, side) + out * IL_CLEAR;
  return { markX, cutX: markX + out * IL_STUB };
}

/**
 * The invert mark under a pipe with its "IL" note centred below it, outside
 * the trench and clear of the pipe; invert depths are TBC.
 * @param {number} x
 * @param {number} invertY
 */
export function invertLevelMarkup(x, invertY) {
  return invertMark(x, invertY) + textEl('ly-note', x, invertY + IL_NOTE_DROP, 'IL', 'middle');
}

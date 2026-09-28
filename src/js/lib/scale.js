/**
 * Pure math for the measured PE scale (0-150 PE) shared by every product
 * sheet and the selector's live PE marker. No DOM access.
 */

export const PE_SCALE_MAX = 150;

/**
 * Convert a population equivalent into a percentage position (0-100) along
 * the 0-150 PE scale, clamped to the scale's bounds. Non-numeric input (e.g.
 * NaN from an empty/invalid form field) is treated as the scale's zero end.
 * @param {number} pe
 * @param {number} [max] the scale's upper bound in PE, default 150
 * @returns {number}
 */
export function peToPercent(pe, max = PE_SCALE_MAX) {
  if (!Number.isFinite(max) || max <= 0) {
    return 0;
  }
  if (typeof pe !== 'number' || Number.isNaN(pe)) {
    return 0;
  }
  const clamped = Math.min(Math.max(pe, 0), max);
  return (clamped / max) * 100;
}

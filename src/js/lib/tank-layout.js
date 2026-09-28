/**
 * Layout of the live tank section (sheet 10): scales a model's real
 * dimensions uniformly into the drawing and places the site around it
 * (ground line, pit, base, access necks, pipes, dimension strings).
 *
 * Only the tank is drawn to proportion. Burial depth, pit batter, base and
 * slab thickness are not published per model, so they are fixed schematic
 * sizes, as on the sheet 05 and sheet 08 sections.
 */
import { clamp } from './svg-markup.js';

/**
 * The viewBox contract with sheet 10 (src/css/slides/10.css): always 480 x 352,
 * whatever the model, with every line and label inside it, so the sheet shows
 * the whole viewBox at this aspect ratio and never crops it.
 */
export const VIEWBOX_WIDTH = 480;
export const VIEWBOX_HEIGHT = 352;
/**
 * The largest font sizes (viewBox units) sheet 10's CSS gives this drawing at
 * any breakpoint (it scales text up where the drawing is drawn small, so the
 * text stays near 11 CSS px). Every fit decision uses these sizes, so no size
 * the CSS picks can clip or collide.
 */
export const TEXT_SIZE = Object.freeze({ note: 15, label: 15.5, dim: 16 });
/** Right end of the "GL" label over the ground line (anchored at its end). */
export const GL_LABEL_END = VIEWBOX_WIDTH - 6;
/** Drawn wall thickness (viewBox units): schematic, like the other sections. */
export const WALL = 5;
/**
 * Band above ground level. An LT needs the full band for its blower housing
 * and label; a bio-filter only for the GL note, the cover tops, the
 * centreline overshoot and one extra dimension, so its tank draws larger.
 */
export const TOP_BAND = Object.freeze({ blower: 50, plain: 24 });
/** Ground level to tank top: slab and access necks (schematic, invert depths TBC). */
export const COVER = 26;
/** Concrete base and lean concrete under the tank. */
export const BASE = 12;
/** Soil hatch band along the ground line and around the pit. */
export const SOIL_BAND = 8;
/** Working space beside the tank at its base. */
const PIT_GAP = 12;
/** Pit side batter, horizontal per unit of depth. */
const PIT_BATTER = 0.12;
/** Room left of the pit for the H1 (and LT H2) dimension strings. */
const ANNOT_LEFT = 70;
/** Room right of the pit for the pipe stub and the bio-filter H2 string. */
const ANNOT_RIGHT = 46;
/** Room under the pit for the footprint dimension string. */
const ANNOT_BOTTOM = 40;
const DEFAULT_PIPE_MM = 100;

/**
 * The largest tank that fits under a given top band, with room for the pit,
 * base and every dimension string.
 * @param {number} topBand
 */
function tankLimits(topBand) {
  const maxTankH = VIEWBOX_HEIGHT - topBand - COVER - BASE - SOIL_BAND - ANNOT_BOTTOM;
  const maxPitSide = PIT_GAP + PIT_BATTER * (COVER + maxTankH + BASE);
  return { maxTankH, maxPitSide, maxTankW: VIEWBOX_WIDTH - ANNOT_LEFT - ANNOT_RIGHT - 2 * maxPitSide };
}

/**
 * @param {object} model
 * @returns {boolean} true for an LT box-ended cylinder (width + length)
 */
export function isBoxEnded(model) {
  return typeof model.width === 'number';
}

/**
 * The real-world footprint dimension (mm) drawn along the section's
 * horizontal axis: length for a horizontal cylinder or an LT box-ended
 * cylinder, diameter for a vertical cylinder.
 * @param {object} model
 * @returns {{symbol: string, mm: number}}
 */
export function footprint(model) {
  if (isBoxEnded(model) || model.orientation === 'horizontal') {
    return { symbol: 'L', mm: model.length };
  }
  return { symbol: 'D', mm: model.diameter };
}

/**
 * Any dimension not drawn as the footprint: the diameter of a horizontal
 * cylinder, or an LT tank's width. A long section cannot show it, so it is
 * written as a text-only dimension.
 * @param {object} model
 * @returns {Array<{symbol: string, mm: number}>}
 */
export function extraDimensions(model) {
  if (isBoxEnded(model)) {
    return [{ symbol: 'W', mm: model.width }];
  }
  if (model.orientation === 'horizontal' && Number.isFinite(model.diameter)) {
    return [{ symbol: 'D', mm: model.diameter }];
  }
  return [];
}

/**
 * The x of a pit side wall at height y (the sides batter outward to ground level).
 * @param {{top: number, bottom: number, topL: number, botL: number, topR: number, botR: number}} pit
 * @param {number} y
 * @param {'left'|'right'} side
 * @returns {number}
 */
export function pitEdgeX(pit, y, side) {
  const t = (y - pit.top) / (pit.bottom - pit.top);
  return side === 'left' ? pit.topL + (pit.botL - pit.topL) * t : pit.topR + (pit.botR - pit.topR) * t;
}

function buildPit(tank, groundY) {
  const bottom = tank.bottom + BASE;
  const batter = PIT_BATTER * (bottom - groundY);
  return {
    top: groundY,
    bottom,
    topL: tank.x - PIT_GAP - batter,
    botL: tank.x - PIT_GAP,
    botR: tank.x + tank.w + PIT_GAP,
    topR: tank.x + tank.w + PIT_GAP + batter,
  };
}

/**
 * Scale the model uniformly (no distortion) into the drawing, centre it,
 * and derive every level the section needs.
 * @param {object} model a products.json model
 * @param {{pipeMm?: number, topBand?: number}} [options] the series' pipe
 *   size in mm; the band above ground level (TOP_BAND, blower by default)
 */
export function buildLayout(model, options = {}) {
  const { symbol, mm: footprintMm } = footprint(model);
  const topBand = Number.isFinite(options.topBand) ? options.topBand : TOP_BAND.blower;
  const { maxTankH, maxPitSide, maxTankW } = tankLimits(topBand);
  const s = Math.min(maxTankW / footprintMm, maxTankH / model.height);
  const w = footprintMm * s;
  const h = model.height * s;
  const groundY = topBand + (maxTankH - h) / 2;
  const x = ANNOT_LEFT + maxPitSide + (maxTankW - w) / 2;
  const y = groundY + COVER;
  const bottom = y + h;
  const cylinder = model.orientation === 'horizontal' && !isBoxEnded(model);
  const rx = Math.min(w, h) * (cylinder ? 0.3 : 0.12);
  const inner = { x: x + WALL, y: y + WALL, w: w - WALL * 2, h: h - WALL * 2, rx: Math.max(rx - WALL, 2) };
  const waterLevelMm = Number.isFinite(model.waterLevel) ? model.waterLevel : 0;
  const waterY = Math.max(bottom - waterLevelMm * s, inner.y);
  const pipeMm = Number.isFinite(options.pipeMm) ? options.pipeMm : DEFAULT_PIPE_MM;
  const tank = { x, y, w, h, rx, bottom };

  return {
    ...tank,
    s,
    base: bottom,
    inner,
    innerBottom: inner.y + inner.h,
    waterY,
    groundY,
    pit: buildPit(tank, groundY),
    pipeD: clamp(pipeMm * s, 8, 16),
    footprintSymbol: symbol,
    footprintMm,
  };
}

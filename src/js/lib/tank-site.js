/**
 * Site layers of the live tank section: soil and ground line, the
 * sand-backfilled pit on its concrete base, and the access necks with their
 * covers at ground level. Vocabulary from the sheet 05 and 08 sections.
 */
import { fmt, rectPath, textEl } from './svg-markup.js';
import { VIEWBOX_WIDTH, GL_LABEL_END, BASE, SOIL_BAND, pitEdgeX } from './tank-layout.js';

const NECK_WALL = 4;
const COVER_LIP = 4;
const COVER_T = 5;
const SLAB_OVERHANG = 8;
/** A neck's centreline runs just past the tank's inner top face, clear of the TWL label below. */
const CENTRE_PAST = 4;

/**
 * Ground line, broken where the manhole covers sit on it.
 * @param {number} groundY
 * @param {Array<{cx: number, width: number}>} necks
 */
function groundLinePath(groundY, necks) {
  const gaps = necks
    .map((n) => [n.cx - n.width / 2 - COVER_LIP, n.cx + n.width / 2 + COVER_LIP])
    .sort((a, b) => a[0] - b[0]);
  let d = '';
  let from = 0;
  gaps.forEach(([start, end]) => {
    d += `M${fmt(from)} ${fmt(groundY)}H${fmt(start)}`;
    from = end;
  });
  return `${d}M${fmt(from)} ${fmt(groundY)}H${VIEWBOX_WIDTH}`;
}

/**
 * Soil beyond the excavation: a hatched band along the ground line and
 * around the pit's sides and bottom.
 */
function soilBandPath(pit) {
  const y2 = pit.top + SOIL_BAND;
  const leftIn = pitEdgeX(pit, y2, 'left') - SOIL_BAND;
  const rightIn = pitEdgeX(pit, y2, 'right') + SOIL_BAND;
  return (
    `M0 ${fmt(pit.top)}H${fmt(pit.topL)}L${fmt(pit.botL)} ${fmt(pit.bottom)}H${fmt(pit.botR)}` +
    `L${fmt(pit.topR)} ${fmt(pit.top)}H${VIEWBOX_WIDTH}V${fmt(y2)}H${fmt(rightIn)}` +
    `L${fmt(pit.botR + SOIL_BAND)} ${fmt(pit.bottom + SOIL_BAND)}H${fmt(pit.botL - SOIL_BAND)}` +
    `L${fmt(leftIn)} ${fmt(y2)}H0Z`
  );
}

/**
 * @param {ReturnType<import('./tank-layout.js').buildLayout>} geo
 * @param {Array<{cx: number, width: number}>} necks
 */
export function buildGroundMarkup(geo, necks) {
  const { pit } = geo;
  return (
    `<g data-layer="ground">` +
    `<path class="ly-soil" d="${soilBandPath(pit)}"/>` +
    `<path class="ly-ground" d="M${fmt(pit.topL)} ${fmt(pit.top)}L${fmt(pit.botL)} ${fmt(pit.bottom)}H${fmt(pit.botR)}L${fmt(pit.topR)} ${fmt(pit.top)}"/>` +
    `<path class="ly-ground" d="${groundLinePath(pit.top, necks)}"/>` +
    textEl('ly-note', GL_LABEL_END, pit.top - 6, 'GL', 'end') +
    `</g>`
  );
}

/**
 * Fine-sand backfill in the pit (stipple), on a concrete base over lean
 * concrete, with the cover slab over the tank.
 */
export function buildBeddingMarkup(geo) {
  const { pit } = geo;
  const baseX = pit.botL + 1;
  const baseW = pit.botR - pit.botL - 2;
  const slabY = geo.groundY + 12;
  return (
    `<g data-layer="bedding">` +
    `<path class="ly-sand" d="M${fmt(pit.topL)} ${fmt(pit.top)}L${fmt(pit.botL)} ${fmt(pit.bottom)}H${fmt(pit.botR)}L${fmt(pit.topR)} ${fmt(pit.top)}Z"/>` +
    `<path class="ly-concrete" d="${rectPath(baseX, geo.base, baseW, BASE - 4)}"/>` +
    `<path class="ly-concrete" d="${rectPath(baseX, geo.base + BASE - 4, baseW, 4)}"/>` +
    `<path class="ly-concrete" d="${rectPath(geo.x - SLAB_OVERHANG, slabY, geo.w + SLAB_OVERHANG * 2, 8)}"/>` +
    `</g>`
  );
}

/**
 * One access neck from the tank's inner face up to ground level: a
 * knockout bore (it cuts the slab, the sand and the tank top), hatched
 * riser walls, the cover at grade and its centreline.
 */
function neckMarkup(geo, { cx, width }) {
  const left = cx - width / 2;
  const top = geo.groundY;
  const bottom = geo.inner.y + 1;
  const wallH = bottom - top;
  const walls = rectPath(left, top, NECK_WALL, wallH) + rectPath(left + width - NECK_WALL, top, NECK_WALL, wallH);
  const cover = rectPath(left - COVER_LIP, top - COVER_T, width + COVER_LIP * 2, COVER_T);
  return (
    `<path class="ly-knockout" d="${rectPath(left, top, width, wallH)}"/>` +
    `<path class="ly-wall-hatch" d="${walls}${cover}"/>` +
    `<path class="ly-wall" d="${walls}${cover}"/>` +
    `<path class="ly-center" d="M${fmt(cx)} ${fmt(top - 12)}V${fmt(geo.inner.y + CENTRE_PAST)}"/>`
  );
}

/**
 * @param {ReturnType<import('./tank-layout.js').buildLayout>} geo
 * @param {Array<{cx: number, width: number}>} necks
 */
export function buildAccessMarkup(geo, necks) {
  return `<g data-layer="access">${necks.map((neck) => neckMarkup(geo, neck)).join('')}</g>`;
}

/**
 * Bio-filter internals for the live tank section (PE and FRP series), the
 * sheet 05 vocabulary parameterised by the model's proportions: inlet with
 * its dip pipe into the primary settling zone, a filter chamber hung from
 * the large opening with bio-media between two plates, and the outlet
 * leaving the chamber at top water level. Raw, settled, filtered and
 * discharged flow in yellow.
 */
import { fmt, clamp, rectPath, textEl, textWidth } from './svg-markup.js';
import { TEXT_SIZE } from './tank-layout.js';
import { pipeRunMarkup, invertLevelMarkup, invertPlacement } from './tank-pipes.js';

const CHAMBER_WALL = 4;
const TICK_PITCH = 10;
const SETTLING = 'SETTLING';
/** Clearance kept each side of the SETTLING note. */
const NOTE_CLEAR = 1;

function levels(geo) {
  const { inner, waterY, innerBottom, pipeD, pit } = geo;
  const depth = innerBottom - waterY;
  const chamberL = inner.x + inner.w * 0.56;
  const chamberR = inner.x + inner.w * 0.92 - CHAMBER_WALL;
  const dipX = inner.x + (chamberL - inner.x) * 0.2;
  const inletInvert = clamp(waterY - Math.max(10, pipeD * 0.8), inner.y + 2 + pipeD, waterY - 3);
  const outletTop = Math.max(waterY - pipeD, inner.y + 1);
  const inletIl = invertPlacement(pit, inletInvert, 'left');
  const outletIl = invertPlacement(pit, waterY, 'right');
  return {
    depth,
    chamberL,
    chamberR,
    partBottom: waterY + depth * 0.62,
    mediaTop: waterY + depth * 0.16,
    mediaBottom: waterY + depth * 0.5,
    dipX,
    dipL: dipX - pipeD / 2,
    dipR: dipX + pipeD / 2,
    dipBottom: waterY + depth * 0.24,
    inletInvert,
    inletTop: inletInvert - pipeD,
    outletTop,
    inletIlX: inletIl.markX,
    outletIlX: outletIl.markX,
    cutL: inletIl.cutX,
    cutR: outletIl.cutX,
  };
}

function necks(lv) {
  const spanL = lv.dipR + 3;
  const spanR = lv.chamberL - 3;
  const desludgeW = clamp((spanR - spanL) * 0.7, 14, 40);
  return [
    { cx: (spanL + spanR) / 2, width: desludgeW },
    { cx: (lv.chamberL + lv.chamberR + CHAMBER_WALL) / 2, width: lv.chamberR + CHAMBER_WALL - lv.chamberL },
  ];
}

function mediaMarkup(geo, lv) {
  const top = geo.inner.y;
  const wallH = lv.partBottom - top;
  const walls =
    rectPath(lv.chamberL, top, CHAMBER_WALL, wallH) +
    rectPath(lv.chamberR, top, CHAMBER_WALL, Math.max(lv.outletTop - 1 - top, 0)) +
    rectPath(lv.chamberR, geo.waterY + 1, CHAMBER_WALL, lv.partBottom - geo.waterY - 1);
  const bedL = lv.chamberL + CHAMBER_WALL;
  const bedW = lv.chamberR - bedL;
  let ticks = '';
  for (let x = bedL + 5; x < lv.chamberR - 2; x += TICK_PITCH) {
    ticks += `M${fmt(x)} ${fmt(lv.mediaTop - 4)}v8M${fmt(x)} ${fmt(lv.mediaBottom - 4)}v8`;
  }
  return (
    `<g data-layer="media">` +
    `<path class="ly-wall-hatch" d="${walls}"/>` +
    `<path class="ly-wall" d="${walls}"/>` +
    `<path class="ly-media" d="${rectPath(bedL, lv.mediaTop, bedW, lv.mediaBottom - lv.mediaTop)}"/>` +
    `<path class="ly-wall" d="M${fmt(bedL)} ${fmt(lv.mediaTop)}H${fmt(lv.chamberR)}M${fmt(bedL)} ${fmt(lv.mediaBottom)}H${fmt(lv.chamberR)}"/>` +
    `<path class="ly-media" d="${ticks}"/>` +
    `</g>`
  );
}

function inletMarkup(geo, lv) {
  const stub = lv.inletTop - 5;
  return (
    `<g data-layer="inlet">` +
    pipeRunMarkup({ cutX: lv.cutL, wallX: geo.inner.x, endX: lv.dipL, top: lv.inletTop, bottom: lv.inletInvert }) +
    `<path class="ly-wall" d="M${fmt(lv.dipL)} ${fmt(stub)}V${fmt(lv.inletTop)}M${fmt(lv.dipL)} ${fmt(lv.inletInvert)}V${fmt(lv.dipBottom)}M${fmt(lv.dipR)} ${fmt(stub)}V${fmt(lv.dipBottom)}"/>` +
    invertLevelMarkup(lv.inletIlX, lv.inletInvert) +
    `</g>`
  );
}

function outletMarkup(geo, lv) {
  return (
    `<g data-layer="outlet">` +
    pipeRunMarkup({
      cutX: lv.cutR,
      wallX: geo.inner.x + geo.inner.w,
      endX: lv.chamberL + CHAMBER_WALL + 3,
      top: lv.outletTop,
      bottom: geo.waterY,
    }) +
    invertLevelMarkup(lv.outletIlX, geo.waterY) +
    `</g>`
  );
}

/** Raw in, settled down and under the chamber, filtered up the media, discharged. */
function flowPaths(geo, lv) {
  const inletCy = lv.inletInvert - geo.pipeD / 2;
  const outletCy = (lv.outletTop + geo.waterY) / 2;
  const turnY = geo.innerBottom - 8;
  const settleEndX = lv.chamberL + (lv.chamberR - lv.chamberL) * 0.4;
  const settleStart = lv.dipBottom + 8;
  const settleDrop = Math.max(settleStart + 2, turnY - 30);
  const chamberIn = lv.chamberR - lv.chamberL - CHAMBER_WALL;
  const upCount = chamberIn >= 54 ? 3 : 2;
  const up = Array.from({ length: upCount }, (_, i) => {
    const x = lv.chamberL + CHAMBER_WALL + (chamberIn * (i + 1)) / (upCount + 1);
    return `<path class="ly-flow" d="M${fmt(x)} ${fmt(lv.partBottom - 6)}V${fmt(lv.mediaTop - 8)}"/>`;
  });
  return [
    `<path class="ly-flow" d="M${fmt(lv.cutL + 8)} ${fmt(inletCy)}H${fmt(lv.dipL - 3)}"/>`,
    `<path class="ly-flow" d="M${fmt(lv.dipX)} ${fmt(inletCy)}V${fmt(lv.dipBottom - 3)}"/>`,
    `<path class="ly-flow" d="M${fmt(lv.dipX)} ${fmt(settleStart)}V${fmt(settleDrop)}C${fmt(lv.dipX)} ${fmt(turnY + 6)} ${fmt(settleEndX)} ${fmt(turnY + 6)} ${fmt(settleEndX)} ${fmt(lv.partBottom + 4)}"/>`,
    ...up,
    `<path class="ly-flow" d="M${fmt(lv.chamberL + CHAMBER_WALL + 8)} ${fmt(outletCy)}H${fmt(lv.cutR - 8)}"/>`,
  ];
}

/**
 * SETTLING, below the dip pipe: between the settling flow line (at dipX) and
 * the filter chamber wall, at the largest size the sheet CSS sets, or left
 * out where the zone is too narrow for it.
 */
function notesMarkup(geo, lv) {
  const zone = lv.chamberL - lv.dipX;
  if (zone < textWidth(SETTLING, TEXT_SIZE.note) + 2 * NOTE_CLEAR) {
    return '';
  }
  return textEl('ly-note', (lv.dipX + lv.chamberL) / 2, geo.waterY + lv.depth * 0.46, SETTLING, 'middle');
}

/**
 * @param {ReturnType<import('./tank-layout.js').buildLayout>} geo
 */
export function buildBioFilter(geo) {
  const lv = levels(geo);
  return {
    necks: necks(lv),
    internals: mediaMarkup(geo, lv) + notesMarkup(geo, lv),
    pipes: inletMarkup(geo, lv) + outletMarkup(geo, lv),
    flows: flowPaths(geo, lv),
    twlX: lv.dipR + 6,
    h2: { side: 'right', startX: lv.cutR + 11 },
    leftCut: lv.cutL,
  };
}

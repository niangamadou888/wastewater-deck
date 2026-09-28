/**
 * LT internals for the live tank section, the sheet 08 vocabulary
 * parameterised by the model's proportions: the aerobic reactor tank (ART)
 * at the inlet end, a sloped partition with a transfer pipe into the final
 * settlement tank (FST), the outlet baffle, the diffuser fed by blowers at
 * grade (1 duty + 1 standby), and inlet above / outlet below top water level.
 * Positions are the sheet 08 section's, as fractions of the inner length and
 * of the water depth.
 */
import { fmt, clamp, rectPath, textEl, textWidth } from './svg-markup.js';
import { VIEWBOX_WIDTH, GL_LABEL_END, TEXT_SIZE } from './tank-layout.js';
import { pipeRunMarkup, invertLevelMarkup, invertPlacement } from './tank-pipes.js';

const PARTITION = 5;
const LEG = 10;
const HOUSING_W = 40;
const HOUSING_H = 22;
/** Clearance kept between a label and the lines around it. */
const LABEL_GAP = 4;
/** Air columns rising from the diffuser, either side of the air main. */
const AIR_OFFSETS = [-7, -3, 3, 7];
/** Sheet 08: inlet centre 11 above TWL, outlet centre 10 below, of a 152-unit water depth. */
const INLET_ABOVE_TWL = 0.072;
const OUTLET_BELOW_TWL = 0.066;

function levels(geo) {
  const { inner, waterY, innerBottom, pipeD, pit } = geo;
  const d = innerBottom - waterY;
  const X = (f) => inner.x + inner.w * f;
  const Y = (f) => waterY + d * f;
  const inletCy = Math.max(waterY - d * INLET_ABOVE_TWL, inner.y + pipeD / 2 + 2);
  const outletCy = Y(OUTLET_BELOW_TWL);
  const inletIl = invertPlacement(pit, inletCy + pipeD / 2, 'right');
  const outletIl = invertPlacement(pit, outletCy + pipeD / 2, 'left');
  return {
    d,
    X,
    Y,
    partTopX: X(0.585),
    partLowX: X(0.412),
    crossTop: waterY - 8,
    crossBottom: waterY + 4,
    slopeEndY: innerBottom - d * 0.287,
    fstLegX: X(0.537),
    artLegX: X(0.621),
    legTop: waterY - 14,
    fstLegBottom: Y(0.09),
    artLegBottom: Y(0.32),
    /** Sheet 08's diffuser position; buildLt moves it onto the ART neck's centreline. */
    diffuserX: X(0.777),
    diffuserY: Y(0.454),
    inletCy,
    outletCy,
    /** The ART flow runs down the inlet-end wall at xr and turns along the floor near yb. */
    xr: inner.x + inner.w - 7,
    yb: innerBottom - 12,
    inletIlX: inletIl.markX,
    outletIlX: outletIl.markX,
    cutL: outletIl.cutX,
    cutR: inletIl.cutX,
  };
}

function necks(geo, lv) {
  const width = clamp(geo.inner.w * 0.16, 16, 44);
  return [
    { cx: lv.X(0.23), width },
    { cx: lv.X(0.75), width },
  ];
}

/**
 * The ART label sits in the reactor clear of the flow and the diffuser:
 * under the diffuser in a deep tank, beside it (under top water level) in a
 * shallow one, whichever region first holds the label at its largest size.
 */
function artLabelMarkup(geo, lv) {
  const size = TEXT_SIZE.label;
  const width = textWidth('ART', size);
  const floor = lv.yb - 26 - LABEL_GAP;
  const regions = [
    { x1: lv.artLegX + 6 + LABEL_GAP, x2: lv.xr - LABEL_GAP, y1: lv.diffuserY + 9 + LABEL_GAP, y2: floor },
    { x1: lv.diffuserX + 9 + LABEL_GAP, x2: lv.xr - LABEL_GAP, y1: geo.waterY + 6 + LABEL_GAP, y2: floor },
  ];
  const fits = (r) => r.x2 - r.x1 >= width && r.y2 - r.y1 >= size;
  const r = regions.find(fits) ?? regions[0];
  return textEl('ly-label-long', (r.x1 + r.x2) / 2, (r.y1 + r.y2) / 2 + size * 0.35, 'ART', 'middle');
}

function partitionMarkup(geo, lv) {
  const top = geo.inner.y;
  const bottom = geo.innerBottom;
  const upper = rectPath(lv.partTopX, top, PARTITION, Math.max(lv.crossTop - top, 0));
  const lower =
    `M${fmt(lv.partTopX)} ${fmt(lv.crossBottom)}H${fmt(lv.partTopX + PARTITION)}` +
    `L${fmt(lv.partLowX + PARTITION)} ${fmt(lv.slopeEndY)}V${fmt(bottom)}H${fmt(lv.partLowX)}V${fmt(lv.slopeEndY)}Z`;
  const fL = lv.fstLegX - LEG / 2;
  const aL = lv.artLegX - LEG / 2;
  const transfer =
    `M${fmt(fL)} ${fmt(lv.fstLegBottom)}V${fmt(lv.legTop)}H${fmt(fL + LEG)}V${fmt(lv.crossTop)}H${fmt(aL)}` +
    `V${fmt(lv.legTop)}H${fmt(aL + LEG)}V${fmt(lv.artLegBottom)}M${fmt(aL)} ${fmt(lv.artLegBottom)}` +
    `V${fmt(lv.crossBottom)}H${fmt(fL + LEG)}V${fmt(lv.fstLegBottom)}`;
  const bx = lv.X(0.092);
  const baffle =
    `M${fmt(geo.inner.x)} ${fmt(geo.inner.y + 8)}H${fmt(bx)}V${fmt(lv.Y(0.257))}` +
    `L${fmt(lv.X(0.042))} ${fmt(lv.Y(0.349))}`;
  return (
    `<g data-layer="partition">` +
    `<path class="ly-wall-hatch" d="${upper}${lower}"/>` +
    `<path class="ly-wall" d="${upper}${lower}"/>` +
    `<path class="ly-wall" d="${transfer}"/>` +
    `<path class="ly-wall" d="${baffle}"/>` +
    textEl('ly-label-long', lv.X(0.3), lv.Y(0.36), 'FST', 'middle') +
    artLabelMarkup(geo, lv) +
    `</g>`
  );
}

/**
 * "BLOWERS" beside the housing when it clears the "GL" label at the end of
 * the ground line, otherwise centred over the housing (kept inside the sheet).
 */
function blowerLabelMarkup(hx, gl) {
  const size = TEXT_SIZE.note;
  const width = textWidth('BLOWERS', size);
  const besideX = hx + HOUSING_W + 8;
  const glLeft = GL_LABEL_END - textWidth('GL', size);
  if (besideX + width <= glLeft - LABEL_GAP * 2) {
    return textEl('ly-note', besideX, gl - 7, 'BLOWERS');
  }
  const x = Math.min(hx + HOUSING_W / 2, VIEWBOX_WIDTH - LABEL_GAP - width / 2);
  return textEl('ly-note', x, gl - HOUSING_H - 7, 'BLOWERS', 'middle');
}

function blowerMarkup(geo, lv, artNeck) {
  const gl = geo.groundY;
  const hx = Math.min(artNeck.cx + artNeck.width / 2 + 10, VIEWBOX_WIDTH - HOUSING_W - 6);
  const housing = `M${fmt(hx)} ${fmt(gl)}V${fmt(gl - HOUSING_H)}H${fmt(hx + HOUSING_W)}V${fmt(gl)}`;
  const runY = gl + 8;
  const air = AIR_OFFSETS
    .map((dx) => `M${fmt(lv.diffuserX + dx)} ${fmt(lv.diffuserY - 4)}V${fmt(geo.waterY + 6)}`)
    .join('');
  return (
    `<g data-layer="blower">` +
    `<path class="ly-wall" d="${housing}"/>` +
    `<circle class="ly-wall" cx="${fmt(hx + 12)}" cy="${fmt(gl - 11)}" r="6"/>` +
    `<circle class="ly-wall" cx="${fmt(hx + 28)}" cy="${fmt(gl - 11)}" r="6"/>` +
    `<path class="ly-steel" d="M${fmt(hx + HOUSING_W / 2)} ${fmt(gl)}V${fmt(runY)}H${fmt(lv.diffuserX)}V${fmt(lv.diffuserY)}"/>` +
    `<circle class="ly-wall" cx="${fmt(lv.diffuserX)}" cy="${fmt(lv.diffuserY + 5)}" r="4"/>` +
    `<path class="ly-air" d="${air}"/>` +
    blowerLabelMarkup(hx, gl) +
    `</g>`
  );
}

function pipesMarkup(geo, lv) {
  const half = geo.pipeD / 2;
  const inner = geo.inner;
  return (
    `<g data-layer="inlet">` +
    pipeRunMarkup({ cutX: lv.cutR, wallX: inner.x + inner.w, endX: inner.x + inner.w - 8, top: lv.inletCy - half, bottom: lv.inletCy + half }) +
    invertLevelMarkup(lv.inletIlX, lv.inletCy + half) +
    `</g>` +
    `<g data-layer="outlet">` +
    pipeRunMarkup({ cutX: lv.cutL, wallX: inner.x, endX: inner.x + 6, top: lv.outletCy - half, bottom: lv.outletCy + half }) +
    invertLevelMarkup(lv.outletIlX, lv.outletCy + half) +
    `</g>`
  );
}

/**
 * Inlet and outlet runs first (right to left, as the water moves), then the
 * aerated ART, the transfer into the FST and the rise under the baffle.
 */
function flowPaths(geo, lv) {
  const inner = geo.inner;
  const { xr, yb } = lv;
  const X = lv.X;
  const Y = lv.Y;
  const bx = inner.x + Math.max(6, inner.w * 0.03);
  return [
    `<path class="ly-flow" d="M${fmt(lv.cutR - 8)} ${fmt(lv.inletCy)}H${fmt(inner.x + inner.w - 10)}"/>`,
    `<path class="ly-flow" d="M${fmt(inner.x + 3)} ${fmt(lv.outletCy)}H${fmt(lv.cutL + 8)}"/>`,
    `<path class="ly-flow" d="M${fmt(xr)} ${fmt(geo.waterY + 2)}V${fmt(yb - 26)}C${fmt(xr)} ${fmt(yb + 4)} ${fmt(lv.artLegX)} ${fmt(yb + 4)} ${fmt(lv.artLegX)} ${fmt(yb - 26)}V${fmt(lv.artLegBottom + 7)}"/>`,
    `<path class="ly-flow" d="M${fmt(lv.artLegX)} ${fmt(lv.artLegBottom - 3)}V${fmt(geo.waterY - 2)}H${fmt(lv.fstLegX)}V${fmt(lv.fstLegBottom + 4)}"/>`,
    `<path class="ly-flow" d="M${fmt(lv.fstLegX)} ${fmt(lv.fstLegBottom + 10)}C${fmt(X(0.495))} ${fmt(Y(0.342))} ${fmt(X(0.396))} ${fmt(Y(0.645))} ${fmt(X(0.248))} ${fmt(Y(0.658))}C${fmt(X(0.124))} ${fmt(Y(0.671))} ${fmt(X(0.05))} ${fmt(Y(0.579))} ${fmt(X(0.027))} ${fmt(Y(0.434))}"/>`,
    `<path class="ly-flow" d="M${fmt(bx)} ${fmt(Y(0.316))}V${fmt(lv.outletCy + geo.pipeD / 2 + 4)}"/>`,
  ];
}

/**
 * @param {ReturnType<import('./tank-layout.js').buildLayout>} geo
 */
export function buildLt(geo) {
  const base = levels(geo);
  const neckList = necks(geo, base);
  // The air main drops down the ART manhole's centreline to the diffuser,
  // so it never runs a hair beside the red centreline.
  const lv = { ...base, diffuserX: neckList[1].cx };
  return {
    necks: neckList,
    internals: partitionMarkup(geo, lv),
    pipes: pipesMarkup(geo, lv) + blowerMarkup(geo, lv, neckList[1]),
    flows: flowPaths(geo, lv),
    twlX: lv.X(0.12),
    h2: { side: 'left' },
    leftCut: lv.cutL,
  };
}

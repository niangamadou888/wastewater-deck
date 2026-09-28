/**
 * Live tank-section drawing: builds an inline `<svg class="dwg">` string,
 * drawn to a specific model's real proportions, for the product selector's
 * `[data-live-drawing]` hook (see docs/ENGINE.md). Pure string building
 * only — no DOM access — so the caller (src/js/dom/live-drawing.js) can
 * parse the result safely with DOMParser.
 *
 * The section carries the same layer vocabulary as the sheet 05 (bio-filter)
 * and sheet 08 (LT) sections, parameterised by the model's D or L, H1 and
 * H2: ground line and soil, a sand-backfilled pit on a concrete base, access
 * necks with covers at grade, the series' internals, inlet and outlet pipes
 * with invert marks, and live dimension strings. Every number drawn comes
 * from `model` (src/data/products.json); no fact is invented here. Site
 * depths are schematic because invert levels are TBC.
 */
import { fmt, escapeXml, roundedRectPath, rectAttrs, textEl } from './svg-markup.js';
import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, SOIL_BAND, TOP_BAND, buildLayout, extraDimensions, isBoxEnded } from './tank-layout.js';
import { buildGroundMarkup, buildBeddingMarkup, buildAccessMarkup } from './tank-site.js';
import { buildBioFilter } from './tank-biofilter.js';
import { buildLt } from './tank-lt.js';

/** Extension lines stop this far short of the object they measure. */
const EXT_GAP = 2;
const DEFAULT_ID_PREFIX = 'live-dwg';

const SERIES_LABELS = { pe: 'PE Bio-Filter', frp: 'FRP Bio-Filter', lt: 'LT' };

/**
 * @param {string} seriesId
 * @returns {string}
 */
function seriesLabel(seriesId) {
  return SERIES_LABELS[seriesId] ?? 'Tank';
}

function assertDrawable(model) {
  if (!model || typeof model !== 'object') {
    throw new TypeError('tankSectionSvg requires a model object');
  }
  if (!Number.isFinite(model.height)) {
    throw new TypeError('tankSectionSvg requires a finite model.height');
  }
  const footprintMm = isBoxEnded(model) || model.orientation === 'horizontal' ? model.length : model.diameter;
  if (!Number.isFinite(footprintMm)) {
    throw new TypeError('tankSectionSvg requires a finite footprint dimension (diameter or length)');
  }
}

/**
 * A knockout hides the sand behind the tank; only the wall ring is hatched
 * (ANSI31 between the outer and inner faces), so the interior stays open
 * for the water tint.
 */
function buildShellMarkup(geo) {
  return (
    `<g data-layer="shell">` +
    `<path class="ly-knockout" d="${roundedRectPath(geo)}"/>` +
    `<path class="ly-wall-hatch" fill-rule="evenodd" d="${roundedRectPath(geo)}${roundedRectPath(geo.inner)}"/>` +
    `<rect class="ly-wall" ${rectAttrs(geo)}/>` +
    `<rect class="ly-wall" ${rectAttrs(geo.inner)}/>` +
    `</g>`
  );
}

/**
 * The water body fills the inner face up to top water level, clipped to the
 * inner outline so its lower corners follow the tank's.
 */
function buildWaterMarkup(geo, clipId, twlX) {
  const { inner, innerBottom } = geo;
  const y = geo.waterY;
  if (innerBottom - y <= 0) {
    return '<g data-layer="water"></g>';
  }
  return (
    `<g data-layer="water">` +
    `<clipPath id="${clipId}"><rect ${rectAttrs(inner)}/></clipPath>` +
    `<rect class="ly-water" clip-path="url(#${clipId})" x="${fmt(inner.x)}" y="${fmt(y)}" width="${fmt(inner.w)}" height="${fmt(innerBottom - y)}"/>` +
    `<line class="ly-waterline" x1="${fmt(inner.x)}" x2="${fmt(inner.x + inner.w)}" y1="${fmt(y)}" y2="${fmt(y)}"/>` +
    textEl('ly-note', twlX, y - 5, 'TWL') +
    `</g>`
  );
}

function buildWidthDim(geo) {
  const y = geo.pit.bottom + SOIL_BAND + 12;
  const left = fmt(geo.x);
  const right = fmt(geo.x + geo.w);
  return (
    `<path class="ly-dim-ext" d="M${left} ${fmt(geo.base + EXT_GAP)}V${fmt(y + 6)}M${right} ${fmt(geo.base + EXT_GAP)}V${fmt(y + 6)}"/>` +
    `<path class="ly-dim" d="M${left} ${fmt(y)}H${right}"/>` +
    textEl('ly-dim-text', geo.x + geo.w / 2, y + 19, `${geo.footprintSymbol} ${fmt(geo.footprintMm)}`, 'middle')
  );
}

/**
 * A vertical dimension from the tank base to `topY`. Extension lines run
 * from `topStartX` / `baseStartX` (EXT_GAP short of the object) to 6 units
 * past the dimension line; the figure reads up the line's left side.
 */
function buildHeightDim(geo, { x, symbol, mm, topY, topStartX, baseStartX }) {
  const top = fmt(topY);
  const bottom = fmt(geo.base);
  const past = x < geo.x ? x - 6 : x + 6;
  const textX = x - 7;
  return (
    `<path class="ly-dim-ext" d="M${fmt(topStartX)} ${top}H${fmt(past)}M${fmt(baseStartX)} ${bottom}H${fmt(past)}"/>` +
    `<path class="ly-dim" d="M${fmt(x)} ${top}V${bottom}"/>` +
    `<text class="ly-dim-text" transform="translate(${fmt(textX)} ${fmt((topY + geo.base) / 2)}) rotate(-90)" text-anchor="middle">${symbol} ${fmt(mm)}</text>`
  );
}

/**
 * H1 always left of the pit. H2 follows its series' sheet: right of the
 * outlet stub on a bio-filter (sheet 05), where its extension clears the
 * outlet pipe, and left beside H1 on an LT (sheet 08).
 */
function buildDimsMarkup(geo, model, series) {
  const leftEdge = Math.min(geo.pit.topL, series.leftCut) - 8;
  const cornerX = geo.x + geo.rx - EXT_GAP;
  const h2Left = series.h2.side === 'left';
  const h1X = h2Left ? leftEdge - 30 : leftEdge - 16;
  const h2 = h2Left
    ? { x: leftEdge - 10, topStartX: geo.x - EXT_GAP, baseStartX: cornerX }
    : {
        x: series.h2.startX + 14,
        topStartX: series.h2.startX,
        baseStartX: geo.x + geo.w - geo.rx + EXT_GAP,
      };
  return (
    `<g data-layer="dims">` +
    buildWidthDim(geo) +
    buildHeightDim(geo, { x: h1X, symbol: 'H1', mm: model.height, topY: geo.y, topStartX: cornerX, baseStartX: cornerX }) +
    buildHeightDim(geo, { ...h2, symbol: 'H2', mm: model.waterLevel, topY: geo.waterY }) +
    buildExtraDimsMarkup(geo, model) +
    `</g>`
  );
}

/**
 * Any dimension the section cannot show (W of an LT, D of a horizontal
 * tank), written as a text-only dimension over the ground line at the left,
 * next to the section it belongs to. The model's name is the sheet's view
 * title, outside the drawing.
 */
function buildExtraDimsMarkup(geo, model) {
  return extraDimensions(model)
    .map(({ symbol, mm }, i) => textEl('ly-dim-text', 8, geo.groundY - 8 - i * 20, `${symbol} ${fmt(mm)}`))
    .join('');
}

function describe(model, geo, seriesId, rawCode) {
  const pipes =
    seriesId === 'lt'
      ? 'inlet at the right above top water level, outlet at the left below it'
      : 'inlet above top water level, outlet at top water level';
  const internals =
    seriesId === 'lt'
      ? 'aerobic reactor tank, sloped partition and final settlement tank, with blowers at grade'
      : 'primary settling zone and a bio-media filter chamber';
  return (
    `${rawCode}: ${geo.footprintSymbol} ${fmt(geo.footprintMm)} mm, H1 ${fmt(model.height)} mm, ` +
    `H2 ${fmt(model.waterLevel)} mm. Buried on a concrete base in a sand-backfilled pit, with ${internals}; ` +
    `${pipes}. Invert levels TBC.`
  );
}

/**
 * Build the live tank-section drawing for a chosen model, drawn to its real
 * proportions (unlike the other, illustrative drawings on the deck).
 * @param {object} model a model entry from products.json (src/data/products.json)
 * @param {string} seriesId the model's series id ('pe' | 'frp' | 'lt')
 * @param {{pipeMm?: number, idPrefix?: string}} [options]
 *   pipeMm: the series' pipe size; idPrefix: keeps ids unique when two
 *   sections share a page
 * @returns {string} a self-contained `<svg class="dwg">...</svg>` string
 */
export function tankSectionSvg(model, seriesId, options = {}) {
  assertDrawable(model);

  const isLt = seriesId === 'lt';
  const geo = buildLayout(model, { pipeMm: options.pipeMm, topBand: isLt ? TOP_BAND.blower : TOP_BAND.plain });
  const series = isLt ? buildLt(geo) : buildBioFilter(geo);
  const prefix = options.idPrefix ?? DEFAULT_ID_PREFIX;
  // Raw (unescaped) text: escaping happens exactly once, where the text is
  // embedded in the markup, so a code containing "&" or "<" is never escaped twice.
  const rawCode = String(model.code);
  const titleText = `Typical section: ${rawCode}, ${seriesLabel(seriesId)}, drawn to this model's real proportions.`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="dwg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" role="img" ` +
    `aria-labelledby="${prefix}-title ${prefix}-desc">` +
    `<title id="${prefix}-title">${escapeXml(titleText)}</title>` +
    `<desc id="${prefix}-desc">${escapeXml(describe(model, geo, seriesId, rawCode))}</desc>` +
    buildGroundMarkup(geo, series.necks) +
    buildBeddingMarkup(geo) +
    buildShellMarkup(geo) +
    buildWaterMarkup(geo, `${prefix}-inner`, series.twlX) +
    series.internals +
    buildAccessMarkup(geo, series.necks) +
    series.pipes +
    `<g data-layer="flow">${series.flows.join('')}</g>` +
    buildDimsMarkup(geo, model, series) +
    `</svg>`
  );
}

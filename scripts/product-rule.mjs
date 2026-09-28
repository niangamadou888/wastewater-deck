/**
 * The authored sizing rule behind src/data/products.json.
 *
 * Lintang Tankworks is fictional, so its schedule is synthetic: every
 * dimension is derived here from the model's PE rating by a stated rule, and
 * every capacity is the liquid volume of the tank as the deck draws it. No
 * figure is copied from any real manufacturer's schedule. The rule is this
 * fictional maker's own, not a standard (docs/SOURCES.md).
 *
 * 1. Target liquid volume: septic tanks hold 1600 L plus 220 L per PE; an LT
 *    holds 900 L plus 150 L per PE.
 * 2. Vertical cylinder: D grows with PE from a per-series base diameter
 *    (rounded to 50 mm); H2 is the depth that holds the target volume
 *    (rounded up to 10 mm); H1 adds the series' freeboard.
 * 3. Horizontal cylinder: D comes from the same kind of rule, H1 = D,
 *    H2 = D less the freeboard, and L is the length that holds the target
 *    volume (rounded up to 10 mm).
 * 4. LT: fixed W, H1 and H2 for every model; L is the length that holds the
 *    target volume (rounded up to 50 mm).
 * 5. Capacity is the drawn liquid volume, rounded to the nearest 10 L:
 *    pi/4 D^2 H2 (vertical), the circular segment of D filled to H2 times L
 *    (horizontal), W x L x H2 (LT).
 */

export const VOLUME_RULE = Object.freeze({
  septic: Object.freeze({ baseL: 1600, perPeL: 220 }),
  lt: Object.freeze({ baseL: 900, perPeL: 150 }),
});

export const SHAPE_RULE = Object.freeze({
  pe: Object.freeze({
    vertical: Object.freeze({ baseD: 1400, perPeD: 25, freeboard: 300 }),
    horizontal: Object.freeze({ baseD: 1300, perPeD: 0, freeboard: 250 }),
  }),
  frp: Object.freeze({
    vertical: Object.freeze({ baseD: 1350, perPeD: 35, freeboard: 350 }),
    horizontal: Object.freeze({ baseD: 1400, perPeD: 10, freeboard: 300 }),
  }),
  lt: Object.freeze({ width: 2300, height: 2500, waterLevel: 1900, lengthStep: 50 }),
});

/** Model line-up per series: code, PE rating, orientation. */
export const LINE_UP = Object.freeze({
  pe: Object.freeze([
    ['LP-6H', 6, 'horizontal'], ['LP-6V', 6, 'vertical'], ['LP-8', 8, 'vertical'], ['LP-10', 10, 'vertical'],
    ['LP-12', 12, 'vertical'], ['LP-15', 15, 'vertical'], ['LP-18', 18, 'vertical'],
  ]),
  frp: Object.freeze([
    ['LF-8H', 8, 'horizontal'], ['LF-8V', 8, 'vertical'], ['LF-15H', 15, 'horizontal'], ['LF-15V', 15, 'vertical'],
    ['LF-20V', 20, 'vertical'], ['LF-28H', 28, 'horizontal'], ['LF-30H', 30, 'horizontal'],
  ]),
  lt: Object.freeze([
    ['LT-40', 40], ['LT-50', 50], ['LT-60', 60], ['LT-75', 75],
    ['LT-90', 90], ['LT-110', 110], ['LT-130', 130], ['LT-150', 150],
  ]),
});

const MM3_PER_LITRE = 1e6;

const roundTo = (value, step) => Math.round(value / step) * step;
const ceilTo = (value, step) => Math.ceil(value / step) * step;

/**
 * @param {'pe'|'frp'|'lt'} seriesId
 * @param {number} pe
 * @returns {number} target liquid volume in litres
 */
export function targetLitres(seriesId, pe) {
  const rule = seriesId === 'lt' ? VOLUME_RULE.lt : VOLUME_RULE.septic;
  return rule.baseL + rule.perPeL * pe;
}

/**
 * Area (mm^2) of a circle of diameter `d` filled to depth `h` from its bottom.
 * @param {number} d
 * @param {number} h
 */
export function segmentArea(d, h) {
  const r = d / 2;
  const depth = Math.min(Math.max(h, 0), d);
  const offset = r - depth;
  return r * r * Math.acos(offset / r) - offset * Math.sqrt(Math.max(2 * r * depth - depth * depth, 0));
}

/**
 * The liquid volume the deck draws for a model, in litres, to the nearest 10 L.
 * @param {object} model a products.json model
 * @returns {number}
 */
export function drawnCapacityL(model) {
  let mm3;
  if (typeof model.width === 'number') {
    mm3 = model.width * model.length * model.waterLevel;
  } else if (model.orientation === 'horizontal') {
    mm3 = segmentArea(model.diameter, model.waterLevel) * model.length;
  } else {
    mm3 = (Math.PI / 4) * model.diameter ** 2 * model.waterLevel;
  }
  return roundTo(mm3 / MM3_PER_LITRE, 10);
}

function verticalModel(rule, code, pe, litres) {
  const diameter = roundTo(rule.baseD + rule.perPeD * pe, 50);
  const waterLevel = ceilTo((litres * MM3_PER_LITRE) / ((Math.PI / 4) * diameter ** 2), 10);
  return { code, pe, orientation: 'vertical', diameter, length: null, height: waterLevel + rule.freeboard, waterLevel };
}

function horizontalModel(rule, code, pe, litres) {
  const diameter = roundTo(rule.baseD + rule.perPeD * pe, 50);
  const waterLevel = diameter - rule.freeboard;
  const length = ceilTo((litres * MM3_PER_LITRE) / segmentArea(diameter, waterLevel), 10);
  return { code, pe, orientation: 'horizontal', diameter, length, height: diameter, waterLevel };
}

function ltModel(rule, code, pe, litres) {
  const length = ceilTo((litres * MM3_PER_LITRE) / (rule.width * rule.waterLevel), rule.lengthStep);
  return { code, pe, orientation: 'horizontal', width: rule.width, length, height: rule.height, waterLevel: rule.waterLevel };
}

/**
 * Derive one model entry from its line-up row.
 * @param {'pe'|'frp'|'lt'} seriesId
 * @param {[string, number, string?]} row
 */
export function deriveModel(seriesId, [code, pe, orientation]) {
  const litres = targetLitres(seriesId, pe);
  let shape;
  if (seriesId === 'lt') {
    shape = ltModel(SHAPE_RULE.lt, code, pe, litres);
  } else if (orientation === 'horizontal') {
    shape = horizontalModel(SHAPE_RULE[seriesId].horizontal, code, pe, litres);
  } else {
    shape = verticalModel(SHAPE_RULE[seriesId].vertical, code, pe, litres);
  }
  return { ...shape, capacityL: drawnCapacityL(shape) };
}

/**
 * @param {'pe'|'frp'|'lt'} seriesId
 * @returns {object[]} every model in the series, in schedule order
 */
export function deriveSeriesModels(seriesId) {
  return LINE_UP[seriesId].map((row) => deriveModel(seriesId, row));
}

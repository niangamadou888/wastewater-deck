/**
 * Product selection logic. Pure function over src/data/products.json: no DOM
 * access, no mutation of the input data. See docs/ENGINE.md for the rules
 * this module implements.
 */

export const DISCLAIMER =
  "Selection guide only. Lintang Tankworks' engineers confirm the model with a PE calculation.";

const INVALID_REASON = 'Enter a whole number of PE, 1 or greater.';
const OUT_OF_RANGE_REASON =
  'Beyond Phase 1 (up to 150 PE): a full sewage treatment plant is needed. ' +
  "Talk to Lintang Tankworks' engineers.";
const LT_POWER_WARNING =
  'The LT system needs mains power for its air blowers; confirm power is available on site.';
/* A high water table never changes the series: sheet 06 says the PE series
   suits coastal and high water-table areas, and sheet 07 says the same of
   FRP. The site needs the tank anchored and strapped to its base instead
   (sheet 11), so the result says that. */
const HIGH_WATER_TABLE_SEPTIC_NOTE =
  'High water table: both bio-filter series suit it, so the model stays the same. Anchor and strap the tank to its base (sheet 11).';
const HIGH_WATER_TABLE_LT_NOTE =
  'High water table: the model stays the same. Anchor and strap the tank to its base (sheet 11).';
/* Deep burial steering to FRP is the maker's own guide rule, for the
   fibreglass shell's flexural strength (sheets 04 and 07), not a standard. */
const DEEP_BURIAL_REASON =
  "Deep burial: Lintang Tankworks' guide rule picks the FRP Bio-Filter series, for its flexural strength.";

function isValidPe(pe) {
  return Number.isInteger(pe) && pe >= 1;
}

function findSeries(data, seriesId) {
  return data.series.find((series) => series.id === seriesId);
}

/**
 * Among a series' models, find the smallest PE that still covers the
 * request, and every model tied at that PE value.
 * @param {Array<object>} models
 * @param {number} pe
 * @returns {{tiedGroup: Array<object>}}
 */
function smallestQualifying(models, pe) {
  const qualifying = models.filter((model) => model.pe >= pe);
  if (qualifying.length === 0) {
    return { tiedGroup: [] };
  }
  const minPe = Math.min(...qualifying.map((model) => model.pe));
  return { tiedGroup: qualifying.filter((model) => model.pe === minPe) };
}

/**
 * Break a tie between models sharing the same PE by orientation preference:
 * vertical when the site has a limited footprint, horizontal (shallower
 * dig) otherwise. The non-chosen sibling becomes an alternative.
 * @param {Array<object>} tiedGroup
 * @param {boolean} limitedFootprint
 * @returns {{chosen: object, others: Array<object>}}
 */
function chooseFromTied(tiedGroup, limitedFootprint) {
  if (tiedGroup.length <= 1) {
    return { chosen: tiedGroup[0], others: [] };
  }
  const preferredOrientation = limitedFootprint ? 'vertical' : 'horizontal';
  const chosen =
    tiedGroup.find((model) => model.orientation === preferredOrientation) ?? tiedGroup[0];
  const others = tiedGroup.filter((model) => model !== chosen);
  return { chosen, others };
}

function recommendLt(pe, input, data) {
  const series = findSeries(data, 'lt');
  const { tiedGroup } = smallestQualifying(series.models, pe);
  const chosen = tiedGroup[0];

  const reasons = [
    `Requested ${pe} PE is above the 30 PE limit of the septic tank series, so the ${series.name} applies.`,
    `Rated ${chosen.pe} PE, the smallest LT model that covers ${pe} PE.`,
    ...(input.highWaterTable ? [HIGH_WATER_TABLE_LT_NOTE] : []),
  ];

  const warnings = input.powerAvailable === false ? [LT_POWER_WARNING] : [];

  return {
    status: 'ok',
    seriesId: 'lt',
    model: chosen,
    alternatives: [],
    reasons,
    warnings,
  };
}

function buildSepticSeriesReasons(seriesId, triggers, pe) {
  const seriesReasons =
    seriesId === 'pe'
      ? ['Within the PE Bio-Filter series range (6-18 PE).']
      : [
          ...(triggers.overEighteen
            ? [`Requested ${pe} PE exceeds the 18 PE limit of the PE Bio-Filter series, so the FRP Bio-Filter series applies.`]
            : []),
          ...(triggers.deepBurial ? [DEEP_BURIAL_REASON] : []),
        ];
  return triggers.highWaterTable ? [...seriesReasons, HIGH_WATER_TABLE_SEPTIC_NOTE] : seriesReasons;
}

function recommendSepticTank(pe, input, data) {
  const triggers = {
    overEighteen: pe > 18,
    highWaterTable: Boolean(input.highWaterTable),
    deepBurial: Boolean(input.deepBurial),
  };
  // A high water table is noted, never a series trigger (see HIGH_WATER_TABLE_SEPTIC_NOTE).
  const useFrp = triggers.overEighteen || triggers.deepBurial;
  const seriesId = useFrp ? 'frp' : 'pe';
  const series = findSeries(data, seriesId);

  const { tiedGroup } = smallestQualifying(series.models, pe);
  const { chosen, others } = chooseFromTied(tiedGroup, Boolean(input.limitedFootprint));

  const orientationReason =
    chosen.orientation === 'vertical'
      ? 'Vertical model chosen for a smaller footprint.'
      : 'Horizontal model chosen for a shallower dig.';
  const reasons = [
    ...buildSepticSeriesReasons(seriesId, triggers, pe),
    `Rated ${chosen.pe} PE, the smallest ${series.name} model that covers ${pe} PE.`,
    ...(others.length > 0 ? [orientationReason] : []),
  ];

  return {
    status: 'ok',
    seriesId,
    model: chosen,
    alternatives: others,
    reasons,
    warnings: [],
  };
}

/**
 * Recommend a Lintang Tankworks model for a given population equivalent and site
 * conditions. See docs/ENGINE.md for the full rule set.
 * @param {{pe: number, highWaterTable?: boolean, deepBurial?: boolean, limitedFootprint?: boolean, powerAvailable?: boolean}} input
 * @param {object} data products.json
 * @returns {{status: 'ok'|'out-of-range'|'invalid', seriesId: string|null, model: object|null, alternatives: Array<object>, reasons: string[], warnings: string[]}}
 */
export function recommend(input, data) {
  const pe = input?.pe;

  if (!isValidPe(pe)) {
    return {
      status: 'invalid',
      seriesId: null,
      model: null,
      alternatives: [],
      reasons: [INVALID_REASON],
      warnings: [],
    };
  }

  if (pe > 150) {
    return {
      status: 'out-of-range',
      seriesId: null,
      model: null,
      alternatives: [],
      reasons: [OUT_OF_RANGE_REASON],
      warnings: [],
    };
  }

  if (pe > 30) {
    return recommendLt(pe, input, data);
  }

  return recommendSepticTank(pe, input, data);
}

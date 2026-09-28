# Sources — sample data

This is a portfolio concept for a **fictional** manufacturer, "Lintang Tankworks". Nothing in
`src/data/products.json` describes a real company or a real certified product.

- **Dimensions and capacities are synthetic.** Every figure in `src/data/products.json` is derived
  from the model's PE rating by an authored sizing rule, `scripts/product-rule.mjs`, and written by
  `node scripts/derive-products.mjs`; none is copied from any real manufacturer's schedule. The rule is
  this fictional maker's own, not a standard:
  1. Target liquid volume: a septic tank holds 1600 L plus 220 L per PE; an LT holds 900 L plus 150 L
     per PE.
  2. Vertical tanks: D grows with PE from a per-series base (PE series 1400 mm + 25 mm per PE, FRP
     1350 mm + 35 mm per PE, rounded to 50 mm); H2 is the depth that holds the target volume, rounded
     up to 10 mm; H1 adds the freeboard (300 mm PE, 350 mm FRP).
  3. Horizontal tanks: H1 = D (PE 1300 mm; FRP 1400 mm + 10 mm per PE, rounded to 50 mm), H2 = D less
     the freeboard (250 mm PE, 300 mm FRP), and L is the length that holds the target volume, rounded
     up to 10 mm.
  4. LT: every model is 2300 mm wide and 2500 mm high with water at 1900 mm; L is the length that
     holds the target volume, rounded up to 50 mm. The LT line-up is eight models (40, 50, 60, 75, 90,
     110, 130 and 150 PE).
  5. Capacity is the liquid volume the deck draws, to the nearest 10 L: pi/4 x D^2 x H2 for a vertical
     tank, the circular segment of D filled to H2 times L for a horizontal tank, W x L x H2 for an LT.

  `tests/unit/products.test.js` checks that the data file is exactly the rule's output and that the
  schedules on sheets 06, 07 and 09 match it. The real company this concept was originally drafted
  for is not named anywhere in this project, and none of its dimensions, capacities or its dispatch
  town is used.
- **The brand, every model code, and every licence number are invented.** "Lintang Tankworks", the
  LP-/LF-/LT- model codes, and the sample licence numbers (`SAMPLE-PE-01`, `SAMPLE-FRP-02`,
  `SAMPLE-SSTS-03`) do not correspond to any real company, product, or certificate. They are rendered
  with a visible "sample" marker everywhere they appear in the deck.
- **The public standards and regulation are real and unchanged**: MS 2441-1:2012, MS 2441-2:2014,
  MS 1228:1991 and the Malaysian Sewerage Industry Guidelines (MSIG) Volume V are genuine published
  Malaysian Standards, cited by name and number only — no licence, certificate or "since" date is
  attached to Lintang Tankworks against them. The EQA discharge limits (sheet 09) are transcribed
  directly from the Environmental Quality (Sewage) Regulations 2009, P.U.(A) 432/2009, a public
  regulation, and are shown as fact rather than sample data.
- **The installation sequence** (sheet 11: excavate, base and anchors, set and strap, fill and
  backfill, pipes, slab and necks, covers and final fill) follows the general order and materials
  (lean concrete base, BRC mesh, stainless steel anchor straps, sand backfill, fall on the pipes)
  described in public septic-tank installation guidance for this class of product; item and panel
  numbers on each step are illustrative, not references to any specific document.
- **The site photo** (`src/assets/photo-tanks.webp`, sheet 02) is a real, unrelated photograph used as
  a stand-in with full attribution — see `src/assets/photo-tanks.json` for its own provenance and
  CC BY-SA 4.0 licence.

## Guide assumptions (not standards)

The selector (sheet 10) picks the FRP Bio-Filter series for deep burial even at 18 PE or less, for the
fibreglass shell's flexural strength. This is the fictional maker's own guide rule, not a rule drawn
from any brochure or standard; the selector's reason text, its rules list and sheet 07 all call it
"Lintang Tankworks' guide rule" to keep that distinction visible. A high water table never changes the
series or the model: both bio-filter series suit it, and the selector adds the anchor-and-strap note
(sheet 11) instead.

## Not shown as fact

Never invented, and never shown as fact for this fictional brand: invert levels in mm below ground,
weights, blower power ratings, prices, real customer or project references, awards, ISO certifications,
subsidiary counts or distributor counts.

# Sheet kit

The visual system for the 12-sheet Phase 1 deck, "The Drawing Sheet at Night": every slide is a CAD
model-space sheet with a frame, zone references and a title block. This file is the class reference
for slide authors and the markup contract for the engine. Live preview of every component, set with
real data: `tests/visual/kit.html` (open it straight from disk; screenshots in `.impeccable/review/`).

## Files and load order

`src/css/design.css` imports, in order:

| File | Holds |
|---|---|
| `design/fonts.css` | Archivo (variable, width 62-125%) and B612 400/700, self-hosted |
| `design/tokens.css` | colours, type scale, spacing, `--tap: 44px` |
| `design/base.css` | document type, links, selection, caret, scrollbars, focus ring, reduced motion |
| `design/sheet.css` | `.slide` frame, `.sheet-grid` layout, the `.titleblock` chrome |
| `design/components.css` | heads, notes, legend, approvals, key facts, sample tag, viewport, buttons, PE scale, steps |
| `design/schedule.css` | spec schedule: table, scroller, hint, orientation glyph, per-model rows (`.is-rows`) |
| `design/controls.css` | selector, result, sheet-index and share dialogs |
| `design/drawing.css` | the `svg.dwg` layer classes (see that file) |

`src/css/main.css` imports the engine's `engine.css`, then `design.css`, then the per-sheet `slides.css`.

## Rules every sheet follows

- No `style` attributes anywhere (html-validate bans them). Use classes; SVG geometry goes in
  presentation attributes (`x`, `y`, `d`, `text-anchor`, `fill-rule`).
- Colour carries meaning. Cyan: dimensions, PE ranges, anything interactive or chosen. Yellow: water
  and flow only. Red: centrelines, invert marks and warnings, as marks and icons, never as text.
- No gradients, glass, emoji or unicode icon glyphs. Icons are the inline SVGs below (16 px grid,
  `class="ico"`, stroke only).
- No eyebrow labels above headings. The field labels inside title-block cells are not headings.
- Numbers come from `src/data/products.json` only. Invert depths are unknown: draw the mark and write
  `TBC`. Installation steps cite their (illustrative) panel and item numbers, per docs/SOURCES.md.
- Phones (<= 720 px): single column, drawings full width, no horizontal page overflow at 358 px.
  Product schedules marked `.is-rows` turn into one labelled row per model in any column narrower
  than 41rem; any other schedule scrolls sideways inside `.schedule-scroll`, with its hint.

## Type

| Element / class | Use |
|---|---|
| `h1` | Cover title only. Archivo 72% width, weight 720, up to 5.75rem. |
| `h2` | Sheet title (one per sheet). Archivo 72%, weight 700. |
| `h3` | Product or block title. Archivo 88%. |
| `h4` | Field-style heading: B612 bold uppercase. |
| `.lede` | The sheet's one-paragraph scope line under the title. Start it with a `<b>` range. |
| `.wordmark` | "Lintang Tankworks" set in Archivo 125%, uppercased by CSS. Type it in title case. |
| `.num` | Tabular lining figures in Archivo. B612 figures are already equal width. |
| `kbd` | Key hints (G, F, Esc). |
| `.visually-hidden` | Screen-reader-only text. |

Headings get more space above than below automatically (`* + h2` etc.). Body copy is capped at 70ch.

```html
<div class="brand">
  <span class="wordmark">Lintang Tankworks</span>
  <span class="brand-rule" aria-hidden="true"></span>
  <span class="tagline">Septic and sewage systems in PE and FRP</span>
</div>
```

## The sheet: frame and layout

Every `<section class="slide">` gets the drawing frame automatically (`.slide::before`): trim line,
16 px zone band with 1-8 across and A-F down, heavy inner border. Nothing to author. On phones the frame
is dropped and the slide pads for the bottom bar.

`.sheet-grid` gives the two regions of a sheet. `.sheet-side` is exactly as wide as the title block and
stops above it, so schedules and notes never run under the chrome. `.sheet-foot` pushes a block (usually
the drawing) to the bottom of `.sheet-main`, as on the cover comp.

```html
<section class="slide" data-slide data-title="FRP Bio-Filter septic tank"
  aria-roledescription="slide" aria-label="6 of 12: FRP Bio-Filter septic tank">
  <div class="sheet-grid">
    <div class="sheet-main">
      <header class="sheet-head">
        <h2>FRP Bio-Filter septic tank</h2>
        <p class="lede"><b>8 to 30 PE.</b> Fibreglass reinforced polyester tank with upflow anaerobic
          filtration through bio-media. No power on site.</p>
      </header>
      <figure class="dwg-figure is-split sheet-foot">
        <!-- svg.dwg + .legend + figcaption.view-title, see below -->
      </figure>
    </div>
    <div class="sheet-side">
      <!-- .schedule-scroll, .keyfacts, .notes -->
    </div>
  </div>
</section>
```

A sheet that does not use `.sheet-grid` must keep its lower-right corner clear of the title block
(`var(--tb-w)` wide, `var(--tb-h)` tall) on desktop.

## Title block chrome (global, one per deck)

Fixed bottom-right on the inner border corner on desktop; a two-row bottom bar on phones (title and
sheet counter, then Prev / Sheet index / Share / Next). It replaces the engine's plain
`<nav data-chrome>` and keeps every engine hook. Place it inside `main[data-deck]`, after `[data-slides]`.

```html
<aside class="titleblock" data-chrome aria-label="Title block and deck controls">
  <div class="tb-cell tb-co">
    <span class="tb-lbl">Company</span>
    <span class="tb-v"><span class="wordmark">Lintang Tankworks</span></span>
  </div>
  <div class="tb-cell tb-title">
    <span class="tb-lbl">Drawing title</span>
    <span class="tb-v" data-sheet-title>Wastewater &amp; Sanitation Systems</span>
  </div>
  <dl class="tb-meta">
    <div><dt>Drg no.</dt><dd data-drg>WW-P1-01</dd></div>
    <div><dt>Rev</dt><dd>A</dd></div>
    <div><dt>Scale</dt><dd>NTS</dd></div>
    <div class="tb-sheet"><dt>Sheet</dt><dd data-counter>01<span class="of">of</span>12</dd></div>
  </dl>
  <p class="tb-cell tb-notice">Portfolio concept. Fictional manufacturer, sample data.</p>
  <nav class="tb-keys" aria-label="Deck controls">
    <button class="tb-key" type="button" data-action="menu" aria-haspopup="dialog" aria-controls="deck-menu">
      <kbd class="tb-desk">G</kbd>
      <svg class="ico tb-touch" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z"/></svg>
      <span>Sheet index</span>
    </button>
    <button class="tb-key" type="button" data-action="fullscreen" aria-pressed="false"><kbd>F</kbd><span>Fullscreen</span></button>
    <button class="tb-key tb-prev" type="button" data-action="prev" data-end-prev aria-label="Previous sheet">
      <span class="tb-pill"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4"/></svg></span>
      <span class="tb-touch">Prev</span>
    </button>
    <button class="tb-key tb-next" type="button" data-action="next" data-end-next aria-label="Next sheet">
      <span class="tb-next-label">Next</span><span class="tb-first-label">Back to 01</span>
      <span class="tb-pill"><svg class="ico tb-next-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg><svg class="ico tb-first-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3v10M13 8H6.5M9.5 5l-3 3 3 3"/></svg></span>
    </button>
  </nav>
  <button class="tb-qr" type="button" data-action="share" aria-haspopup="dialog" aria-controls="deck-share"
    aria-label="Tap to share this deck">
    <span data-qr-mini></span>
    <span class="tb-qr-cap"><span class="tb-qr-scan">Scan to open<br></span><b>Tap to share</b></span>
    <svg class="ico tb-touch" viewBox="0 0 16 16" aria-hidden="true"><circle cx="12" cy="3.5" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="12.5" r="1.8"/><path d="M5.6 7.1l4.8-2.7M5.6 8.9l4.8 2.7"/></svg>
    <span class="tb-touch">Share</span>
  </button>
  <div class="tb-progress" data-progress aria-hidden="true"></div>
</aside>
```

What the engine writes into it:

| Hook | Engine writes | Notes |
|---|---|---|
| `[data-sheet-title]` | active slide's `data-title` (textContent) | |
| `[data-counter]` | sheet counter (textContent) | engine currently writes `6 / 12`; the kit is drawn for `06` + `<span class="of">of</span>` + `12` |
| `[data-drg]` | optional: `WW-P1-` + two-digit sheet number | static if not wired |
| `[data-qr-mini]` | the same `makeQrSvg()` output as `[data-qr]` | CSS paints the light tile, quiet zone and dark modules |
| `--deck-progress` | 0..1 on `[data-deck]` (already done) | `.tb-progress` scales along the block's top edge |
| `aria-pressed` on fullscreen | already done | pressed state lights the `F` key cyan |
| `data-position` on `[data-deck]` | `first`, `middle` or `last` | on sheet 01, `[data-end-prev]` gets `aria-disabled="true"` (muted ink, no action); on the last sheet `[data-end-next]` switches to `data-action="first"` and reads "Back to 01" |

**No URL to encode.** Opened from `file://` with no `SITE_URL` (see README), the engine leaves every
`[data-qr]` / `[data-qr-mini]` empty. CSS (`:empty`, `sheet.css`) then draws the XREF "not loaded"
frame with a "QR once hosted" tag instead of a blank light tile, and `:has()` swaps any copy that says
"scan": `.tb-qr-scan` hides in the title block, `.share-scan` / `.share-unhosted` swap in the share
dialog, `.s12-scan` / `.s12-unhosted` on sheet 12. Author both spans wherever a caption says "scan".

`.tb-touch` shows only on phones, `.tb-desk` only above 720 px. `data-fullscreen="unsupported"` on the
root hides the fullscreen key (engine.css).

## Drawings

Inline `<svg class="dwg">` per `src/css/design/drawing.css`, with the shared defs from
`src/drawings/_defs.svg` included once per page. Wrap each in a figure with a view title:

```html
<figure class="dwg-figure is-split">
  <svg class="dwg" viewBox="0 0 640 384" role="img" aria-labelledby="dwg06-t">
    <title id="dwg06-t">Typical section through ...</title>
    <g data-layer="shell">...</g>
    <g data-layer="water">...</g>
  </svg>
  <div class="legend" role="group" aria-label="Isolate a layer in the section">...</div>
  <figcaption class="view-title">
    <span class="view-bubble" aria-hidden="true"><span>A</span><span>06</span></span>
    <span class="view-name">Typical section: LF-20V</span>
    <span class="view-sub">Illustrative, not to scale. Dimensions in mm.</span>
  </figcaption>
</figure>
```

`.is-split` puts the legend in a 12rem column beside the drawing above 1100 px and under it below.
On short laptop screens (above 1100 px wide, 820 px tall or less: 1280 x 800, 1366 x 768) height is
what limits the drawing, so the legend stays beside it as a slim 9.5rem column with wrapping labels
and `.ly-note` steps up to 14 units; with that, every label in a split drawing reads at 11 px or more.
The bubble reads view letter over sheet number.

Every `.ly-dim-text`, `.ly-label-long` and `.ly-note` carries a ground-coloured `paint-order` halo, so
a label that meets hatching or a line breaks the line instead of being struck through. Dimension
figures still sit clear of their own dimension line. Invert marks on the live section (sheet 10) sit
outside the trench wall, under the pipe, with the `IL` note centred below the mark.

General notes that belong to a drawing are HTML (`.notes`), not SVG text, so they keep body-size
type at every scale: sheet 07 places them in the empty top-right corner of its detail above the
phone breakpoint and after the detail on phones.

## Layer legend (isolate buttons)

Buttons toggle `aria-pressed`; the engine sets `data-isolating` on the `svg.dwg` and `.is-isolated`
on the matching `[data-layer]` group. The balloon number matches the balloon drawn in the section.
The swatch is optional and reuses the drawing layer classes, so it must carry `class="dwg legend-swatch"`.

```html
<div class="legend" role="group" aria-label="Isolate a layer in the section">
  <button class="legend-item" type="button" aria-pressed="false" data-isolate="shell">
    <span class="balloon">1</span>Tank shell
    <svg class="dwg legend-swatch" viewBox="0 0 32 10" aria-hidden="true"><path class="ly-wall" d="M1 5H31"/></svg>
  </button>
  <button class="legend-item" type="button" aria-pressed="true" data-isolate="water">
    <span class="balloon">2</span>Water and flow
    <svg class="dwg legend-swatch" viewBox="0 0 32 10" aria-hidden="true"><path class="ly-flow" d="M1 5H27"/></svg>
  </button>
</div>
```

## General notes

CAD convention: numbered, uppercase, short. Add `.is-plain` for sentence-case reasons (the result panel).

```html
<section class="notes" aria-labelledby="n06">
  <h3 class="notes-title" id="n06">Notes</h3>
  <ol>
    <li>Illustrative typical section, not to scale.</li>
    <li>Invert levels (IL) per site: TBC.</li>
  </ol>
</section>
```

## Spec schedule

Header row of field labels with the dimension symbol in cyan (`.sym` = the letter on the drawing),
optional units row, tabular figures, sticky model column. `.n` right-aligns a numeric cell, `.na`
greys a not-applicable cell (write `–`). Mark the chosen row with `.is-chosen` and a visually hidden
reason. `.is-compact` tightens cell padding for the side column; `.is-natural` lets a full-width
schedule take its natural width instead of stretching.

Always wrap in `.schedule-scroll`. `data-scroll-x` is the engine's scroll hook, `data-no-swipe` keeps a
finger drag on the table from changing sheets, `tabindex="0"` plus `aria-label` make the region
keyboard-reachable. Use `<section>` (html-validate prefers it to `div role="region"`).

**Rows mode (`.is-rows`, `design/schedule.css`).** The product schedules (sheets 06, 07, 09) add
`.is-rows`. When the scroller is narrower than 41rem (every phone, and the narrow main column on a
portrait tablet) a container query turns each model into one two-line row: model code, orientation
glyph and PE first, then a labelled strip of its dimensions, so no column hides off-screen and nothing
scrolls sideways. Wider columns keep the table. The same markup serves both: strip cells carry
`data-label` (the dimension letter), `.s-pe` marks the PE cell, `.s-type` the orientation cell (its word
in `.orient-name` stays for screen readers), and the caption's `.rows-units` line replaces the units row.
A sheet whose schedule sits in a narrow side column opts out above the phone breakpoint with
`container: none` (sheet 07). A plain schedule without `.is-rows` still scrolls sideways on phones and
shows `.schedule-hint` there.

```html
<section class="schedule-scroll" data-scroll-x data-no-swipe tabindex="0" aria-label="PE Bio-Filter schedule">
  <table class="schedule is-rows">
    <caption><span class="cap-title">Schedule: PE Bio-Filter</span> <small>MS 2441-1:2012, sample licence SAMPLE-PE-01</small><small class="rows-units">Dimensions in mm, capacity in litres.</small></caption>
    <thead>
      <tr>
        <th scope="col">Model</th><th scope="col">Type</th><th scope="col" class="n">PE</th>
        <th scope="col" class="n"><span class="sym">D</span>Diameter</th>
        <th scope="col" class="n"><span class="sym">L</span>Length</th>
        <th scope="col" class="n"><span class="sym">H1</span>Height</th>
        <th scope="col" class="n"><span class="sym">H2</span>Water level</th>
        <th scope="col" class="n">Capacity</th>
      </tr>
      <tr class="schedule-units"><td></td><td></td><td></td><td class="n">mm</td><td class="n">mm</td><td class="n">mm</td><td class="n">mm</td><td class="n">L</td></tr>
    </thead>
    <tbody>
      <tr><th scope="row">LP-6H</th><td class="s-type"><svg class="orient" viewBox="0 0 18 14" aria-hidden="true"><rect x="1.5" y="3.5" width="15" height="8" rx="4"/></svg><span class="orient-name">Horizontal</span></td><td class="n s-pe">6</td><td class="n" data-label="D">1300</td><td class="n" data-label="L">2550</td><td class="n" data-label="H1">1300</td><td class="n" data-label="H2">1050</td><td class="n s-cap" data-label="Cap.">2930</td></tr>
      <tr class="is-chosen"><th scope="row">LP-12<span class="visually-hidden"> (recommended for 12 PE)</span></th><td class="s-type"><svg class="orient" viewBox="0 0 18 14" aria-hidden="true"><rect x="5" y="0.5" width="8" height="13" rx="2"/></svg><span class="orient-name">Vertical</span></td><td class="n s-pe">12</td><td class="n" data-label="D">1700</td><td class="n na" data-label="L">–</td><td class="n" data-label="H1">2170</td><td class="n" data-label="H2">1870</td><td class="n s-cap" data-label="Cap.">4240</td></tr>
    </tbody>
  </table>
</section>
```

For a plain schedule that scrolls on phones, drop `.is-rows` and follow the scroller with the hint:

```html
<p class="schedule-hint"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M5 5L2 8l3 3M11 5l3 3-3 3"/></svg>Scroll the schedule sideways for every dimension</p>
```

## Inline dimension string

A PE range or length drawn as a dimension (cover product-line table, sheet heads).

```html
<span class="dimstring">6–18<small>PE</small></span>
```

## Measured PE scale

One linear scale, 0 to 150 PE, on every product sheet. It is inline SVG with percentage x so text never
scales: x% = PE / 150 x 100. Ranges come from `peRange` in products.json. The cyan marker
(`[data-pe-marker]`) follows the selector: the engine sets `x1`/`x2` on its line and `x` on its text
with `setAttribute`. The tick markers use `#mk-tick` from the shared defs. `.rs-minor-label`
tick labels (25, 75, 125) hide on phones. Full generated markup: `tests/visual/kit.html`.

```html
<figure class="range-scale">
  <svg class="rs" width="100%" height="160" role="img" aria-labelledby="rs-title">
    <title id="rs-title">Measured PE scale, 0 to 150: PE Bio-Filter 6 to 18 PE, FRP Bio-Filter 8 to 30 PE, LT 40 to 150 PE.</title>
    <line class="rs-proj" x1="4%" x2="4%" y1="41" y2="128"/>
    <g class="rs-marker" data-pe-marker>
      <line x1="13.333%" x2="13.333%" y1="44" y2="128"/>
      <text x="13.333%" y="152">20 PE</text>
    </g>
    <g class="rs-range" data-series="pe">
      <line class="rs-ext" x1="4%" x2="4%" y1="27" y2="41"/>
      <line class="rs-ext" x1="12%" x2="12%" y1="27" y2="41"/>
      <line class="rs-dim" x1="4%" x2="12%" y1="34" y2="34"/>
      <text x="4%" y="25"><tspan class="rs-name">PE Bio-Filter</tspan><tspan class="rs-val" dx="8">6–18</tspan></text>
    </g>
    <!-- frp row at y 72, lt row at y 110 -->
    <line class="rs-axis" x1="0" x2="100%" y1="128" y2="128"/>
    <line class="rs-tick rs-tick-major" x1="0%" x2="0%" y1="128" y2="137"/>
    <text class="rs-tick-label" x="0%" y="152">0</text>
    <text class="rs-tick-label rs-minor-label" x="16.667%" y="152">25</text>
  </svg>
</figure>
```

## Approvals schedule

Reads like a CAD revision table; the delta holds the row number. Wrap in `.schedule-scroll` (it scrolls
on phones with the licence numbers in view first).

```html
<table class="approvals">
  <caption>Approvals schedule</caption>
  <thead><tr><th scope="col">No.</th><th scope="col">Standard</th><th scope="col">Sample licence</th><th scope="col">Series</th><th scope="col">Since</th><th scope="col">SPAN ref.</th></tr></thead>
  <tbody>
    <tr><td><span class="rev">1</span></td><td>MS 2441-1:2012</td><td class="lic">SAMPLE-PE-01</td><td>PE Bio-Filter septic tank</td><td class="na">Sample</td><td class="ref na">Sample</td></tr>
    <tr><td><span class="rev">2</span></td><td>MS 2441-1:2012</td><td class="lic">SAMPLE-FRP-02</td><td>FRP Bio-Filter septic tank</td><td class="na">Sample</td><td class="ref na">Sample</td></tr>
    <tr><td><span class="rev">3</span></td><td>MS 2441-2:2014</td><td class="lic">SAMPLE-SSTS-03</td><td>LT small sewage treatment system</td><td class="na">Sample</td><td class="ref na">Sample</td></tr>
  </tbody>
</table>
```

## Sample-data marker

`.sample-tag` flags a fictional licence number, date or fact for this portfolio concept (small bordered
uppercase tag, the same visual language as the XREF tag below). Pair it with the value, inline.

```html
<td class="lic">SAMPLE-PE-01<span class="sample-tag">Sample</span></td>
```

## Key facts

Drawing-note rows, never big-number tiles. `.dim` colours a dimension value cyan.

```html
<dl class="keyfacts">
  <div><dt>Pipe</dt><dd><span class="dim">150 mm</span> inlet and outlet</dd></div>
  <div><dt>Warranty</dt><dd>5 years</dd></div>
</dl>
```

## Image viewport (XREF)

Every raster carries its provenance. `.is-empty` is the placeholder for client photos not yet supplied.

```html
<figure class="viewport-frame">
  <div class="vf-clip"><img src="..." width="1600" height="900" alt="..."></div>
  <figcaption class="vf-strip">
    <span class="vf-name">photo-tanks.webp</span>
    <span class="vf-prov">Sample site photo, stand-in for Lintang Tankworks dispatch photos. Provenance and licence in the matching .json file.</span>
  </figcaption>
</figure>

<figure class="viewport-frame is-empty">
  <div class="vf-clip"><span class="vf-empty">Photo to be supplied</span></div>
  <figcaption class="vf-strip"><span class="vf-name">factory-truck-loading.jpg</span><span class="vf-prov">Factory truck-loading photo, to be supplied by Lintang Tankworks.</span></figcaption>
</figure>
```

## Installation sequence

Sequence numbers in balloons; cite the (illustrative) panel and item numbers on every step.

```html
<ol class="steps">
  <li><span class="balloon">1</span><span class="step-title">Base</span>
    <p class="step-text">50 mm lean concrete, then a 150 mm grade 30N concrete base with one layer of BRC-A8.</p>
    <span class="step-ref">Panel B, item 2</span></li>
</ol>
```

## Buttons

44 px targets, square corners, title-block cell language. `.btn-primary` is cyan (one per sheet: the
enquiry). `.btn-cell` stacks a field label over a value. States: `:disabled` / `aria-disabled="true"`
(every button, the primary included, drops to an outline: `--line-2` border, `--ink-3` text, no
fill), `aria-busy="true"` (spinner), `data-state="done"` (e.g. after copying the link).

```html
<a class="btn btn-primary btn-cell" data-whatsapp-enquiry href="https://wa.me/?text=..." target="_blank" rel="noopener">
  <small>Enquire on WhatsApp</small><strong>LF-20V, 20 PE</strong>
</a>
<button class="btn" type="button" data-copy-link>
  <svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 5.5h8v8h-8z"/><path d="M10.5 5.5v-3h-8v8h3"/></svg>Copy link
</button>
```

## Selector controls

Field `name`s are load-bearing for the engine. The PE value sits on a cyan dimension line; set
`aria-invalid="true"` on the input to turn the line red. Checkboxes render as layer toggles with an
ON / OFF state (the state word is CSS, hidden from assistive tech).

```html
<form class="selector" data-selector novalidate>
  <div class="pe-field">
    <label class="pe-label" for="selector-pe">Population equivalent</label>
    <div class="pe-input">
      <input id="selector-pe" name="pe" type="number" inputmode="numeric" min="1" max="1000" step="1" required aria-describedby="selector-pe-help">
      <span class="pe-unit" aria-hidden="true">PE</span>
    </div>
    <p class="pe-help" id="selector-pe-help">Whole number. Phase 1 covers 6 to 150 PE.</p>
  </div>
  <fieldset class="toggles">
    <legend>Site conditions</legend>
    <label class="toggle"><input type="checkbox" name="highWaterTable"><span class="toggle-box" aria-hidden="true"></span><span>High water table</span><span class="toggle-state" aria-hidden="true"></span></label>
    <label class="toggle"><input type="checkbox" name="deepBurial"><span class="toggle-box" aria-hidden="true"></span><span>Deep burial</span><span class="toggle-state" aria-hidden="true"></span></label>
    <label class="toggle"><input type="checkbox" name="limitedFootprint"><span class="toggle-box" aria-hidden="true"></span><span>Limited footprint</span><span class="toggle-state" aria-hidden="true"></span></label>
    <label class="toggle"><input type="checkbox" name="powerAvailable" checked><span class="toggle-box" aria-hidden="true"></span><span>Mains power available</span><span class="toggle-state" aria-hidden="true"></span></label>
  </fieldset>
  <button class="btn btn-primary" type="submit">Find the model</button>
</form>
```

## Recommendation result

The engine's renderer should emit this structure into `[data-selector-result]` and set
`data-status` on it (`ok`, `invalid`, `out-of-range`) or `.is-empty` before a PE is entered.
Reasons are `recommend().reasons`, warnings are `recommend().warnings` (one `.warn` each).

```html
<section class="result" data-selector-result data-status="ok" aria-live="polite" aria-labelledby="result-model">
  <h3 class="result-model" id="result-model">LF-20V</h3>
  <p class="result-series">FRP Bio-Filter septic tank, rated 20 PE, vertical</p>
  <dl class="result-dims">
    <div><dt><span class="sym">D</span>Diameter</dt><dd>2050<small>mm</small></dd></div>
    <div><dt><span class="sym">H1</span>Height</dt><dd>2170<small>mm</small></dd></div>
    <div><dt><span class="sym">H2</span>Water</dt><dd>1820<small>mm</small></dd></div>
    <div><dt>Capacity</dt><dd>6010<small>L</small></dd></div>
  </dl>
  <section class="notes is-plain" aria-labelledby="result-why">
    <h4 class="notes-title" id="result-why">Why this model</h4>
    <ol><li>Requested 20 PE exceeds the 18 PE limit of the PE Bio-Filter series, so the FRP Bio-Filter series applies.</li></ol>
  </section>
  <p class="warn">LT needs mains power for its air blowers; confirm power is available on site.</p>
  <p class="result-actions"><a class="btn btn-primary btn-cell" data-whatsapp-enquiry href="..." target="_blank" rel="noopener"><small>Enquire on WhatsApp</small><strong>LF-20V, 20 PE</strong></a></p>
  <p class="result-disclaimer">Selection guide only. Lintang Tankworks' engineers confirm the model with a PE calculation.</p>
</section>
```

`.warn` works anywhere: a red delta icon with ink text.

## Dialogs

Both keep the engine's hooks (`data-menu-list`, `data-menu-goto`, `data-qr`, `data-copy-link`,
`data-share-whatsapp`, `data-action="close"`). The sheet index numbers itself with a CSS counter
(01-12), so the engine only writes titles; `aria-current="true"` highlights the current sheet. On phones
both open as bottom sheets. The backdrop is a solid dark wash, no blur.

```html
<dialog data-menu id="deck-menu" aria-labelledby="deck-menu-title">
  <div class="dlg-head">
    <h2 id="deck-menu-title">Sheet index</h2>
    <button class="dlg-close" type="button" data-action="close" aria-label="Close sheet index">
      <svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>
    </button>
  </div>
  <ul data-menu-list></ul>
  <div class="dlg-foot">
    <p class="warn">Portfolio concept. Fictional manufacturer, sample data.</p>
    <p class="dlg-keys">Press <kbd>G</kbd> or <kbd>Esc</kbd> to close</p>
  </div>
</dialog>

<dialog data-share id="deck-share" aria-labelledby="deck-share-title">
  <div class="dlg-head">
    <h2 id="deck-share-title">Share this deck</h2>
    <button class="dlg-close" type="button" data-action="close" aria-label="Close share">
      <svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>
    </button>
  </div>
  <div class="share-body">
    <div data-qr aria-hidden="true"></div>
    <div class="share-actions">
      <p class="lede"><span class="share-scan">Scan to open the deck on a phone, or send the link.</span><span class="share-unhosted">Open the deck on a phone, or send the link.</span></p>
      <p class="share-url" data-share-url-text></p>
      <button class="btn" type="button" data-copy-link>
        <svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 5.5h8v8h-8z"/><path d="M10.5 5.5v-3h-8v8h3"/></svg>Copy link
      </button>
      <a class="btn btn-primary" data-share-whatsapp href="https://wa.me/" target="_blank" rel="noopener">
        <svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/></svg>Send on WhatsApp
      </a>
      <p class="warn">Portfolio concept. Fictional manufacturer, sample data.</p>
    </div>
  </div>
</dialog>
```

## Icon set

All 16 x 16, `class="ico"`, `aria-hidden="true"`, stroke 1.5 via CSS.

| Name | Path |
|---|---|
| arrow left | `<path d="M13 8H3M7 4L3 8l4 4"/>` |
| arrow right | `<path d="M3 8h10M9 4l4 4-4 4"/>` |
| sheet index | `<path d="M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z"/>` |
| share | `<circle cx="12" cy="3.5" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="12.5" r="1.8"/><path d="M5.6 7.1l4.8-2.7M5.6 8.9l4.8 2.7"/>` |
| close | `<path d="M4 4l8 8M12 4l-8 8"/>` |
| copy | `<path d="M5.5 5.5h8v8h-8z"/><path d="M10.5 5.5v-3h-8v8h3"/>` |
| message | `<path d="M2.5 3h11v7.5H7L4 13v-2.5H2.5z"/>` |
| scroll sideways | `<path d="M2 8h12M5 5L2 8l3 3M11 5l3 3-3 3"/>` |
| fullscreen | `<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>` |

## Regenerating the preview

`tests/visual/kit.html` is static and validates with the project `.htmlvalidate.json`. Screenshot it
at 1440 and 390 wide (full page) into `.impeccable/review/kit-desktop.png` and `kit-phone.png`.

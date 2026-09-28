# Engine

Direction-independent engine for the Lintang Tankworks concept deck: navigation, the product
selector, sharing, and the build pipeline that inlines everything into one
offline-capable `dist/index.html`. This document is the contract between the
engine and whatever writes the real slides and visual CSS later (a separate design
pass). Nothing here is visual design — `engine.css` only contains the CSS needed for
the deck to *behave* correctly.

## Build pipeline

```
node build.mjs           # one-shot build -> dist/index.html
node build.mjs --watch   # rebuild on any change under src/
```

`build.mjs` has no dependencies beyond `esbuild` (already a devDependency):

1. **JS** — `src/js/main.js` is bundled by esbuild into a single minified IIFE,
   target `es2019`. `src/data/products.json` is inlined via esbuild's `json` loader
   (a plain `import data from '../data/products.json'` in `main.js`), so the deck
   never fetches it at runtime.
2. **CSS** — `src/css/main.css` is bundled by esbuild. It `@import`s `engine.css`
   and, later, the design pass's own stylesheet(s). Fonts (`woff2`/`woff`) and
   images (`svg`/`png`/`jpg`/`webp`) referenced from CSS are inlined as `dataurl`s,
   so the design pass can `@import` and reference assets normally and the build
   will still produce one self-contained file.
3. **HTML** — `src/index.html` is expanded: `<!-- @include path/relative/to/src.html -->`
   comments are replaced with the referenced file's contents, recursively (paths are
   resolved relative to the *including* file, mirroring how a preprocessor include
   works). A missing include or an include cycle throws and fails the build.
   `<!-- @styles -->` is replaced with `<style>...</style>` containing the bundled
   CSS; `<!-- @scripts -->` is replaced with `<script>...</script>` containing the
   bundled JS.
4. **Site URL** — `resolveSiteUrl` picks `SITE_URL` (env) or `deck.config.json`'s
   `siteUrl`, defaulting to none. `injectOgTags` writes it into `og:url`/`og:image`
   (both omitted when unset, so no absolute URL is ever guessed; og:image also
   needs `src/assets/og-cover.jpg`, copied beside the page) and declares a
   `summary_large_image` twitter card only when og:image ships, a plain `summary`
   otherwise; `injectShareUrl`
   writes the same value into `data-share-url` (see Markup contract, Root). No
   value is committed by default — a deployer sets `SITE_URL` at build time.
5. The result is written to `dist/index.html` — no external URLs anywhere except
   the links a user can click (`mailto:`, `wa.me`, the deck's own canonical site
   link, when configured). The build prints the final file size.

`--watch` uses esbuild's incremental `context` API for the JS and CSS bundles and
`fs.watch(src/, { recursive: true })` to re-run the include/inject step and rewrite
`dist/index.html` on every change (HTML/slide edits aren't esbuild entry points, so
they're handled by the plain watcher).

### npm scripts

| Script | What it does |
|---|---|
| `npm run build` | One-shot build. |
| `npm run build:watch` | Watch mode. |
| `npm test` | Unit tests (`node --test` + `--experimental-test-coverage`) over `tests/unit/`. |
| `npm run test:e2e` | Playwright, against `dist/index.html` (a `globalSetup` builds first with a fictional test `SITE_URL`; a `globalTeardown` rebuilds with the caller's own environment, so `dist/` ends as `npm run build` makes it). |
| `npm run validate` | `html-validate` against `dist/index.html`, using the project's `.htmlvalidate.json`. |
| `npm run check` | `build && test && validate && test:e2e`. |

## Markup contract

The engine expects — and the placeholder slides demonstrate — this structure.
Anything not called out here (visual layout, colour, type) is the design pass's.

### Root

```html
<main data-deck data-share-url="@@SITE_URL@@" data-whatsapp="" data-index="0">
  ...
</main>
```

- `data-deck` marks the root the engine initialises on (`initDeck(root)` in
  `src/js/deck.js`).
- `data-share-url` is the canonical URL encoded in the QR code and used for
  sharing when the page is opened as a `file://` document (no real URL to share).
  Author it as the literal placeholder `@@SITE_URL@@`: `build.mjs`'s `injectShareUrl`
  replaces it with the resolved `SITE_URL` (see Build pipeline), or with an empty
  string when none is configured. `resolveShareUrl`/`initShareUi` (src/js/share-ui.js)
  then fall back to the page's own http(s) URL, or — on `file://` with no
  `data-share-url` either — show a "host the deck to share a link" message instead
  of a QR to nowhere.
- `data-whatsapp` is a WhatsApp number, used to build enquiry links
  (`[data-whatsapp-enquiry]`). It's read and normalised at runtime — author it in
  whatever human format is easiest (`+60 3 9123 4567`). This portfolio concept has
  no real company number to message, so it's authored empty: `buildWhatsAppUrl`
  (src/js/lib/share.js) then omits the phone entirely, producing a recipientless
  `https://wa.me/?text=...` link that lets the person pick who to send it to.
- `data-index` is written by the engine on every navigation (current 0-based
  slide index) and can be used for CSS if useful; don't hand-author it.
- The engine also sets a `--deck-progress` custom property (0 = first slide, 1 =
  last) on the root, updated on every navigation.

### Slides

```html
<section class="slide" data-slide data-title="Find your model"
         aria-roledescription="slide" aria-label="2 of 3: Find your model">
  ...
</section>
```

- One `<section class="slide" data-slide data-title="...">` per slide, in
  document order — order is the deck order, there's no separate index config.
- `data-title` is the short label used in the slide menu, the live region
  announcement and (indirectly) enquiry text; keep it short.
- Author `aria-label="n of N: title"` as shown (it's correct for the file as
  authored); the engine also recomputes and overwrites the live region text on
  every navigation, so the count never actually goes stale even if slides are
  added or removed later.
- The engine toggles, per slide, on every navigation:
  - `class="is-active"` / `data-state="active"` on the current slide, removed from
    the rest (`data-state="inactive"`).
  - `aria-hidden="true"` and `inert` on every *inactive* slide (removed from the
    active one).
- Exactly one `<h1>` is allowed across the whole document (the a11y config bans
  more than one); the cover slide owns it. Every other slide heading starts at
  `<h2>`.

### Chrome

```html
<nav data-chrome aria-label="Deck controls">
  <button type="button" data-action="prev" aria-label="Previous slide">‹</button>
  <div data-counter aria-hidden="true"></div>
  <div data-progress aria-hidden="true"></div>
  <button type="button" data-action="next" aria-label="Next slide">›</button>
  <button type="button" data-action="menu" aria-haspopup="dialog" aria-controls="deck-menu">Menu</button>
  <button type="button" data-action="fullscreen" aria-pressed="false">Fullscreen</button>
  <button type="button" data-action="share" aria-haspopup="dialog" aria-controls="deck-share">Share</button>
</nav>
```

- Any element with `[data-action="prev|next|first|last|menu|fullscreen|share|close"]`
  is wired to the matching engine action on click — put as many of these as the
  design needs, anywhere inside the deck root (e.g. a `close` button inside each
  dialog, a `share` button on the contact slide as well as in the chrome nav).
- `[data-counter]` gets `"n / N"` text on every navigation.
- The root gets `data-position="first|middle|last"` on every navigation
  (`sheetPosition` in `src/js/lib/nav.js`). A button marked `[data-end-prev]` is
  `aria-disabled="true"` on the first sheet; one marked `[data-end-next]` switches its
  `data-action` to `first` and its `aria-label` to "Back to sheet 01" on the last sheet,
  so the end of the set never shows a live-looking control that does nothing.
- `[data-progress]` is a hook for the design pass; the engine does not write text
  into it — it drives the root's `--deck-progress` custom property instead, which
  `[data-progress]` (or anything else) can read via CSS (e.g.
  `transform: scaleX(var(--deck-progress))`).
- `[data-live]` — a `aria-live="polite"` region — gets
  `"Slide n of N: title"` text on every navigation. `engine.css` visually hides it
  (screen-reader-only) without removing it from the accessibility tree; this is
  functional scaffolding, not a design opinion.
- The `fullscreen` button gets `aria-pressed` kept in sync with actual fullscreen
  state. If neither the standard nor the WebKit Fullscreen API exists (iPhone
  Safari), the root gets `data-fullscreen="unsupported"` and `engine.css` hides
  the button — don't hide it yourself in markup.

### Slide menu dialog

```html
<dialog data-menu id="deck-menu" aria-labelledby="deck-menu-title">
  <h2 id="deck-menu-title">Slides</h2>
  <ul data-menu-list></ul>
  <button type="button" data-action="close">Close menu</button>
</dialog>
```

`[data-menu-list]` is populated by the engine from every slide's `data-title`
(`<li><button data-menu-goto="0">Cover</button></li>`, etc.); the current slide's
button gets `aria-current="true"`. Clicking an item navigates and closes the
dialog. `g`/`G` toggles the dialog (`keyToAction`'s `'menu'` action); `Escape`
closes it (native `<dialog>` also closes on Escape on its own — both mechanisms
are harmless together).

### Share dialog

```html
<dialog data-share id="deck-share" aria-labelledby="deck-share-title">
  <h2 id="deck-share-title">Share this deck</h2>
  <div data-qr aria-hidden="true"></div>
  <button type="button" data-copy-link>Copy link</button>
  <a data-share-whatsapp href="https://wa.me/" target="_blank" rel="noopener">Share on WhatsApp</a>
  <button type="button" data-action="close">Close</button>
</dialog>
```

- `[data-qr]` gets an inline `<svg>` (from `src/js/lib/qr.js`) encoding the
  resolved share URL (`resolveShareUrl(location, root.dataset.shareUrl)` — the
  live page URL on http/https, the canonical `data-share-url` on `file://`).
  With no resolved URL at all (`file://`, `data-share-url` unset — the deck's
  default, no `SITE_URL` configured), `[data-qr]`/`[data-qr-mini]` are left
  empty, `[data-share-url-text]` reads "Host the deck to share a link.", and
  `[data-copy-link]` / `[data-share-whatsapp]` are disabled rather than
  pointing at nothing (`src/js/share-ui.js`).
- `[data-copy-link]` copies that URL via `navigator.clipboard`, falling back to a
  temporary off-screen `<textarea>` + `execCommand('copy')`; the outcome
  ("Link copied" / "Copy failed — copy the link manually") replaces the button's
  own text for ~2.5s, then reverts — that's the "report outcome in the button's
  live text" requirement, no separate live region needed since the text change on
  a focused/just-clicked button is already announced.
- `[data-share-whatsapp]`'s `href` is a generic `wa.me/?text=...` link (no phone
  number: this shares the deck via whatever contact the user picks, unlike the
  enquiry links below which target Lintang Tankworks directly).

### Product selector

```html
<form data-selector novalidate>
  <input id="selector-pe" name="pe" type="number" inputmode="numeric" min="1" max="1000">
  <input type="checkbox" name="highWaterTable">
  <input type="checkbox" name="deepBurial">
  <input type="checkbox" name="limitedFootprint">
  <input type="checkbox" name="powerAvailable" checked>
  <button type="submit">Get recommendation</button>
  <div data-selector-result aria-live="polite"></div>
</form>
```

Field `name`s are load-bearing — the engine reads them via `FormData`. On every
`input` (and on `submit`, which is prevented from actually submitting) it calls
`recommend()` (see below) and renders into `[data-selector-result]` using
`textContent`/DOM APIs only, never `innerHTML` with data:

- **Example** (the initial state): the PE field is authored with `value="8"`, so
  the sheet opens on a real result (LP-8) and a drawn section, labelled
  "Example" until the visitor types their own PE (see "Live section" below).
- **Empty** (PE field blank): a plain prompt to enter a PE.
- **Invalid** (PE entered but not a whole number ≥ 1): `recommend()`'s reason text.
- **Out-of-range** (PE > 150): `recommend()`'s reason text (talk to Lintang Tankworks'
  engineers — Phase 1 tops out at 150 PE).
- **Ok**: model code, series name, PE, key dimensions, reasons, any warnings, any
  alternative model at the same rating, and the selection-guide disclaimer.

The contact sheet's primary action is marked `[data-enquiry-cta]` instead (with a
`[data-enquiry-label]` value line): `src/js/dom/enquiry-cta.js` keeps its href and
label in sync with the visitor's own pick — "LF-20V, 20 PE", as on sheet 10 — and
reads "Send a general enquiry" (with the general enquiry text) until the visitor
changes the selector; the authored 8 PE example is not a pick.

The latest valid selection is kept as in-memory state (recomputed immutably, never
mutated in place) and mirrored to `sessionStorage` (wrapped in `try`/`catch` — a
storage failure, e.g. private browsing, never breaks the form). Every
`[data-whatsapp-enquiry]` link's `href` is kept in sync via
`buildWhatsAppUrl(root.dataset.whatsapp, buildEnquiryText(selection))` — with a
selection it names the model/PE/series and asks for the spec sheet and CAD
drawing; without one it's a general range enquiry.

### Live section (`[data-live-drawing]`)

`src/js/dom/live-drawing.js` renders `tankSectionSvg(model, seriesId,
{pipeMm})` (`src/js/lib/tank-drawing.js`, a pure string builder) into
`[data-live-drawing]` via `DOMParser`, never `innerHTML`, and names the drawn
model in `[data-live-title]` with `textContent`.

- The section is the sheet 05 (bio-filter) or sheet 08 (LT) vocabulary
  parameterised by the model's real D or L, H1 and H2 and its series' pipe size:
  ground line and soil, a sand-backfilled pit on a concrete base, access necks
  with covers at grade, wall hatch on the wall ring only, the water body to top
  water level, the filter chamber with bio-media (bio-filter) or the ART / FST
  partition, transfer pipe, baffle, diffuser and blowers at grade (LT), inlet
  and outlet pipes with IL marks, flow arrows, and live dimension strings in mm.
  Burial depth, base and slab are schematic (invert levels TBC).
- **ViewBox contract**: always `0 0 480 352`, for every model, with every line
  and label inside it at the largest drawing text sizes sheet 10's CSS sets
  (`TEXT_SIZE` in `src/js/lib/tank-layout.js`). `.s10-live-box` keeps the same
  `aspect-ratio: 480 / 352`, so the sheet never crops the drawing.
  `tests/unit/tank-drawing-fit.test.js` checks all 22 models.
- While the PE field still holds its authored value the container carries
  `data-example` and the view title reads "Example: LP-8, 8 PE". With no model
  to draw (blank, invalid or above 150 PE) the last section stays as a ghost
  (`data-state="ghost"`, `aria-hidden`) under the "enter a PE" note.

## Selector rules (`src/js/lib/selector.js`)

`recommend(input, data)` — `input = {pe, highWaterTable, deepBurial,
limitedFootprint, powerAvailable}`, `data` = `products.json` — returns
`{status, seriesId, model, alternatives, reasons, warnings}`.

1. **Invalid**: `pe` is not a finite integer ≥ 1 → `status: 'invalid'`.
2. **Out of range**: `pe > 150` → `status: 'out-of-range'` (beyond Phase 1; a full
   sewage treatment plant is needed — talk to Lintang Tankworks' engineers).
3. **LT** (`pe > 30`, up to 150): the smallest LT model with `model.pe >= pe`
   (e.g. 31–40 PE → `LT-40`).
   - `powerAvailable === false` adds a warning (LT needs mains power for its
     blowers).
   - `highWaterTable` keeps the model and adds the anchor-and-strap note.
4. **Septic tank series** (`pe <= 30`): FRP if `pe > 18` OR `deepBurial` (each
   reason is stated separately when it applies); otherwise PE. The smallest model
   in the chosen series with `model.pe >= pe`.
   - `deepBurial` steering to FRP is Lintang Tankworks' own guide rule, for the
     fibreglass shell's flexural strength (sheets 04 and 07), not a standard; its
     reason says so ("Lintang Tankworks' guide rule picks the FRP Bio-Filter
     series, for its flexural strength").
   - `highWaterTable` never changes the series or the model: sheet 06 says the PE
     series suits coastal and high water-table areas, and FRP suits them too. It
     adds a reason that both bio-filter series suit it and that the tank is
     anchored and strapped to its base (sheet 11).
5. **Orientation tie-break**: when two models in the chosen series share the
   smallest qualifying PE (6 PE in the PE series: `LP-6H` horizontal / `LP-6V`
   vertical; 8 PE in the FRP series: `LF-8H` horizontal / `LF-8V` vertical),
   pick the vertical model if `limitedFootprint`, otherwise the horizontal one
   (shallower dig); the other model becomes the sole entry in `alternatives`.
6. Every `reasons` entry is a short, factual, plain-English sentence, and nothing
   is claimed that isn't backed by `products.json`/`PRODUCT.md`.
7. `DISCLAIMER` (exported alongside `recommend`) is always shown next to a
   result: *"Selection guide only. Lintang Tankworks' engineers confirm the model with a
   PE calculation."*

`recommend()` never mutates `data` — it only reads and returns references into it.

## Other pure modules

- **`src/js/lib/nav.js`** — `clampIndex`, `formatHash`/`parseHash` (`'#3'`,
  `'#/3'`, `'#slide-3'`, case-insensitive, 1-based in the hash / 0-based as an
  index), `keyToAction` (see the doc comment in the file for the full modifier /
  editable-target / menu-open precedence), `classifySwipe` (horizontal swipe past
  a 50px threshold that isn't more vertical than horizontal).
- **`src/js/lib/share.js`** — `normalizePhone`, `buildWhatsAppUrl` (normalises the
  phone itself, so callers can pass the raw `data-whatsapp` value),
  `resolveShareUrl`, `buildEnquiryText`.
- **`src/js/lib/qr.js`** — `makeQrSvg(text, {ecc, margin})`, a viewBox-based
  `<svg>` string (`role="img"`, non-empty `aria-label`, `shape-rendering:
  crispEdges` as a presentation attribute — never an inline `style=""`).

## Input layers (touch / pointer / keyboard)

- **Keyboard** (`src/js/dom/deck-keyboard.js`, document-level `keydown` →
  `keyToAction`): editable targets are `input`, `textarea`, `select`,
  `[contenteditable]`, `[role="slider"]`, plus `button`/`a`/`summary` for
  Space/Enter only (so a focused button still activates on Space instead of also
  advancing the deck).
- **Pointer** (`src/js/dom/deck-pointer.js`): a click in the outer 15% left/right
  edge of the deck root navigates, only on fine-pointer devices
  (`matchMedia('(pointer: fine)')`), ignoring clicks on interactive elements,
  `<table>`, `<dialog>`, or anything under `[data-no-nav]`.
- **Touch** (`src/js/dom/deck-touch.js`): `touchstart`/`touchend` on the deck root
  → `classifySwipe`. A swipe starting inside `[data-no-swipe]`, a form control, an
  open `<dialog>`, or any element that is *actually* horizontally scrollable
  (`scrollWidth > clientWidth + 1` with computed `overflow-x: auto`/`scroll` —
  see `src/js/dom/scrollable.js`) is ignored, so a finger dragging the model
  comparison table scrolls the table instead of changing slides.
- **Hash** (`src/js/dom/deck-hash.js`): read on load and on `hashchange`; written
  with `history.replaceState` (never pushes new history entries).

## Deviations from the brief

- `src/css/main.css` isn't explicitly listed in the ownership section but is
  required by the build pipeline description (esbuild's CSS entry point); it was
  added as minimal infrastructure — just `@import './engine.css';` — with a
  comment marking where the design pass adds its own stylesheet.
- The DOM layer is organised as `src/js/deck.js` / `share-ui.js` / `selector-ui.js`
  / `main.js` (as specified) composing small internal helpers under
  `src/js/dom/*.js` (keyboard, pointer, touch, hash, fullscreen, menu, dialog,
  slide-state, edit-target, scrollable, selector-render, model-table). This keeps
  every function under ~50 lines and every file well under the 800-line cap,
  per the project's coding-style rules; the four named files remain the public
  entry points.
- The selector slide includes a small "all models" comparison table rendered at
  runtime from `products.json` (`src/js/dom/model-table.js`), not hand-authored —
  both so the figures can't drift from the single source of truth, and because
  the e2e suite needs a real horizontally-scrollable element to verify the touch
  layer's scrollable-element exception.

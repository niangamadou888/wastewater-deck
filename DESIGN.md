---
name: Lintang Tankworks Wastewater Deck
description: A 12-sheet portfolio deck for a fictional septic and sewage tank maker, set as CAD model-space drawing sheets at night.
colors:
  ms-ground: "#1d232c"
  ms-panel: "#232a35"
  ink: "#e8ecef"
  ink-2: "#b7bec5"
  ink-3: "#8b949e"
  line: "rgb(232 236 239 / 0.16)"
  line-2: "rgb(232 236 239 / 0.34)"
  tb-rule: "rgb(232 236 239 / 0.38)"
  cyan: "#3dd6e0"
  cyan-hover: "#6ddce4"
  chosen-bg: "#213842"
  yellow: "#f2d14b"
  red: "#e0524a"
  backdrop: "rgb(12 15 20 / 0.84)"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.2rem + 5.4vw, 5.75rem)"
    fontWeight: 720
    lineHeight: 0.93
    letterSpacing: "-0.018em"
    fontVariation: "'wdth' 72"
  headline:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.85rem, 1.1rem + 2.6vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1rem + 0.7vw, 1.6rem)"
    fontWeight: 620
    lineHeight: 1.15
    fontVariation: "'wdth' 88"
  wordmark:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.17em"
    fontVariation: "'wdth' 125"
  model-code:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 88"
  dimension:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    fontVariation: "'wdth' 86"
    fontFeature: "'tnum', 'lnum'"
  pe-entry:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 2.8rem + 3vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.9
    fontVariation: "'wdth' 72"
    fontFeature: "'tnum', 'lnum'"
  body:
    fontFamily: "B612, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum', 'lnum'"
  lede:
    fontFamily: "B612, Archivo, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.3vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.5
  note:
    fontFamily: "B612, Archivo, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
  button:
    fontFamily: "B612, Archivo, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.1em"
  block-title:
    fontFamily: "B612, Archivo, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.1em"
  label:
    fontFamily: "B612, Archivo, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.1em"
rounded:
  none: "0"
  key: "10px"
  pill: "12px"
  balloon: "50%"
spacing:
  s-1: "0.25rem"
  s-2: "0.5rem"
  s-3: "0.75rem"
  s-4: "1rem"
  s-5: "1.5rem"
  s-6: "2rem"
  s-7: "3rem"
  gutter: "clamp(1rem, 0.5rem + 2.2vw, 2.5rem)"
  tap: "44px"
  frame-trim: "12px"
  frame-band: "16px"
  titleblock-w: "468px"
components:
  button:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1.125rem"
    height: "{spacing.tap}"
  button-hover:
    textColor: "{colors.cyan}"
  button-primary:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.ms-ground}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1.125rem"
    height: "{spacing.tap}"
  button-primary-hover:
    backgroundColor: "{colors.cyan-hover}"
    textColor: "{colors.ms-ground}"
  button-disabled:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink-3}"
  button-cell:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.ms-ground}"
    typography: "{typography.model-code}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1.25rem 0.5625rem 1rem"
  legend-item:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink-2}"
    typography: "{typography.note}"
    rounded: "{rounded.none}"
    padding: "0 0.875rem 0 0.625rem"
    height: "{spacing.tap}"
  legend-item-active:
    textColor: "{colors.cyan}"
  toggle:
    textColor: "{colors.ink-2}"
    typography: "{typography.note}"
    padding: "0.5rem 0.25rem"
    height: "{spacing.tap}"
  toggle-on:
    textColor: "{colors.ink}"
  pe-input:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.cyan}"
    typography: "{typography.pe-entry}"
    padding: "0 1.25rem 0.375rem"
  schedule-row:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.note}"
    padding: "0.6875rem 0.75rem"
  schedule-row-hover:
    backgroundColor: "{colors.ms-panel}"
  schedule-row-chosen:
    backgroundColor: "{colors.chosen-bg}"
    textColor: "{colors.cyan}"
  titleblock:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    width: "{spacing.titleblock-w}"
  result:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.s-5}"
  sheet-index-item:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink-2}"
    padding: "0.875rem 1.25rem"
    height: "64px"
  sheet-index-item-current:
    backgroundColor: "{colors.chosen-bg}"
    textColor: "{colors.cyan}"
  sample-tag:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1px 5px"
  balloon:
    backgroundColor: "{colors.ms-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.balloon}"
    size: "24px"
---

# Design System: Lintang Tankworks Wastewater Deck

## Overview

**Creative North Star: "The Drawing Sheet at Night"**

Every screen is a CAD model-space sheet on a consultant's monitor: a dark slate ground, white linework, and layer colours that mean something. The deck presents each tank the way engineers already review one. It is sectioned, dimensioned, hatched, annotated with numbered notes and closed by a title block. Persuasion comes from recognising that drawing language, not from brochure devices. There are no product glamour shots, no icon tiles and no stat cards. The sheet frame, zone grid and title block appear on every screen, so the deck reads as one drawing set of twelve sheets rather than a run of slides.

The density is that of a working drawing: hairline cells, micro uppercase field labels, tabular figures and numbered notes, with generous negative ground around one large section per sheet. Colour is rationed. The sheet is white on slate, and colour appears only where a drafter would put a layer colour: on a dimension, on water, or on a centreline or warning. Motion is just as scarce. Only the flow layer moves on its own, and it moves in the direction the effluent actually travels.

The brand is fictional and the deck says so on every sheet. The title block carries a portfolio notice with a red warning delta, every invented licence or date carries a sample tag, and a typographic wordmark stands in for the logo.

**Key Characteristics:**
- A dark model-space ground with white ink, and cyan, yellow and red used only as meaningful layer colours
- Every sheet has a frame with a 1 to 8 and A to F zone band and a fixed title block that carries navigation, sharing and the sheet counter
- Condensed Archivo carries titles, model codes and big figures; B612, a cockpit-display face, carries notes, labels and data
- Drawings use real drafting vocabulary: ANSI31 wall hatch, sand stipple, bio-media rings, dimension ticks, balloons, invert marks and view bubbles
- Controls are title-block cells and layer toggles, with square corners and 44px targets
- The deck is flat throughout: depth comes from line weight, hatch and knockouts, never shadows

## Colors

A night drafting palette: slate ground, three ink tiers, and three layer colours that each keep one meaning.

### Primary
- **Dimension Cyan** (#3dd6e0): This is the layer for dimensions, PE ranges, and anything interactive or chosen. It covers dimension lines and figures, the PE entry and its dimension line, the primary button, pressed legend items, ON toggles, the chosen schedule row, the current sheet in the index, the focus ring, text selection, links and the title-block progress edge. On hover, the primary button lightens to **Lit Cyan** (#6ddce4), a 72/28 mix toward ink.
- **Chosen Wash** (#213842): 12% cyan over the ground. It fills the background of the chosen schedule row and the current sheet-index cell, which marks the selection without a solid block of colour.

### Secondary
- **Water Yellow** (#f2d14b): Used only for water and flow: flow arrows, flow arrowheads, waterlines (TWL) and a 6% water tint inside tanks. It never appears on UI chrome.

### Tertiary
- **Centreline Red** (#e0524a): Used for centrelines, invert (IL) triangles, the warning delta icon and an invalid PE dimension line. It is always a mark and never text (4.1:1 on the ground).

### Neutral
- **Model-Space Slate** (#1d232c): The ground of the page, every sheet, the title block, the dialogs and the result panel. It is also the knockout fill that hides hatch behind pipes and necks, and the halo behind drawing labels.
- **Panel Slate** (#232a35): The hover surface for schedule rows, sheet-index cells, the QR cell and pressed phone keys. It only ever appears as a response to a pointer.
- **Sheet White** (#e8ecef): The primary ink for headings, walls, heavy borders, the sheet frame and body values.
- **Pencil Grey** (#b7bec5): Secondary ink for ledes, notes, leaders, legend labels at rest and hidden lines.
- **Field-Label Grey** (#8b949e): Tertiary ink for micro field labels, units, not-applicable cells, sample and XREF tags, disclaimers and the placeholder "?".
- **Hairline** (rgb 232 236 239 at 16%): Row rules, legend and toggle borders, and the sticky model-column edge.
- **Construction Line** (rgb 232 236 239 at 34%): Outline-button borders, dashed key-fact rules, empty-state frames and scrollbar thumbs.
- **Title-Block Rule** (rgb 232 236 239 at 38%): The cell dividers inside the title block, the approvals table, result dimensions and dialog heads and feet.
- **Backdrop Wash** (rgb 12 15 20 at 84%): A solid dark wash behind open dialogs, with no blur.

### Named Rules
**The Layer Colour Rule.** Each colour keeps one meaning. Cyan is for dimensions, PE ranges and whatever the viewer can touch or has chosen. Yellow is for water and flow, and nothing else. Red is for centrelines, invert marks and warnings. If an element is none of these, it is drawn in ink.

**The Red-Is-A-Mark Rule.** Red never colours text. A warning is a red delta icon followed by ink text, and an invalid entry turns its dimension line red, never its figure.

**The Night Ground Rule.** Every surface, including dialogs, panels, the title block and table cells, sits on the model-space slate. Panel Slate appears only on hover or press. There are no light surfaces, and the only light tile is the QR code's quiet zone.

## Typography

**Display Font:** Archivo (variable, width 62 to 125%), with Arial Narrow and system-ui as fallbacks
**Body / Data Font:** B612 (400 and 700), with Archivo and system-ui as fallbacks
**Label Font:** B612, uppercase and tracked

**Character:** Archivo narrowed to 72% width gives the tight, heavy title lettering of a drawing sheet. Opened to 125% and tracked wide, it becomes the wordmark. B612 was designed for cockpit displays, so its figures are equal-width and legible at small sizes. That makes it the natural face for notes, schedules and every number.

### Hierarchy
- **Display** (720, fluid 2.5 to 5.75rem, 0.93, 72% width): The cover title only, one per deck.
- **Headline** (700, fluid 1.85 to 3.25rem and capped lower on short screens, 0.98, 72% width): The sheet title, one per sheet. It is written as a claim and balanced across lines.
- **Title** (620, fluid 1.2 to 1.6rem, 1.15, 88% width): Product and block titles. At the same 88% width it also sets the title-block drawing title and the value in an enquiry cell button.
- **Wordmark** (800, 125% width, tracked 0.17em, uppercase via CSS): The brand name "Lintang Tankworks", typed in title case. It is 1.375rem on the cover, 0.9375rem in the title block and 1.125rem on phones.
- **Model Code** (600, 1rem, 88% width): The model column in schedules, such as LP-12 and LF-20V.
- **Dimension** (600, 1.5rem, 86% width, tabular): Inline dimension strings such as the PE ranges, set in cyan over a tick-ended line.
- **PE Entry** (700, fluid 3.5 to 5.5rem, 72% width): The selector's PE figure, which is the largest cyan number in the deck.
- **Body** (400, fluid 1 to 1.125rem, 1.6, tabular lining figures): Running text, capped at 70ch.
- **Lede** (400, fluid 1 to 1.0625rem, 1.5, Pencil Grey, 60ch): The one-paragraph scope line under each sheet title. It opens with a bold ink range.
- **Note** (400, 0.8125rem, 1.5): Numbered general notes, legend items, schedule cells and warnings.
- **Block Title** (700, 0.6875rem, tracked 0.1em, uppercase, 1px ink underline offset 6px): Captions for notes, schedules and fieldsets, in the style of a drafting label.
- **Label** (400, 0.6875rem, tracked 0.1em, uppercase, Field-Label Grey): Title-block field labels, schedule headers and key-fact terms.

### Named Rules
**The Two Faces Rule.** Archivo is for titles, model codes and big figures. B612 is for everything else, including every number in a table, note or label.

**The 11px Floor Rule.** No HTML text is set below 0.6875rem (11px). That size is reserved for field labels, key hints, tags and units. Drawing text scales with its SVG, so phones raise the balloon, dimension and label sizes to keep them near 12 CSS px.

**The Short Caps Rule.** Uppercase is only for short labels of 30 characters or fewer: field labels, block titles, view names, tags and drawing callouts. Notes, captions after the title and source lines stay in sentence case.

## Layout

The sheet is the layout. `.slide` pads inside a 12px trim line, a 16px zone band with 1 to 8 across and A to F down, and a heavy 1.5px ink inner border. The frame is drawn in pure CSS, so slide authors write nothing for it. Inside the frame, `.sheet-grid` has two regions. The drawing side takes the remaining width. The schedule side is exactly as wide as the title block, minus the gutter, and stops above it, so nothing ever runs under the chrome. A drawing is usually pushed to the foot of the main region.

The title block is fixed at the bottom right, on the inner-border corner. It is 468px wide on desktop and 404px at 1180px wide and below. Its five rows hold, in order: company, drawing title, the metadata strip (drawing no., rev, scale, sheet), the fictional-brand notice, and the key-hint row. The QR share cell spans the first three rows. On screens 820px tall or less, the rows compact, the top padding drops and sheet titles cap at 2.75rem.

On phones (720px and below), the frame is dropped. The page becomes a single column with drawings at full width. The title block turns into a two-row bottom bar: title and sheet counter on top, then Prev, Sheet index, Share and Next as 52px cells. Split drawings move their legend from a 12rem side column to a row beneath the drawing at 1100px and below. On short laptops the legend stays beside the drawing as a slim 9.5rem column. Product schedules become one labelled two-line row per model when their container is narrower than 41rem. Any other schedule scrolls sideways inside its own scroller and shows a hint.

Spacing runs on a 0.25rem-based scale (s-1 to s-7). Headings get more space above than below. Sheet columns are separated by the fluid gutter, and every interactive target is at least 44px.

### Named Rules
**The Title Block Clearance Rule.** On desktop, nothing sits in the lower-right rectangle that the title block occupies. A sheet that doesn't use the grid must keep that corner clear itself.

## Elevation & Depth

The system is flat. There are no box shadows, gradients, glass or blur. Depth is expressed the way a drafter expresses it, through line weight and fill. Walls are 2px ink over ANSI31 hatch. Heavy borders at 1.5px ink mark the sheet frame, the title block, dialogs, schedule header rules and the approvals table. Cell dividers are 1px Title-Block Rule, and lighter separations use Hairline or dashed Construction Line. Stacking uses ground-coloured knockouts: a slate fill hides hatch behind a pipe bore or manhole neck. Every drawing label also carries a 3px slate halo (paint-order stroke), so a line breaks around text instead of striking through it. Dialogs lift off the sheet only through a solid Backdrop Wash and a heavy ink border.

### Named Rules
**The Flat Sheet Rule.** A surface is separated from the sheet by a rule, a hatch or a knockout, never by a shadow. Hover changes the fill to Panel Slate or turns the border cyan. Nothing rises.

## Shapes

Corners are square. Buttons, cells, panels, dialogs, tables, legend items and toggles all use a 0 radius, in keeping with the drawing sheet. Circles appear only where drafting uses them. These are the numbered balloon (24px, or 28px on installation steps), the 40px view bubble split horizontally into view letter over sheet number, and the capsule key caps: `kbd` at 20px tall with a 10px radius and the arrow pill at 24px with a 12px radius. The revision delta on the approvals table is a clipped triangle outline holding its row number. Viewport corners are 14px L-shaped crop marks, and the XREF boundary is a dashed line 6px outside the raster. Tank shells in drawings are the only rounded rectangles, because that is the real shape of the tank.

## Components

Every control speaks the same cell language: hairline cells, micro uppercase field labels, B612 values, and cyan only where something can be touched or has been chosen.

### Buttons
- **Shape:** Square (0 radius), with a minimum height of 44px.
- **Outline (default):** Transparent over the ground, with a 1px Construction Line border and ink B612 text at 0.8125rem, bold, tracked 0.1em and uppercase. It can lead with an 18px stroke icon.
- **Primary:** Solid Dimension Cyan with slate text. A sheet has at most one: the enquiry or the find-the-model action. On hover it lightens to Lit Cyan.
- **Cell button:** A primary button set like a title-block cell. It stacks an uppercase field label ("Enquire on WhatsApp") over a value in Archivo at 88% width ("LF-20V, 20 PE"), in sentence case, aligned to the start.
- **Hover / Focus / Active:** On hover the border and text turn cyan, with a 0.2s ease-out colour transition. Focus is a 2px cyan outline offset by 3px. Active nudges the button down 1px.
- **States:** Disabled or aria-disabled buttons, including the primary, drop to an outline with Construction Line border, Field-Label Grey text and no fill. Busy adds a 12px spinning ring. Done keeps a cyan border and text.

### Chips and tags
- **Sample tag:** An uppercase 11px label in Field-Label Grey inside a 1px Field-Label Grey border, padded 1px 5px. It sits inline after any fictional licence number, date or fact.
- **XREF tag:** The same construction, prefixed to a raster's file name in the viewport strip.

### Cards / Containers
The system has no cards. Content sits on the sheet between rules.
- **Key facts:** Drawing-note rows, never big-number tiles. There is a 1px ink top rule and dashed Construction Line row rules. The term is a field label and the value is 0.875rem ink, with dimension values in cyan.
- **Result panel:** A 1px cyan border on the ground, padded 1.5rem. The model code is in cyan Archivo at 72% width, followed by a grid of dimension cells ruled with Title-Block Rule. Its border turns dashed Construction Line when empty, and plain Construction Line when the entry is invalid or out of range.
- **General notes:** A block title, then numbered sentence-case lines in Pencil Grey, each with a bold ink counter.

### Inputs / Fields
- **PE entry:** A large cyan Archivo figure standing on a 1px cyan dimension line, with tick-mark ends drawn as SVG and a cyan "PE" unit. When empty, a dashed Field-Label Grey box holds a "?" placeholder. Focus draws a 2px cyan outline 10px out. An invalid entry turns the dimension line red.
- **Layer toggles (checkboxes):** A 44px row ruled with Hairline, containing an 18px square box, the label, and a CSS-only OFF/ON state word. Checked fills the box cyan with a slate tick, raises the label to ink and turns the state word cyan.

### Navigation
- **Title block key row:** The key hints are the controls. There is `G` Sheet index and `F` Fullscreen as outlined key caps, and Prev and Next as arrow pills. Hover raises the text to ink and turns the cap border cyan. A pressed fullscreen key fills its cap cyan. On sheet 01, Prev is muted and inert, and on the last sheet Next becomes "Back to 01". The top edge of the title block fills cyan as the sheets advance.
- **Sheet index dialog:** A grid of 64px cells separated by 1px rules. Each cell shows a zero-padded sheet number in Archivo and the sheet title in B612. The current sheet takes the Chosen Wash with cyan text. On phones the dialog becomes a bottom sheet.
- **QR share cell:** The mini QR is itself the button. When there is no URL to encode, it shows an X-crossed XREF "not loaded" frame tagged "QR once hosted" in place of a blank tile.

### Spec schedule (signature)
The table is modelled on a drawing schedule. Each header is a field label with the dimension symbol above it in cyan (D, L, H1, H2), matching the letter on the drawing. An optional units row follows, then tabular figures, a sticky model column in Archivo at 88% width, and a 1.5px ink rule under the header. The chosen row takes the Chosen Wash, a cyan model code and cyan rules above and below. It also carries a visually hidden reason. In narrow containers, product schedules become one two-line row per model with a labelled dimension strip and an orientation glyph: a capsule for horizontal tanks and an upright for vertical ones.

### Layer legend (signature)
Legend items are 44px bordered buttons. Each has a numbered balloon that matches the balloon drawn in the section, the layer name, and an optional 32px swatch drawn with the drawing's own layer class. Pressing an item isolates its layer: other layers fade to 16% and the isolated walls and balloon turn cyan. A pressed item has a cyan border and text, and its balloon fills cyan.

### Drawing layer (signature)
Every schematic is an inline SVG, normally on a 640-unit-wide viewBox (the cover plate is 1300 units wide so its ground line and outlet run to the border). It uses shared hatch patterns and markers: ANSI31 for walls, a sparse diagonal for soil, stipple for sand, aggregate for concrete, rings for bio-media, a 45-degree tick for dimensions, a filled arrowhead for flow and a dot for leaders. The layer classes are fixed. Walls are 2px ink. Hidden lines are dashed Pencil Grey. Centrelines are red chain lines. Waterlines are yellow chain lines. Flow is 2px dashed yellow with an arrowhead. Aeration is ink dots. Dimensions are 1px cyan with ticks and bold 14px cyan figures. Each drawing sits in a figure with a view title: the split bubble, an uppercase view name double-underlined in ink, and a Field-Label Grey scale note.

### Measured PE scale (signature)
A single linear scale from 0 to 150 PE appears on every product sheet. Each series is drawn as a cyan dimension over its real range. A 2px cyan marker follows the selector.

### Image viewport (XREF)
Every raster sits inside a clip marked by 14px ink crop corners and a dashed Field-Label Grey boundary. Below it is a strip holding the tagged file name and its provenance line. The single stand-in photo is graded into the night sheet with a luminosity blend over a slate tint. An unsupplied photo shows as an X-crossed 16:9 frame labelled "Photo to be supplied".

### Warning line
A 16 by 14px red outline delta followed by ink text. It is used for the fictional-brand notice, site cautions from the selector, and dialog footers.

## Do's and Don'ts

### Do:
- **Do** keep each layer colour to its single meaning: cyan (#3dd6e0) for dimensions, ranges and interaction, yellow (#f2d14b) for water and flow, and red (#e0524a) for centrelines, invert marks and warning marks.
- **Do** put every sheet inside the frame and let the fixed title block carry the title, sheet counter, navigation, sharing and the fictional-brand notice.
- **Do** set every figure in B612 or tabular Archivo. Draw a dimension as a dimension, meaning a cyan figure on a tick-ended line, rather than as a big standalone number.
- **Do** tag every invented licence number, date or fact with the sample tag, and write TBC for any figure that isn't known.
- **Do** keep controls square, at least 44px, and styled as title-block cells or layer toggles with an uppercase 11px field label over a B612 or Archivo value.
- **Do** animate only the flow layer (water, and the aeration air in it) on the active sheet, in the drawn direction. UI state changes use 0.2s ease-out, and reduced motion turns everything off.
- **Do** give every drawing label a slate halo, and give every raster an XREF viewport with its provenance line.

### Don't:
- **Don't** use gradients, glass, blur, box shadows, emoji or unicode glyph icons. Icons are inline 16px SVGs with a 1.5 stroke.
- **Don't** set any text in red, or use yellow for anything but water.
- **Don't** put eyebrow or kicker labels above headings. The uppercase field labels inside cells are not headings.
- **Don't** build stat cards, big-number tiles, icon tiles or product-glamour layouts. Key facts are drawing-note rows.
- **Don't** round the corners of buttons, panels, cells or dialogs. Circles are only for balloons, view bubbles and key caps.
- **Don't** add a light surface. Everything sits on the model-space ground.
- **Don't** place content under the title block on desktop, or let a phone page scroll sideways at 358px.
- **Don't** set HTML text below 11px, or set uppercase runs longer than 30 characters.

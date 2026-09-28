---
version: 1
slug: "src-index-html"
primary_target: "src/index.html"
related_targets: []
---

# Surface: Phase 1 wastewater deck (src/index.html -> dist/index.html)

Mode: Persuade. Audience: Malaysian contractors and engineering consultants, on a phone on site or on a meeting-room screen.
Job: pick a certified system for a PE and site, then enquire. Primary action: WhatsApp enquiry pre-filled with the model chosen in the selector.
Proof: SIRIM QAS licences, MS 2441-1 / MS 2441-2, SPAN refs, real spec schedules (src/data/products.json).
Constraints: client-pinned dark / high-contrast look, Space / arrows / G menu / F fullscreen / swipe / QR share; offline single file;
no invented claims; audience rejects tech-startup looks, excess motion, generic templates, phone-unreadable tables.
Build path: code-led (no image generation). Critique reference: the chosen decision comp (model-pick.png), archived outside the repo.

## Direction contract

THESIS: Every system is shown the way consultants already review it: a model-space drawing sheet, sectioned, dimensioned, layered and title-blocked. It refuses the supplier brochure (product photo, icon tiles, stat cards).

OWN-WORLD: Model-space ground #1D232C, line white #E8ECEF; layer colours carry meaning: cyan #3DD6E0 dimensions, PE ranges and anything interactive; yellow #F2D14B water and flow; red #E0524A centrelines, invert marks, warnings (never body text). ANSI31 wall hatch, sand-bedding stipple, bio-media dots, A-F / 1-8 border grid, title block on every sheet. Archivo (condensed display, expanded wordmark) with B612 for drawing notes and data. Controls are title-block cells and layer toggles.

STORY: The consultant recognises their own drawing language, trusts real licence numbers and schedules, finds the model for their PE and site on the selector sheet, and sends a pre-filled WhatsApp enquiry.

FIRST VIEWPORT: Title large top-left; product-line range table top-right with cyan dimension-string ranges; a full-width typical section through a bio-filter tank across the lower half (inlet, primary settling, bio-media, outlet), flow in yellow; title block bottom-right holding company, drawing title, sheet 01 of 12, QR and key hints. Next-sheet affordance lives in the title block.

FORM: CAD model-space drawing sheet, position 1 of 7 on the ordered list (IMPECCABLE'S PICK card, user-chosen), seed key ae4e0a94. Signature interaction: the selector redraws the tank section at the chosen model's real D / H1 / H2 with live dimension strings; tapping a legend label isolates its layer in the section. Carried disciplines: colour only on what moves or is chosen; one measured PE scale 6-150 across product sheets; only water moves, in its real direction; flow states named raw, settled, filtered, discharged.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Client factory / truck-loading photos not yet supplied; photo sheet uses a labelled image viewport (XREF grammar).
- Invert depths below ground unknown; shown qualitatively or as H2.

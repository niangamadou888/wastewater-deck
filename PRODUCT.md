# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, no framework (user choice, 2026-09-28). Authored as source partials and built by a
dependency-free Node script into one self-contained `dist/index.html` with fonts, schematics, the QR
encoder and scripts inlined, so it opens offline and travels as a single link or file.

## Users

- **A freelancer's portfolio visitor.** A prospective client or hiring manager scanning a case study,
  who opens the link (or the attached file) to see how the freelancer approaches a real-feeling product
  problem end to end: brand, data, drawings, interaction, accessibility.
- **Contractors and engineering consultants (the audience the deck itself is written for).** The deck
  stays in character as a tool for this audience — open the link on a phone, often on site, to pick a
  septic or sewage system for a given population equivalent (PE), burial depth and water table — even though the manufacturer is fictional and every figure is synthetic, derived by an authored
  sizing rule rather than taken from any real schedule.

## Product Purpose

Originally built as a speculative concept demo for a real Malaysian wastewater manufacturer's Upwork
job post; the client hired someone else. It is now a **portfolio piece**: a self-contained demonstration
of the same interactive deck, rebuilt around a fictional manufacturer, "Lintang Tankworks", so it can be
shown and shared without impersonating or referencing the real company that never became a client.

Success: a visitor can tell, within seconds, that the brand and figures are fictional and sample-only,
while still experiencing the deck exactly as a real consultant would — PE in, certified-sounding model
out, a WhatsApp enquiry that goes nowhere real (recipientless, by design) rather than to any actual
phone number.

## Positioning

Lintang Tankworks is a **fictional** Malaysian manufacturer, dispatching from Nilai, Negeri Sembilan, that
makes both rotomolded polyethylene and fibreglass composite septic/sewage systems in-house, covering 6
PE household tanks through 150 PE small sewage treatment systems. Every certification number, date and
company fact attached to it is sample data, clearly marked as such throughout the deck.

## Operating Context

- Scope of Phase 1 (unchanged from the original brief): cover / sharing, credibility and standards (the
  public MS 2441-1 / MS 2441-2 standards, EQA discharge limits), PE Bio-Filter septic tanks (6-18 PE),
  FRP Bio-Filter septic tanks (8-30 PE), LT small sewage treatment system (40-150 PE), technical
  selection matrices, contact / call to action.
- Required interactions (carried over from the original client brief): Space and arrow keys, G opens a
  slide jump menu, F toggles fullscreen, touch swipe on phones and tablets, integrated QR code for
  sharing.
- Look: clean, dark-mode / high-contrast corporate card layouts — "The Drawing Sheet at Night" visual
  world (CAD model-space sheets).
- Visual material: no studio photography of the fictional product exists. Visuals rely on 2D vector
  cross-sections (chambers, flow Primary > Filter > Discharge, invert levels), subtle SVG/CSS motion, a
  real, CC-licensed stand-in site photo (`src/assets/photo-tanks.webp`, provenance in the matching
  `.json`), and structured data cards and tables.

## Capabilities and Constraints

- Must work offline and on mid-range phones over mobile data; one self-contained build.
- Project `.htmlvalidate.json` (parent folder) bans inline `style` attributes and requires a11y rules.
- Sample product lines and model codes (fictional, `src/data/products.json`):
  - PE Bio-Filter septic tank (rotomolded HDPE, 6-18 PE): LP-6H = 6 PE horizontal, LP-6V = 6 PE
    vertical, LP-8 = 8 PE, LP-10 = 10 PE, LP-12 = 12 PE, LP-15 = 15 PE, LP-18 = 18 PE.
  - FRP Bio-Filter septic tank (8-30 PE): LF-8V = 8 PE vertical, LF-8H = 8 PE horizontal, LF-15V = 15 PE
    vertical, LF-15H = 15 PE horizontal, LF-20V = 20 PE, LF-28H = 28 PE, LF-30H = 30 PE.
  - LT small sewage treatment system (SSTS, 40-150 PE): LT-40, 50, 60, 75, 90, 110, 130, 150 (eight
    models, 22 across the three series).
  - Sample services: PE calculation, SPAN / IWK submission support, LT rental.
  - Every dimension is synthetic: derived from the PE rating by an authored sizing rule
    (`scripts/product-rule.mjs`), with every capacity recomputed as the drawn liquid volume. No figure
    is copied from a real manufacturer's schedule (see `docs/SOURCES.md`); the model codes, licence
    numbers and company facts are invented for this fictional brand.
- Per-model dimensions (diameter / width, length, height H1, water level H2) and nominal capacities are
  the single source of truth in `src/data/products.json`; sample licence numbers
  (`SAMPLE-PE-01` / `SAMPLE-FRP-02` / `SAMPLE-SSTS-03`) replace what would be real SIRIM QAS licence
  numbers, rendered with a visible "sample" marker everywhere they appear.
- Still unknown / never invented: invert depths below ground, weights, blower ratings, flow rates,
  prices, real customer or project references. Schematics show invert levels qualitatively or as H2
  only; "TBC" marks any figure that isn't known.

## Brand Commitments

- Company: "Lintang Tankworks", short name "Lintang". Tagline: "Septic and sewage systems in PE and
  FRP". Fictional, clearly labelled as such on every sheet.
- Location: "Nilai, Negeri Sembilan" only, as a sample dispatch point — no street address (there is no
  real premises to give one for).
- Contact: WhatsApp enquiries are recipientless (`data-whatsapp=""`, `https://wa.me/?text=...`, so
  WhatsApp lets the visitor pick who to send it to rather than messaging a real number). Email
  `sales@example.com` (a reserved domain, never a real inbox). Phone shown as "Phone on request", never
  as a `tel:` link. Office hours are a generic placeholder.
- The official logo file (there isn't one — Lintang Tankworks doesn't exist) is not used; a typographic
  wordmark stands in, same treatment the original brief specified.

## Evidence on Hand

- Synthetic dimension and capacity figures from the authored sizing rule in `scripts/product-rule.mjs`
  (`docs/SOURCES.md`); every brand-identifying detail (name, model codes, licence numbers, addresses,
  phone numbers) is invented for Lintang Tankworks.
- No photography of a fictional product can exist: the one site photo used
  (`src/assets/photo-tanks.webp`) is a real, CC BY-SA 4.0 photograph of an unrelated tank installation,
  used and credited as a stand-in (provenance in `src/assets/photo-tanks.json`).

## Product Principles

1. Selection first: every product slide answers "which model for my PE and my site?"
2. Proof over adjectives: certifications, model codes and numbers carry the persuasion — even as sample
   data, they behave like the real thing would.
3. One link does everything: share, present, and enquire from the same page, online or offline.
4. Phone-first reading, meeting-room presenting: both are primary, neither is a fallback.
5. Honest about what it is: fictional and sample-labelled everywhere, never mistakable for a real
   company's publication.

## Accessibility & Inclusion

Readable in sunlight on a phone (high contrast), full keyboard operation, visible focus, respects
reduced-motion, English copy that is plain enough for non-native readers.

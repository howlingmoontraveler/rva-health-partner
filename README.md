# RVA Health Partner — Design System

**Brand:** RVA Health Partner ("RVAHP")
**Category:** Premium health coaching — strength training + peptide therapy + GLP-1 wellness support
**Location:** Richmond, Virginia
**Positioning:** Evidence-based, medically adjacent, results-driven. Not a gym. Not a clinic. A complete system.
**Archetype:** The Sage + The Ruler — authoritative knowledge combined with premium control and precision.
**Emotional register:** Confident, restrained, clinical warmth. Signals expertise without arrogance.

> *"Rolex meets Mayo Clinic."* — the single-sentence brief the whole system rolls up to.

---

## Index — what lives where

| Path | What it is |
|---|---|
| `README.md` | This document — brand fundamentals, content + visual + iconography guidelines |
| `SKILL.md` | Claude Skill wrapper — lets this system drop into Claude Code |
| `colors_and_type.css` | CSS custom-property tokens: color ramps, type scale, spacing, elevation, motion |
| `brand/wordmark-design-system.md` | Full wordmark brief (provided by user) |
| `assets/brand/` | Logos, wordmarks, brand imagery (dynamic-partner concept) |
| `assets/icons/` | Icon SVGs (Lucide-based, see Iconography) |
| `preview/` | Design-system preview cards that surface in the Design System tab |
| `ui_kits/marketing-site/` | Hi-fi recreation of the marketing website |
| `ui_kits/member-portal/` | Hi-fi recreation of the member portal / dashboard |

---

## Sources provided

- `uploads/RVAHP-wordmark-design-system.md` — full wordmark brief (color, type, lockups, forbidden treatments). Copied to `brand/wordmark-design-system.md`.
- `uploads/Gemini_Generated_Image_ajlpolajlpolajlp.png` — "Concept 8: The Dynamic Partner" brand-identity exploration (two watercolor figures, forest-green + antique-gold, overlapping with momentum). This is the anchor illustration concept for the brand. Copied to `assets/brand/dynamic-partner-concept.png`.
- `uploads/hero-animation.svg` — provided but contained no renderable image data (empty image mask wrapper). Not used.

No codebase, Figma file, or live product was attached. **Everything past the wordmark brief is a disciplined extrapolation from the wordmark system, Dynamic Partner concept, and the stated brand archetype.** Flagged in the Caveats section at the bottom.

---

## Content fundamentals

The wordmark brief establishes the voice: **evidence-based, premium, results-driven, medically adjacent, trustworthy, confident**. That translates to copy that reads like a specialist clinic, not a gym and not a wellness blog.

### Voice attributes & how to write them

| Attribute | In practice |
|---|---|
| **Evidence-based** | Cite mechanisms, not vibes. *"GLP-1 agonists reduce appetite by slowing gastric emptying"* — not *"melt the fat away."* |
| **Premium / restrained** | Short sentences. No exclamation points. Never use two words where one does the work. |
| **Medically adjacent** | Sound like a protocol, not a promo. *"Week 1: baseline labs, movement screen, peptide consultation."* |
| **Richmond-rooted** | Occasional, understated. *"Our Scott's Addition studio."* Never tourist-branded. |
| **Confident** | State what we do. Don't hedge with "we help you try to…". |

### Casing, punctuation, and the small stuff

- **Sentence case** for UI labels, buttons, nav, cards, and headings. *"Book consultation"*, not *"Book Consultation"*.
- **Title Case** is reserved for program names (*The Catalyst Protocol*, *Partner Program*) and editorial article titles.
- **ALL CAPS, tracked** is reserved for eyebrows, location tags, and the wordmark itself. Cap tracking is `+180` letterspacing. Never use all caps for body copy.
- **Em dashes over parentheses** for asides — it reads more editorial.
- **Oxford commas** on. No ampersands in body copy; save `&` for the wordmark and display lockups.
- **Numbers:** spell out one through nine; digits for 10+ and always for dosages, measurements, weeks, and pricing. *"eight weeks"* in prose, *"Week 8 labs"* in a protocol header.
- **No emoji.** Not in product, not in marketing, not in email. The wordmark brief explicitly forbids decorative punctuation adjacent to the mark — we extend that to the whole surface.
- **No exclamation points** except in direct-quoted member testimonials.
- **Avoid "journey."** Use *protocol*, *program*, *plan*, *partnership*.
- **Avoid "wellness clichés":** no *"fuel your body"*, no *"level up"*, no *"unlock"*.

### First person: we, you, and the partner frame

- **"We"** = RVA Health Partner as a clinical team. *"We test quarterly."*
- **"You"** = the member, singular, directly addressed. *"You'll receive a weekly protocol review."*
- **"Your partner"** / **"your health partner"** = the specific coach or clinician assigned to the member. This is the brand's central metaphor and it's literal, not decorative.
- Never use "I" in product copy.
- Never use "client," "patient," "customer," or "user" externally. Members are **members**. Internally, "member" is fine in docs.

### Tone anchors — copy in the wild

**Hero** — *"A health partner, not a gym membership. Strength, peptides, and GLP-1 protocols — built around your labs, not a program calendar."*

**Button** — *"Book consultation"* / *"Review this week's protocol"* / *"Message your partner"*

**Empty state** — *"Your first labs arrive here within 72 hours of your draw."* (State fact, state timeline.)

**Error** — *"We couldn't reach the lab portal. Your data is safe. Try again in a moment."* (Reassure, don't panic.)

**Testimonial framing** — *"Member, 14 months"* — never *"Sarah T., crushing it!"*

**Things that are off-brand in content:** slogans with *"transform"* / *"journey"* / *"unleash"* / *"unlock your potential"*; before/after language; body-shame framing; scarcity urgency (*"only 3 spots left!"*); any mention of a weight-loss number in hero copy.

---

## Visual foundations

### Color

Two colors do almost all the work: **Forest Green `#006039`** and **Antique Gold `#A37E2C`**, pulled directly from the Rolex Submariner's green bezel and gold crown. Everything else is a neutral — **Ivory `#F5F0E8`** as the primary warm surface, **Deep Charcoal `#1A1A1A`** as the primary ink, **White** as an alternate surface for high-density UI, and a charcoal ramp for hierarchy.

- **Forest green dominates.** It's the wordmark, the primary button, the hero background option, the inverse surface. Use it confidently.
- **Gold is an accent, never a block.** Thin rules, single-character monograms, a hairline under an eyebrow, a focus ring. If you find yourself filling large areas with gold, stop — it reads cheap.
- **Ivory is the canvas.** Pure white is used for dense UI (tables, forms) where ivory would feel muddy; ivory is used everywhere else.
- **No off-palette colors.** Status colors are tuned warm/earthy (a muted clay for danger, a brass-warning rather than safety-yellow) to stay within the world.

### Typography

- **Display / editorial → Playfair Display**, weight 500–600. High-contrast serif. All display headings, hero copy, wordmark, editorial article titles. Tight letter-spacing (`-0.01em`).
- **Secondary serif → Cormorant Garamond**, italic 500, for pull quotes and lead paragraphs. Adds a refined, almost editorial-essay cadence.
- **UI / body → Inter**, weights 400/500/600. Everything functional: nav, buttons, form labels, table cells, paragraph copy under hero length.
- **Mono → JetBrains Mono** for dosages, lab values, and code-adjacent UI.
- **Never** use a sans-serif for a display/wordmark treatment. **Never** use a script font. **Never** use condensed or extended variants.

### Spacing

4px base, with generous vertical rhythm at display sizes. Section-to-section breathing room is **96–128px** (`--sp-9` / `--sp-10`) in marketing; card padding is **24–32px** (`--sp-5` / `--sp-6`) in product. When in doubt, add space — restraint is the register.

### Backgrounds & imagery

- **Primary canvas:** flat ivory or flat forest green. Full-bleed color blocks, not gradients.
- **Photography vibe:** warm-shadow, low-saturation, grain-optional. Clinical but not cold — think editorial portraiture of a doctor, not stock "woman doing yoga." Skin tones hold their warmth; greens in environments are muted, not neon.
- **Watercolor / wash illustrations:** lifted from the **Dynamic Partner** concept (`assets/brand/dynamic-partner-concept.png`) — forest-green and gold figures with a dry-brush overlap. Use as hero illustration or section anchor. Always on ivory. Never trace these into SVG; they live as raster.
- **No gradients on brand surfaces** (wordmark brief explicit). A very soft vertical ivory-to-ivory-pale wash is the only exception, used under long-scroll sections to add depth.
- **No stock photography of barbells, kettlebells, yoga mats, or scales.** If imagery is strength-related, it's anatomical, architectural, or abstract — a barbell in partial silhouette against forest-green is acceptable; a man grimacing under a heavy bar is not.
- **Textures:** a subtle paper/linen grain (3–5% opacity) on ivory surfaces in hero sections. Nothing else.

### Animation

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo style) is the house ease — confident arrival, no bounce.
- **Duration:** 140ms for micro (hover tint), 240ms for standard (tab change, drawer), 480ms for hero reveals. Never over 600ms.
- **Motions allowed:** fade + 8–12px vertical translate; width animations on gold rules; number counters on outcome stats.
- **Motions forbidden:** bounce, elastic, overshoot, confetti, skew, rotate-on-hover, parallax, fade-in-per-word hero animations.
- **Reduce-motion:** all transitions collapse to `opacity` only, 120ms.

### Hover & press

- **Button hover:** forest darkens by one step (→ `--rvahp-forest-700`). Gold rules brighten 10%. Never add a shadow on hover.
- **Button press:** shrinks to 98% scale for 120ms, then returns. No color change on press (press state reads through motion, not color).
- **Link hover:** adds a 1px gold underline from `text-decoration-color: transparent` → `var(--rvahp-gold-600)` over 140ms. Never color-change the text itself.
- **Card hover:** elevation goes from `--shadow-1` → `--shadow-3`, and an inset 1px gold rule appears at the bottom edge. 240ms.

### Borders & shadows

- **Borders are 1px, always.** No 2px or 3px. Hairline is the register. Color is `rgba(26,26,26,0.12)` for subtle, `rgba(26,26,26,0.24)` for strong.
- **Dividers** are either 1px charcoal at 12% opacity (neutral) or 1px gold (editorial — under display headings, within wordmark lockups).
- **Shadows are restrained.** Three levels only: `--shadow-1` (resting card), `--shadow-3` (hover / focus-overlay card), `--shadow-4` (dialog / modal). No large diffuse glows, no colored shadows.
- **Inset shadows are used deliberately** for a gold bottom-rule effect (`--shadow-rule`) — a signature of the system.

### Corner radii

- **Default radius: 8px** (`--r-3`). Cards, inputs, dropdowns.
- **4px** for tags, badges, small chips.
- **12–16px** for hero-scale surfaces (dashboard "today" panel, pricing feature blocks).
- **Pill (999px)** for filter chips and the member-status indicators only. Never on primary buttons — RVAHP buttons are 8px, not pills.
- **0px (square)** for editorial image containers and full-bleed hero image frames — emphasizes the restraint.

### Cards

A default RVAHP card: ivory or white surface, **1px hairline border** at 12% charcoal, 8px radius, 24–32px padding, `--shadow-1` at rest. On hover, a 1px inset gold rule appears at the bottom edge and elevation lifts to `--shadow-3`. No gradient borders, no glassmorphism, no left-border-only-accent-color cards (a common AI tell).

### Transparency & blur

- **Blur is used sparingly**, only for a backdrop-filter under the global nav when scrolled (`backdrop-filter: blur(12px)` over ivory at 80% alpha).
- **Transparency is not a decorative device.** We don't use semi-transparent white cards over photography; we use the ivory "protection block" pattern instead — a solid ivory rectangle sized to the text, sitting over the image.

### Layout rules

- **12-column grid**, 1440px max container with 80px gutters; 1200px for reading content.
- **Navigation is fixed top**, 72px tall, ivory with hairline charcoal bottom-border. It becomes blurred + translucent once scrolled.
- **Hero max-width:** display text maxes at ~16ch for `display-xl`, ~24ch for `display-m`. Never full-width-edge-to-edge display type.
- **Asymmetry is acceptable and encouraged** — a 60/40 hero split with a flush-left display headline and a right-column watercolor illustration is the canonical layout.

---

## Iconography

RVAHP doesn't ship a bespoke icon font. The system uses **[Lucide](https://lucide.dev)** as the baseline icon set — 1.5px strokes, rounded joins, 24×24 grid, outline-only. This was chosen (and flagged as a substitution, since no icon set was provided in the brief) because it matches the system's temperament: precise, clinical-but-warm, single-weight, no fills. Key swaps to make it feel RVAHP-specific:

- **Stroke color** defaults to `var(--fg)` (charcoal) in neutral UI, `var(--fg-brand)` (forest) in emphasis contexts, `var(--fg-accent)` (gold) for editorial accents like an eyebrow bullet.
- **Never fill Lucide icons.** If a filled-state is needed (e.g. active nav item), use a 1.5px outline version inside a circle of `--rvahp-forest-100`.
- **Size tokens:** 16px (inline with text), 20px (button leading/trailing), 24px (nav, list items), 32px (feature blocks), 48px (empty-state hero icons).

### The custom marks (not icons)

The brand uses four wordmark lockups and four optional supporting marks (shield, precision cross, minimal crown, no-mark). These are **brand marks**, not icons, and they live in `assets/brand/`, never in `assets/icons/`. The precision cross is close to a medical-adjacent icon but is reserved for brand use only — don't adopt it as a UI "add" icon.

### What about emoji and Unicode?

**No emoji. Anywhere.** The wordmark brief forbids them adjacent to the mark; we extend that policy to all product surfaces. **Unicode typographic characters are encouraged:** em dash (`—`), en dash (`–`), true multiplication (`×`), degree (`°`), and the prime/double-prime for measurements (`8′`, `8″`). These are part of the editorial register. Never use `*`, `->`, `<-`, or ASCII approximations where the Unicode character exists.

### Iconography substitutions flagged

- **Lucide** is used as a reasonable stand-in because no icon set was provided. If RVAHP has a proprietary icon set, swap `assets/icons/` and re-point the UI kits.

---

## Caveats & open questions

- No codebase, Figma file, or screenshots of an existing product were provided — the UI kits in `ui_kits/` are a designed extrapolation, not a recreation.
- Font files are not bundled; the system links Google Fonts CDN. If brand typography is actually licensed (e.g. Freight Display Pro mentioned in the brief as an Option D), fonts need to be purchased and dropped into `assets/fonts/`.
- Photography direction is described but no photo asset library was provided.
- The Dynamic Partner watercolor concept is a single exploratory image — a full illustrated library (protocol icons, service illustrations, etc.) would benefit from a commissioned set in the same watercolor style.

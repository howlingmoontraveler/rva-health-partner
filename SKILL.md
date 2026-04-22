---
name: rvahp-design
description: Use this skill to generate well-branded interfaces and assets for RVA Health Partner, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Key files, in this order:
1. `README.md` — brand voice, content fundamentals, visual foundations, iconography, caveats
2. `colors_and_type.css` — drop-in CSS tokens (colors, type, spacing, elevation, motion)
3. `brand/wordmark-design-system.md` — full wordmark brief (color, lockups, forbidden treatments)
4. `assets/brand/` — wordmark SVGs, monogram, marks, Dynamic Partner illustration
5. `ui_kits/marketing-site/` — hi-fi marketing recreation (Nav, Hero, Sections, BookingModal)
6. `ui_kits/member-portal/` — hi-fi member dashboard recreation (Sidebar, TopBar, Panels)
7. `preview/` — individual design-system preview cards (type, color, spacing, components)

Binding rules (from the wordmark brief, extended to the full system):
- No emoji anywhere. No exclamation points outside direct quotes.
- No gradients on brand surfaces. No drop shadows on the wordmark. No script fonts.
- Forest Green `#006039` and Antique Gold `#A37E2C` are the only brand colors. Ivory `#F5F0E8` is the canvas. Deep Charcoal `#1A1A1A` is the ink.
- Display/editorial type is Playfair Display; UI is Inter; pull quotes use Cormorant Garamond italic.
- Icons are Lucide at 1.5px stroke. Never fill. Stroke color is charcoal or forest.
- Voice: evidence-based, medically adjacent, restrained. "Rolex meets Mayo Clinic." Never "journey," "unlock," "level up," or "transform."

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out of `assets/` and create static HTML files for the user to view. Link `colors_and_type.css` for tokens. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (who is it for, marketing or product surface, is it a single piece or a set, etc.), and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

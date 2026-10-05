# Illustrated Guide release verification

2026-10-05

- All 43 original article URLs have complete replacement lessons. Three new chapters cover AC/DC coupling, storage certification and flexible loads/EV charging, for 46 articles total (40 guides and six dated briefings).
- Original chapters contain roughly 55,000 teaching words; the new chapters bring the reference to roughly 58,000 words. Guides contain detailed explanations, comparison tables, worked examples and explained exercises. Source URLs and labels are excluded from teaching-word estimates.
- 60 figure placements use 15 original SVG illustrations. The generator is committed alongside the artwork. Photographic examples reuse four sourced catalog products and explicitly distinguish pictured models from lesson calculations.
- Research ledgers record manufacturer/public-agency/research sources and evidence boundaries. Trina's 440 W STC/NOCT table was visually verified against page 2 of its specific regional datasheet, independently checked, and protected by a regression assertion.
- Independent review identified caption/diagram mismatches; corrected captions and a new module-level conversion figure resolve the finding.
- 151 repository tests passed; TypeScript and the final production build passed.
- All 46 article routes returned HTTP 200 with chapter headings, figures and answer disclosure. Representative desktop/mobile tests verified section anchors, a readable STC/NOCT table without page overflow at 390 px, exercise disclosure, lazy-loaded diagram/catalog photographs and article-to-calculator context.
- Reader bodies remain on the server. Client chapter navigation and library receive compact metadata; figures load lazily. The expanded reference is not shipped as a complete article-body client bundle.

Publication uses the exact final build artifact. Deployment identity is recorded by the Sites tools rather than predicted in this document.

# PVPartPicker contributor instructions

Read `site/docs/design-system.md` before changing any user interface. The user approved **Night Inventory (Design 1)** on 2026-10-05. Its reference image is `site/docs/design-system/night-inventory-reference.png`.

- Home (`/`) now uses the owner-approved minimal circular-button layout; see `site/docs/design-system/circular-home-reference.png`. Preserve its simple header and open space. The owner also approved Tier Lists/Watch List shortcuts and the automatic latest-price-drop strip. Preserve pause controls and reduced-motion support.
- On inner pages, keep the shared left navigation, compact comparison tables, small product photographs, restrained blue controls, and persistent day/night toggle. Avoid decorative heroes, gradients, game HUDs, large category graphics, and unnecessary cards.
- Use semantic tokens from `site/app/theme.css`. New routes must work in **both** themes and at mobile widths. Do not introduce hardcoded page colors or a separate page theme. White product-image mats and original educational diagrams are documented exceptions.
- The root layout and PVProvider own the application shell and theme startup. Reuse them. See the design document for components, spacing, and interaction rules.
- Retain real catalog data, source attribution, uncertainty labels, price freshness, pack-aware costs, accessibility, and current application behavior. The mockup's example products and prices are not data sources.
- Follow existing feature tests. Validate meaningful behavior with `npm.cmd test` and `npm.cmd run typecheck` from `site/`, then build and inspect affected routes in the browser. Check both day/night themes and mobile. A passing build alone is not visual verification.
- Keep a reviewable visual QA record when making broad UI changes. `design-qa.md` records this theme's acceptance checks.
- Use the repository-root Git checkout, not the nested `site/.git`. Respect existing user edits and running servers. The user's standing delivery preference is to commit features to `FahadArfin/pvpartpicker` and publish the validated version to the existing Sites project; do not claim publication before terminal deployment success.

Implementation lives in `site/`. The `output/` directory contains local preview/release artifacts and is not the canonical source.

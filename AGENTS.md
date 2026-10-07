# PVPartPicker contributor instructions

Read `site/docs/design-system.md` before changing any user interface. The user approved **Night Inventory (Design 1)** on 2026-10-05. Its reference image is `site/docs/design-system/night-inventory-reference.png`.

- Home (`/`) now uses the owner-approved minimal circular-button layout; see `site/docs/design-system/circular-home-reference.png`. Preserve its simple header and open space. The owner also approved Tier Lists/Watch List shortcuts and the automatic latest-price-drop strip. Preserve pause controls and reduced-motion support.
- On inner pages, use the shared compact horizontal header (owner revision, October 6, 2026). Show the horizontal product-category row only on `/parts`; do not restore a permanent left navigation or repeat categories on unrelated pages. Keep compact comparison tables, small product photographs, restrained blue controls, and the persistent day/night toggle. Avoid decorative heroes, gradients, game HUDs, large category graphics, and unnecessary cards.
- Use semantic tokens from `site/app/theme.css`. New routes must work in **both** themes and at mobile widths. Do not introduce hardcoded page colors or a separate page theme. White product-image mats and original educational diagrams are documented exceptions.
- The root layout and PVProvider own the application shell and theme startup. Reuse them. See the design document for components, spacing, and interaction rules.
- Internal page links must use `SiteLink`, which uses the statically imported router and bounded intent prefetch. Keep external, auth, account/admin and download links native. The current vinext beta's `next/link` dynamic navigation import fails in production; verify the built Worker before changing this workaround. Preserve catalog expiry and shared request coalescing. See `site/docs/navigation-performance.md`.
- Retain real catalog data, source attribution, uncertainty labels, price freshness, pack-aware costs, accessibility, and current application behavior. The mockup's example products and prices are not data sources.
- Follow existing feature tests. Validate meaningful behavior with `npm.cmd test` and `npm.cmd run typecheck` from `site/`, then build and inspect affected routes in the browser. Check both day/night themes and mobile. A passing build alone is not visual verification.
- Keep a reviewable visual QA record when making broad UI changes. `design-qa.md` records this theme's acceptance checks.
- Use the repository-root Git checkout, not the nested `site/.git`. Respect existing user edits and running servers. The user's standing delivery preference is to commit features to `FahadArfin/pvpartpicker` and publish the validated version to the existing Sites project; do not claim publication before terminal deployment success.

The owner rejected floating bottom section shortcuts on October 6, 2026. Keep Home shortcuts in the page content and inner-page navigation in the header/Menu; do not reintroduce the floating dock.

Implementation lives in `site/`. The `output/` directory contains local preview/release artifacts and is not the canonical source.

Browser-agent integration uses native `document.modelContext` WebMCP. Read `site/docs/webmcp.md` when extending it. Preserve closed schemas, current-state getters, owned abort cleanup, same UI/API permissions, saved-build identity, deadline-aware catalog reuse and opt-in private analytics. Do not expose scraper/admin/publish/purchase operations as agent shortcuts.

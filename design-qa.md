# Night Inventory implementation QA

Result: **passed** for the implemented theme, public routes, and tested interactions. October 5, 2026, local time.

## Comparison evidence

- Approved target: `site/docs/design-system/night-inventory-reference.png` (the first displayed image from the latest design set).
- Final desktop night: `site/docs/design-system/catalog-night.png`.
- Final desktop day: `site/docs/design-system/catalog-day.png`.
- Final phone night: `site/docs/design-system/catalog-mobile.png`.
- Desktop comparison viewport: 1488 × 1056. Phone: 390 × 844.
- Target and final night screenshot were loaded together in one image-comparison tool call and visually inspected. The day screenshot and phone screenshots were also opened and inspected.
- Browser: Codex in-app browser, compiled Worker preview at `http://127.0.0.1:5190` using the existing local catalog database.
- Final desktop state: batteries, EG4 manufacturer filter, preview closed, first row inspected, existing local draft retained. Phone state: all batteries, drawer closed. Separate drawer-open check verified all navigation links remain reachable by scrolling.

The shared left rail, charcoal surfaces, blue actions, selected-row edge, small real product photographs, dense specification columns, and build tray match the approved direction. Intentional differences: the real application keeps every existing category, ecosystem controls, condition/refinement controls, comparison and preview actions, source/freshness information, and real catalog specs. These need more toolbar space than the simplified mockup. Product names, images, quantities, prices and specifications are actual local catalog data, not the generated image's illustrative values. White image mats preserve legibility of retailer photos.

## Findings and fixes

1. Old product-image padding collapsed the new row thumbnails. Removed thumbnail padding; verified loaded image dimensions and rendered photographs.
2. Search occupied a separate full-width row. Moved it beside the title on desktop and reduced filter spacing. Phone search remains full width.
3. Review found missing mobile-dialog focus restoration. Added an explicit trigger ref; Escape returns focus to Open navigation. Full filters also restores focus to All filters.
4. Review found low-contrast focus rings and skip-link background after token migration. Changed focus-specific borders/outlines to the accent token and skip-link background to the solid action token.
5. Selected-filter hover inherited white text on a light accent. Added an explicit surface/text hover rule with an accent underline.
6. Print theme variables lost on specificity. Updated the print override to `html[data-theme]`.
7. Night-theme rail-width specificity prevented the mobile breakpoint from removing its gutter. Moved the responsive variable to a standalone `:root` declaration. Rechecked day and night at 390px: main left edge 0 and no document-level horizontal overflow.

Focused independent code review rechecked all reported fixes and returned no pending findings.

## Runtime and route checks

- Catalog: manufacturer and format filtering, row photo display, quantity 0 → 1 → 0, advanced filters, mobile navigation, selected state, current build tray. Test quantity changes were reversed.
- Theme: toggles both ways, survives reload and full navigation, synchronizes an already-open second tab. Bootstrap tests cover missing/invalid preference and denied local storage.
- Desktop day and night: catalog, system builder, guide article, calculators, product specifications, tiers, deals, watch list, community, compare, account, admin and price-scraper entry screens.
- Phone: catalog both themes; builder, guide, tiers and product details day mode; no document-level horizontal overflow on these checks.
- Chart: voltage-drop calculator curves, legend and axis labels inspected in night mode. Guide diagrams retain their authored content palette.
- Keyboard: mobile menu Escape/focus return, filter dialog Escape/focus return, visible conductor-checkbox focus.
- Sampled visible text contrast on the tested desktop states produced no sub-4.5:1 findings in a DOM color check (disabled controls excluded). This is a targeted check, not a full accessibility certification.
- Browser console: no errors in the final catalog check.
- Validation: 195 tests passed; TypeScript check passed; production Worker build passed; `git diff --check` passed.

## Verification boundary

Account, admin and scraper were visually checked in their signed-out states. Their shared CSS and scraper-specific styles were migrated, but an authenticated owner session and scraping jobs were not exercised for this theme change. No live price collection, authentication, publishing of community builds, electrical calculations, or source-data backfill behavior was changed. Existing local stale/unknown catalog values were left intact.

The design contract and reference are documented in `site/docs/design-system.md` and required by root `AGENTS.md` for future UI work.

## Day/night switch refinement — October 5, 2026

- Replaced the action-style theme button with a labeled Radix sliding switch: Day/sun on the left, Night/moon on the right. Its accessible name remains "Night mode" and checked means night. Mobile retains both icons.
- Softened day mode throughout the shared shell with warm off-white surfaces, softer boundaries, charcoal text and muted blue actions. The approved night palette is retained.
- Inspected the compiled catalog at desktop and 390 × 844 in both modes, plus the Guide in day mode. Verified click and Space input, visible keyboard focus, reload and navigation persistence, thumb containment and no mobile horizontal overflow. Browser error log was empty.
- Corrected a conflicting thumb translation from the generic switch utility styles by using the same Radix primitive directly with theme-specific styling.
- Measured day token contrast: primary text/surface 9.77:1; muted text/canvas 5.11:1; muted text/raised surface 4.62:1; muted text/rail 4.66:1; accent/selected surface 4.85:1; white/action 5.89:1. This is a targeted palette check, not a full accessibility audit.
- Validation: 195 existing tests passed, TypeScript passed, production Worker build passed. [Final day preview](site/docs/design-system/catalog-soft-day.png).

## Home and build collections — October 5, 2026

- Added a compact home page with Browse Parts, Price Drops and View Builds; category shortcuts, planning resources and a current-draft link use the shared day/night theme. The home page does not request the product catalog.
- Moved the catalog to /parts. Regression tests cover root catalog bookmarks retaining encoded searches, filters and builder context. Updated internal category, ecosystem, builder and empty-state links.
- Added /builds with Saved builds and Community builds collections. Saved builds reuse the existing guarded open action, and device builds remain available if account retrieval fails. Community content reuses the existing workspace.
- Browser checks: all three home actions, legacy filtered builder redirect, saved device build reopening in System Builder, saved-build search/clear, community empty state, desktop and 390px phone home in both themes. Home and saved collections had no document-level phone overflow. Authenticated account retrieval was not exercised in the signed-out QA session.
- Validation: 197 tests passed, TypeScript and final production Worker build passed. [Home preview](site/docs/design-system/home-night.png).

## Home composition refinement — October 5, 2026

- Replaced the three equal action cards with an introduction, cross-category search and a compact current-draft workbench. Browse Parts, Price Drops and View Builds remain grouped near the top.
- Added four small representative catalog photos, links to every other equipment category, a guide feature and focused calculator/watch-list links. Photos carry example-model titles; no live prices, fabricated statistics or catalog-loading dependency were added. Images have fixed dimensions, lazy loading and an icon fallback.
- Scoped the new layout in app/home.css; preserved shared theme tokens and saved-build page styling. Updated the design contract for future work.
- Browser verification: desktop and 390px home layouts in both themes; no horizontal overflow; all four equipment photos loaded; search for EG4 6000XP opened /parts with category=all and the requested query; browser error log empty. Inspected the complete desktop composition. [Final night preview](site/docs/design-system/home-refined-night.png).
- Validation: 197 tests, TypeScript and final production Worker build passed.


## Circular home implementation — October 6, 2026

- Source visual truth: `site/docs/design-system/circular-home-reference.png` (1487×1058).
- Implementation: `site/docs/design-system/circular-home-day.png` (1487×1058), `circular-home-mobile.png` (390×844). CSS viewport equals image pixels (1× density); both full views inspected. Source and desktop implementation were opened together in the same comparison input. Focused region comparison was unnecessary for this sparse layout; heading, search, circles, header and footer are all legible at full size.
- State: anonymous home, day; phone inspected in both themes. Live draft unchanged.
- Typography: existing Inter/system sans stack retained; OS fallback is slightly narrower than generated lettering. Hierarchy, copy, line lengths and button labels match the intended composition.
- Layout: centered search and labeled circular shortcuts, minimal header/footer, no sidebar on Home. Phones retain all three shortcuts in one row, with 76px circles and no document overflow.
- Tokens: shared warm day/navy night palette intentionally retained; blue is more muted than mock art to match approved low-glare palette. Toggle correctly shows day unchecked and night checked, unlike the generated reference.
- Assets: no raster illustration needed. Existing Lucide SolarPanel, Tag, FolderClosed and Grid2X2 provide sharp library icons rather than approximated artwork. SolarPanel differs slightly from the generated glyph.
- Interaction evidence: search submitted EG4 6000XP to `/parts?category=all&q=EG4+6000XP`; inner navigation restored. View Builds opened the saved/community collection with existing device draft. Theme persisted across full-page navigation. Links for Parts, Price Drops, Builds and Guide have correct destinations. Browser error log empty after search/build checks.
- Comparison history: first full-view comparison found no actionable P0/P1/P2 differences. No visual repair iteration required. P3: exact generated letterforms and decorative sun accent are not reproduced; existing type/icon assets are deliberate shared-system choices.
- Validation: 197 tests passed, TypeScript passed, production Worker build passed. The generic Sites build wrapper could not resolve its npm binary on Windows; the repository's `npm.cmd run build` succeeded on the same source.
- Sales-strip concept is a separate, unimplemented reference with illustrative prices.
- final result: passed


## Five home shortcuts and automatic price drops — October 6, 2026

- User approved the sales-strip concept and Tier Lists/Watch List additions. The simple hero and shared theme tokens remain intact.
- Evidence: `site/docs/design-system/home-deals-live-data.png` shows the actual local empty-history state. `home-deals-qa-day.png` and `home-deals-qa-mobile.png` use an isolated localhost-only fixture feed with explicit QA names to test populated behavior; they are not real offers. No fixture code or data is part of the deployed app.
- Desktop 1487×1058 and phone 390×844 inspected, with day/night modes. All five shortcuts readable; phone wraps 3+2 with no document horizontal overflow. Populated entries preserve product, retailer, unit prices, pack purchase cost and checked date; manual controls stay reachable.
- Automatic motion observed at 449px then 898px; Pause retained 898px across more than one interval, Next advanced to 1347px. Reduced-motion emulation hides automatic-play control and retains manual navigation. Browser errors: none.
- Actual API returned no verified recent drops; honest empty state shown. Home does not load the page catalog; bounded feed adds only 12 enriched, distinct products at most. Stale and out-of-stock offers continue to be excluded by existing drop eligibility.
- 200 tests passed (including feed size/dedup/order, pack semantics, empty ineligible offers, and carousel wrap/bounds); TypeScript and production Worker build passed.
- Existing font/icon/token choices retained. No new image artwork, fonts, libraries or oversized card panels. No P0/P1/P2 visual findings. Runtime failure messaging and hover/focus/hidden-tab pause were inspected in code; reduced-motion, auto-play, explicit pause and manual motion were browser-checked.
- final result: passed

## Slim home deals ticker — October 6, 2026

- Replaced the separate latest-price-drops section with a single compact row along the bottom of Home. No visible heading, divider, or card panel. Five circular shortcuts remain unchanged.
- Continuous motion runs at 22 pixels/second and wraps seamlessly. Tiny Pause/Play and All deals controls remain available. Keyboard focus, hover, hidden tabs, manual pointer interaction and reduced-motion settings stop automatic movement.
- Browser QA: 1487×1058 desktop and 390×844 mobile in day/night themes; no document horizontal overflow. Motion advanced from 269px to 290px, then explicit Pause held at 291px across checks. Reduced motion retained position 0, removed visual duplicate content, and hid automatic-play controls. Duplicate links are excluded from the accessibility tree and tab order. Browser error log empty.
- Screenshots: home-ticker-qa-day.png and home-ticker-qa-mobile.png contain explicitly labelled localhost QA fixtures, not real offers. They verify the populated layout and whole-package pricing. Production data remains unchanged; when no eligible drops exist, a short status line is shown.
- Validation: 200 tests passed, TypeScript passed, production Worker build passed, git diff whitespace check passed. Tests cover frame-rate independence, seamless wrap, zero-width and elapsed-time bounds alongside existing feed tests.
- final result: passed


## Horizontal navigation revision - October 6, 2026

Owner requested reclaiming the persistent site rail and limiting categories to Parts. Inner pages now use a full-width brand/tools row and horizontal primary navigation. Parts alone includes a separate horizontal category row. Home keeps its approved circular shortcuts; Guide keeps its contextual table of contents.

Validated the production Worker locally: Guide in night/day, Parts with 12 categories and 36 loaded rows, Batteries category selection, builder-context category URLs and destination, System Builder, Watch list, and 390px/320px phone widths. The narrow header was tightened after discovering 8px overflow; final 320px viewport has a 305px document/client width with no page overflow. Navigation rows scroll independently and reveal active links on route/category changes and resize. Build/watch counts, theme toggle, account/scraper access and full-width catalog tray remain available. No catalog values or saved data changed.

205 existing tests passed; final typecheck and Worker build passed. Visual evidence: `output/horizontal-navigation/guide-night.png` and `guide-phone.png` (local untracked QA artifacts).


## Builds landing - October 6, 2026

`/builds` now presents the owner-requested Start Your Build, Open Saved Builds, and Popular Builds actions. Existing builder is at `/build`, saved collections at `/builds/saved`, and the community collection at `/builds/community`. Home and primary navigation use the Builds label. Old collection query URLs redirect. Landing navigation preserves drafts and makes no catalog request. Popular Builds uses real community submissions; no popularity scores are invented.

Verified production Worker locally in both themes, desktop and 390px/320px widths: all three destinations, reopening the existing saved audit draft, legacy community bookmark redirect, community empty state without errors, and no horizontal document overflow. Existing 205 tests, typecheck and Worker build passed. Preview files are under `output/builds-landing/`.

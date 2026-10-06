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

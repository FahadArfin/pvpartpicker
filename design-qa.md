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

## Builder choose actions - October 6, 2026

Owner requested PCPartPicker-style Component and Selection columns with highlighted pick actions on the left. Each category now appears once, with its blue Choose/Add another action beside it at the start of Selection. Selected products retain quantity, retailer, cost and removal controls. The shared design guide records this arrangement for future changes.

Local production Worker QA covered an empty build, two products grouped under Solar panels, choosing a part and returning to the build, adding another part, quantity increase and retailer selection. The existing audit draft remained intact; a product without a current offer continued to show its honest price status. Desktop night/day, 800px tablet, 390px phone and 320px bounds were checked. A pre-existing direction-control overflow at 320px was corrected; final client/document widths both measured 305px. Browser error logs were empty. Local screenshots under `output/builder-left-choose/` may include the isolated local retailer QA label; production catalog data was not changed.

205 tests and typecheck passed. The final production Worker build and whitespace check passed after the narrow-screen CSS repair.

## Build price history - October 6, 2026

The current equipment list now has a stacked purchase-cost history below its subtotal. A colored legend names every part and quantity, with 30/90/365-day controls, dated totals/period low/high, tooltip breakdowns and an on-demand daily coverage table. Chart bands use explicit lower/upper values so missing checkpoints break the entire tracked subtotal rather than turning unpriced equipment into zero cost. Missing products remain identified in the legend. The selected quantities and retailer choices apply throughout the period; this is not a history of past draft configurations.

One bounded public read request queries the latest daily check per currently eligible offer. Prices include whole-package minimums; selected offers never silently switch. Later unavailability, stale checks, incompatible pack sizes, non-USD prices and future observations cannot qualify. Snapshot checks are dated at their actual observation time. The chart begins at the first shared checkpoint in the selected window and retains subsequent gaps. Shipping/tax remain excluded.

Browser QA on the final production Worker: real local observations for two existing products, both themes, 390px/320px phone widths with no document overflow, 30-day/90-day/year controls, tooltip breakdown, quantity change from 2 to 3 updating the total from $302.97 to $385.96, and restoration to 2. Clear/Undo verified the empty state and preserved the existing QA draft. The daily table had zero rows before opening and 30 after opening. No history request/chart chunk was loaded before the section approached the viewport; the subsequent request covered both parts. Browser error logs were empty. Local screenshots under `output/build-price-history/` contain the existing isolated local retailer QA label, not new production offers.

211 tests passed, including history purchase math, selected-offer isolation, missing/stale/ineligible data, request bounds, real SQLite daily query behavior, and stacked-band gaps. Final TypeScript, production Worker build and whitespace checks passed. No catalog, scraper schedule or production observation data was modified.

## Visual system connections - October 6, 2026

The builder now shows Panel strings → Inverter/MPPT input → Battery voltage, with real product thumbnails, explicit receiver-unit/tracker assignments, schematic strings, an automatic recorded-limit sizing candidate, allocation counts and free/used input slots. Each node gives useful numbers; a disclosure shows STC/cold/hot voltage, operating and short-circuit currents, source limits, direct input counts and power planning. The 70°C maximum cell temperature is labelled as an assumption; minimum site temperature must be entered. Missing coefficients, operating envelopes and exact battery approval stay unverified. Existing installation notes remain below the map. Saved builds, reopened/shared copies and device drafts preserve assignments through bounded validation.

A small public selected-product electrical-evidence request avoids putting full datasheets back into the fast catalog summary. Quantities/string edits reuse the same two-minute cache. The observed request for three real products transferred 1,121 bytes in local browser QA; no fabricated electrical ratings or observations were inserted. Manufacturer sheet evidence was added for the exact EG4 18kPV, 6000XP and LifePower4 V2 models; the 6000XP input ceiling was corrected from the stale 500 V catalog value to the current manufacturer sheet's 480 V.

Final built-Worker browser QA used 16 actual Renogy RSP100DC panels, one EG4 18kPV and two LifePower4 V2 batteries. Auto-size returned 16S × 1P. A manual 8S × 2P arrangement produced 198.91 V cold Voc, 159.76 V STC Vmp, 10.02 A Imp and 10.62 A Isc. MPPT 1 displayed 25/31 A limits; moving to MPPT 2 displayed 15/19 A and flagged its single direct input. The top compatibility strip reflected that mismatch. A 1.5-series edit remained unverified with a stable accessible label/error description. Reload retained assignments. Clear removed the connections and Undo restored them. Input usage correctly identified MPPT 1 assigned and MPPTs 2/3 free. Both themes and 390/320px widths passed; document width equalled client width (375/305px with scrollbars). Product thumbnails render at 28px within 36px mats after overriding legacy image padding. Browser error logs were empty. Screenshots: `output/connection-map/`.

222 tests passed, including per-tracker arithmetic, cold overvoltage, missing/listing evidence, duplicate inputs, allocation bounds, chemistry-specific battery ranges, selected-product transport and independent saved-build copies. Final typecheck, production Worker build and whitespace checks passed. This is a planning map; startup, irradiance/bifacial factors, wire/protection design, battery current/communications and manufacturer approval remain installation-specific checks.

## Phone usability review — 2026-10-06

- [Full review and screenshots](site/docs/mobile-review/review.md); width measurements in `site/docs/mobile-review/width-checks.json`.
- Built Worker at 127.0.0.1:5190. 320x740 / 390x844 portrait in day and night; measured scrollWidth equals clientWidth on Home, Parts, product detail, Builds, saved/community collections, Deals, populated Watch list, two-product Compare, Guide, calculators, Account and Price scraper access pages. Builder checked separately with a populated real-product draft and 8S2P connection map. No page-level overflow; data tables intentionally scroll locally.
- Navigation dialog: all eight sections + account/scraper reachable, Escape closes and restores menu-trigger focus; Guide link navigates; desktop at 1440x900 retains its original horizontal nav and dense comparison table.
- Filter dialog: categories collapsed, independent scroll body, persistent Show products footer. Bifacial filter reduced 172 to 62 local results; close restored All filters focus. 667x375 landscape dialog and action remained within the viewport.
- Builder pick + returned to /build with quantity 16 -> 17 and the same assignment/settings. Phone quantity controls and forms remain editable; cold Voc198.91V, Vmp159.76V, Imp10.02A on 8S2P example.
- Calculator dropdown exposes nine tools. Edited voltage24V retained after switching to battery and back. Phone forms inspected at16px and >=44px. Existing responsive charts and table regions retained.
- Tier photo captions visible at320px; product detail photo190px; watch sign-in label/arrow grouped. Main catalog/compare controls do not overlap: compare bar64px, tray above it66px at320px.
- Day and night screenshots inspected, transient loading/crossfade shots replaced. Browser error logs empty. Test local draft/watch/compare/theme storage restored exactly.
- 222 tests passed, TypeScript and production Worker build passed. Physical Android/iOS, screen-reader certification and owner/account authenticated interactions were not tested. All screenshot claims are viewport/browser evidence.
# Retailer coverage and historical prices — October 6, 2026

- Product history offers 30/90/365 days and All history without hiding the chart behind a tab.
- Built Worker: `/api/history?productId=eg4-6000xp&days=0` returned real observations; unauthenticated `/api/history-import` returned 401.
- Browser checked All history selected, rendered chart and readable controls in Night mode and Day mode at 390 × 844. No document-wide horizontal overflow; the retailer table retains its intentional internal scroll.
- Archived observations show day precision, source attribution and unknown stock; current offers remain unchanged. SQLite tests verify replay deduplication and rejected mismatched packages, dates and source metadata.
- SQLite dashboard checks assert 39 source seeds, 30 enabled defaults, nine paused review sources, and preservation of owner edits.

# Builds banner navigation — October 6, 2026

- My Build is nested under Builds in the shared header, alongside Saved Builds and Popular Builds; the primary row has seven sections. Removed the duplicate collection tabs from the saved/community page body.
- Built Worker at 127.0.0.1:5191: Builds landing → My Build → Saved Builds → Popular Builds links were exercised. Builds remains selected in the main row, with the current child underlined in the banner. Guide has no Builds banner.
- Day desktop and Night phone layouts inspected. At the phone viewport (375 CSS pixels), document scrollWidth equals clientWidth; the three banner links remain reachable. Mobile Menu groups all three child links beneath Builds, navigation closes the dialog, and Escape returns focus to its trigger.
- Existing tests, typecheck and production build passed. Account-authenticated saved builds and community backend functionality are unchanged and were not part of this navigation check.

# Sales alongside price drops — October 6, 2026

- `/deals` defaults to Sales, with Price drops retaining Daily/Weekly/Monthly/Latest. Existing query links initialize the recorded-drop view; returning through the header restores default Sales.
- Built Worker inspected in the browser: view switching, query reset, day/night and 390 × 844 phone layout. Phone document width and scrollWidth both 375 CSS pixels. Local old offers correctly produce an empty Sales state; populated production rows must be verified after publication.
- Tests verify retailer reference comparisons without invented observations, per-unit/full-package costs, median daily history with at least seven days, repeated checks, even samples, archive/stock/pack exclusions, tracked-basis precedence and immediate invalidation of stale/changed offers. WooCommerce regular prices retain correct currency units.
- Review found and resolved catalog-refresh and same-route query-state issues. Production API counts and populated-row screenshots are release evidence in ignored `output/`; authenticated account writes are unchanged.

# UI/UX audit implementation - October 8, 2026

- All 22 approved findings mapped to five implementation groups in `site/docs/ux-improvements-plan.md`. Preserve existing theme, source attribution, package identity and shared navigation/catalog behavior.
- Production Worker preview on port 5199; mobile 390x844 and desktop 1440x1000, day and night themes. Screenshots in `output/ux-audit-2026-10-08/after/`; independent review in the same audit folder. No remaining important source-review blockers.
- Parts: compact mobile filters, visible Watch/Compare labels and full package purchase cost. Comparison exposes sourced specifications and a two-product phone selector while retaining up to four selections.
- Builder: empty neutral planning status, compact Save/Saved/More actions, collapsed phone direction controls, analytics prerequisites. Selecting a 100W panel returned to the exact selected row with keyboard focus and the next inverter category.
- Product: smaller summary image, bundle contents up front, buying options collapsed until requested; unknown component ratings remain explicit. Verified unit versus four bundle options on the Pecron F3000 listing. Sparse specification groups are collapsed; price history reports actual coverage.
- Watch: same-model packages expand under one heading, stale local offers label Last seen, guest alerts show sign-in requirements. Tiers start with no inspector; phone dialog closes and returns focus to the chosen model.
- Guide: phone Contents dialog, chapter/section navigation, section jump closes dialog and focuses its section; saved reading position survives reload and Resume works. Calculator copies a real 100W build as 0.1kW and requires location instead of inventing it.
- Wire calculator: changing 6 AWG to 4 AWG and calculating changed drop from 1.18V/2.45% to 0.74V/1.54% at 48V, 30A and 40ft one-way. Result, plot and table share applied conductor assumptions; percentage view is default.
- Local database has old offers, so local empty-sales and no-fresh-price states were expected. Real production data coverage must be checked after deployment. Authenticated saved-build/alert delivery and physical iOS/Android devices were not tested; underlying account/collector behavior is unchanged.
- Full test suite 321/321 passed, TypeScript passed, production Worker build passed. Initial rebuild hit a Windows file lock from the owned preview server; stopped that server, rebuilt successfully and restarted only the owned preview.
- Read-only scraper checks: collector 37737035360 succeeded and backfill 37739363761 in progress. No schedules, collector endpoints, queue, data, scripts or migrations changed.

- Release: PR #31 merged as ff962352682039fe279937d51473ed0555ec74f2; both GitHub CI checks passed. Sites version 65 deployment appgdep_6ac73ec21af88191a8fa490361524011 succeeded at 06:57 UTC. Eleven live routes returned HTTP 200 and all 69 served JS/CSS asset hashes matched the validated local artifact.
- Live Deals showed 1,988 sale offers. Solar panels plus a $100 purchase budget reduced results to 9. Phone document/client widths both 375px; the navigation and filter controls remain within viewport. Screenshots are in the audit after/ folder (capture helper appends .png).
- Backfill remained unpaused after deployment: 530 checked, 3,404 remaining at 06:57 UTC, active run 37739363761. These are queue progress counts, not successful imported-product counts; identity mismatches continue to be recorded and skipped by the unchanged backfill.

# Softer day palette - October 8, 2026

- Shared light tokens now use warm stone canvas, parchment panels, sage-gray secondary surfaces and muted blue controls. Night tokens and authored image/diagram colors are unchanged. Future-page guidance updated in design-system.md.
- Primary, muted and link text tested against all five day surfaces: minimum 4.70:1; white filled-button text also exceeds 4.5:1.
- Built Worker Home inspected at desktop width; Guide inspected at 390x844 in both day and night. Mobile document/client width both 375px. Toggle changes palette correctly. Screenshot: output/day-home.png.
- 321 tests passed; typecheck and final production build passed. No scraper, data, workflow or runtime changes.

## Soft Slate day theme - October 8, 2026

Owner approved the generated Soft Slate preview. Replaced the rejected warm stone/sage day tokens with cool blue-gray canvas, lighter slate panels, charcoal text and blue actions. Shared layout and night tokens retained.

Validation: 321 tests passed, typecheck and production build passed. Browser inspected Home, Parts and Builder at 1280px and Guide at 375px in day/night. Local preview has no hosted deals feed (503); empty/error handling remains visible. Screenshots: output/slate-home.png, output/slate-parts.png, output/slate-build.png, output/slate-guide-mobile.png and output/slate-guide-night.png. No scraper, scheduling or data changes.

## Deals thumbnails - October 8, 2026

Fixed inherited card-image padding consuming the entire 44px thumbnail width. Live diagnosis confirmed loaded 800px/1024px source photos rendered at zero width. Deals now use 4px padding (36px image content) with a bounded missing-image fallback. Retailer sales and recorded drops share this thumbnail styling.

321 tests, typecheck and production build passed. Verified correction against actual live sale photos using a temporary browser style override at desktop and 375px mobile in both themes; screenshots output/deal-images-after-desktop.png and output/deal-images-mobile-detail.png. Post-publication check verifies the built CSS without the override.

## Populated example builds - October 9, 2026

Replaced square Builds landing actions with compact circular shortcuts and the empty planning templates with three editorial example equipment lists. Each shows real catalog product photos, quantities, specification summaries, package-aware fresh-price subtotals, expandable selected parts, source links and site-specific exclusions. Open a copy uses the existing draft-confirmation/save flow and preserves quantities and offer selections. Missing products block copying; stale/out-of-stock prices are excluded. The public example endpoint returns only six selected catalog products, not the whole catalog, and never writes scraper data.

Validation: 326 tests passed; typecheck and production build passed. Browser QA on the built Worker used the actual public catalog snapshot as an explicitly routed fixture: desktop night/day and 375px mobile, filter/details interaction, copying cabin quantities 8/1/2, and canceling a switch without changing the draft all passed. Screenshots: output/examples-night-loaded.png, output/examples-day.png, output/examples-mobile.png. Final live endpoint/asset checks follow deployment. Reviewed manufacturer references are linked in each example; these are core equipment examples, not complete permitted installation designs.

## Compact Builds pills - October 8, 2026

Removed the repeated visible Builds heading and intro while retaining an accessible h1. Enclosed each Current/Saved/Community shortcut icon and label in a single rounded pill matching the owner's sketch. Browser checked the built Worker in night desktop and day mobile (375px): all three links fit without overflow, retain correct destinations and have 48px touch targets. Screenshots output/pills-night.png and output/pills-mobile.png. All 326 tests, typecheck and production build passed.

## Example build readability refinement
- Enlarged labeled capacity metrics, named equipment photos, clear subtotal and Customize this build action; preserved open rows and shared tokens.
- Built Worker reviewed at 1365px in day/night and at 375px/320px; no horizontal overflow. All seven product images loaded. Screenshots: output/examples-refresh-day.png, output/examples-refresh-night.png, output/examples-refresh-mobile.png.
- Off-grid filter and expanded contents checked. Copy retained panel/inverter/battery quantities 8/1/2; cancelling a switch preserved the current draft. QA uses the captured real catalog fixture because the local database lacks newer products.
- 326 tests passed; typecheck and build passed.

## Build subsection circular icons
- Verified Current, Saved and Community navigation on built Worker; active Saved icon, labeled links, preserved landing pills and no duplicate row.
- Reviewed night desktop and day 375px screenshots: output/build-icons-night.png and output/build-icons-mobile.png. Phone targets are 44px and no overflow. Local community API returned its existing unavailable state; navigation still worked.
- 326 tests, typecheck and build passed.

## Named build pills correction
- Restored visible names beside the circular icons across Current, Saved and Community subsections; retained active icon styling and landing pills.
- Checked night desktop and day 320px phone navigation, all destinations and visible labels. Final phone spacing accommodates Community builds. Screenshots: output/named-icons-night.png and output/named-icons-mobile.png.
- 326 tests, typecheck and final build passed.

## Builds landing alignment
- Moved landing shortcuts into the shared top-left build banner; removed duplicate local navigation and centered 1150px content constraint.
- Verified identical banner geometry on landing and Saved (x=0, y=100 at 1280px), one navigation row, day/night and phone without overflow. Screenshots output/build-align-night.png and output/build-align-mobile.png.
- 326 tests, typecheck and build passed.

## Remove repeated build introductions
- Removed landing intro/filter tabs, Saved heading/current-draft block and both Community introductions. Accessible headings and shared navigation retained.
- Built Worker reviewed in night desktop/day phone: output/build-trim-landing.png, output/build-trim-saved.png, output/build-trim-community.png. Confirmed search inputs remain usable and no overflow. Browser uses real catalog fixture and empty community fixture.
- 326 tests, typecheck and build passed.

## Compact rounded example build cards
- Eight populated examples: portable, off-grid, four hybrid options and two Enphase IQ8MC solar-only setups. Catalog IDs verified against the current public catalog; manufacturer manuals linked in expanded details. No scraper changes.
- Budget tiers use full fresh package-aware subtotals; unpriced examples are separate. System/budget combination, reset empty results and ascending price order checked.
- User-selected rounded cards show text when closed and photos only in expanded part lists. Reviewed desktop and 320px phone in both themes; no overflow. Screenshots output/compact-night.png and output/compact-mobile.png (theme reflects persisted browser selection).
- Enphase copy verified 16 panels, 16 microinverters and one combiner with gridtie purpose. 329 tests, typecheck and build passed. QA fixtures retain real public catalog prices; live API will be rechecked after publish.

## Compact vertical build contents
- Closed cards show each selected model and quantity on its own line, with tighter spacing. Expanded lists retain photos and pack-aware line prices, add a bottom total, and remove the requested Finish for your location and explanatory paragraphs. Transparent photo mats and translucent images are scoped to examples.
- Built Worker reviewed in both themes and at 320px: output/vertical-collapsed.png, output/vertical-expanded-night.png, output/vertical-expanded-day.png and output/vertical-mobile.png. No horizontal overflow; three Cabin line prices sum to the displayed $7,041.96. Real catalog fixture used locally.
- 329 tests passed; typecheck and build passed. Scraper and backfill code unchanged.

## Centered Builds landing
- Matches the existing header, Current build, Saved builds and Community builds: 1500px wide, x=505.5 at a 2511px viewport. Two desktop card columns, one on phones.
- Reviewed both themes and 320px phone, with no overflow: output/center-desktop.png, output/center-other-theme.png, output/center-mobile.png.
- 329 tests, typecheck and final build passed. Only presentation changed.

## Build filter pills
- Budget and System use the shared Deals category pill buttons with visible selected state, named groups and focus outlines. All ten options remain available; budget ranges remain visible.
- Built browser checks passed for budget/system combinations, empty-result reset, keyboard Tab/Enter and 320px wrapping without overflow. Reviewed both themes: output/pill-desktop.png, output/pill-other-theme.png, output/pill-mobile.png.
- 329 tests, typecheck and build passed; no scraper changes.

## Uniform build cards
- Eight collapsed cards measured 280px on desktop and 380px at 320px phone width. Bottom pricing/expansion controls align; expanded content grows without clipping and total matches resolved subtotal.
- Removed build-count/sort text and the budget paragraph above cards. Both themes visually reviewed; no phone overflow. Screenshots output/uniform-desktop.png, output/uniform-other-theme.png, output/uniform-mobile.png.
- 329 tests, typecheck and final build passed. Fixture offers retain freshness handling; older offers can be unpriced.

## Shared section icon pills
- Deals, Watch List, Tier Lists and Guide (including calculators) share the Builds circular-icon pill format. Watch fresh-only checkbox becomes two explicit view buttons using the same existing filter state.
- Built route checks verified icon counts, selected state and switching; 320px layouts have no horizontal overflow. Reviewed desktop and phone screenshots output/sections-* in alternating day/night themes. Local Deals and Watch use existing empty states; tier catalog photos may be unavailable locally.
- 334 tests, typecheck and production build passed. Existing catalog, pricing, saved watches, tier evidence and guide/calculator behavior retained; no scraper changes.

## October 9, 2026 — Compact Tier Lists, Watch List and Deals

- Removed the requested visible introductory copy and watch storage note. Page headings remain available to screen readers. Related-page links now sit beside section pills.
- Removed Tier Lists' fresh-only checkbox and coverage row, including its invisible filter state; all researched models remain available. Price eligibility rules are unchanged.
- Simplified How the tiers work to product ratings, price value and missing prices. Detailed thresholds, metrics, source limitations and research date remain in a second collapsed disclosure.
- Preserved recorded-drop period explanations, watch target alerts, category/filter controls and price/source details. No scraper, workflow or backfill settings changed.
- Verification: 334 tests passed; typecheck and production build passed. Built Worker browser checks at 1440px and 320px in both themes passed for /tiers, /watchlist and /deals, with no horizontal overflow. Verified price-value/unpriced lane, watch view switch, sales/drop controls and detailed methodology disclosure.
- Screenshots: output/trim-{tiers,watchlist,deals}-{day,night}-{1440,320}.png; output/trim-tier-simple.png. Local catalog freshness is not production data proof.

## October 9 — Parts category pill navigation

- Parts-only header categories now use named rounded pills with circular icons and accent-selected state, matching the Builds/section controls.
- One horizontal scroll row, 60px desktop / 48px phone touch targets; selected category automatically stays visible. Existing SiteLink URLs and builder query handling retained.
- 334 tests, typecheck and production build passed. Browser checked all 12 icons, rounded shape, both themes at 1440px and 320px, no page overflow, navigation to Accessories and automatic active-link reveal. No category row on Builds. Screenshots output/part-pills-{day,night}-{1440,320}.png.

## October 9 — Wrapping Parts category pills

- Owner revision replaces the horizontal category scroll with wrapped rows. Phones use two columns and wrapping labels; the Parts header is non-sticky on phones to avoid covering products.
- 334 tests, typecheck and production build passed. Browser checked both themes at 1440px (two rows) and 320px (six rows), no horizontal category/page overflow, all 12 links unclipped with >=44px touch targets, and category selection navigation. Screenshots output/wrapped-pills-{day,night}-{1440,320}.png.

## October 9 — Compact expandable Parts category picker

- Smaller category pills behind a selected-category toggle, initially closed. Choosing a category closes the options. Removed duplicate visible category heading and Searching label; screen-reader heading, search-all control and builder context remain.
- 334 tests, typecheck and production build passed. Real browser checked both themes at 1440/320px, open/closed appearance, no horizontal overflow, 12 options, keyboard expansion, automatic collapse/selected-label update and preservation of builder=1 links. Screenshots output/picker-{day,night}-{1440,320}-{closed,open}.png.

## October 9 — Smooth category tray motion

- Category drawer uses a 240ms intrinsic-height transition and gentle opacity/chevron/pill feedback. Closed options are inert and hidden from assistive technology; reduced-motion settings suppress animation.
- 334 tests, typecheck and build passed. Browser checked animated expansion/collapse and inert state in both themes at 1440/320px, no page overflow, reduced-motion duration <=1ms, and category selection/automatic closure. Screenshots output/motion-{day,night}-{1440,320}.png.

## October 10 — Grouped solar-system category tray

- Approved grouped drawer: Generate (panels/mounting), Store (batteries/stations), Convert (inverters/controllers), Connect & control (wiring/module electronics/monitoring/electrical/bundles/accessories). Existing category names, icons and routes retained. Desktop groups use compact labeled rows; phone groups use two-column pills beneath headings.
- 334 tests, typecheck and production build passed. Built browser checks verified four headings, exactly 12 unique category links, no clipped links or horizontal overflow, >=44px targets, both themes at 1440/320px, inert collapsed content, automatic selection/closure, builder query retention and reduced motion. Screenshots output/tray-{day,night}-{1440,320}.png.

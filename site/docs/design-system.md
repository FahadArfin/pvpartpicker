# Night Inventory design system

Approved by the project owner on October 5, 2026: the first image from the latest three concepts, **Night Inventory**. This is the visual contract for new pages and future revisions. [Reference image](design-system/night-inventory-reference.png).

## Product character

A practical solar parts workbench inspired by the clarity of PCPartPicker. The pleasure comes from scanning useful specifications, comparing prices, and assembling a build quickly. Keep the design quiet, precise, and consistent. The user explicitly rejected heavy graphics and decorative game interfaces.

## Shared structure

- Owner revision, October 6, 2026: inner pages use a full-width compact header. Brand, scraper, account and theme occupy the first row; Home, Parts, Builds, Price drops, Watch list, Tier lists and Guide occupy a horizontal second row. My Build is nested under Builds, never a separate primary tab. Build pages show a compact banner row for My Build, Saved Builds and Popular Builds; the mobile Menu groups these beneath Builds and keeps the banner row scrollable. Use 26px content gutters and a left-aligned title. There is no permanent left site-navigation rail.
- Product categories appear in a horizontal third row **only at `/parts`**, retaining builder context when switching categories. Product details highlight Parts in primary navigation but do not repeat category navigation. Preserve the build/watch counters and the catalog build tray. Selected links use an underline plus color.
- On narrower screens, the navigation rows scroll horizontally, using ordinary links that keyboard focus brings into view. Do not clip links or the page horizontally. Brand/account/theme remain visible; the scraper also remains reachable from the footer. The Guide keeps its own useful article table of contents; it is separate from site navigation.
- Product lists use a dense comparison table, real 36px thumbnails, short product names, category-specific spec columns, retailer price, watch/compare controls, and quantity buttons. Around 65px per desktop row; mobile rows reflow into labeled specifications.
- Filters sit in a compact toolbar. Frequently used category filters are understated tabs. The full filter dialog retains advanced refinements. Do not remove existing filters to simplify appearance.
- The catalog's bottom build tray shows the current build and equipment subtotal. It accounts for retailer pack quantities and identifies unpriced items. Comparison selection can coexist above/below it without covering controls.
- Product details, builder, guide, calculators, tiers, watch list, account and administration use the same shell and tokens. Preserve article diagrams and genuine product images.
- Owner-approved revision, October 6, 2026: the part inspector includes a compact recorded-price chart. Product pages show retailer offers, price history and specifications together, with section links that scroll instead of hiding content behind tabs. On desktop use specifications on the left and prices/history on the right; stack prices first on phones. Preserve real observations, historical pack sizes, limited-history labels, error/retry states and recorded-observation tables. Reuse `ProductPriceHistory` and its bounded shared cache; skip transient hover requests and do not mount a second hidden mobile chart.
- Builder equipment uses a separate Component column, followed by Selection, Quantity, Retailer and Cost. Put blue filled Choose/Add another actions at the left of the Selection column, beside the category. Name each category once per group, including when multiple products are selected. Preserve grouped products, quantities, offer choice and costs. On phones, category and pick action share a compact two-column row; selected products reflow below.
- Below builder equipment, show a restrained Build price history section with a colored part legend, stacked purchase-cost chart, 30/90/365-day controls and accessible daily table. Use the current build quantities and chosen offers across historical dates, including pack minimums. Never invent history or treat missing prices as zero. Label partial coverage as a tracked subtotal; daily gaps stay visible. Fetch all selected parts in one bounded request when the section approaches the viewport, and lazy-load chart code.

## Entry pages and navigation

Owner revision, October 6, 2026: floating bottom section icons are removed. Keep the six circular shortcuts in the normal Home content and use the shared top navigation/Menu on inner pages. Do not restore a floating section dock or reserve trailing space for one.

- `/` is the lightweight home page: Browse Parts, Price Drops, and Builds are the primary actions. Keep its content useful and compact, without decorative hero artwork or catalog-loading dependencies.
- Home is an intentional exception to the inner-page horizontal header: the owner approved the [simple circular home reference](design-system/circular-home-reference.png) on October 6, 2026. Use a minimal brand/account/theme header, centered heading and pill search, six circular icon links with labels beneath (Browse Parts, Price Drops, Builds, Tier Lists, Watch List, Guide), and a quiet footer. Guide uses the shared BookOpen icon in the main shortcut row, with no duplicate header or text link. Keep six shortcuts across on desktop and two rows of three on phones. Keep the palette and existing theme behavior shared. No workbench panels, category grids or decorative imagery on Home. Its scoped styling lives in `app/home.css`; `SiteNavigation` and `PVProvider` select the home shell only at `/`.
- The owner approved the [bottom sales carousel](design-system/circular-home-sales-concept.png) on October 6, 2026. Home loads only `/api/deals?view=home` (at most 12 products, deduplicated, latest recorded reduction first). Never use illustrative mock prices. The latest revision is a slim continuously scrolling ticker (~22px/s), without a visible section heading or divider. It loops only when overflowing; pause on hover, keyboard focus, pointer interaction, hidden tab, and reduced-motion preference. Keep a small visible play/pause control and All deals link. Native scrolling/swiping and keyboard focus allow manual inspection. Duplicate visual content is hidden from assistive technology and the tab order. Show total package prices (not per-unit prices), pack count, retailer, observed date, shipping/tax caveat, and compact loading/error/empty states. Data refreshes every 5 minutes while visible.
- `/parts` owns the catalog. Old root query links redirect there with filters and builder context intact. New catalog links must use `/parts`.
- Owner revision, October 6, 2026: `/builds` is a lightweight landing page with three actions: **Start Your Build** to `/build`, **Open Saved Builds** to `/builds/saved`, and **Popular Builds** to `/builds/community`. The landing shell remains immediate and does not mutate the active draft. Owner revision, October 9: use circular action icons and open horizontal example-build rows, not square action cards or empty planning templates. Fetch only selected products from /api/example-builds; show real photos, fixed quantities, fresh pack-aware subtotals, expandable contents and source notes. Open a copy must populate every selected line through BuildOpenAction and protect the existing draft. Missing products disable copying; unavailable prices are never zero-price promises. Examples are editorial equipment selections, separate from community builds, with installation items clearly excluded. `/build` remains the existing System Builder; My Build is a direct resume shortcut in the Builds banner/Menu group. Preserve device/account collections, community filters and honest empty states. The Popular Builds collection currently shows community submissions by publication date; do not invent popularity scores. Legacy `?view=saved` and `?view=community` URLs redirect to their collection routes. Reuse `BuildOpenAction` so opening another build preserves the existing draft confirmation and save flow.

## Canonical implementation

| Responsibility | Source |
| --- | --- |
| Palette, shared layout and density | `app/theme.css` |
| Theme startup before paint | `lib/theme.ts`, `app/layout.tsx` |
| Accessible mode toggle and cross-tab sync | `components/theme-toggle.tsx` |
| Horizontal header, Parts category row, build tray | `components/site-navigation.tsx` |
| Shared context and existing application behavior | `components/pv-provider.tsx` |
| Catalog toolbar and refinements | `components/catalog-workspace.tsx` |
| Product rows and inspector | `components/part-inventory.tsx` |

## Palette and type

Use CSS tokens; do not duplicate hex values in page styles. Legacy `--ink`, `--green`, `--mint`, and `--cream` aliases map into this palette for existing components.

| Token | Night | Day | Purpose |
| --- | --- | --- | --- |
| `--background` | #171e27 | #e1e6ec | Page canvas |
| `--surface` | #1c2530 | #ebeef2 | Tables, inputs, panels |
| `--surface-alt` | #222d3a | #d8e0e9 | Headers, secondary surfaces |
| `--surface-raised` | #263240 | #ced9e5 | Hover, dialogs, feedback |
| `--text` | #e4eaf2 | #28364a | Primary text |
| `--muted` | #a8b5c5 | #526176 | Labels and supporting text |
| `--line` | #344151 | #bdc8d5 | Quiet boundaries |
| `--accent` | #71b0ff | #315f98 | Links, focus, selected borders |
| `--accent-solid` | #286bb4 | #3567a2 | Filled actions with `--on-accent` text |
| `--accent-soft` | #243c57 | #cfdcec | Selected rows |

Use `--success`, `--warning`, `--danger` and their `-soft` backgrounds for statuses, with text labels. Use `--chart-1` through `--chart-8` for charts. Do not reuse a light link color as a filled button background.

Owner revision, October 8, 2026: the owner approved the Soft Slate preview: day mode uses a cool blue-gray canvas, lighter slate panels, charcoal-slate text and restrained blue actions. This supersedes the rejected warm stone/sage palette. Preserve the existing layout and circular Home shortcuts. Avoid white page/panel backgrounds; reuse these shared tokens on every route. Preserve readable text contrast rather than fading text. Keep the switch thumb white for contrast against its track.

Typography uses the existing Inter/system sans stack. Typical sizes: title 27–28px, body 14px, row name 12px, specs 11px, metadata 10–11px. Numbers use tabular alignment. Borders 1px; corners usually 4–6px. Avoid oversized headings, pill-shaped everything, heavy shadows, and gradients.

## Theme behavior

Default is night, matching the selected reference. The day/night sliding switch has a stable accessible name, "Night mode": checked means night, unchecked means day. Sun/Day and Moon/Night labels show its direction; phone layouts retain both icons. It supports keyboard input and persists `pvpartpicker-theme` in local storage. A tiny synchronous document-head script applies the preference before painting, including full-page navigation. Storage failure falls back safely; changing mode still works on the current page. Storage events synchronize open tabs. Dark/light are the two supported choices, not an automatic system mode.

Intentional exceptions: real product photos and brand marks can sit on white image mats for legibility; source diagrams keep their authored colors. These are content assets, not independent page palettes. Print uses a light canvas.

## Interaction and data rules

- Preserve keyboard focus, visible focus rings, accessible names, and Escape/focus restoration for dialogs.
- Selected rows and tabs use borders/underlines as well as color. Statuses include words, not color alone.
- Keep +/- quantity controls, watch buttons, comparison selections, hover/click preview, explicit product-details links, and build return behavior.
- Prices, products and specifications in the reference image are illustrative. Use the real catalog. Never replace missing electrical specifications with fabricated values to match a mockup.
- Keep uncertainty/source labels, data freshness, compatibility caveats, and retailer pack minimums visible where decisions depend on them.
- Page navigation uses the owner-requested **280ms old/new crossfade**, via `navigatePage` and the browser View Transition API. Start the router inside the snapshot callback and resolve when PVProvider commits the destination with its catalog ready. Never add an exit wait, extra data fetch or interactive DOM clone. Identical navigation/header pixels remain visually steady; Home's different shell blends with the next page. Use additive snapshot blending to avoid a dark flash. Initial load, hidden tabs and reduced motion skip animation. Cancel on Back, interrupted navigation or changed motion preference; release a stalled snapshot within 1.8 seconds without canceling the router. On unsupported browsers and Back, `usePageTransition` supplies a 240ms main-content entry. Search/filter/quantity/calculator edits remain immediate. No new icon library or font download is necessary.

## Acceptance for future changes

The existing `/deals` section includes **Sales** (default) and **Price drops**. Sales compare a fresh available USD offer with its median of the latest in-stock check per completed UTC day during the previous 30 days (at least 7 distinct days, same package, excluding imported archives). When that history is insufficient, use a published retailer regular/compare-at price. Label the basis on each row; advertised references are not proof of prior paid prices or historical lows. Usable tracked history takes precedence even if it means no sale. Keep dollar/percentage sorting, category/search/watch filters, package purchase costs, observation timestamps and history actions. Refresh with catalog/visibility changes and remove outdated offers immediately. Price-drop periods retain their separate recorded-change meaning; Home's recorded-drop ticker is unchanged.

Build Analytics uses the same compact tokens and day/night shell: a collapsible input column beside the report on desktop, stacked controls and report on phones. Use accessible tab and chart/table labels. Keep monthly climate averages separate from forecasts and electrical approval. Preserve private analytics stripping from shared/community builds, explicit overrides for incomplete panel capacity/pricing, invalid-field blocking, provider attribution and graceful fallback. See `build-analytics.md`; never infer battery dispatch from battery capacity alone.

Builder compatibility uses a compact **Panel strings → Inverter/MPPT input → Battery voltage** map below the selected equipment/history. Keep one homogeneous panel model per tracker assignment, explicit receiver unit and MPPT numbers, quantity allocation, numeric STC/cold/hot checks and visible missing-data labels. Small schematic panel tiles and product thumbnails serve the connection, not decoration. On phones, stack the same three nodes vertically; arrows rotate downward. Store assignments in `Build.settings.pvArrays` so drafts, saved/account builds and shared copies retain them. Auto-size is a recorded-limit candidate; it never establishes installation approval. Use sourced exact-model specifications, separate per-tracker current limits, a user-entered lowest temperature and a visibly labelled maximum-cell-temperature assumption. Never substitute Pmax coefficients for Vmp, multiply battery voltage by quantity, use output charging current as solar input current, or use estimates for a pass. Missing operating envelopes, irradiance/bifacial factors, input/startup rules, battery approval/control, wiring/protection and site-specific requirements remain unverified.

Inspect affected routes in both modes at desktop and phone widths. Check text and control contrast, content wrapping, navigation overflow and overlay stacking, horizontal overflow, image failures, and long names. Verify theme persistence across navigation/reload, filter availability, build quantity changes, and dialog keyboard behavior. Compare catalog changes against the reference at the same viewport. Record intentional content differences; do not treat passing unit tests as visual approval.

## Phone usability contract (October 6, 2026)

At widths up to 720px, use the compact current-section/Menu row and accessible navigation dialog. Desktop keeps horizontal section/category rows. On phones, the Parts category selector is in the catalog, with no duplicate header category strip. All filters collapse category choices, scroll only their body and keep Show products visible. Inputs/selects use 16px text and 44px targets; avoid making the dense desktop tables larger. Compact phone specs use labels and values instead of large boxed tiles. Calculator tools use one labeled selector on phones and the existing sidebar on desktop. Product photos shrink on phones; tier photos have visible captions because touch users cannot hover. Keep safe-area padding and non-overlapping catalog/comparison bars. These refinements live in `app/mobile.css` after the shared theme styles. Check 320px, 390px, landscape, desktop, both themes, keyboard focus and all preserved workflows. See [mobile review](mobile-review/review.md).

Owner refinement, October 8, 2026: on the Builds landing page, omit the repeated visible Builds title and introductory sentence (retain an accessible page heading). Current build, Saved builds and Community builds are single pill-shaped links enclosing the round icon and label. Keep them compact in both themes and on phones.

Builds navigation uses the same named circular-icon pill banner on /builds and every build subsection. Render it once in the shared header, aligned top-left; do not repeat pills inside the landing content. The landing content uses the shared centered 1500px page container, matching the header and build subsections. Keep example cards in two desktop columns even on ultrawide screens. Preserve the mobile Menu group.

Owner revision, October 9: example builds use compact rounded rectangular cards (14-16px corners), two columns on desktop and one on phones. Closed cards show names, equipment text, capacities and pack-aware subtotal, without product image mats. Expand Parts & details for product photos, quantities, retailer line prices, a bottom equipment total and source links. Collapsed equipment uses a compact vertical list. Photo mats are transparent with translucent images scoped to these cards; embedded retailer backgrounds may remain. Omit the per-card Finish for your location and explanatory paragraphs. Preserve draft confirmation and populated copies.

Owner correction: build subsection header navigation uses named pill links enclosing circular icons (wrench, folder, community), matching the landing pills. Keep visible Current build, Saved builds and Community builds labels on every build page, with the active icon highlighted. Retain text labels in the mobile Menu and minimum 44px touch targets.

Owner simplification: Builds landing omits decorative introductions. The expanded example catalog has a compact Budget/System pill-button toolbar matching the Deals category shortcuts with Low (<$5k), Mid ($5k to <$10k), High ($10k+) and Unpriced ranges based on current complete equipment subtotals. Partial prices must not qualify as low budget. Sort complete prices first, low to high. Saved builds starts with search/list, without a title/back-link/current-draft block. Community starts with its search/filter toolbar, without either repeated introduction. Keep screen-reader page headings and the shared named pill banner.

Owner revision: collapsed example cards use uniform desktop/phone heights with aligned bottom controls; expansion grows naturally. Remove the visible build-count/sort line and budget explanation above the cards.

Shared section controls: Deals views, Watch List all/fresh views, Tier List families and Guide Articles/Calculators use named pill controls enclosing a circular icon, matching Builds. Active icons use the shared accent tokens. Keep semantic button/link state, visible labels, keyboard focus, compact secondary filters and wrapping phone layouts.

Parts category header uses the shared named circular-icon pill style in wrapping rows, without horizontal scrolling. Phones use two columns with wrapping labels; the Parts header scrolls with the page so the expanded category navigation does not cover the product list. Keep category navigation scoped to /parts.

Owner revision: Parts categories start collapsed behind a compact selected-category icon pill with a chevron. Expand to see smaller wrapping category pills; selecting a category closes the picker. Avoid repeated visible category headings and Searching labels in the catalog; retain accessible headings and search controls.

Owner-approved solar-system tray groups the category pills under Generate, Store, Convert, and Connect & control. Group headings sit beside pills on desktop and above the two-column pills on phones. Preserve the selected-category toggle, smooth collapse, inert closed content, reduced-motion support and all 12 category routes.

Parts search sits directly beside the selected-category picker with a 16px gap, rather than at the far right of the header toolbar. Phones stack the search directly below the picker. Preserve the same controlled search state, clear button, URL filters and accessible fallback; do not duplicate the catalog search or leave an empty introduction row.

The ecosystem brand chooser is now a Brands pill between category selection and search. Its smooth drawer retains logos, availability counts, disabled unlisted brands, selected state and All brands reset. Choosing a brand closes the drawer; preserve the existing ecosystem filtering and builder category rules.

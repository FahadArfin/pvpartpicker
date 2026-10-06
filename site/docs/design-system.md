# Night Inventory design system

Approved by the project owner on October 5, 2026: the first image from the latest three concepts, **Night Inventory**. This is the visual contract for new pages and future revisions. [Reference image](design-system/night-inventory-reference.png).

## Product character

A practical solar parts workbench inspired by the clarity of PCPartPicker. The pleasure comes from scanning useful specifications, comparing prices, and assembling a build quickly. Keep the design quiet, precise, and consistent. The user explicitly rejected heavy graphics and decorative game interfaces.

## Shared structure

- Desktop: fixed 226px navigation rail (240px on wide screens), subtle top bar, 26px content gutters, left-aligned page title, compact controls, main content. Rail scrolls when the viewport is short.
- Navigation includes builds, parts, price drops, watch list, tiers, guide, every catalog category, scraper and account. The selected item is visible without relying only on color.
- Below 900px, replace the rail with a labeled menu button and an accessible, focus-trapped navigation dialog. Keep the day/night control available outside the menu.
- Product lists use a dense comparison table, real 36px thumbnails, short product names, category-specific spec columns, retailer price, watch/compare controls, and quantity buttons. Around 65px per desktop row; mobile rows reflow into labeled specifications.
- Filters sit in a compact toolbar. Frequently used category filters are understated tabs. The full filter dialog retains advanced refinements. Do not remove existing filters to simplify appearance.
- The catalog's bottom build tray shows the current build and equipment subtotal. It accounts for retailer pack quantities and identifies unpriced items. Comparison selection can coexist above/below it without covering controls.
- Product details, builder, guide, calculators, tiers, watch list, account and administration use the same shell and tokens. Preserve article diagrams and genuine product images.

## Canonical implementation

| Responsibility | Source |
| --- | --- |
| Palette, shared layout and density | `app/theme.css` |
| Theme startup before paint | `lib/theme.ts`, `app/layout.tsx` |
| Accessible mode toggle and cross-tab sync | `components/theme-toggle.tsx` |
| Rail, top bar, mobile navigation, build tray | `components/site-navigation.tsx` |
| Shared context and existing application behavior | `components/pv-provider.tsx` |
| Catalog toolbar and refinements | `components/catalog-workspace.tsx` |
| Product rows and inspector | `components/part-inventory.tsx` |

## Palette and type

Use CSS tokens; do not duplicate hex values in page styles. Legacy `--ink`, `--green`, `--mint`, and `--cream` aliases map into this palette for existing components.

| Token | Night | Day | Purpose |
| --- | --- | --- | --- |
| `--background` | #171e27 | #f4f6f8 | Page canvas |
| `--surface` | #1c2530 | #ffffff | Tables, inputs, panels |
| `--surface-alt` | #222d3a | #eef2f6 | Headers, secondary surfaces |
| `--surface-raised` | #263240 | #e6ecf3 | Hover, dialogs, feedback |
| `--text` | #e4eaf2 | #223043 | Primary text |
| `--muted` | #a8b5c5 | #58687b | Labels and supporting text |
| `--line` | #344151 | #d3dce6 | Quiet boundaries |
| `--accent` | #71b0ff | #205da0 | Links, focus, selected borders |
| `--accent-solid` | #286bb4 | #205fa8 | Filled actions with `--on-accent` text |
| `--accent-soft` | #243c57 | #e5effc | Selected rows |

Use `--success`, `--warning`, `--danger` and their `-soft` backgrounds for statuses, with text labels. Use `--chart-1` through `--chart-8` for charts. Do not reuse a light link color as a filled button background.

Typography uses the existing Inter/system sans stack. Typical sizes: title 27–28px, body 14px, row name 12px, specs 11px, metadata 10–11px. Numbers use tabular alignment. Borders 1px; corners usually 4–6px. Avoid oversized headings, pill-shaped everything, heavy shadows, and gradients.

## Theme behavior

Default is night, matching the selected reference. The day/night button persists `pvpartpicker-theme` in local storage. A tiny synchronous document-head script applies the preference before painting, including full-page navigation. Storage failure falls back safely; changing mode still works on the current page. Storage events synchronize open tabs. Dark/light are the two supported choices, not an automatic system mode.

Intentional exceptions: real product photos and brand marks can sit on white image mats for legibility; source diagrams keep their authored colors. These are content assets, not independent page palettes. Print uses a light canvas.

## Interaction and data rules

- Preserve keyboard focus, visible focus rings, accessible names, and Escape/focus restoration for dialogs.
- Selected rows and tabs use borders/underlines as well as color. Statuses include words, not color alone.
- Keep +/- quantity controls, watch buttons, comparison selections, hover/click preview, explicit product-details links, and build return behavior.
- Prices, products and specifications in the reference image are illustrative. Use the real catalog. Never replace missing electrical specifications with fabricated values to match a mockup.
- Keep uncertainty/source labels, data freshness, compatibility caveats, and retailer pack minimums visible where decisions depend on them.
- Avoid decorative transitions; honor reduced motion. No new icon library or font download is necessary for this theme.

## Acceptance for future changes

Inspect affected routes in both modes at desktop and phone widths. Check text and control contrast, content wrapping, sidebar and overlay stacking, horizontal overflow, image failures, and long names. Verify theme persistence across navigation/reload, filter availability, build quantity changes, and dialog keyboard behavior. Compare catalog changes against the reference at the same viewport. Record intentional content differences; do not treat passing unit tests as visual approval.

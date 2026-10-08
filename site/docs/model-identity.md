# Equipment model identity and retailer packages

Owner-approved October 8, 2026: one model in Browse Parts and one place to compare its purchase choices and price history. Implement as a reversible read projection, never as a destructive catalog merge.

An equipment model has a stable identity. Each selected package has a separate identity (unit only, quantity of the same model, or bundle). Retailer offers and observations retain their existing IDs. Preserve all old product URLs, draft/saved build lines, and watch selections. No source URLs, schedules, queue records, collector payloads or imported observations are rewritten.

The reviewed registry records exact catalog titles, retailer parent URLs, hardware fields and selected package labels. Conflicting model/revision/specification candidates stay independent. A changed title, source or hardware field fails closed until reviewed. New unreviewed listings remain visible, rather than being grouped by vague wattage/capacity similarity.

Page projections share offers only between the same selected package. Conditions remain offer metadata and visibly labelled. Different pack quantities and bundles remain distinct options. Browse defaults to model groups, with All listings available. Product pages show a compact purchase-options selector, package contents/uncertainty, all corresponding retailer offers and the existing always-visible chart. Selecting a package switches the offers, chart and build/watch/alert target together.

Historical queries select original offer IDs for the selected package, not a rewritten product ID. Preserve source attribution, pack counts, real timestamps, gaps, stock and request/cache bounds. Alerts use the same package projection; bundles cannot trigger standalone alerts. Build costs and validation resolve the same original product/offer selection. The raw catalog and scrape/backfill flows remain unchanged.

Delivery: meaningful identity/history/build tests, full tests/typecheck, built Worker browser QA in both themes and phone widths, GitHub commit/PR/CI and publication of the validated artifact to the existing Sites project.

Purchase comparison revision: default to all packages sorted by total purchase price, keep selected choices visible, and highlight fresh same-condition bundles below the bare unit. Watch all operates on current original listing IDs, with identical package aliases grouped in the watch list. New options are not subscribed automatically. See [package comparison QA](package-deals-qa.md).

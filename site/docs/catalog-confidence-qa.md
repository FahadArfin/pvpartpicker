# Catalog confidence and buying QA — 2026-10-11

## Scope

Reversible catalog projection: canonical brand display, exact-page ALPHA 5 PRO model groups, explicit battery packs, NOVA inverter+battery bundles and open-box conditions. Product IDs, original offer prices, observation timestamps and collected history are preserved. Historical charts for corrected package counts use raw package prices; build history discloses that legacy totals rely on original recorded counts.

Shared price confidence, sourced comparison, whole-build buying plans, and owner-scoped saved-build equipment targets. The owner's final revisions remove retailer/check timestamps and Watch/Compare words from inventory rows, align their icon controls, and remove the verbose comparison introduction/explanation. Source links and per-product unknown counts remain.

## Verification

- 391 tests passed; TypeScript check and production Worker build passed.
- Independent catalog/buying and alert reviews completed. Alert regressions cover competing evaluation claims, cancellation/re-enable races, pending-only email status writes, consent, owner scope, deleted builds, pack rounding and incomplete prices.
- Additive migrations 0007 and 0008 applied to the isolated local database. No production test account or email was created; real email delivery was not exercised.
- Browser-tested built Worker through localhost 5197 with a synthetic preview account and a copy of public catalog data. Saved build target created at $3,000 then disabled successfully. Opened the build and expanded split buying options: $2,748.99 for two eligible selected lines; unknown shipping remains unknown; partial retailer coverage cannot win.
- Compared standard and self-heating ALPHA batteries; selected comparison IDs persist, sourced specs load, differences-only view correctly retains distinct prices, missing specs stay unknown.
- Catalog day/night checked; mobile 390x844 shows 44px aligned icon controls. Comparison day/night and mobile inspected; buying table becomes stacked rows on mobile. Temporary viewport override reset.
- Evidence screenshots are in canonical output/catalog-confidence-qa/: catalog-day.png, catalog-night.png, catalog-mobile-day.png, catalog-mobile-night.png, saved-target-day.png, buying-day.png, buying-mobile.png, compare-night.png, compare-mobile-day.png. Final production verification records any later publication checks separately.

## Scraping preservation

No changes to collection scripts, workflow files, schedules, retailer configuration or backfill state. Read-only GitHub check confirmed Collect retailer prices remains active and latest run 38186513302 succeeded. NAZ's source block is a known limitation; overall job success is not a claim of complete retailer coverage.
# Verified specification research — October 11, 2026

The owner approved research across all 12catalog categories. This release imports49 reviewed source transcriptions covering121 listing identities. It adds506 document/table fields and resolves218 previously missing comparison cells. The original1477 specification records are retained; the expanded index has1531 records. These are listing/field counts, not complete engineering-model coverage.

## Evidence and safeguards

New transcriptions are in data/specification-research-reviewed.json. Every entry has exact catalog IDs, expected title/source/category, available identity anchors, source URL, kind, model and review date. Official PDFs were rendered and visually reviewed for new battery sheets, EG4 6000XP and Emporia Vue 3. Current manufacturer technical pages supply other facts. Conflicting dimensions, ambiguous revisions, firmware-dependent limits, peak trip thresholds and blocked Enphase sources were withheld. Pack listings retain per-unit ratings; bundle aggregate ratings are not invented.

The reviewed importer preserves existing stronger fields and owner override precedence. Conflicts remain recorded. Wh/kWh, rated capacity, nominal voltage and panel power must agree with listing identity. Changed model/variant titles, source variants or anchors invalidate the new evidence. Peak current cannot become continuous current; current/voltage units and positive runtime limits are checked. Partial STC/NMOT tables merge without discarding existing values.

ALPHA 5 PRO Standard now has sourced 100 Ah, 100 A maximum charging, wired communications and 452 × 450 × 133 mm dimensions from the 2024 manual. The heating version uses the 2026 sheet, including 100 A continuous discharge and its own dimension ordering. Neither document publishes a verified peak rating. The Standard manual's unspecified-duration maximum discharge is not labelled continuous.

## Repeatable workflow

From site/, use Node 22.13+:

1. Export the public current catalog to an ignored JSON snapshot.
2. scripts/fetch-specification-sources.mjs --catalog SNAPSHOT --cache CACHE reuses cache, respects robots/delays and refuses blocked origins. It does not collect prices or write the hosted database.
3. scripts/collect-specifications.mjs --catalog SNAPSHOT --cache CACHE --output CANDIDATE_JSON generates candidate evidence and sibling audit outside deployed data. Candidate extraction is not verification; do not promote this file automatically.
4. Review exact sources/models and add identity-guarded entries to data/specification-research-reviewed.json.
5. scripts/import-reviewed-specifications.mjs --catalog SNAPSHOT --reviewed data/specification-research-reviewed.json --report REPORT_DIR imports only accepted evidence and exports every category's filled/remaining table.
6. Test, type-check, build, browser-check and publish the validated artifact.

Raw pages/PDFs and comprehensive remaining tables are retained in canonical output/spec-research and output/specification-research/results, not shipped in the application. Unresolved fields remain unknown. No unattended enrichment automation was created.

## Validation

403 tests, TypeScript check and production Worker build passed. Independent focused review cleared all 12newimport/measurement regressions. Built preview confirmed ALPHA unknown counts fall from 6 each to 2 Standard / 1 Heating, with exact distinct document links. Day/night and 390 px mobile comparison inspected. Evidence screenshots: output/specification-research/qa/compare-night.png and compare-mobile-day.png.

No price collector scripts, schedules, workflows, offer IDs, prices or historical observations were changed. Existing normal retailer scraping remains enabled. This release does not remove the existing NAZ access limitation.
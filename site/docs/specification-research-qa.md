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
## October12 continuation

Fresh snapshot:7,213 catalog listings. Twelve additional exact standalone identities from manufacturer pages,129 new technical fields and65 resolved comparison cells. Seven Redodo/LiTime batteries and five PECRON stations. Source disputes (dimensions, surge durations/contradictions, solar voltage versus operating ranges) remain unknown. Qualified port currents are retained as text and are not scalar compatibility limits. Combined PV totals were refined after independent review so per-port numbers cannot look like alternative totals.

Remaining:6,085 listings /41,776 comparison fields;5,664 awaiting review,288 unavailable source pages,133 reviewed with gaps. These include retailer and pack variants;1,128 complete comparison coverage does not mean an installation design is verified. Owner dashboard snapshot is a build-time report, not an automatic research worker. Category detail expands with native keyboard-accessible disclosure.

Validation:407 existing/progress tests before two new source regressions; typecheck and built Worker passed. Local owner dashboard day/night,390px phone table317px and no page overflow; screenshots under output/specification-research/qa. Hosted price workflow enabled and running during research. Price database and schedules untouched.

## October12 batch two across all categories

26 additional manufacturer records cover31 exact listing identities in all12categories. Added206technical fields and resolved63 comparison cells;10 panel STC entries also transcribed. Remaining snapshot:7,213listings;6,085withgaps;41,713missingfields;5,635awaitingreview;288sourceunavailable;162reviewedwithgaps. Two reviewed kits already had complete comparison coverage; their sourced billsofmaterials improve attribution without reducing the gap count.

Kit contents now accept exact kit-only labels and take verified evidence before parsed shorthand. Existing parsed fallback remains; component wattage/current in BOM text never becomes a kit scalar rating. Legacy kit component fields are retained from earlier evidence, outside this batch's verified aggregate scope. AGM5-second maxima remain peak-only. HQST controller uncertainPVarray totals/dimensions, OUPES durationlesssurges and MidNite SPD conflicting electricallimits remain unknown.

Independent review cleared all31identity matches and source semantics; Tamarack Rev4d page2 visually confirms #88450/30–40mm mid/endfit. PDFhash/render held under output/specification-research. Retention audit checked1,543priorrecords/8,431priorfields with5listing-to-verified upgrades and no stronger-field replacements. All412tests,typecheck,Workerbuild passed. Browser verified source-linked kit BOMs in night/day390px with no overflow, and updated owner progress counts. Price workflows/schedules/scripts unchanged. Local canonical dependencies restored with pinned npm ci after an incomplete installation was detected; remove isolated dependency junction before worktree archive.

### Live metadata refresh correction

Normal hosted collector run38200199512 completed successfully and grew the catalog by195listings (7,213→7,408). Fresh queue snapshot now6,280listings /43,263missingfields;5,830awaitingreview,288sourceunavailable,162reviewedwithgaps. Batch delta remains206newtechnical fields /63resolvedcomparisoncells measured before catalog growth; the latest report is a post-import current-coverage snapshot and cannot be used to recount that delta.

Live proof exposed4circular identity anchors in newly reviewed RenogyAGM/kit records: prior enrichment maxChargeCurrent or controller maxPvVoltage was absent from refreshedrawmetadata. Removed ONLY these4derived anchors; exact name, variantURL,category,capacity/voltage/type guards remain. No matcher logic changed. Added a regression that reproduces refreshedmetadatawithoutderivedfields;413tests/typecheckpassed. Independent reviewer cleared the correction against currentmetadata. Prior strongfields retained. Pinned canonical dependencies restored; isolated junction will be removed before archive.

## October 12 batch six

Investigated 170 manufacturer/seller-page families and 855 exact listings. Approved 662 listing updates: 593 new identities and 69 supplements. Added 5,070 verified technical fields and 356 panel STC cells, resolving 2,135 comparison cells. Of these, 245 become available through corrected battery categories and exclusion of bundled charger-voltage artifacts. Dedicated lithium chargers retain accessory roles. Battery feature taglines do not turn actual batteries into monitors or inverters; whole-home bundles remain kits.

All 11,739 prior fields and panel tables retain their values and source references; 42 listing-only fields were upgraded with verified evidence. Ten unitless Redodo continuous-current values remain held. LiTime 460Ah's separately labelled 500A/5-second and 1000A/1-second peak cells are qualified explicitly; continuous discharge remains 250A. Manufacturer and exact seller sources preserve their truthful attribution and acquisition dates. Four BigBattery EG4 resale accessory records retain retailer attribution. Post-refusal K2 captures are excluded; no blocked origin was retried.

Normal hosted price collection remained enabled. Run 38218471945 succeeded and added 74 catalog listings, taking the current snapshot to 7,638. Two curated EG4 retailer selections were independently revalidated against exact seller SKUs and unchanged manufacturer model/version sheets; exact guard names/URLs refreshed without technical/source changes, restoring 18 existing comparison cells separately from batch additions.

Current coverage: 1,145 complete comparison rows; 6,493 listings with 41,049 remaining fields. Of those, 5,063 await review, 288 have unavailable source pages, and 1,142 reviewed listings retain gaps. All investigated families remain resumable for exact manuals and unresolved evidence; none is falsely declared exhausted. The owner-authorized exhaustive task and hourly recovery heartbeat continue.

No scraper, workflow, current price or historical observation changes. No UI layout changes. Independent source, identity and retention checks passed. Browser access remains restricted by browser policy; live API identity/provenance and exact asset verification accompany publication. Release test/type/build results are recorded below after validation.

Validation: 419 tests, TypeScript check and production Worker build passed. All 1,165 current reconstructed raw identities pass exact guards. No browser policy bypass; live field and artifact verification is performed after terminal publication.


## October12 batch seven

Investigated 240 previously pending families and exact listings across all 12 categories. Approved 178 listing updates with 867 verified technical fields, 17 panel STC cells and 350 resolved comparison cells. Sources retain their actual acquisition dates and truthful attribution: 147 manufacturer records and 31 exact seller records.

Corrected 59 equipment/component roles: empty battery boxes, balancers, switches, controllers, cables, brackets and sensor clamps are separate from stored energy. Real battery modules, battery cabinets, cell packages and whole-home kits retain their roles. Two four-panel packages now use explicitly published per-module wattage that reconciles with the stated count and total; package prices and quantities remain intact. Field-scope corrections account for another 148 missing cells removed from inappropriate categories, separately from the 350 source-resolved cells.

Five ranged panel Voc rows remain held until an exact scalar STC source is available. Electrical input promotion now requires an unambiguous nominal measurement, retaining explicit paired units and percentage tolerances. All 1,271 valid prior scalar inputs remain available; 17 contaminated, compound or approximate legacy strings retain their source evidence but no longer supply guessed sizing limits. New tests reproduce the original range lower-bound error and preserve source display values.

Independent review corrected unitless CCA weight, conflicting Switch10 temperatures, conflicting Yeti1400 dimensions, NEXUS140A/150A continuous-current conflict and SolaX seller attribution. Renogy40A stays qualified for AC/grid mode; LiTime20Ah charging retains both continuous and outboard conditions without scalar promotion. All 16,940 prior fields and panel tables retain values and source references; 22 listing-only fields were upgraded.

Normal hosted price collection stayed enabled; run38225402958 succeeded and added233 catalog listings. Current snapshot:7,871 listings;1,176 complete comparison rows;6,695 listings with42,207 missing comparison fields. Of the latter,5,113 await review,288 have unavailable source pages and1,294 reviewed listings retain gaps. These are current-coverage counts; the batch delta remains867/350 despite catalog growth.

All240 investigations remain accurately partial where manuals, revisions or missing evidence still need follow-up. Attempt ledgers and category tables preserve unresolved reasons. No scraper/workflow/current-price/history changes, source-refusal bypass or UI layout changes. Owner-authorized exhaustive research continues.

Validation:426 tests and typecheck passed. Independent source/identity/retention and targeted code reviews passed. Both live and fallback catalog invariants use the same per-module normalization. Browser access remains restricted by policy; production Worker build and live exact field/asset checks accompany publication.

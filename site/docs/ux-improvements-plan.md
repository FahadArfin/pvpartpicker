# October 8 UI/UX improvements

Approved scope: the owner requested implementation of all 22 findings in `output/ux-audit-2026-10-08/index.html`. Preserve the Night Inventory theme and all current behavior. This is a collection of bounded changes to existing flows, not a new architecture or a visual redesign.

## Non-negotiable constraints
- Do not pause, cancel, reseed, migrate, or edit scraper/backfill jobs, schedules, queue, data, collector APIs, or source identifiers.
- Root Git checkout only. Branch `codex/ux-review-improvements`; current base `2ced631`.
- Reuse SiteLink, shared catalog/cache, semantic theme tokens, model/package identity and provenance. No guessed electrical specifications or fabricated community activity.
- All changes must pass tests/typecheck/build and browser QA in day/night and phone/desktop before publication to the existing public Site.

## Tasks and coverage
1. Catalog and comparison: findings 03,04,06,07,21. Normalize display brand aliases without modifying collector data. Add explicit category/all search scope and recovery. Compact mobile controls. Show total required purchase alongside per-unit price. Expand sourced electrical comparisons and mobile two-product selection. Own catalog-workspace, part-inventory, comparison-view, compare/page, new scoped stylesheet/helper/tests.
2. Builder: findings 05,18,19,22 (build labels). Compact action menu and direction controls; return to added row using URL/state with announcement. Purpose-aware neutral readiness. Explain empty analytics prerequisites. Consistent Saved/Community labels and separate honest example templates if suitable. Own build-workspace, build-flow, build-analytics-report, build library/landing components, new scoped styles/tests. Coordinate provider changes with root.
3. Guide/calculators: findings 15,16,17,20. Mobile contents sheet, remembered reading position, smaller chrome; compact results near form, explicit examples and build reuse; unified conductor size/material/temp inputs with advanced resistance, percentage-first table. Own guide/calculator components and their scoped helpers/styles/tests.
4. Product/history: findings 01,02,08,13. Compact top-aligned product summary; optional package comparison and concise lower-cost callout; exact component contents and verified model links; sparse specs collapsed; actual history coverage/range summary. Root owns product-detail, model-purchase-options, bundle-presentation, product-specifications, product-price-history and scoped helpers/styles/tests.
5. Deals/watch/tiers/home/shell: findings 09,10,11,12,14,19,21,22. Budget filters and clear price basis; same model grouped watches and consistent header counts, real alert status; tier fresh-only filter, coverage and mobile sheet; home beginner link and explicit sales fallback; consistent Deals and build naming, one relevant tray. Root owns these components/provider/shell and any read-only API changes needed. Scraping endpoints/config remain untouched.
6. Integration, independent review, complete tests/typecheck/build, visual QA, commit/PR/merge, exact Sites artifact deploy and verify. Recheck active scraping before and after release.

## Coordination and review
Only one delegated implementer at a time, with disjoint owned files from root work. New scoped CSS files avoid shared stylesheet conflicts; root imports them once. No schema/storage migrations, dependency updates, or production data mutation. Root alone commits/publishes. Independent review must check package identity, missing/stale values, mobile keyboard/focus behavior and scraper invariance.

## Acceptance
- Category search can directly recover matches elsewhere; manufacturer aliases act as one filter.
- Package identity and actual minimum purchase are visible before buying/adding.
- Mobile choose/add flows show prompt next action and confirmation without losing context.
- Comparison offers relevant sourced specifications with unknown fields retained honestly.
- Watch counts agree and packages group beneath model with individual controls retained.
- Tier/price displays explain coverage; no historical data is invented.
- Examples and user inputs are distinct; wire tool is not presented as ampacity approval.
- Existing scraper/backfill files and runtime settings are unchanged, with job status recorded.

## Progress ledger
- Preflight: root clean; HEAD matches origin/main; no open PRs. Live Sites version 64 public. Backfill run 37710258771 in progress. Latest collector run 37706211163 succeeded. Workflows retain cancel-in-progress:false.
- Shared interface review: tasks 1/5 share provider/shell (root only); 2/5 share provider (coordinate root patch); 3/4 share no code; task-specific CSS imported by root; all consume unchanged Product and SiteLink interfaces.
- Ruling: the user's explicit instruction to implement the approved audit is sufficient design authorization; do not introduce another approval loop.
- Ruling: use repository-root branch as required by AGENTS; no worktree relocation of running local servers.
- Tasks 1/2 implemented and focused checks passed. Task 3 in progress. Tasks 4/5 implemented, integration review underway.
- Review fixes: reachable detailed-spec control; additional observed brand aliases; expandable watch model groups with minimum purchase; alert lookup across full package identity, loading and delivery status; removed ambiguous global watch counts; phone differences use visible pair.
- Scraper recheck at 06:34 UTC: backfill 37710258771 still in progress, collector 37737035360 in progress. No runtime/job changes.
- Full first test run 316/317: sale fallback fixture revealed unintended carry-through of history metadata. Fixed explicit sales projection; focused suite 14/14 and typecheck passed. Final full suite pending after guide integration.

- All five implementation tasks complete. Final independent review cleared every reported finding. Full suite: 321/321; typecheck and production build passed. Mobile Guide contents/focus/resume, build add-return, analytics prerequisites, calculator build reuse and conductor recalculation exercised. Release validation is recorded in root design-qa.md.
- Latest read-only job check: collector 37737035360 succeeded; backfill 37739363761 in progress. No workflow, collector, migration or ingestion files changed.

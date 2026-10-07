# Temporary historical backfill monitor

Open `/price-scraper#historical-backfill` while signed in as the owner. The monitor is visible above the retailer list, across all scraper tabs. Existing Live updates polls every 10 seconds while visible; Refresh requests a fresh snapshot. Closing the browser does not stop the hourly GitHub worker.

The progress bar measures resolved **eligible queue listings**, not imported prices. Pre-queue identity exclusions are separate. Pending retries stay remaining; matched, not-found, processed-review and final-failed outcomes count as checked. Prices stored is the real attributed observation count, including retry-safe deduplication. No estimate of completion time is fabricated.

Worker start/end check-ins persist in D1 independently of the global request lease. The last source-request-start timestamp is recorded only after confirming the owned request slot. An active reservation expires automatically; budget exit releases it without resetting pacing or removing pending work. Status distinguishes working, request-slot wait, reserved, between runs, paused, failed and overdue (over two hours since check-in). An ended run is not evidence of new imported prices. View worker run links only to this repository's GitHub Actions runs.

The monitor is isolated in `components/backfill-progress.tsx` and `lib/backfill-progress.ts` for later removal. It adds no public endpoint, WebMCP shortcut, polling service or alternate scheduler. Owner/collector API authorization is unchanged. Existing global pacing remains at least one source request per 30 seconds; source refusals pause rather than bypassing limits.

## QA — October 7, 2026

- 278 tests pass; typecheck and production Worker build pass. Tests exercise real SQLite queue counts, pre-review exclusions, source timestamp persistence, expired reservations, heartbeat URL validation, stale/paused states and owned budget release.
- Independent read-only review identified an abandoned budget reservation; fixed and re-reviewed with no remaining Important/Critical findings.
- Inspected the built Worker owner route through a loopback-only QA proxy with non-secret local owner settings. Local queue fixture used live snapshot counts; no fixture records were sent to production.
- Desktop, 390px and 320px CSS viewports: readable compact panel, wrapped metadata, accessible labeled native progress, collapsible recent results, no document horizontal overflow. Live updates off messaging, refresh, recent details and both theme switches checked.
- Day token selection is correct (`--background: #eeede8`); this Edge profile force-darkens light pages, so unmodified day colors could not be visually established in that profile. No browser settings changed.
- Screenshots: ignored `output/backfill-progress-desktop.png`, `output/backfill-progress-phone.png`.

Publication and actual production check-in evidence are verified separately from the local fixture.

# Temporary historical backfill monitor

Open `/price-scraper#historical-backfill` while signed in as the owner. The monitor is visible above the retailer list, across all scraper tabs. Existing Live updates polls every 10 seconds while visible; Refresh requests a fresh snapshot. Closing the browser does not stop the continuous GitHub worker.

The progress bar measures resolved **eligible queue listings**, not imported prices. Pre-queue identity exclusions are separate. Pending retries stay remaining; matched, not-found, processed-review and final-failed outcomes count as checked. Prices stored is the real attributed observation count, including retry-safe deduplication. No estimate of completion time is fabricated.

Worker start/end check-ins persist in D1 independently of the global request lease. The last source-request-start timestamp is recorded only after confirming the owned request slot. An active reservation expires automatically; budget exit releases it without resetting pacing or removing pending work. Status distinguishes working, request-slot wait, reserved, cooldown, awaiting restart, paused, failed and overdue (over two hours since check-in). An ended run is not evidence of new imported prices. View worker run links only to this repository's GitHub Actions runs.

The monitor is isolated in `components/backfill-progress.tsx` and `lib/backfill-progress.ts` for later removal. It adds no public endpoint, WebMCP shortcut, polling service or alternate scheduler. Owner/collector API authorization is unchanged. Existing global pacing remains at least one source request per 30 seconds; source refusals pause rather than bypassing limits.

## QA — October 7, 2026

- 278 tests pass; typecheck and production Worker build pass. Tests exercise real SQLite queue counts, pre-review exclusions, source timestamp persistence, expired reservations, heartbeat URL validation, stale/paused states and owned budget release.
- Independent read-only review identified an abandoned budget reservation; fixed and re-reviewed with no remaining Important/Critical findings.
- Inspected the built Worker owner route through a loopback-only QA proxy with non-secret local owner settings. Local queue fixture used live snapshot counts; no fixture records were sent to production.
- Desktop, 390px and 320px CSS viewports: readable compact panel, wrapped metadata, accessible labeled native progress, collapsible recent results, no document horizontal overflow. Live updates off messaging, refresh, recent details and both theme switches checked.
- Day token selection is correct (`--background: #eeede8`); this Edge profile force-darkens light pages, so unmodified day colors could not be visually established in that profile. No browser settings changed.
- Screenshots: ignored `output/backfill-progress-desktop.png`, `output/backfill-progress-phone.png`.

Publication and actual production check-in evidence are verified separately from the local fixture.

## Continuous processing revision

The owner removed the 45-minute hourly processing window. The workflow now runs continuous paced work, refreshes check-ins every minute, and dispatches a continuation when the runner budget ends and unpaused pending work remains. GitHub concurrency and D1 leases preserve one source worker. Hourly recovery ticks may queue a replacement but do not interrupt a running worker. Normal handoffs have setup/runner scheduling overhead; true zero-gap execution is not promised on GitHub-hosted workers. Remote crawl delays/refusals remain respected.

Validation: 285 tests, typecheck and production Worker build pass. Independent review rechecked competing-lease protection during legacy retry recovery and heartbeat updates during long cooldown waits. Built owner preview checked at desktop, 390px and 320px CSS widths, with no document overflow and correct light/night tokens; the existing Edge forced-dark limitation remains. Preview: ignored `output/continuous-backfill-preview.png`.

## Refusal and lookup-integrity recovery (October 9)

The worker preserves `Retry-After` (seconds or standard HTTP date), the pause kind and a cooldown deadline in D1. HTTP 429 remains paused until an explicit reviewed resume; the minimum cooldown is 24 hours, or the longer source-provided interval. Legacy 429 pauses use 24 hours after the last recorded request. Missing/invalid dates never shorten the minimum. Challenge pages, 401/403, robots restrictions and lookup-integrity pauses cannot use rate-limit resume. Existing scheduled starts and seed actions do not clear pauses.

After reviewing source access and verifying correct URL lookup behavior, an owner can select `resume_rate_limit` in the existing manual workflow dispatch, or run the existing worker with `--resume --reviewed-rate-limit` using the configured collector credential. The CLI resume action exits without source requests. The API checks the exact current pause reason and uses the existing compare-and-swap state update; it leaves all job records and imported observations unchanged. Do not use this while the source still refuses requests.

Before fetching a lookup candidate, the worker asks D1 whether another listing already rejected that same candidate for retailer/model/package mismatch. A collision pauses as lookup integrity and leaves the current job pending. This uses previously stored results across runner restarts, including the repeated `sg-4882548064393` fallback. Identity and import deduplication checks are unchanged. This circuit breaker prevents repeated bad candidates; it does not establish that Drop.solar's external lookup implementation has been repaired.

Verified live state: 1,805/3,934 checked, 2,129 pending, 23 observations imported, legacy HTTP 429 pause. A single read-only source probe on October 9 again returned 429; no further source requests or live resume were made. The cached public client sends the same POST `{url}` shape as our worker. Exact external cause remains unverified while access is refused. Previously rejected jobs remain review records; do not requeue them wholesale before validating the corrected lookup.

Validation: 334 tests passed, including durable wrong-candidate detection, pending/completed preservation, explicit reason review, seconds/date Retry-After parsing, long cooldowns and refusal stops. Typecheck and built Worker verification recorded separately.

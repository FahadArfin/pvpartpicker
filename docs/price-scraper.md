# Price Scraper

Owner-only source management at `/price-scraper`. Source configuration and queue state live in the existing D1 database. The GitHub collector checks due work every 15 minutes; it does not depend on an open browser. GitHub can delay scheduled runs. Existing retailer schedules default to six hours; new verified sources default to daily. See [retailer research and history provenance](drop-solar-research.md) for coverage, paused sources and archive import details.

Implementation plan:
- Add validated public HTTPS source configuration, interval/daily/manual schedules and source seeding.
- Persist jobs with leases, cancellation, request events, counters and immutable configuration snapshots. Avoid overlapping work for one source.
- Extend the existing parser and ingestion path to registered sources. Preserve source identities, observation idempotency, matching and quarantine.
- Execute bounded jobs from GitHub with per-site pacing, robots policy, DNS/address checks, response limits and no challenge bypass.
- Build the owner dashboard: sources, settings, queue, history, recent observations and request details. Poll only while visible.
- Verify scheduling boundaries, invalid URLs, DNS/address restrictions, queue lifecycle, permissions, parser output and live ingestion; commit and publish.

Source configuration: name/origin, adapter (`shopify`, `woocommerce`, `sitemap`, `pages`), starting path/product URLs, interval minutes or daily UTC time/weekdays, request spacing (10–300 seconds), page budget (1–80), feed pages (1–4), optional jitter (0–30 seconds). Pausing prevents new work and cancels pending jobs. Cancelling a running job stops at the next safe request boundary; observations already stored remain.

Jobs retain the source settings used when queued. A worker claims a 20-minute lease renewed with each request event. Stale leases become failed runs. Each job has a 12-minute collection budget, and the workflow has a bounded overall runtime. Site settings may require several runs to cover a large catalog. Sitemap jobs reserve roughly 20% of their page budget for discovery and persist a rotating sitemap cursor across runs; remaining slots check priority and oldest known URLs. Specific-page jobs rotate through only their configured URLs across runs. Claims and completion writes are idempotent across API retries. Feed jobs resume a persisted page cursor across bounded runs and reset on a short or empty final page; a large feed may require several daily runs for a full refresh.

History contains actual request events and accepted/quarantined observation counts. Source detail shows current offers and recent stored observations. Legacy collector reports are displayed separately and are not invented as job-level request histories. Owner mutations require authenticated admin access; worker calls require the existing collector token plus a job-specific lease. Source URLs must be public HTTPS on port 443 without credentials. The Node transport resolves and pins only public addresses, checks every same-origin redirect, and enforces response/time limits. It never logs authentication headers.

Scheduling reference: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

Shopify product feeds do not declare currency per variant. Their source configuration requires the owner to confirm USD; feeds of other currencies are unsupported. WooCommerce and JSON-LD offers must explicitly declare USD.

# Retailer collection

Adapters use public JSON-LD, BigCommerce product attributes, Shopify product feeds, WooCommerce Store API, and sitemaps. Supported sources: Signature Solar, Current Connected, SanTan Solar, ShopSolar, NAZ Solar Electric, Renogy, and Emporia Energy.

The launch snapshot has 1,098 product/variant records and three verified EG4 model comparisons across retailers. This is a bounded catalog sample, not a claim of complete retailer inventory. Feed adapters inspect up to 250 products (500 for Renogy); sitemap adapters inspect 24 selected product pages. Increase coverage only after reviewing retailer policies and identifier matching.

Every request checks the retailer origin and robots policy, waits at least ten seconds between requests to one retailer, limits redirects and response size, and times out. Authentication failures, rate limits, or bot challenges are recorded without bypass. One unavailable retailer does not prevent other adapters publishing. Scheduled jobs retain old prices with their timestamps; offers older than 24 hours or lacking confirmed stock are excluded from current-price totals and alerts.

Variants retain retailer SKU identity across price changes. A small allowlist combines known standalone EG4 models; refurbished, mixed bundles, and pallet listings stay separate. Owner matching requires source evidence. Package parsing recognizes homogeneous panel packs/pallets and distinguishes mixed monitor bundles. Unspecified pallet quantities are excluded rather than guessed. Title-derived specifications are attributed estimates; unlisted electrical fields remain unknown. The EG4 6000XP lithium range is documented from its manufacturer manual.

## Scheduled job

`.github/workflows/collect-prices.yml` runs at 00:17, 06:17, 12:17, and 18:17 UTC on the repository default branch. GitHub controls scheduling and can delay runs. Configure repository variable `PV_API_ORIGIN` and secret `PV_COLLECTOR_TOKEN`; the latter must match the production runtime `COLLECTOR_TOKEN`. It grants ingestion and alert processing only, not user or owner access. Manual workflow dispatch is available for recovery.

The job publishes batches directly to `/api/ingest` and calls `/api/process-alerts`. Replaying the same offer/timestamp is idempotent. A price movement above 80%, or a package-quantity change, is retained in the owner quarantine queue for review. Price histories preserve package quantities per observation. Matching and specification corrections persist independently of incoming metadata.

Local collection writes ignored progress for recovery. Set the same explicit `COLLECT_RUN_ID` on a retry to reuse completed retailers from that run. A fresh run without this variable always checks sources again. `COLLECT_RETAILERS` selects comma-separated adapter IDs; `COLLECT_MAX_PAGES` bounds sitemap sampling (maximum 80). Review source health in `/admin` after a failure. Do not commit progress files, credentials, or scraped diagnostic HTML.

## Notifications

Price targets apply to the actual purchase cost for the requested quantity, including minimum packs, excluding shipping/tax. Notifications occur when an eligible price first reaches the target or crosses it again after rising above. A database cursor rotates through bounded batches of 500 alerts, preventing later subscribers from being starved. Emails are limited to 25 per processing call, with three recorded attempts and provider idempotency keys. One failed delivery does not block later items. Subscribers can disable alerts from their account or unsubscribe link. Website notifications work without an email provider.

The source images are hotlinked to retailer/manufacturer imagery and retain product/source links; no photographs, ratings, historical data, or savings claims are fabricated. Image availability depends on the originating retailer. Confirm usage terms before monetizing or redistributing source media.

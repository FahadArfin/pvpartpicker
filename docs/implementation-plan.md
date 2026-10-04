# PVPartPicker implementation

Approved brief: US solar catalog and guided system builder, real multi-retailer offers and recorded price history, ChatGPT sign-in, persistent builds, community reviews, email and website target-price alerts.

## Deliverables
1. Source-verified catalog across panels, mounting, wiring, batteries, inverters, electrical, and accessories. Record source, variant, package quantity, stock, price, and observation date. No invented prices, reviews, or historical observations.
2. Responsive catalog, product details, comparison, guided builder, and documented compatibility checks. Missing evidence remains unverified.
3. D1 persistence and authenticated APIs for saved builds, reviews, alerts, notifications, and administration. Preserve platform ChatGPT authentication.
4. Bounded retailer adapters and resumable collection. Snapshot is a launch fallback; D1 is the live source. Scheduled jobs must work with the browser closed.
5. Validate domain rules, parser failures, API ownership, migration integrity, browser flows, and production deployment. Push validated source to FahadArfin/pvpartpicker.

## Dependencies and defaults
USD; working brand PVPartPicker; public catalog. Resend email delivery needs a key and verified sender. No paid purchases. Collection runs every six hours, at least ten seconds between requests to the same retailer. Unknown shipping and tax are excluded from equipment subtotals. No permit, wire-sizing, roof-layout, or installation-certification engine.

## Execution ledger
- Initial repository is empty with no commits; implement on codex/build-platform in the provided checkout so the user can inspect all files. No parallel worktree is needed for an empty repository.
- Windows bundled installer resolved npm relative to the project and failed; use the installed Node npm CLI directly.
- Planned unattended collector will use GitHub Actions and a scoped ingestion secret, avoiding an interactive plugin connection for scheduled collection. Hosted price/history data remains in D1. UTC six-hour cadence is independent of daylight saving time.

- Implemented 1,098 source product variants, seven retailer adapters, D1 account/price storage, owner moderation/matching/corrections, and bounded notification queues.
- Final reviewer identified package parsing, selected variants, stable offer identity, persistent corrections, email failure isolation, alert starvation, classification, and system-purpose checks; addressed with regression tests and database acceptance.
- Validation: 24 tests passed; type checking passed; production Worker build passed; local D1 migrations and seed passed; browser saved a two-unit build and flagged off-grid/grid-tie mismatch at 390px; 2,001 alerts rotated through five bounded calls with no starvation.
- Publication and unattended collection are validated separately; email sending still requires a provider key and verified sender.

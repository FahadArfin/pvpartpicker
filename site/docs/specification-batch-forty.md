# Specification batch 40 — October 23, 2026

Adds 55 independently reviewed technical fields across 9 exact listing identities and fills 21 comparison-field gaps. Research was limited to complete, exact current product identities and two already-existing source-family followups. Queue eligibility audits are preserved separately and count as zero source visits.

The supported database capture read 9,368 product rows and 9,400 offers, with 5,480 complete products and 3,888 unreadable or truncated records. It is a non-atomic multi-read capture. Ten newly readable identities were assessed; incomplete records including the truncated A058M290 and EG4 records remain excluded. Offers and prices are capture metadata only and were not imported.

Every prior technical field, source record, identity, and panel STC/NOCT value is preserved. Reviewed values remain bound to exact product identity, variant, unit, pack, and operating qualifiers. Module facts are kept separate from cabinet, stack, control-unit, and system limits. Conflicting, unpublished, unrepresentable, or consumer-unsupported claims remain explicit holds. The two legacy source followups are recorded as followups and are not counted as first visits.

The durable checkpoint contains 3,046 attempted families and preserves historical holds and identities. No pending families or unresolved historical source leads remain in the captured queue. Pause until new complete records or exact-source evidence arrive. Unpublished, conflicted, blocked, identity-held, truncated, and consumer-unsupported gaps remain unresolved; this is not catalog completion. This is not a claim that every catalog specification is complete.

Accepted transcriptions and fixed-baseline delta are in `data/specification-batch-forty-reviewed.json` and `data/specification-batch-forty-audit.json`. Original worker records, source quotes, independent reviews, the full capture manifest, exact baseline Git references with hashes and counts, and integration decisions are preserved in `docs/specification-batch-forty-review.json`. Prices, offers, observations, runtime APIs, UI behavior, and automations are unchanged.

Validation: 681 tests passed, 11 skipped, zero failures; type checking and the production build passed.

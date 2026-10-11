# Current-price collection repair

Owner request: repair Inverters R Us and NAZ, refresh every catalog listing regularly,
and leave working collection running. No historical backfill is resumed.

1. Reproduce source failures and preserve source-policy checks. NAZ responds on
   this host but rejects GitHub's robots request; use an isolated local executor
   for that registered source. Inverters R Us intermittently returns HTML for its
   Store API feed; classify refusals, recover ordinary malformed-feed responses,
   and refresh known product pages when their identities are verifiable.
2. Test then implement fair refresh rotation across all known URLs, including
   snapshot listings. Store a separate refresh cursor; advance it after attempted
   targets even when a removed target fails. Retain discovery's independent cursor.
3. Feed collection traverses up to the configured page budget, and schedules a
   short continuation when the full catalog has not been exhausted. Ensure each
   enabled catalog has at least daily coverage, while ordinary small feeds stop
   immediately on their last page. Retain source request spacing and leases.
4. Remove the silent 5,000-product catalog truncation so accepted observations
   for later products remain visible. Keep bounded catalog serving and caching.
5. Run regression tests, typecheck, production build, merge/publish, and verify
   source-specific fresh observations. Configure local NAZ continuation with an
   explicit availability requirement; report remaining blocked/removed listings.

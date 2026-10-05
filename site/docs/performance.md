# Catalog loading and storage

D1 is the authoritative SQL database for products, offers, price observations, builds, reviews, watches and alerts. The versioned catalog and specification files provide a dated fallback. The hosting manifest currently has no R2 binding. R2 is object storage: useful for future managed thumbnails, PDFs and exports, rather than relational price history or private account records.

## Load path

- The root layout reads request authentication only. It does not query D1 or embed the entire catalog in every HTML/RSC response.
- Parts, builder, comparisons and other equipment workspaces load `/api/catalog?view=summary`. A fetch preload overlaps that request with hydration. The public summary omits long descriptions, galleries and sourced detail records, preserving all exact filter/compatibility specs, offer IDs, quantities, price timestamps and source links.
- The public D1 catalog is cached in the Worker isolate for 30 seconds, with simultaneous requests sharing one read. The serialized summary is reused for that same lifetime. This is an optimization, not durable storage; a new isolate still reads D1.
- Browser HTTP and session caches reuse only this public catalog. Its absolute server expiry travels with the response, so navigation never extends an older catalog's lifetime. Expired or corrupt caches are discarded. Disabled browser storage and failed loads have a retry path; fetches time out after 15 seconds.
- Collector and authorized admin mutations invalidate this isolate's cache before and after writes, including partially failed ingestion. Other isolates and already-open browser caches expire within their existing 30-second lifetime. Account data is never added to this cache. Validation during saves, ownership checks, alert evaluation and the full catalog API still read authoritative data without this public cache.
- Database-unavailable snapshots are not retained as healthy cached results. Offer observation timestamps are unchanged; the existing freshness rules still exclude stale offers.
- Guide articles and calculators render without requesting the product catalog. Product pages render their sourced detail directly; the global catalog loads separately. Price history/reviews are requested on their tabs, and the Recharts bundle loads only with a price chart. Watch-list alert dialogs no longer import the detail page/chart library.
- Native page navigation remains in place because the installed beta framework has a known production RSC namespace-export failure. Session reuse removes repeated catalog transport during those page transitions without reviving that error.

## Measurement

On the public version 17 before this change, an ordinary HTTP homepage response contained 1,525,658 decoded bytes; builder contained 1,394,466 bytes. One live browser homepage sample measured first contentful paint at 2,428 ms, TTFB at 1,820 ms and document transfer at 134,681 compressed bytes. A full catalog API sample reported 778 ms of server catalog work. These are samples from this machine/network, not percentile claims.

The browser User Timing mark `pv-catalog-ready` identifies when the catalog-dependent working surface commits. Compare that as well as first contentful paint: the loading shell alone is not the completed equipment list. Inspect `Server-Timing: catalog` on the summary API for the database/cache cost. Measure first visits separately from subsequent navigation and preserve the same viewport/network when comparing.

Regression checks cover cache coalescing, expiry, invalidation races, failure recovery, browser reuse and storage-disabled behavior, alongside existing pricing/quantity/compatibility tests. Production browser checks must include catalog filtering, builder quantities returning from the picker, watches, comparisons, Guide and lazy price charts.

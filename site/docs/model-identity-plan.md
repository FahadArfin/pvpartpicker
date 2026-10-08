# Model identity implementation plan

Goal: combine reviewed equipment identities in browsing while preserving original offer/package histories and ongoing scraping.

Architecture: immutable reviewed registry -> cached page projection retaining every raw product ID -> compact model list and package selector. Collection and backfill continue using the raw catalog and unchanged offers. Implement inline in the root feature branch; the checkout is clean and all writes stay in the authorized workspace.

- [x] Test identity guards, package isolation, duplicate offer IDs, raw-record immutability, old aliases and pack-aware build selection before implementing the pure projection.
- [x] Seed reviewed exact-model candidates, excluding conflicts. Record conservative selected package identities; unresolved bundles remain separate.
- [x] Apply the projection to page/product/history/build/alert reads. Keep raw catalog, ingestion, backfill, queue and scraper code untouched. Test history offer selection and build pricing.
- [x] Add model/all-listings control and purchase-options selector using existing tokens/SiteLink. Keep prices/history/specs visible and original package targets intact.
- [x] Run tests and typecheck, build, inspect day/night desktop and phone behavior, record QA. GitHub delivery and Sites publication follow after these checks.

- [ ] Finish GitHub CI/merge, Sites publication and live verification.


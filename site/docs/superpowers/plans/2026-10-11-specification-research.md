# Verified specification research implementation plan

Goal: research all current catalog categories and fill only source-verified exact-item gaps while normal price scraping continues.
Spec: canonical output/specification-research/README.md, approved by owner October11.
Architecture: reuse the cached source/PDF collection and reviewed transcription importer. Read a current catalog snapshot explicitly; retain all listing IDs, prices and history. Evidence stays source-linked and uncertain revisions remain excluded. Export category tables and remaining gaps separately.

- [ ] Task1: accept explicit --catalog in source collector and importer; cache existing sources and persist progress, retain previous evidence for unrelated IDs, no price writes. Tests pin input selection, reviewed identity checks and old evidence retention.
- [ ] Task2: fetch missing current pages and documents with existing per-origin rate/robots/refusal guards. Research manufacturer documents across12categories; reviewed records must list exact product IDs and carry expected names/source identity. Never apply aggregate kit/pallet specs to individual units.
- [ ] Task3: generate guarded current evidence; import reviewed tables with source/revision information. Reject mismatched models, capacities, panel powers and conflicting ratings. Export coverage/remaining queue against normalized current catalog.
- [ ] Task4: tests/typecheck/build, independent review and browser comparison verification both themes/mobile. Commit/CI/merge/publish exact existing Sites artifact; verify live values and enabled scraping.

Ruling: no new unattended external automation or database mutation is required. This run performs a resumable research pass and ships accepted static evidence; unresolved fields stay unknown. Verified source records do not mean all model fields are known.
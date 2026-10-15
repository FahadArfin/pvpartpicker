# Specification research batch twenty-two

Added 227 independently reviewed technical fields from 43 source records, resolving 42 comparison gaps. Eight unsupported existing values were quarantined separately, restoring three unknown comparison cells: net gap reduction 39. The fixed 8,729-listing snapshot has 7,390 listings with 39,103 missing comparison fields across all 12 categories. Research continues; publication is tracked in the release proof.

## Evidence and holds

Exact source/offer model, SKU, pack and condition bindings were independently reviewed. Five conflicting operating-temperature rows and six conflicting dimensions remain held. Used products receive qualified manufacturer model ratings, not inferred used-unit warranties. Source citations and dates are preserved. The combined output retains 30,371 prior strong fields and 8,305 source objects, apart from the eight explicitly reviewed quarantines. The registry now contains 4,504 source records.

The quarantine ledger suppresses only exact bad field/source/identity tuples. All four specification writers reject their reintroduction. These corrections are not counted as new research facts. Existing identity and WattCycle guards remain enforced.

## Queue and catalog growth

The fixed pre-import catalog had 39,142 gaps. Catalog size grew by 82 listings from the last live release check (8,647); this growth is separate from the batch's research gains. The queue preserves 3,036 earlier unique attempts and adds 118 documented inspections with 129 holds; no families are newly declared exhausted. Later Luna cohorts remain isolated and require their own validated imports.

## Validation

671 tests passed, zero failed, 11 optional tests skipped; type checking and production build passed. Independent review verified exact CLI/in-memory replay, idempotence, 172 identity negative controls, 43 full/light comparisons, 73 source hashes, 35 selected offer bindings, and retention. Publication and live runtime verification are recorded separately. Current offers, historical observations and price workflow configuration are unchanged.

The built database API initially exposed an offer-hydration ordering regression: quarantine identities were checked before selected offers loaded. Attachment is now deferred to the fully hydrated selection. Two regression tests verify retained facts and rejection of mismatched SKU/pack/condition; independent probes also reject duplicate/mapped offers and duplicate metadata.

# Specification batch two

Owner requested another verified batch across all12categories while price scraping continues. Baseline main ff0d5e6 / Sites99:7,213listings,6,085withgaps,41,776missingcomparisonfields.

- Research generation categories (panels,inverters,charging,all-in-one), balance categories (wiring,electrical,mounting,module-electronics), storage/misc (batteries,monitoring,accessories,kits) from exact manufacturer evidence.
- Independent source/schema/runtime review; exclude contradictory/ambiguous/revisionless data and preserve conditional ratings.
- Guarded importer retains all previous records and current catalog/offer IDs. Snapshot generated from samecurrentcatalogbefore/after; reportnewtechnicalfields andresolvedcells separately.
- Full tests/typecheck/build and browser sample checks; reviewedcommit/CI/merge thenexistingSitespublishexactartifact/liveproof.

Ruling: unavailable source or manufacturer omission stays unresolved. A reviewed category need not produce an accepted import. No scraper scripts,workflows,schedules,currentoffers or historicalprices are modified. Research is a manual-reviewed batch; progress remains a saved snapshot.

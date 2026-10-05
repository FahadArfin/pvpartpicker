# Solar tier lab - October 5, 2026 edition

`/tiers` now covers 124 exact models/revisions: 36 all-in-one batteries, 26 standalone solar batteries, 28 panels and 34 inverters. The October 5 expansion adds 104 documentation-based provisional assessments to the original 20 entries. New assessments include manufacturer evidence, specifications, strengths, limitations and model/region caveats; they are not comparative lab-test results or sales-popularity statistics.

## Evidence and editorial judgments

Research is stored in `site/data/tiers.json`. Each entry records its review date, use case, editorial tier, strengths, limitations, and attributed sources with the specific evidence they supply. Sources include manufacturer documentation, first-hand reviewer tests, and owner discussions. Reviewer commercial incentives and anecdotal limitations are disclosed in the UI. No fabricated community stars, failure rates, or lifetime claims are supplied.

S/A/B/C are qualitative judgments for the stated application, considering documented capability, charging/output performance, practicality, warranty/support evidence and limitations. They are not benchmark scores or blanket brand grades. Documentation-only assessments are provisional. A new model requires its own evidence; an older generation's results do not transfer automatically.

## Price-value rules

Price tiers use explicitly reviewed base-configuration product IDs, fresh (24 hours), new, confirmed in-stock USD offers. Similar names, accessories, expansion batteries, bundles, unmatched revisions, unknown stock and expired observations do not qualify. If no offer qualifies, show Unpriced.

Use rated kWh for batteries/stations, front-side STC watts for panels, and battery-only continuous AC output for inverters. Conditional inverter output and grid pass-through are excluded from the denominator. Grid-only string/microinverters have no battery-only price metric and remain unpriced. Unknown battery-only AC watts use a zero denominator and cannot qualify for price value. VA ratings are never silently converted to watts. Pallet unit cost is displayed with the entire purchase minimum. Build quantity actions preserve the selected product and its matching offer ID.

Published cost thresholds (S / A / B maximum; C above B):

| Family | Unit | S | A | B |
| --- | --- | --- | --- | --- |
| Stations | USD / rated kWh | 400 | 600 | 900 |
| Batteries | USD / rated kWh | 220 | 300 | 400 |
| Panels | USD / front-side W | 0.30 | 0.45 | 0.60 |
| Inverters | USD / battery-only AC W | 0.30 | 0.40 | 0.60 |

These are explicit editorial bands, not measured market percentiles. Freight, tax, installation and required accessories are excluded. Cost tiers do not establish quality or compatibility.

The existing collector refreshes prices. Reload the page to receive new catalog observations; eligibility is rechecked every minute. Editorial tiers/evidence need a manual research update. Do not change research dates merely because the collector ran. Add a product ID to a ranked model only after verifying exact model, condition and configuration. Manufacturer/retailer revisions that cannot be resolved remain unpriced in the value board.

## Validation

Domain tests cover classification, bundle arithmetic, excluded stale/used/unavailable offers, exact configuration matching, panel power denominators, package purchase minimums and evidence coverage. Browser checks cover all four families, use-case/search filters, hover/click inspection, price mode, coherent product/offer equipment selection and mobile overflow. Live validation must confirm database-backed catalog storage and preserved real history.

## Battery format filtering

Supported mounting formats are explicit arrays, independent of use case: standing/floor, server rack, wall mounted and stackable. A model may support more than one format with required mounting hardware. Format, search (including specs) and use-case filters compose; switching family clears all filters. Counts show filtered versus researched models. Empty formats are omitted from the menu. Floor-mounted batteries may still require wall attachment or a separate stand; each evidence card records these conditions.

## Expansion provenance

Exact base-unit catalog IDs are attached only after checking model and capacity; ambiguous variants remain unpriced. Photos may identify the manufacturer model family, with this boundary noted in sources, and never qualify a model for pricing. Repeated source URLs are merged. Missing verified photos remain labeled rather than substituting a different generation. Price eligibility is memoized per category/catalog observation/time check so inspecting the larger board does not repeatedly scan offers.

Current EG4 280Ah Indoor datasheet v1.1.8 overrides an outdated marketing-page current claim: 140A continuous and 200A for 30 minutes. The Pytes V10α March 2026 sheet says 9.98kWh rated despite a 10.24kWh marketing-page headline; the sheet value is retained, with the discrepancy disclosed.

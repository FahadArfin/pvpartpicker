# Repair selected battery-pack quantities after offer hydration

Live version109 correctly classifies DPU battery modules and preserves per-module capacity, but the catalog reader attaches recorded database offers after categorization. Selected2–5battery packs consequently retain recorded quantity1; the client does not repair it. A reader→client→cost regression reproduces a two-unit subtotal8736 instead4368 for one two-pack sale.

Reuse exact selected-variant offer quantity normalization after hydration, preserving all reviewed scalar specifications and source objects rather than recategorizing enriched products. Preserve actual price amounts, stock, observation dates, history and explicit owner overrides. Retain recorded quantity metadata and exact offer origin/path/variant binding; do not infer packs for mixed kits or accessories.

Original role implementer diagnoses and fixes with a failing integrated reader/loader/cost regression. Independent code review, full tests/types/build, CI/merge, exact provider publish and terminal live API/asset/unit-cost verification precede the next research batch. Normal hosted retailer collection stays enabled; no source-vendor lookups, UI layout edits or archival changes.

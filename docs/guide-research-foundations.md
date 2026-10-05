# Foundations textbook research ledger

Reviewed: 2026-10-05. Scope: the fifteen slugs in `site/data/guide-textbook-foundations.json`. Existing foundations and Solar4U material was read for continuity. The replacement text is original teaching prose; manuals are linked references, not reproduced chapters. All numerical purchase, tariff, load, module, battery, loss, and scheduling examples are explicitly hypothetical unless an exact real product is named.

## Source checks

These primary pages were opened or retrieved through web search during this work; each returned readable content. The chapter-level sources collect the section-specific references. A successful retrieval establishes access on the review date, not permanence or approval for a particular installation.

- [DOE: PV system design basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-system-design-basics)
- [DOE: Inverters and grid services](https://www.energy.gov/cmei/systems/solar-integration-inverters-and-grid-services-basics)
- [DOE: Homeowner’s guide to solar](https://www.energy.gov/cmei/systems/homeowners-guide-solar)
- [DOE: Solar rooftop potential](https://www.energy.gov/cmei/systems/solar-rooftop-potential)
- [DOE: Permitting and inspection](https://www.energy.gov/cmei/systems/permitting-and-inspection-rooftop-solar)
- [Victron Wiring Unlimited: electrical theory](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/theory.html)
- [Victron Wiring Unlimited: DC wiring](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/dc-wiring.html)
- [Victron Wiring Unlimited: AC wiring](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/ac-wiring.html)
- [Victron Wiring Unlimited: communication wiring](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/communication-wiring.html)
- [Victron SmartSolar MPPT 150/35 and 150/45: specifications](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_150-35__150-45/en/technical-specifications.html)
- [Victron SmartShunt: operation and interpretation](https://www.victronenergy.com/media/pg/SmartShunt/en/operation.html)
- [Victron SmartShunt: battery settings](https://www.victronenergy.com/media/pg/SmartShunt/en/all-features-and-settings.html)
- [Victron SmartShunt: troubleshooting readings](https://www.victronenergy.com/media/pg/SmartShunt/en/troubleshooting.html)
- [NLR: PVWatts V8 input and output documentation](https://developer.nlr.gov/docs/solar/pvwatts/v8/)
- [Sandia PVPMC: weather and design inputs](https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/)
- [Sandia PVPMC: module current-voltage characteristics](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/)
- [Sandia PVPMC: combining modules into an array](https://pvpmc.sandia.gov/modeling-guide/3-dc-array-iv/)
- [Sandia PVPMC: DC to AC conversion](https://pvpmc.sandia.gov/modeling-guide/dc-to-ac-conversion/)
- [Sandia PVPMC: AC system output](https://pvpmc.sandia.gov/modeling-guide/5-ac-system-output/)
- [NREL: PV and energy storage operation and maintenance, third edition](https://www.nlr.gov/docs/fy19osti/73822.pdf)
- [IronRidge: Flush Mount installation manual](https://files.ironridge.com/pitched-roof-mounting/resources/brochures/IronRidge_Flush_Mount_Installation_Manual.pdf)
- [IronRidge: Ground Mount system](https://www.ironridge.com/ground-based/)
- [CFPB: Solar financing issue spotlight (2024)](https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/)
- [NLR: System Advisor Model financial models](https://sam.nlr.gov/financial-models.html)
- [IRS: Current Form 5695 instructions and credit termination](https://www.irs.gov/instructions/i5695)
- [IRS: Public Law 119-21 clean energy credit modifications FAQ](https://www.irs.gov/newsroom/faqs-for-modification-of-sections-25c-25d-25e-30c-30d-45l-45w-and-179d-under-public-law-119-21-139-stat-72-july-4-2025-commonly-known-as-the-one-big-beautiful-bill-obbb)
- [Victron: PV curves, MPPT, and temperature (2020 technical paper)](https://www.victronenergy.com/upload/documents/Technical-Information-Which-solar-charge-controller-PWM-or-MPPT.pdf)
- [DOE: PV performance and efficiency basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-performance-and-efficiency-basics)
- [Sandia PVPMC: inverter saturation and clipping](https://pvpmc.sandia.gov/modeling-guide/dc-to-ac-conversion/inverter-saturation-or-clipping/)
- [Sandia PVPMC: plane-of-array irradiance](https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/plane-of-array-poa-irradiance/)
- [Sandia PVPMC: model validation and data requirements](https://pvpmc.sandia.gov/model-validation/)

## Important boundaries and caveats

- **Current U.S. residential tax boundary:** IRS Form 5695 instructions and the Public Law 119-21 modification FAQ state that 25D is unavailable for expenditures after 2025-12-31; the latter explains installation-completion timing. The economics chapter uses no incentives. The 2024 CFPB report and some older IRS/DOE pages retain superseded incentive schedules and are not treated as current tax guidance. Historical carryforwards are distinguished from new-project eligibility.
- **Named real equipment:** SmartSolar MPPT 150/35 and 150/45 specification headings were checked for 150 V maximum PV open-circuit voltage, separate PV short-circuit limits, battery-current ratings, startup notes, and model distinctions. The examples do not recommend a pairing or infer grid/backup capability from a solar charger. SmartShunt operation was checked for its positive-charge/negative-discharge convention, current integration, synchronization, and time-to-go limitations. Other equipment may use different signs.
- **PV input design:** cold Voc, hot operating voltage, tracking/startup, operating current, short-circuit current, input grouping, protection, and exact product permission remain separate checks. The hypothetical cold-voltage calculation supplies no location-specific design temperature or installation margin. It is not a wiring instruction.
- **Prediction boundaries:** simplified capacity-times-resource calculations are not PVWatts runs. PVWatts V8 fields and DC/AC units were checked against the current developer page. Exact dataset, geometry, loss, model, and conversion assumptions must accompany a real estimate. Clipping and curtailment are distinguished; oversizing does not authorize overvoltage or excessive current.
- **Shade:** optical loss remains even if electrical mismatch is reduced. Percentages in the comparison are invented, with no brand improvement guarantee. Detailed cell/bypass grouping must come from the exact module documentation.
- **Installation and owner tasks:** local permitting, utility review, and equipment-specific design remain controlling. Conceptual drawings, surveys, monitoring review, and arithmetic do not establish structural capacity, approved protection, safe switching sequences, or an installable circuit. Handover milestones and specific functional demonstrations remain distinct.
- **Source access issues:** the legacy DOE appliance-estimation URL returned 404 and was not included. The legacy `pvwatts.nrel.gov` fetch returned a gateway error; the verified V8 documentation at `developer.nlr.gov` is used instead. The O&M report retains its historical NREL authorship while its accessible host is now `nlr.gov`.
- **Data diagnosis:** missing samples stay missing; interval averages, snapshots, signs, timestamps, and meter boundaries are distinguished. No single chart pattern is presented as a unique fault diagnosis.

## Original artwork contract

Every chapter references at least one of the root-created original diagrams. All captions describe conceptual or explicitly hypothetical conditions; no manufacturer illustration was copied. The chapter references use `energy-flow`, `series-parallel`, `iv-curve`, `module-anatomy`, `battery-bank`, `inverter-topology`, `roof-load-path`, `ground-spacing`, `dc-protection`, `meter-boundaries`, `cash-flow`, `commissioning`, and the additional `power-and-energy` plot requested by root. The latter compares hypothetical 2 kW × 3 h and 6 kW × 1 h profiles with equal 6 kWh energy. Captions and alt text are supplied in the data file; section titles omit numeric prefixes because the reader numbers them.

## Validation

- Fifteen exact contracted chapter slugs; replacement data contains `sections`, deduplicated primary `sources`, `outcome`, and `reviewed: 2026-10-05`.
- Each chapter contains eight pedagogically ordered sections, a real `workedExample` object, a real `exercise` object with answer and explanation, a reference table, and figures with caption and alt text.
- JSON parsed successfully with PowerShell `ConvertFrom-Json`; every table row matches its column count. Teaching word counts exclude source labels/URLs, diagram IDs, and alt text, while including section titles, paragraphs, tables, examples, exercises, formulas, and captions.
- Root owns reader integration, artwork verification, repository tests, commit, and publication. This ledger records content/data checks rather than claiming those broader results.


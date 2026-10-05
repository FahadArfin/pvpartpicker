# Equipment textbook research ledger

Reviewed: 2026-10-05. Scope: the 12 equipment chapters in `site/data/guide-textbook-equipment.json`. Primary source research, original explanations and clearly marked teaching calculations. No manufacturer manual is reproduced. No equipment prices, tax eligibility, final local code determinations or construction specifications are inferred from these sources.

## Research and verification method

The equipment JSON replaces the existing sections for its assigned slugs. Research used manufacturer-hosted datasheets/manuals, DOE, Sandia PVPMC, the California Energy Commission and the SolarAPP+ project documentation. Source links are attached to the relevant teaching sections as well as aggregated at article level. Model-specific facts are separated from hypothetical values and from conditional planning estimates.

URLs below were checked by primary-source search/open on 2026-10-05. Some documentation uses JavaScript or provides limited searchable HTML; those limitations are recorded rather than silently assuming all manual text was exposed. Source availability today does not guarantee unchanged future specifications. Current delivered equipment identity, regional revision, manual and approved configuration control a real project.

PDF extraction can reorder columns. The Trina APAC PDF was also downloaded to a temporary location, rendered with the bundled pypdfium2 runtime, and visually inspected at page 2. An early extracted-column reading corresponded to the neighboring 435 W bin. It was corrected before the JSON was written: the final 440 W NOCT values are **337 W / 41.4 V / 8.14 A / 49.5 V / 8.60 A**, not the 435 W values 333 W / 41.0 V / 8.12 A / 49.1 V / 8.58 A.

## Exact module example and page references

Source: [Trina TSM-NEG9R.28 APAC EN 2024_D PDF](https://static.trinasolar.com/sites/default/files/DT-M-0043%20APAC%20EN%20I%20210RVertexS%2B_NEG9R.28_430-460%202024_D_web.pdf). Page 1 identifies the family as 430–460 W, n-type i-TOPCon, dual glass. Page 2 contains the STC and NOCT tables, temperature ratings, maximum ratings, dimensions and connector information. The printed version identifier is `TSM_APAC_EN_2024_D`. This is an archived regional teaching example, not a statement about every current seller's inventory.

| Page 2, TSM-440NEG9R.28 column | STC | Published NOCT table |
| --- | --- | --- |
| Pmax | 440 W | 337 W |
| Vmp | 44.0 V | 41.4 V |
| Imp | 10.01 A | 8.14 A |
| Voc | 52.2 V | 49.5 V |
| Isc | 10.67 A | 8.60 A |
| Module efficiency | 22.0% | Not published as a row |

STC conditions: irradiance 1,000 W/m², cell temperature 25°C, AM1.5. The second table is explicitly labeled **NOCT**, with irradiance 800 W/m², ambient temperature 20°C and wind speed 1 m/s. The temperature-rating box gives NOCT 43°C ±2°C. The electrical table at those reference conditions is separate from how the nominal operating temperature was characterized.

Published coefficients on page 2: Pmax −0.29%/°C, Voc −0.24%/°C, Isc +0.04%/°C. No Vmp temperature coefficient is published in this sheet. The JSON therefore does not claim an exact Trina Vmp value at 70°C or invent that coefficient from Pmax and Isc slopes.

Other page-2 facts used selectively: dimensions 1,762 ×1,134 ×30 mm; mass 21.0 kg; TS4 Plus/TS4 connectors; maximum series-fuse rating 25 A. These do not establish connector interchangeability, a fuse choice or site structural suitability. Dual glass is not treated as proof of a useful rear-side rating.

Arithmetic audit:

- STC Vmp×Imp =44.0×10.01 =440.44 W, consistent with rounded displayed values.
- NOCT Vmp×Imp =41.4×8.14 =336.996 W, consistent with the published 337 W.
- NOCT/STC power ratio =337/440 =76.59%; explicitly not an annual derate.
- Voc×Isc =52.2×10.67 =556.974 W; these endpoints do not occur simultaneously.
- Approximate fill factor =440/556.974 ≈0.790; an original interpretation exercise.
- Area =1.762×1.134 =1.998108 m²; 440/(1,000×area) ≈22.02%.
- Hypothetical Tmin −15°C: multiplier 1.096; module cold Voc57.2112 V; 2S114.4224 V; 3S171.6336 V; 4S228.8448 V.
- Illustrative ambient30°C/irradiance1,000/noct43 thermal approximation yields58.75°C; first-order power396.935 W. It is labeled a simplified open-rack estimate, not a measured rating or a roof prediction.

## NOCT versus NMOT provenance

The [California Energy Commission 2026 equipment-list RFI](https://efiling.energy.ca.gov/GetDocument.aspx?DocumentContentId=107115&tn=269961), PDF printed page 3, explicitly describes NOCT testing with the module open-circuited and NMOT with the module under load. It discusses why NMOT is not a drop-in replacement in a particular NOCT-dependent PTC calculation. The textbook uses this as primary evidence for the distinction. It does **not** present the RFI as an adopted universal regulatory rule or rename Trina's NOCT table NMOT.

Sandia's thermal modeling pages provide context for environment, mounting and cell/module-temperature assumptions. A nominal operating temperature is not a universal operating ceiling, a fixed outdoor temperature or a complete annual-energy model.

## Model-specific controller and inverter facts

[Victron SmartSolar MPPT 150/60–250/70 technical specifications](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_150-60_up_to_250-70/en/technical-specifications.html), section 9.1 and its footnotes:

- MPPT150/60 battery-output current60 A.
- Maximum PV short-circuit current50 A.
- Cold absolute Voc maximum150 V; startup/operating maximum145 V.
- Nominal PV power at48 V battery class3,440 W.
- Startup PV voltage must exceed Vbat+5 V; subsequent stated minimum is Vbat+1 V.
- Covered MC4 connection pairs are internally parallel to one tracker; stated connector maximum30 A.

The JSON does not apply these footnotes to every MPPT or power station. Source current, connector current, battery-output current and watts remain separate. Passing a teaching voltage screen never implies a complete installation approval.

[Victron Inverter RS Smart Solar PIN482601000 manual](https://www.victronenergy.com/media/pg/Inverter_RS_Smart_Solar/en/technical-specifications.html), section 7, and [manufacturer datasheet](https://www.victronenergy.com/upload/documents/Datasheet-Inverter-RS-Smart-Solar-EN.pdf):

- 230 VAC example; not represented as a North American split-phase product.
- Continuous output at25°C rises from4,800 W at46 VDC to5,300 W at52 VDC.
- Continuous output4,500 W at40°C and3,000 W at65°C.
- Temporary peaks9 kW for3 s and7 kW for4 min.
- Startup PV voltage120 V.

The non-solar Inverter RS Smart PIN482600000 has a separate manual and different figures; it is not substituted. Search results and product overview pages can differ in PV range/short-circuit detail from a specific manual revision. The chapters avoid prescribing arrays for this product and instruct the reader to use exact equipment/current manual and all footnotes. Peak efficiency and idle draw are discussed as conditional ownership variables, not a fixed runtime model.

## Battery facts and architecture boundaries

[Victron Lithium NG51.2 V/100 Ah technical data](https://www.victronenergy.com/media/pg/Lithium_NG_battery_51%2C2_V/en/technical-data.html), section8.1:

- Nominal energy5,120 Wh at25°C, under the stated rate condition.
- Continuous discharge100 A; pulse200 A for10 s.
- Discharge range−20°C to+50°C; charge+5°C to+50°C.
- Separately purchased compatible Lynx Smart BMS NG required.

The system-design chapter's own product-family table distinguishes permitted 12.8 V,25.6 V and51.2 V arrangements. The textbook does not permit arbitrary series stacking of51.2 V modules. Arithmetic examples using generic batteries are explicitly hypothetical and conditional on approval. No cable-size, fuse-size or BMS setting is prescribed.

Certification wording is treated literally: cell-level testing, battery certification, combination-specific approval and entries marked pending are different. No pending item is promoted to certified, and no national/local installation approval is inferred from a generic manufacturer datasheet.

The Victron AGM/Gel datasheet uses20-hour discharge capacity and presents rate-dependent effective capacity. Its cycle/float information is not generalized to all lead-acid products. Fictional50%/80% available-energy windows in the chemistry chapter are chosen teaching assumptions, not chemistry-wide allowable discharge limits.

## EcoFlow regional and documentation caveats

The [US DELTA Pro3 product page](https://www.ecoflow.com/us/delta-pro-3-portable-power-station) establishes the normal rated4,000 W output and2,600 W combined PV headline. The [US detailed specifications/FAQ](https://us.ecoflow.com/collections/whole-home-backup-power-solutions/products/ecoflow-delta-pro-3-smart-generator-4000-transfer-switch) give4,096 Wh capacity and individual ports: high-PV30–150 V/15 A/1,600 W; low-PV11–60 V/20 A/1,000 W. The [US manual entry](https://manuals.ecoflow.com/us/product/delta-pro-3-portable-power-station?lang=en_US) is JavaScript-driven: primary-source search exposed the high-port wording, while normal open returned little searchable content. The detailed manufacturer FAQ was opened and used to corroborate both ports and nominal capacity.

These are US figures. X-Boost is kept separate from normal regulated output. Expansion energy does not automatically increase inverter watts. The chapter's array and runtime calculations have explicit hypothetical module/loss assumptions; they are not recommended arrays or manufacturer runtime tests. The manufacturer FAQ contains unrelated historical tax-credit copy; none of that copy is used for tax or financial guidance.

## Connector and monitoring evidence

[Stäubli MA298](https://www.staubli.com/content/dam/spot/PV_MA298-en.pdf) is model-specific assembly documentation. The inspected PDF applies to its stated MC4-Evo2 connector variants; the visible printed issue line includes10.2023/indexa. The date inferred by a search engine is not substituted for that printed document revision. The guide intentionally does not copy stripping dimensions, torques or live-service steps.

[Stäubli's cross-connection statement](https://www.staubli.com/global/en/electrical-connectors/industries/renewable-energy/cross-connection.html) and [April2024 intermateability matrix](https://www.staubli.com/content/dam/ecs/pictures/solar-photovoltaics/Staubli-MC4-%20Intermateability-en-20240404.pdf) are used together: matching shape or another brand's compatible claim does not establish approval, while specifically documented same-manufacturer family combinations should be evaluated by their own matrix and product documentation.

SmartShunt operation, configuration, installation, feature and Peukert pages support distinct measurement, synchronization, boundary and model questions. Worked current-integration/drift calculations are original hypothetical arithmetic. A monitor's state of charge is not treated as cell protection, a guaranteed capacity test or permission to override a BMS.

## Permitting and safety scope

DOE and SolarAPP+ sources explain process and site-specific inspection evidence. The chapters distinguish permitting, field inspection, utility authorization and functional commissioning. They do not state a universal permit exemption, code edition, conductor correction factor, neutral bond or installed-storage approval. Hardware and local requirements must be resolved for the actual configuration.

## Checked source register

- [Trina Solar · TSM-NEG9R.28 APAC EN 2024_D datasheet](https://static.trinasolar.com/sites/default/files/DT-M-0043%20APAC%20EN%20I%20210RVertexS%2B_NEG9R.28_430-460%202024_D_web.pdf)
- [California Energy Commission · 2026 equipment-list RFI: NOCT and NMOT distinction](https://efiling.energy.ca.gov/GetDocument.aspx?DocumentContentId=107115&tn=269961)
- [Sandia PVPMC · DC module IV characteristics](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/)
- [Sandia PVPMC · Effective irradiance](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/effective-irradiance/)
- [Sandia PVPMC · NOCT cell-temperature model](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/cell-temperature/noct-cell-temperature/)
- [Sandia PVPMC · Sandia cell-temperature model](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/cell-temperature/sandia-cell-temperature-model/)
- [DOE · Photovoltaic performance and efficiency basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-performance-and-efficiency-basics)
- [Victron · SmartSolar MPPT 150/60–250/70 specifications](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_150-60_up_to_250-70/en/technical-specifications.html)
- [DOE · Photovoltaic technology basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-technology-basics)
- [DOE · Solar photovoltaic cell basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-cell-basics)
- [Victron · Wiring Unlimited DC wiring](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/dc-wiring.html)
- [Victron · Inverter RS Smart Solar PIN482601000 specifications](https://www.victronenergy.com/media/pg/Inverter_RS_Smart_Solar/en/technical-specifications.html)
- [DOE · Inverters and grid services](https://www.energy.gov/cmei/systems/solar-integration-inverters-and-grid-services-basics)
- [DOE · Distributed energy resources and microgrids](https://www.energy.gov/cmei/systems/solar-integration-distributed-energy-resources-and-microgrids-basics)
- [Victron · Inverter RS Smart Solar datasheet](https://www.victronenergy.com/upload/documents/Datasheet-Inverter-RS-Smart-Solar-EN.pdf)
- [EcoFlow · US DELTA Pro 3 product specifications](https://www.ecoflow.com/us/delta-pro-3-portable-power-station)
- [DOE · Solar energy and storage basics](https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics)
- [Victron · Wiring Unlimited grounding and electrical safety](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/ground,-earth-and-electrical-safety.html)
- [Victron · Lithium NG 51.2 V/100 Ah technical data](https://www.victronenergy.com/media/pg/Lithium_NG_battery_51%2C2_V/en/technical-data.html)
- [DOE · Homeowner’s guide to solar](https://www.energy.gov/cmei/systems/homeowners-guide-solar)
- [DOE · Reducing cobalt reliance in lithium-ion batteries](https://www.energy.gov/cmei/vehicles/articles/reducing-reliance-cobalt-lithium-ion-batteries)
- [DOE · 2022 grid storage cost and performance assessment](https://www.energy.gov/cmei/2022-grid-energy-storage-technology-cost-and-performance-assessment)
- [Victron · Lithium NG operating instructions](https://www.victronenergy.com/media/pg/Lithium_NG_battery_51%2C2_V/en/operation.html)
- [Victron · Gel and AGM battery datasheet](https://www.victronenergy.com/upload/documents/Datasheet-GEL-and-AGM-Batteries-EN.pdf)
- [Victron · Capacity and Peukert exponent](https://www.victronenergy.com/media/pg/SmartShunt/en/battery-capacity-and-peukert-exponent.html)
- [Victron · Wiring Unlimited battery-bank wiring](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/battery-bank-wiring.html)
- [Victron · Wiring Unlimited electrical theory](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/theory.html)
- [Victron · Lithium NG system design and BMS selection](https://www.victronenergy.com/media/pg/Lithium_NG_battery_51%2C2_V/en/system-design-and-bms-selection-guide.html)
- [Victron · Lithium NG 12.8 V technical data](https://www.victronenergy.com/media/pg/Lithium_NG_battery_12%2C8_V/en/technical-data.html)
- [Victron · SmartShunt measurement boundaries](https://www.victronenergy.com/media/pg/SmartShunt/en/installation.html)
- [Victron · SmartShunt operation and synchronization](https://www.victronenergy.com/media/pg/SmartShunt/en/operation.html)
- [Victron · SmartShunt configuration](https://www.victronenergy.com/media/pg/SmartShunt/en/configuration.html)
- [Victron · SmartShunt features and settings](https://www.victronenergy.com/media/pg/SmartShunt/en/all-features-and-settings.html)
- [EcoFlow · US DELTA Pro 3 user manual](https://manuals.ecoflow.com/us/product/delta-pro-3-portable-power-station?lang=en_US)
- [EcoFlow · US DELTA Pro 3 detailed port and capacity specifications](https://us.ecoflow.com/collections/whole-home-backup-power-solutions/products/ecoflow-delta-pro-3-smart-generator-4000-transfer-switch)
- [Stäubli · PV connector cross-connection statement](https://www.staubli.com/global/en/electrical-connectors/industries/renewable-energy/cross-connection.html)
- [Stäubli · MC4 intermateability matrix, April 2024](https://www.staubli.com/content/dam/ecs/pictures/solar-photovoltaics/Staubli-MC4-%20Intermateability-en-20240404.pdf)
- [Stäubli · MC4-Evo 2 MA298 assembly instructions](https://www.staubli.com/content/dam/spot/PV_MA298-en.pdf)
- [DOE · Permitting and inspection for rooftop solar](https://www.energy.gov/cmei/systems/permitting-and-inspection-rooftop-solar)
- [DOE · Consumer solar installation process](https://www.energy.gov/cmei/systems/articles/walk-me-through-it-step-step-guide-consumers-going-solar)
- [SolarAPP+ · Site-specific field inspections](https://help.gosolarapp.org/article/51-how-do-inspections-work-if-no-planset-is-submitted)
- [SolarAPP+ · Inspector checklist access](https://help.gosolarapp.org/article/57-how-do-inspectors-access-the-inspection-checklist)

## Content validation

Parsed JSON with the bundled Python runtime. Verified exactly12 assigned slugs, reviewed date2026-10-05,10 sections per chapter, all table rows matching column counts, HTTPS source links, existing diagram files, and at least one figure, worked example and solved exercise in each chapter.

Total:120 sections,14 tables,14 figure references,12 worked examples,12 solved exercises. Figures are original root-agent SVGs; captions were checked against their actual markup. The additional temperature-voltage plot uses clearly hypothetical50 V/−0.25% per°C data, not the Trina rating. The root added module-anatomy to the module chapter during integration; it is included in the final counts below.

Textword count excludes source labels/URLs, review metadata and diagram IDs; includes article outcomes, titles, prose, tables, captions/alt and worked exercises:

| Chapter slug | Textwords |
| --- | ---: |
| module-datasheet | 1,655 |
| panel-technology | 1,617 |
| mppt-envelope | 1,628 |
| inverter-architectures | 1,558 |
| battery-backup | 1,503 |
| battery-chemistry | 1,427 |
| battery-bank-architecture | 1,466 |
| battery-monitoring | 1,446 |
| all-in-one-buying-guide | 1,539 |
| dc-wiring-protection | 1,401 |
| connectors-and-terminations | 1,425 |
| permits-and-inspection | 1,417 |
| Total | 18,082 |

No files outside the assigned equipment JSON and this ledger were edited, and no commit was created. Temporary research PDF/render files remain outside the repository.

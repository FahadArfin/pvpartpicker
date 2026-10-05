# Catalog filtering and equipment subcategories

Price is the first filter, followed by manufacturer and category attributes. Solar panel power uses [0,150), [150,350), [350,450), and [450,infinity) watts. Inverter output uses up to 2 kW, over 2–4, over 4–6, over 6–8, over 8–12, over 12–under 18, and 18+ kW. The extra 12–18 interval keeps intermediate models searchable without mislabeling them as 18+.

System voltage classes are 12, 24, 48, 120 and 400 V. Nominal LiFePO4 voltages 12.8, 25.6 and 51.2 map to 12, 24 and 48 respectively. Source voltage remains unchanged; the grouping is not a compatibility determination. Inverter AC-output voltages do not become battery-system classes. Continuous/rated output is parsed separately from surge and PV-input ratings; unknown output stays unfiltered in Any power.

Panel filters include monofacial/bifacial, N-type/P-type/Perovskite, and back contact alongside TOPCon/PERC/HJT. Back contact groups IBC/HPBC/HBC/ABC/BC without changing exact product technology. Perovskite is a material rather than a silicon doping class; it is included as requested for future products. Options without recorded evidence are visibly unavailable, never populated with fabricated listings. Generic monocrystalline does not imply monofacial, and comparison prose does not establish the product's cell type. Only labeled description specs supplement title extraction.

Batteries have Battery modules and Battery cabinets subcategories, plus Stackable format. Empty cabinets are excluded from battery compatibility checks and hide storage/chemistry/format filters when selected. Chemistry is hidden unless at least two recorded chemistry values exist.

Electrical subcategories: busbars, fuses, circuit breakers, conduit, boxes/combiners, disconnects, grounding, surge protection, and other electrical. Accessories: EV charging, battery chargers, adapters/communications, displays/controls, battery bases/stands, covers/carrying, appliances, and other accessories. Classification follows the main sale item: a fuse combiner is a box; a cabinet with included busbars is a cabinet. LCD-equipped inverters remain inverters; covers and screens are accessories.

All normalization runs for both stored and snapshot products, and is reused by the collector. IDs, offers, prices and observation dates are preserved. Owner overrides are applied after normalization.

## Source-backed enrichment reviewed October 4, 2026

- [Renogy's N-type series](https://www.renogy.com/pages/n-type-solar-panel) identifies the 100W series as monofacial; only matching source products at 100W receive that face metadata.
- [SunPower's E20 disclosure](https://www.sec.gov/Archives/edgar/data/867773/000086777313000012/spwr_12302012x10-k.htm) identifies the E20 series as back contact; the SanTan SPR-E20-327 source SKUs receive that technology and retain the citation.
- [Renogy's nominal system example](https://ca.renogy.com/content/manual/UM_12V%20200Ah%20Core%20Series%20Battery_A0_Specification.pdf) explicitly pairs 48V and 51.2V.
- [EcoFlow Power Kits](https://www.ecoflow.com/us/ecoflow-power-kits/series?activeTab=bundles) describes stackable batteries.
- [DOE perovskite research](https://www.energy.gov/cmei/systems/perovskite-solar-cells) supplies the material context; no new perovskite listings or prices were invented.

## Ecosystem browsing

A compact ecosystem toggle row groups exact manufacturer aliases across categories (for example Victron Energy, EG4 Electronics and EcoFlow US). Counts refer to catalog listings, not guaranteed availability. Choosing a brand opens All categories; subsequent category selection preserves the ecosystem. The builder picker keeps its requested equipment category. Search, unit-price, condition, stock and sorting filters continue to apply. Ecosystem and category are encoded in the URL for reloads and product-page links. Reset filters clears the ecosystem too.

All requested brands are selectable, including those with zero current catalog entries. Zero-entry brands show an explicit unlisted state; no products or prices are fabricated. Renogy is included because it also spans existing catalog categories. Third-party titles that mention brand compatibility are not included automatically. Brand membership is not a model-level compatibility verdict.

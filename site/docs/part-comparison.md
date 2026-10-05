# Parts list comparison

The inventory shows short display names without altering the retailer title, product ID, selected variant, offers, or build references. Selected pack/configuration text stays below the name. Full source titles remain in tooltips and product details. Watch lists, price-drop lists and builder selections use the same name formatter.

| Category | Comparison columns |
| --- | --- |
| Panels | Front-side STC watts, face, cell type/technology, module efficiency |
| Batteries | Nominal kWh, rated DC volts, chemistry, format, continuous discharge amps |
| All-in-one | Internal kWh, continuous AC kW, total PV input, published PV operating amps |
| Inverters | Continuous AC kW, total utilized PV kW, operating amps per MPPT, battery voltage |
| Controllers | Charge amps, PV voltage limit, PV power, battery voltage |
| Wiring | Gauge, length, connector |
| Mounting | Type, material, dimensions |
| Electrical | Type, rated amps, rated volts |
| Monitoring | Function, channels, communications |
| Module electronics | Function, operating amps, volts |
| Bundles | Bundle type, selected component types/counts |
| Accessories | Type, compatibility, dimensions |

Numeric headers sort ascending/descending with missing ratings always last. Mixed-category search uses category and key ratings instead of incorrectly labeling a battery capacity as panel power. Mobile rows retain labels; desktop rows align to common headers. The preview is optional so the comparison table has room. Product clicks enable it, double-click opens details, and watch/compare/quantity controls retain their existing behavior.

## Evidence and limits

The lightweight catalog response carries only comparison fields from matched technical sources. It does not send the full specification document or fetch detail pages per row. Existing listing specs fill fields when no matched technical field exists. Missing ratings appear as `—`; empty cabinets and DC-only stations use explicit N/A/DC-only states.

Power and storage are distinct units. Surge ratings, power-boost claims, battery current and PV short-circuit current do not replace continuous AC output or operating PV current. Compound current limits stay per tracker. Conditional power ratings retain their full conditions in the tooltip. Nominal energy can be calculated from matched rated voltage × Ah, or explicitly listed 12.8/25.6/51.2 V; a rounded 12/24/48 V title alone does not establish nameplate energy.

Research checked October 5, 2026:

- [EG4 18kPV sheet v1.4.3](https://eg4electronics.com/wp-content/uploads/2024/04/EG4-18KPV-12LV-Spec-Sheet.pdf): separate 12 kW AC output at 240 VAC, 18 kW utilized solar, 21 kW recommended maximum array, 25/15/15 A operating PV limits, and 31/19/19 A Isc limits. A reviewed record updates this exact model without applying those numbers to other EG4 products.
- [Victron MultiPlus-II technical specifications](https://www.victronenergy.com/media/pg/MultiPlus-II_230V/en/technical-specifications-mp-ii-230v.html): continuous power, apparent power, feed-through current, AC voltage and battery charging current have different meanings.
- [Victron Wiring Unlimited](https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/dc-wiring.html): gauge/cross-section and cable length matter together; this list does not infer cable ampacity from gauge alone.
- [Victron busbars](https://www.victronenergy.com/dc-distribution-systems/busbars): distribution hardware is compared by rated current and voltage.
- [IronRidge XR rails](https://www.ironridge.com/component/xr-rails/): rail family, finish, fit and published dimensions matter; generic dimensions do not establish structural compatibility.

Verification covers names/model codes, selected variants, source-field transport, units, rating separation, missing values, sorting, cabinets and DC-only stations, plus desktop/mobile interaction checks.

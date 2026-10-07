# Build analytics report

Builder → Analytics report reuses the Solar4U seasonal model and existing PVGIS climate service. Equipment remains the default tab. Analytics, Leaflet and map styling load only when requested.

## Inputs and production

Selected panel nameplate watts × installed unit quantity determines DC capacity. Retailer packs affect cost, not installed capacity. Kits, unavailable products and panels missing wattage require confirmation of total capacity before a whole-build report appears. No panel capacity is inferred from inverter output or bundle titles.

Search an address/city/postcode, select a result, click the map, drag the pin, use the map center or enter coordinates. Search results label their precision; a locality result must not be presented as an exact roof. Coverage is bounded to 66°S–66°N. One to four roof faces split capacity; shares rebalance to 100%. Direction uses compass bearings (180° south), converted to PVGIS aspect internally.

Climate production uses EU JRC PVGIS 5.3, fixed crystalline-silicon arrays, free-standing mounting, terrain horizon and entered aggregate losses. The report contains twelve long-term monthly averages, not a rolling weather forecast or measured output. Array/location/loss changes automatically refresh production; tariff and investment edits recalculate locally. A visibly labeled Solar4U simplified seasonal estimate is available while loading or after provider failure, with retry. Nearby shading, roof ventilation, snow, bifacial gains and inverter clipping are not individually modeled.

## Financial calculation

- Annual usage is divided evenly across twelve months.
- On-site energy is min(monthly load, generation × entered self-use percentage).
- Surplus is generation minus on-site use. Off-grid builds receive zero export credit.
- Savings are on-site kWh × avoided retail rate plus surplus kWh × export credit.
- Installed cost uses fresh, selected, pack-aware offers plus additional costs, or an explicit complete installed quote. Missing offers prevent automatic payback calculation.
- Confirmed incentives reduce net cost, floored at zero. No incentive is automatically assumed.
- Simple payback is net cost / (year-one savings − annual maintenance). No positive savings means no payback result.
- The 25-year projection applies annual degradation and electricity-rate escalation. Break-even interpolates the first positive cumulative cash flow; NPV discounts yearly net savings using the entered discount rate.

All costs are USD. Battery selection does not establish hourly self-consumption, dispatch or outage autonomy. Financing, fixed charges, tax-specific eligibility and replacement costs are excluded. The report is separate from electrical compatibility and does not approve an installation.

## Privacy and service behavior

Analytics settings persist in private device/account builds. Shared API responses, server-rendered shared-page props and community snapshots strip the entire analytics object, including precise location, household use and financial assumptions. Exported JSON intentionally contains those settings and warns the user before sharing. Address queries use POST, no-store, six requests per IP/minute, three concurrent upstream searches and a ten-second timeout. No query cache is stored by the address service.

Photon supplies address search; its public demo is suitable for modest use and has no availability guarantee. Move to an operated or contracted geocoder before scaling. OpenStreetMap tiles load only for the visible map with attribution, browser caching and normal referrer behavior; never add bulk/offline tile prefetch. PVGIS receives coordinates and physical array parameters. The location card discloses each provider. Climate requests have bounded server/client caches, coalescing and timeouts; client physical changes debounce 700ms. Sensitive analytics settings must never be copied into public builds by future features.

Sources: [PVGIS API](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en), [Photon](https://github.com/komoot/photon), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).

## Validation and limits

234 tests, TypeScript and built Worker passed. Browser checks covered live Buffalo City Hall search/PVGIS output, map-center and click selection, quantity/roof changes, private device save/reopen, financial updates without climate requests, invalid fields, missing-price behavior, offline fallback/retry, and 320/390px day/night layouts without document overflow. A live 8.75kW example produced about 11,429kWh/year with a single south-facing roof; splitting it 60% south/40% east produced about 10,603kWh/year. These are examples, not site-wide defaults.

Export JSON was inspected for twelve months, 25 cash-flow years and provider provenance; the in-app browser's native download event timed out, so native handoff is not verified. Print styling is included; physical printing, physical phone testing and authenticated cloud save/reopen remain unverified. Public-share stripping is covered by automated tests and source review.

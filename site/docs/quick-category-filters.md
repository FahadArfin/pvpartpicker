# Category quick filters

Compact, wrapping chips sit directly beneath the catalog category heading. One choice per group; groups intersect. Selecting an active chip again clears it. Each chip's count respects search, ecosystem, manufacturer, availability, price, condition, build preferences, and the other active groups. Searches stay in the selected category; choose All categories to search the entire inventory. Zero-result choices stay visible but disabled. Clearing a fuse parent clears its ANL / Class T / MRBF child too. Sidebar refinements remain available.

- Mounting: roof rails, clamps, ground/pole systems, solar brackets, roof attachments, other hardware. DIN rails do not count as roof rails.
- Wiring: premade assemblies, bulk wire, lugs, loose connectors; independent MC4 / XT60 / Anderson / terminal, copper, and THHN/THWN/PV rating choices. Copper-clad aluminum is excluded from the pure/tinned copper choice. Ratings use explicit listing labels, not suitability estimates.
- Batteries: 12/24/48/400 V system classes plus rack, standing, RV/drop-in, wall, stackable, and empty cabinets. 12.8/25.6/51.2 V map to nominal 12/24/48 V. RV use requires an explicit listing label; a 12 V battery is not automatically an RV battery.
- Inverters: nominal DC voltage and off-grid / hybrid / on-grid / microinverter type. AC output voltage does not become battery voltage.
- Electrical: fuses (ANL/Class T/MRBF child group), busbars, breakers, conduit, smart/normal electrical panels, combiners, junction boxes, and other electrical. Smart home panels now live here; meters, shunts, gateways and transfer controllers remain under Monitoring.

Wire source expansion: WindyNation's [solar cable collection](https://www.windynation.com/collections/solar-cable) uses its bounded collection feed, not the entire store. TEMCo's [fixed 100 ft red + 100 ft black PV-wire package](https://temcoindustrial.com/temco-10-awg-solar-pv-wire-100-ft-black-100-ft-red-bare-copper-made-in-usa/) and two additional fixed-package pages use the existing page adapter. The initial 2026-10-05 collection contains 170 WindyNation variants and 3 TEMCo listings, with observed USD package prices and source links. Every new listing has a source-linked specification record; uncollected technical ratings remain unverified. Future observations come from the configured scraper jobs; no historical price series is invented.

Both sources appear in Price Scraper with the existing six-hour schedule and at least ten seconds between source requests. Existing saved source settings are preserved by `INSERT OR IGNORE`. The managed Shopify adapter now honors a configured collection `products.json` path; older source configurations retain the root-feed behavior.

Validation: classification/voltage/toggle tests, actual SQLite source seeding, managed collection-feed targeting, complete catalog specification coverage, desktop/mobile browser checks, TypeScript, and a production Worker build.

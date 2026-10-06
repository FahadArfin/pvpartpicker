# Build analytics implementation

Add an Equipment / Analytics report switch inside the existing builder. Reuse Solar4U's seasonal model and PVGIS monthly climate service; derive array capacity and pack-aware equipment cost from the active build. Address search and a lazy interactive map select coordinates. Debounced climate estimates follow physical-input edits, with a labeled instant fallback and retry.

Report twelve months, annual yield, on-site use, surplus, energy/bill offset, net cost, simple payback, 25-year cash flow and discounted return. Users enter consumption, rates, export credit, installation costs, incentives, degradation and maintenance. No automatic incentives or inferred battery dispatch. Persist validated report assumptions in private/device builds and exclude them from public/community shares.

Validate numerical edge cases, build changes, malformed provider data, save/reopen and sharing privacy. Run all tests, typecheck and built Worker; inspect desktop/mobile and both themes, address/map flow, auto refresh and failure fallback. Commit to the existing beta branch/PR and publish the exact tested beta artifact. Keep production unchanged.

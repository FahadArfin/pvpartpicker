# Package deal comparison — October 8, 2026

Model purchase options default to a compact, lowest-total-purchase comparison. Show the selected package even outside the cheapest five; keep the full list expandable and retain type filters and direct package navigation. A fresh, in-stock bundle below the lowest single-unit price in the same condition gets a prominent labelled link. The highlighted offer keeps its exact retailer, condition and price; a used offer cannot suppress a separate new-versus-new saving. Multipacks compare the whole package price, not an artificially low per-unit price. Missing/stale prices stay unranked and visible as “No fresh offer.”

Watch all adds/removes the current model’s original retailer listing IDs through one batch action. It waits for the complete catalog group before enabling, honors the existing 500-item limit, saves before changing visible state, locks conflicting edits and reconciles failed cloud operations. Account deletes require authentication and bind the signed-in user in every deletion. Guest storage remains device-local. Watch list rows collapse identical package aliases, retaining every alias for price-drop matching and explicit package removal. New configurations require opting in again; model watching does not create package target-price notifications.

Validation:

- 305 behavior tests pass, including stale/out-of-stock, pack totals, new/used condition separation, unchanged aliases, watch failure/capacity and grouped watch rows. Typecheck and production build pass.
- Independent read-only review found a used offer could hide a new bundle discount. Fixed and verified with a dedicated regression case; no remaining review blockers.
- Built Worker tested with isolated local database. Existing 34 F3000 listing IDs save together, appear as 23 distinct package rows, and model unwatch removes them. All 23 options expand. 320px night and 390px day layouts show no document overflow; controls and package links remain usable.
- A **local-only test fixture** changed one bundle offer to $849, against a real snapshot unit price of $899. The page highlights $50 savings, links to the exact bundle with builder context, and adding it returns to the build at $849. The fixture was restored; no production/catalog-source price was changed. Anonymous batch DELETE returns 401.
- Real snapshot comparison and fixture layouts visually checked in both themes. Screenshots below are QA evidence, not live offers.
- Release staging is cleared before copying the validated build so old hashed assets are excluded. Public JS/CSS hashes are checked against this build after deployment.

[Real snapshot comparison](package-deals-qa/comparison-night.png) · [Local fixture, night](package-deals-qa/below-unit-night-fixture.png) · [Local fixture, phone day](package-deals-qa/below-unit-day-fixture.png)

Collector, queue, retailer schedules, observations and backfill code are unchanged. GitHub PR and terminal Sites deployment provide delivery evidence.

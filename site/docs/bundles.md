# Bundles and configurations

The `kits` category is displayed as **Bundles & combos**. It covers power station
combos, inverter and battery packages, storage bundles, panel kits and stationary
solar system kits. Existing product, offer, review, alert and build IDs are retained.

`describeConfiguration` reads the selected variant following ` — ` before parent
marketing. A parent that says “Complete Solar Kit” can still sell a “Main Unit
Only” variant. Those units stay in their equipment category, and a configuration
picker links to the actual bundle variants of the same retailer product.

`Product.configuration` is derived during `categorizeProduct`, for both stored D1
records and the snapshot. The collector uses that same classification on future
runs. No database migration or price refresh is needed for regrouping.

- Names retain the selected variant, color, panel count and battery/mount choices.
  The original retailer title remains available on the product page.
- Component tags and filters reflect explicitly listed contents, not shared photos,
  compatible equipment, advertised input ratings or optional accessories.
- A power station's built-in storage is not an extra included battery.
- Missing counts and models remain unknown. Panel counts and per-panel watts are
  separately identified from total array watts. Derived totals use explicit counts.
- Each combo is one purchase unit. Build quantities, price history and alert targets
  use the selected whole-bundle price. Included components are not expanded into
  independent build lines, storage totals or automatic compatibility matches.
- Generic title-derived watts, voltage and capacity are removed from kit specs.
  Prior station or panel specification records are not presented as whole-bundle
  electrical ratings. The bundle contents listing links to the selected source.

Tests in `bundle-catalog.test.ts` cover real stored variants, standalone exceptions,
panel counts and watts, expansion/charger combos, component filters, mounting
exclusions, offer preservation and build cost arithmetic.

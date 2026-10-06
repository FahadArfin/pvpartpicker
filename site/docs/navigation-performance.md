# Navigation performance

October 6, 2026. Keep the approved visual design; reduce work between pages.

## Findings and approach

The previous SiteLink deliberately used plain anchors because vinext's built next/link navigation failed. That reloaded the document, hydrated the app and restored device state on every click. In the current production build, next/link's dynamic next/navigation import still throws a TypeError. Statically importing useRouter and calling push/prefetch works in the built Worker.

SiteLink now keeps the application shell, theme, build, watch list and comparison state mounted. Native anchor hrefs remain available before hydration, for modified clicks, external destinations, downloads and auth/account/admin endpoints. Same-document hash links retain native behavior. Home search, equipment double-click, builder selection and opening saved builds use the same router.

Hover/focus waits 150ms before warming the full route; pointer-down warms immediately. At most eight distinct destinations warm in a rolling 30-second window. Save-Data, 2G and hidden tabs skip speculative work. Catalog intent warming and the visible page share one pending request. Fresh session storage remains usable only until the original server expiry. The existing two-minute server cache and immutable hashed asset headers are retained. An open catalog checks its deadline and refreshes while visible; failed/degraded responses retry no faster than 30 seconds. Recent offline fallback retains its existing age warning.

Query-dependent catalog/calculator/tier views and product details have identity keys so persistent navigation cannot retain a previous destination's local state.

Live verification caught a redundant HTML fetch-preload: it made a second catalog request alongside the shared fetch loader. Remove those native catalog preload elements; intent warming goes through the shared loader exclusively. This preserves request sharing on both cold and warm page displays.

## Measurements and verification

Baseline production version 41 in the in-app browser: a direct Guide load took 1,089ms to the load event (790ms TTFB). Following Guide to Parts used a new document: 277ms load, then a 792ms catalog request (173KiB encoded); catalog ready at 1,188ms. These are individual observations, not percentile benchmarks.

The local built Worker verifies a single document across Home, Guide and Parts navigation. Keyboard focus fetched Guide's RSC response once (18ms locally) and click reused it without a second route request. Category changes and browser Back update the heading and results correctly. Local timing is not a production speed guarantee. Cold visits still need network/server work; intent prefetch improves likely next-page visits, not every possible destination.

203 tests, TypeScript and production build passed. Navigation policy tests cover auth/private/API/file/external exclusions, query/hash retention, Save-Data and traffic bounds. Catalog tests cover concurrent request sharing, original expiry, storage reuse and retry after failure. Browser checks also confirmed the existing named draft survives, builder query context is retained, Home search works without another document, Guide Next changes the chapter, calculators render their charts, and product specifications open. Both day/night themes were checked; at 390px the mobile menu navigates and closes correctly. No browser console errors appeared during these checks.

## Research

- [Chrome prerender and speculation guidance](https://developer.chrome.com/docs/web-platform/prerender-pages): preload probable destinations with intent rather than downloading every link.
- [web.dev prefetch guidance](https://web.dev/articles/link-prefetch): early fetching can remove the next navigation's network wait, with bandwidth tradeoffs.
- [web.dev back/forward cache](https://web.dev/articles/bfcache): preserve browser-native navigation and avoid unnecessary unload handlers.
- [MDN PWA caching guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching): choose freshness policies by resource type. No cache-first service worker is added for HTML, account data or prices.
- [Vinext source and support status](https://github.com/cloudflare/vinext): validate router changes against the actual built Worker because beta behavior can differ from development.

## Future work

Collect real-user p50/p75 navigation timings before changing the database or adding a service worker. R2 is object storage; moving current database queries there would not fix document reloads. Keep authentication and live price data out of broad persistent page caches. If the catalog grows substantially, measure parse/render cost and consider paginated queries and row virtualization before increasing cache lifetimes.

## Smooth page transitions

The owner requested softer page changes after accepting the faster navigation. `usePageTransition` animates only the committed main content for 160ms, with opacity .76 to 1 and a 4px upward settle. It does not wait for an exit animation, fetch extra data, wrap/remount content or animate the navigation/header. On the first catalog navigation it waits for catalog readiness rather than animating a temporary loading placeholder. Initial document loads and hidden tabs skip the effect. Ordinary typing, price filters, quantities and calculator input updates do not restart it.

The built Worker was checked in day/night themes and at 390px. Browser instrumentation confirmed the MAIN target, 160ms duration, correct destination heading and clean completed opacity/transform. Home/Guide/catalog/category navigation, mobile menu, Back and rapid Batteries-to-Inverters clicks were checked. Search typing did not add an animation. Emulating reduced motion kept the animation count unchanged while Guide opened, with no remaining entry effect. Console errors were empty. Existing 203 tests, typecheck and production build passed.

Implementation uses [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) with cancellation and the [reduced-motion media preference](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion). Changing that preference during an animation cancels it. Browsers without the animation API retain immediate navigation.

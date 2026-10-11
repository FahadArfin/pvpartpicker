# Browser historical collection

The owner requested collection through their connected browser on October 11.
Connected Edge successfully opened Drop.solar, its robots route returned a visible
404, and URL search correctly resolved Current Connected FlexBOSS21 and LiTime
12V 320Ah Mini. The latter is a parent/single-unit chart and cannot be imported
into our four-pack listing. The browser trial submitted the two exact FlexBOSS21
observations; both were already present and the importer inserted zero duplicates.

`scripts/browser-history-session.mjs` is an operator helper for the existing API,
not an unattended browser or external source client. Source UI actions must use
the connected-browser tools. It does not change current prices or retailer scraping.
It requires the existing ignored collector environment file and an explicit saved
claim file. Never expose credentials or lease files in messages.

Before starting the queue, obtain approval to disable **only** the GitHub
`backfill-history.yml` workflow; verify there are no running or queued history
workers. Keep all normal retailer collection workflows enabled. Use `resume
--reviewed-browser-access` only after source policy/access and correct lookup
have been verified and the supported API accepts the existing cooldown/reason.
Do not automatically unpause refusals, policy restrictions or lookup-integrity stops.

For each item, `claim` saves the owned job. `reserve` enforces at least 60 seconds
after the previous source action. Wait the returned interval, then `confirm`
before the browser action. Browser automatic page assets are not individual paced
actions; do not claim that every network request is separated by 60 seconds.
Use visible URL search to find the listing. Inspect the final page and any error.
Extract only inert embedded product/history JSON from the loaded HTML; never
execute page scripts. Save the HTML evidence and use `accept --html PATH --path
/products/ID` to validate and import, then finish that owned queue item.
The server's existing candidate-collision circuit breaker is retained. `not-found
--verified-ui` requires an actual visible no-results response. Wrong package,
model or retailer identity records an unmatched outcome rather than guessed prices.

On a visible refusal/challenge, stop all source actions and use `pause` with the
observed kind/reason and Retry-After if available. On an interruption or unavailable
browser, `release` the owned claim; do not finish uninspected items. An expired
lease must not be reused. Between sessions, review the status and retain only
this collector's owned evidence. No browser run continues after an agent turn
unless a separate scheduled continuation has actually been configured.

October 11 validation: 338 tests, typecheck and production build passed. Browser
trial evidence is ignored under `output/browser-drop-cc-36455*`. After explicit
owner approval, only `backfill-history.yml` was disabled and the saved queue was
resumed. Normal retailer collection remains active. Three paced browser lookups
returned visible `product not found` responses and were recorded without stopping:
checked increased from 1,805 to 1,808, remaining decreased to 2,126, and imported
history rows stayed at 23. Missing source records are not imported or fabricated.

The active hourly thread heartbeat `pvpartpicker-browser-history-backfill`
continues up to 20 items per run with the same checks and one-minute minimum
between source lookups. This requires Codex and the connected Edge browser to
remain available. It reports completion, failures or required input; ordinary
progress remains visible in the site's existing history queue section.

# Hosted current-price collection

All enabled sources on the `hosted` executor are claimed automatically by
`.github/workflows/collect-prices.yml`. Recovery ticks run at minutes 7, 22, 37
and 52; GitHub scheduling can be delayed. Source frequency controls the regular
interval, and unfinished refresh cycles become due again after 15 minutes.
Current NAZ frequency is six hours. Neither this workflow nor the hosted API
requires the owner's computer or Codex. Paused/unverified sources remain paused.

The NAZ background migration moves only the previous local NAZ assignment and
queued NAZ configs to `hosted`. It preserves source pauses, manual schedules,
spacing, identities, history, cursors and active leases. Disable the obsolete
`pvpartpicker-naz-current-prices` local heartbeat after deployment. Other current
collectors remain enabled; historical backfill remains disabled.

## Access limitation verified October 11, 2026

GitHub diagnostic run 38185892838 received HTTP 403 and a Cloudflare "Just a
moment..." challenge at NAZ's public robots.txt. Local access previously worked,
but that does not establish permission or availability for cloud collection.
The hosted scraper stops this source at the refusal, records the failed run,
and continues other retailers. It does not solve challenges, rotate addresses,
change identity, or make prices look fresh when no new observation was obtained.

NAZ needs to provide a supported public/authorized price feed or allow this
identified collector. Merely enabling the hosted schedule does not resolve the
challenge. Do not claim NAZ price collection works until a hosted run accepts
observations and those timestamps appear in the public history endpoint.

The workflow's optional `naz_probe` diagnostic checks only public robots from
its own concurrency group, carries no collector credential, and makes no
queue/data changes. Normal scraping stays in its original concurrency group
with cancellation disabled.

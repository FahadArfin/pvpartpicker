# PVPartPicker

[Open the live website](https://pvpartpicker.fwad101.chatgpt.site).

A solar equipment catalog and system builder for US shoppers. Compare actual retailer offers, minimum purchase quantities, observed price history, and documented equipment specifications.

## Features

- Seven equipment categories with search, specification/brand/condition filters, comparisons, and source-attributed product photography.
- Guided system builder with quantities, retailer selection, pallet-aware purchase totals, documented voltage/current checks, saved builds, and read-only sharing.
- ChatGPT sign-in, moderated community ratings/comments, target-price alerts, website notifications, and opt-in email delivery through Resend.
- D1-backed offers and append-only observations. Price graphs contain real observations only, including their original package quantities.
- Owner administration for moderation, persistent specification corrections, retailer-model matching, collection health, and anomalous price/package changes.
- GitHub Actions collector every six hours; individual retailer failures do not erase previous observations. No browser session is needed.

## Local development

Requires Node 22.13 or later and npm. Application source is in `site/`.

```sh
cd site
npm ci
node scripts/migrate-local.mjs
npm run dev -- --port 5187
```

Create ignored `site/.dev.vars` for local collection and owner testing:

```dotenv
COLLECTOR_TOKEN=generate-a-long-random-token
ADMIN_EMAIL=seedy@sites.test
SITE_ORIGIN=http://127.0.0.1:5187
```

Local sign-in is provided by the Sites development adapter. Production identity comes from the Sites ChatGPT authentication gateway, which protects its trusted identity headers. Do not expose the Worker directly behind a gateway that accepts client-supplied authentication headers.

To collect a bounded source snapshot, run `npm run catalog:collect`. Seed a running development/production API with `PV_COLLECTOR_TOKEN` and optionally `PV_API_ORIGIN` set, using `node scripts/seed.mjs`. Secrets belong in environment configuration, never source files.

```sh
npm test
npm run typecheck
npm run build
```

## Operations

See [collector documentation](docs/collector.md) for coverage, matching, scheduling, and recovery. See [deployment documentation](docs/deployment.md) for runtime configuration and validation limits. Database schema changes use new Drizzle migrations; do not edit an already applied migration.

This is a shopping and preliminary compatibility tool. Missing manufacturer evidence remains unverified. It does not certify an installation or provide engineered electrical, roof, utility-interconnection, or permitting designs. Shipping, freight, and tax are determined at retailer checkout.

# Deployment and configuration

The application is a Vinext/React Cloudflare Worker with D1. `.openai/hosting.json` identifies the registered Sites project. Build with the Sites Vite plugin and package the resulting Worker/client assets and all Drizzle migrations. Push the identical application source to the Site source repository, save the built version, and deploy that saved version. Keep production secrets in Sites runtime environment variables.

Required runtime variables:

| Variable | Purpose |
| --- | --- |
| `COLLECTOR_TOKEN` | Random bearer credential for ingestion/alert processing |
| `ADMIN_EMAIL` | Trusted ChatGPT email authorized for owner tools |
| `SITE_ORIGIN` | Public origin used in email/product links |
| `RESEND_API_KEY` | Optional email-provider secret |
| `EMAIL_FROM` | Optional verified Resend sender |

Initial administrator access uses the Site owner's account. New environment revisions require redeploying a saved version. An absent email key/sender leaves opted-in messages queued and displays the configuration state; it never reports successful delivery. Actual sender-domain setup and end-to-end email delivery remain unverified until credentials are supplied.

The bundled source snapshot provides catalog browsing if D1 cannot be read. Account writes return an explicit service error instead of silently switching to local persistence. Device storage holds only an unsaved build draft. Public shared builds contain equipment/settings, not account identity or contact details. Community reviews require moderation; author names are public, account emails are not exposed in reviews. D1 stores account identifiers and opted-in contact email for alerts.

Checks cover package arithmetic, freshness, string limits, battery voltage evidence, ingestion bounds, model identity, variant parsing, robots policy, persistent correction merging, and isolated email failures. Browser/database acceptance covers saved builds, share reads, moderation, notifications, mobile overflow, and source-price rendering. These checks do not establish physical system suitability, actual email delivery, or exhaustive coverage of every retailer product.

For another hosting provider, replace Sites environment/auth integration with a gateway that authenticates users and strips/spoof-protects identity headers. Do not put provider credentials into frontend bundles. The registered production project ID is not a secret.

# Product specifications

Product details use short technical summaries, sourced specification groups, and separate panel STC and NOCT/NMOT electrical tables. The original retailer marketing description is retained in storage but is no longer shown as the overview.

## Evidence and coverage

`data/specifications.json` is keyed by the existing product IDs. `data/specification-reviewed.json` contains visually reviewed transcriptions with exact model/variant selectors and source links. `data/specification-audit.json` records coverage, missing listings, rejected documents, and collection failures. Coverage means at least one technical field was found, **not** that a product has a complete engineering datasheet.

Each field links to its source. Manufacturer tables, retailer tables, manuals, datasheets, and listing identity are identified separately. Listing-derived attributes do not become verified electrical measurements. The 175 W Renogy example uses RSP175DC ratings, not the shared 200 W product description; module efficiency and cell efficiency remain different fields. An NMOT column retains its own name. Unpublished or unverified values are not calculated, inferred from nominal system voltage, or copied from another variant. Rear-side gain values do not enter front-side STC ratings.

Source data is merged into both the snapshot and database catalog before owner corrections. Retailer offers and observation dates remain live. Detailed records are excluded from the shared catalog transport, so browsing does not download every product's spec sheet data. Detail routes receive only their own full product. A changed panel wattage prevents outdated static evidence from being applied.

## Refresh

Run from the `site` directory with Node 22.13+ and Python with `pdfplumber` installed:

```sh
node --experimental-strip-types scripts/fetch-specification-sources.mjs --cache ../output/spec-research
node --experimental-strip-types scripts/fetch-specification-pdfs.mjs --cache ../output/spec-research
python scripts/extract-specification-pdfs.py ../output/spec-research
node --experimental-strip-types scripts/collect-specifications.mjs --cache ../output/spec-research
npm test
npm run typecheck
npm run build
```

The cache contains raw HTML/PDFs and stays outside the deployed app and Git. Existing cached pages/documents are reused; to revisit a source, remove that source's cache entries intentionally. No prices are changed by this workflow.

Page collection respects robots directives and published crawl delays, makes at most one request per origin every two seconds, bounds requests, and stops an origin on 401/403/429 or a challenge. Document downloads respect robots rules, restrict PDFs to 25 MB, and also stop rejected origins. PDF extraction runs in isolated processes with a 25-second limit per document and a maximum of four workers. Long manuals are limited to pages headed with specifications; manuals longer than 120 pages need a reviewed page selection. Extraction failures are cached; use `--retry-failures` after resolving their cause. Image-only, malformed, ambiguous, or unsupported sheets remain missing and can be added through reviewed transcription.

Review generated values and the missing/rejected audit before publishing. Exact model matching and panel wattage checks are conservative; they cannot replace visual review of every manufacturer revision. Shared battery variant pages are rejected when rated capacity or nominal voltage conflicts. Do not loosen those guards just to improve coverage counts.

## Validation

Tests cover exact variant selection, independent STC/NOCT columns, mismatched panel tables, prose rejected as numeric data, manufacturer spec grids, explicit technical bullets, database refreshes, owner correction precedence, live offer preservation, and reduced shared transport. Runtime checks include the user's Renogy example, a panel with published NMOT ratings, batteries, and mobile layout.

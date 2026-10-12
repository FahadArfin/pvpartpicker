# Exact reviewed storage roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Correct only eleven independently reviewed selected listings without importing technical specifications.

**Architecture:** A static exact identity allowlist applies only category and one role spec key. Shared catalog normalization and categorization preserve raw objects while final database hydration supplies the required exact offer guard.

**Tech Stack:** TypeScript, node:test, existing D1 catalog reader.

**Spec:** Owner-retained output/specification-research/batch-fifteen-role-plan.json and .md; batch-fourteen-storage-role-independent-review.json and .md.

## Global Constraints

- Eleven exact reviewed identities only; seven held listings unchanged.
- Preserve IDs, UTF-8 names, source URLs, offers, prices, timestamps, quantities, configurations and prior stronger evidence.
- No family classifier, no new categories or types, no cell-to-battery configuration, no technical field import, no source network requests.
- Require exact raw anchors and selected offer ID/retailer/URL/SKU; accept only original or precisely corrected state.
- Hold embedded prior specifications and duplicate identities; owner role overrides take precedence.
- Do not commit, push, merge or publish in this task.

## Review Focus

- Selected variant drift must hold, including alternate offers and UTF-8 name corruption.
- Database metadata without offers must not undergo destructive generic extraction before final guards.
- Changed anchors in already corrected objects must hold rather than reconstruct a match.
- Existing prior evidence must survive without identity migration.
- Duplicate rows and owner overrides must not accidentally enable a role correction.

### Task 1: Exact role overlay and catalog hydration

**Files:** Create site/lib/reviewed-storage-roles.ts; site/tests/reviewed-storage-roles.test.ts; site/tests/fixtures/reviewed-storage-role-products.json. Modify site/lib/retailers.ts, site/lib/catalog-cleanup.ts, site/lib/catalog-reader.ts.

**Interfaces:** applyReviewedStorageRole(product: Product): Product | undefined returns a role-corrected product only on an exact hydrated match. isReviewedStorageRoleCandidate(product: Pick<Product, id/name/sourceUrl/category/specs>): boolean requires strict original or precisely applied metadata and anchors before deferring absent-offer metadata. Final catalog normalization can disable reviewed role application for duplicate identities or explicit owner role overrides.

- [x] Write all eleven positive fixtures and per-key drift negatives; demonstrate missing behavior with the actual red run.
- [x] Add minimum static allowlist and strict original/already-applied state guards; no field deletion or offer write.
- [x] Add database/snapshot hydration, duplicate, provenance hold, owner priority, idempotence and cabinet comparison assertions; demonstrate failing integration tests before changes.
- [x] Integrate final correction and defer metadata candidates without hydrated offers.
- [x] Run focused tests, entire test suite, typecheck and production build. Save evidence in ignored output/specification-role-correction.
- [x] Return uncommitted patch and report for independent root review; root owns browser inspection and delivery.

## Authorized presentation refinement

The root authorized safe presentation of the one independently proven empty cabinet before delivery. Add site/lib/specifications.ts to scope: specificationForDisplay must use the same exact hydrated guard, suppress retained title-parser voltage/Ah/chemistry from its summary and displayed fields, and retain only cabinet fit/physical fields. Preserve raw anchors and other cabinet behavior. A failing actual display-contract test must precede the change. This is a role presentation correction, not imported research or deleted source data.

## Review clarification

Strict metadata matching replaces ID-only reservation. Changed names, URLs, categories or anchors and foreign selected offers must retain the prepatch generic categorization behavior while the reviewed role overlay rejects them. Baseline fixtures were captured by executing db86be94 categorizeProduct, and a failing regression preceded this tightening. Final offers, duplicate holds, prior evidence and owner-role override guards remain required.

## Independent review R1 fix

Metadata deferral is provisional and must resolve after final offer hydration/mapping. Track only strictly deferred database candidates. Exact selected-offer matches keep their reviewed role; rejected selections run the real generic categorizer with fully hydrated offers before final output. Explicit role owner overrides, duplicate identity holds and prior embedded evidence remain protected. Reapply unrelated owner corrections after that generic fallback so owner values keep priority. Tests use actual db86be94 categorizer baseline fixtures for original and precisely corrected states, covering SKU, URL, retailer ID, offer ID, and additional foreign offers, including quantity three. Raw prices and offer quantities remain unchanged by this scoped fix.

## Root browser acceptance R2 fix

Exact three reviewed accessories must not display inherited battery capacity, chemistry or form factor. Test the actual ProductSpecifications React component with real specification helpers, then filter only these guarded accessories to accessory type/model/compatibility/dimensions/weight/material/IP fields. Preserve raw identity anchors and source/specification objects; unrelated accessories keep existing behavior.

Evidence order must retain old-category evidence holds before projection, while exact kit/accessory target-category evidence waits until final selected-offer projection. Apply that evidence only after a full hydrated exact role succeeds. Already projected metadata must still defer target evidence until final offer/duplicate/owner guards pass. New evidence fixtures are test-only and no sourced fact is imported here.

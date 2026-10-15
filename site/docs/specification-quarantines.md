# Reviewed source quarantines

`data/specification-quarantines.json` records eight independently approved field removals for four exact Renogy selections. This ledger is separate from `specification-corrections.json`: these source conflicts have no verified replacement rating. They receive zero new-fact credit.

The runtime guard matches the product ID, name, variant URL, category, catalog anchors, and selected offer (including SKU, pack, and condition). Only the approved source URL, source kind, field key, and complete value are suppressed. Display labels do not establish identity. Other sources and different conditions remain available for independent review. Missing or changed selected identity fails closed rather than authorizing a deletion on another variant.

Generation and reviewed import sanitize these exact tuples. Both normal writer scripts check the quarantine boundary before writing. Runtime attachment also removes the tuples and stale projected comparison values, including when the same specification object was already attached. The existing Renogy manual-replacement and WattCycle selection guards remain intact.

The offline migration requires the original hash-verified HTML and metadata, parses the selected SKU from inert JSON, validates the exact old field hash and group, and retains every unrelated field, source object, note, and identity. It protects the five existing manual-backed Rover 20A ratings. It permits unrelated later additions and is idempotent; it is not coupled to a global index hash. A changed same-source target field or missing protected manual rating stops the migration.

Run from `site/` with explicit paths:

```powershell
node --experimental-strip-types scripts/apply-reviewed-quarantines.mjs --index <input-index.json> --catalog <reviewed-catalog.json> --source-root <repository-with-retained-output> --output <new-output-index.json> --report <new-audit-report.json>
```

The CLI refuses existing destinations and input aliases. It never writes the input index, collects network data, or changes prices. Review the eight reported differences before promoting the separate output. Keep the original input and source artifacts for audit. When integrating a newer catalog index, rerun this migration against that index instead of replacing it with an older whole-file snapshot.

Approval packet SHA256: `f7828b6ca92c351d84b6ccc54a6c7f132b39c97cb05b34885b753d9b37ac4d0d`.
Independent source review SHA256: `7d1572cd20da384ec8f988b1e30752c86b51021026557c7b2ed684e329ed7a2a`.

Remaining uncertainty: other fields on the shared 20/30/40A page may need stronger model-specific evidence. This change does not authorize broader removal, select one side of conflicting thermal units, or apply accessory altitude to a controller.

# Guide library and Solar4U calculators

`/guide` replaces Solar Basics. `/learn` remains a bookmark-compatible alias. The searchable library contains 18 guides and six news/analysis articles, with audience and topic filters. Individual articles have a contents navigation, worked examples, checklists, related reading and primary-source links. Load auditing, storage sizing and MPPT input design include extended worksheets. Content stays on the server; the searchable index receives metadata only.

## Provenance

Twelve foundation lessons and nine calculation engines/configurations were adapted from the user's Solar4U project, source commit `87a91d4db804dee461ce345d8b2f63669cd986c1`. Local source: `C:/Users/fahad/OneDrive/Documents/Solar4u`. The two concept illustrations originate in that project and are explicitly labeled as illustrations, not installation drawings. WebP derivatives are approximately 55–62 KB, replacing 2.5 MB PNGs.

New technical guides, worksheets and editorial briefs were written for PVPartPicker. Primary sources were checked on October 4, 2026: DOE, NLR/PVWatts, Sandia PVPMC, Victron, Stäubli, IronRidge, CFPB, IRS, China's Ministry of Finance, IEA, CATL, LONGi and Anker. Each article lists its own sources. Manufacturer announcements are attributed; planned deliveries and performance claims are not described as independently tested results.

The news collection is date-stamped editorial content, not an automatically refreshed feed. Event dates differ from source-check dates. No recurring news automation was added.

## Workshop behavior and limits

`/guide/calculators?tool=<id>` selects one of nine tools: `pv`, `battery`, `voltage`, `fuse`, `array`, `controller`, `cable`, `tou`, `payback`. Inputs are finite, range checked and integer/choice checked where appropriate. Blank inputs are rejected. Editing any input clears old results. JSON downloads contain the applied inputs, results and source.

- Production uses Solar4U's simplified local seasonal model, not a weather API. PVWatts and PVGIS links provide climate-based modeling alternatives. Gross energy value does not represent actual bill savings.
- Battery runtime assumes a full starting charge and steady load. Zero load returns undefined runtime; output power and surge capability are separate checks.
- Voltage-drop calculations do not establish ampacity. Cable sizing uses illustrative table ampacities; retailer cost placeholders are omitted from displayed/downloaded results.
- Fuse sizing uses a 125% planning assumption, not a universal installation rule. Corrected conductor ampacity and DC fault interruption require separate review.
- Array voltage uses stated temperature coefficients. Controller checks use four documented Victron models, one array per controller, absolute voltage/current boundaries and a separate nominal-power flag. They do not automatically allocate strings or certify compatibility.
- TOU rejects peak/mid-peak shares over 100% and inconsistent efficiency assumptions. Negative savings remain negative. Backup starts fully charged; routine shifting reduces reserve.
- Cash flow is an undiscounted 25-year scenario with escalation/degradation. The result is labeled **Modeled break-even year**, not simple cost/first-year-savings payback. Incentives default to zero; current IRS timing guidance is linked. Financing, tax effects and replacements are excluded.

## Verification

Calculator regressions cover default outputs, zero-energy/load handling, nonfinite/range/integer constraints, invalid electrical inputs, cold Voc including equality at an absolute limit, no feasible cable, contradictory TOU shares/efficiencies, negative savings, hemisphere seasonality and financial metric labeling. An imported-notation check protects mathematical symbols from encoding damage.

Browser acceptance checks cover library filtering, dated article rendering, contents navigation, calculator switching, a known battery-runtime example, blank-input rejection, results, legacy `/learn`, responsive layouts and result export. These checks establish software behavior, not installation approval or independently measured equipment performance.

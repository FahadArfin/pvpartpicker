# Guide curriculum and sources

`/guide` renders the introductory chapter immediately. `/guide/[slug]` uses the
same reader and searchable left curriculum. The sidebar switches between chapters
and section anchors; mobile users expand it with **Browse chapters**. The existing
filtered index remains at `/guide?view=library`, and the nine calculators keep their
existing URLs and methods. Only the active chapter body is rendered; the client
sidebar receives compact article metadata, not the complete library.

Seventeen additional chapters in `data/guide-solar4u.json` were adapted from the
user's Solar4U source at commit `87a91d4db804dee461ce345d8b2f63669cd986c1`:

- `app/guides-page.tsx`: lessons, enhancements, examples and checklists.
- `app/professional-guide-data.ts`: reference sections, procedures and tables.

Each chapter retains its source chapter ID, source files, source commit, original
reference-review date, adaptation date, and external references. Adaptation is not
a claim that every linked manual revision was checked again. Third-party manuals
are linked, not reproduced wholesale. Only original Solar4U instructional prose is
adapted. Price/model examples in the source remain educational references rather
than current retailer offers.

Two original researched guides in `lib/guide-research.ts` add quote comparison and
production/battery-log interpretation. Research on October 5, 2026 used DOE's
Homeowner's Guide and installer-selection guidance, PVWatts' model/input cautions,
and Victron's SmartShunt operation manual. Sections link the relevant sources;
worked numerical cases are explicitly hypothetical. General DOE pages still
contain some historic incentive text, which these articles do not import as
current eligibility advice.

Existing foundational, advanced and dated news articles are retained. Chapter
ordering groups topics and starts with energy flow, electrical vocabulary,
components and measured loads. Existing deep links remain valid.

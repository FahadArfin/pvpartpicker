# Saved and community builds

The System Builder toolbar provides New build, My builds, Save build, Save as new, Share, and Community builds.

- Name a build in the builder. Save build updates its current saved version; Save as new creates a separate named version.
- Guests can keep up to 100 builds in this browser's local storage. Clearing browser data removes device saves.
- Signed-in saves belong to the authenticated account and reopen across devices. My builds shows account and device versions with explicit labels. Opening a device version while signed in and saving creates an account version; the device original remains available.
- Switching drafts offers Save current & open, Open without saving, and Cancel, including for named or configured empty drafts.
- Read-only links show the saved account version and allow visitors to open an independent editable copy.

## Community publication

Saving remains private. Share → Publish to community is an explicit opt-in. It saves the account build and publishes a snapshot of the name, parts, selected retailer offers, quantities, system settings, and optional note. Public responses contain no owner account ID, email, private saved-build ID, or unlisted share link.

Private edits do not change the public snapshot. Publish updated version replaces it while retaining its community URL. Withdraw from community removes it from discovery and makes that community link unavailable. Deleting the saved account build also removes its community publication through the database foreign key.

`/community` lists the newest 100 publications with search, purpose and mounting filters, current eligible equipment costs, and detail/copy actions. It starts empty until owners publish actual builds; no fabricated community entries are seeded.

Copied builds preserve quantities, selected offers, and system settings, but lose the source's saved-build and share identities. Copying or reopening does not purchase anything or establish installation compatibility.

## Storage and verification

Device versions use `pvpartpicker-saved-builds`; the working draft continues to use `pvpartpicker-draft`. Invalid stored build libraries are preserved and reported instead of overwritten. Account versions remain in `builds`; `community_builds` stores separate public snapshots and references its source with delete cascading. Migration `0004_friendly_darkstar.sql` creates the publication table and indexes.

Tests cover device save/update/copy behavior, identity stripping, draft switching, asynchronous save state, owner-only publication and withdrawal, snapshot isolation, and private field exclusion using actual SQLite queries. Browser checks exercise device/account saves, reopening, community filters/detail/copy, snapshot stability and responsive dialogs using the local test account.

# PWA reader language order · 2026-10-14

This focused port starts from public Pages baseline `925d01b` and reuses the
reader/selection behavior qualified in native source `601b65e` (Android 22).
It changes only the PWA reader, its language choices, localized arrangement
copy and tests. Native projects, version feed, server, billing and storage
schemas are unchanged.

## Qualification before deployment

- `npm run check`: 83 client tests, 58 server tests, lint, document-renderer
  equation/table/figure/escaping checks and production build passed.
- Visible Chrome, 430 × 932, actual Sanshirō data: English first / Japanese
  second and Japanese first / English second verified in interlinear and
  paragraph layouts. Main text has no badge; secondary text keeps its badge.
- Actual Settings clicks verified removing the main promotes the next,
  reselecting appends, and reload preserves order and layout.
- Main-text-only follows the selected main language; Japanese UI and ruby
  render correctly. No horizontal document overflow or browser page errors.
- Seven browser reader cases passed. Screenshots and machine-readable results:
  project-private `.runtime/pwa-reader-20261014/`.

## Public deployment receipt

Exact deployed commit/revision, live browser checks and old-worker upgrade
preservation evidence are recorded after deployment in:
`OneTimeSync/LazyPromotion/BUNKO-JAPANESE-DEMO-READER-READY-20261014.md`.
The PWA package version stays 1.0.10; `web-release.json` identifies the web
revision independently of native store version numbers.

Existing users can return from reading to the library, open Settings →
App updates → Check for updates, then choose Update & reload. An active reader is not
force-reloaded. Do not clear site data or remove downloaded books to update.

## Verified public result

Pages run [38565531580](https://github.com/lachlanchen/Bunko/actions/runs/38565531580)
completed successfully for source `5239e27f15b81c909b10fb6960190fce6ddf7f06`.
The live URL is https://lachlan.lazying.art/Bunko/ and the demonstration book is
https://lachlan.lazying.art/Bunko/?book=sanshiro .

The deployed `web-release.json` revision is
`cc643f29aea6e37b50d0c88c2f583697af254a7ec5011f1b372cb93abbe217f6`.
The public browser loaded `assets/index-BTz5Q8VD.js`, byte-identical to the
qualified local build (SHA-256
`25d7e3f7dd6ecc63aa15ab6274ce3613d985856b337a67527b052353dea13795`).

All seven reader cases passed again on the public origin. The existing public
browser updated through Settings → App updates → Check for updates →
Update & reload, without clearing site data. All 15 Sanshirō cache records
(13 chapters and two metadata entries) retained identical content hashes;
settings and saved progress remained identical. Chapter 2 resumed after an
offline reload. No browser page errors occurred during the reader checks.
The anonymous QA profile does not establish a fresh authenticated-session
qualification; account/session code and storage were not changed.

Android 1.0.12 (22) already contains this behavior as documented in
`translation-labels22-20261011.md`; no new native test or store mutation was
performed for this PWA request. The new Japanese promotional capture can now
use the public reader. Native review tracks and billing were preserved.

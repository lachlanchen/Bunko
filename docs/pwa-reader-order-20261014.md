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
App updates → Check for updates, then choose Reload. An active reader is not
force-reloaded. Do not clear site data or remove downloaded books to update.

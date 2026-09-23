# Bunko store handoff

Updated 2026-09-23. Owner authorized takeover of the prior session and completion of publication on both stores, including formal review submission. The agreed price is USD 0.99 paid up front.

- PWA: https://lachlan.lazying.art/Bunko/ — deployed from `c2bcb0c`, GitHub Actions passed.
- Apple: app `6815137919`, version 1.0.0 (1), **Waiting for Review**, automatic release. See `apple/submission.md`.
- Google Play: paid app `4972575539744983205`, package `art.lazying.bunko`; production 1.0.0 (1) **In review**, full rollout in 172 countries after approval; internal testing Active. See `release.yaml`.
- Book payloads remain in the separate public `bunko-books` repository. No payloads or private session logs are committed here.
- Native hashes and validation: `artifacts/release-1.0.0.json`.
- Owner testing: TestFlight invitation received and tester state **INSTALLED**; Android internal opt-in and iOS installation instructions emailed on 2026-09-23. Personal invitation links and email evidence are private under `.runtime/store/`.
- The exact shared browser tabs, noVNC URL, Mac paths and current operations are recorded privately in `.runtime/store/handoff.md`.

Do not restart the shared store browser or touch another app's tabs, keys, packages or review state. The source-only layout bug and missing iOS preferences privacy declaration were fixed before these builds.

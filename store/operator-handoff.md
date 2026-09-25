# Bunko store handoff

Updated 2026-09-25. Owner authorized takeover of the prior session and completion of publication on both stores, including formal review submission. The agreed price is USD 0.99 paid up front.

- PWA: https://lachlan.lazying.art/Bunko/ — deployed from `c2bcb0c`, GitHub Actions passed.
- Apple: app `6815137919`, version 1.0.0 (1) **Ready for Sale**. The US public listing resolves and reports USD 0.99. Version 1.0.1 (2) is **Waiting for Review** with automatic release after approval. See `apple/submission.md`.
- Google Play: paid app `4972575539744983205`, package `art.lazying.bunko`; production 1.0.0 (1) **In review**, full rollout in 172 countries after approval; internal testing Active. See `release.yaml`.
- Availability verified 2026-09-25: Apple lists all **175 of 175** current territories as available, with automatic availability in future territories enabled. Play targets all **172 paid-app-eligible** country/region entries; the other five entries are marked "Cannot target for paid app" in the Console. See `artifacts/availability-2026-09-25.json`.
- Update 1.0.1 (2), containing cover display, visible theme controls and catalogue refresh: Apple build 2 is **VALID**, available through the internal TestFlight group and formally submitted for review on 2026-09-25. Google Play internal release 1.0.1 (2) is **Available to internal testers**; production 1.0.0 (1) remains in review. Do not send another Play change while that review is active.
- Expansion 1.0.2 (3), containing 12 owner books, four shelves and local TeX/figure rendering: Apple build 3 (`6057045f-30d5-47ae-8beb-047dabb37be2`) is **VALID** and in the Bunko Internal TestFlight group alongside build 2. Play internal release **1.0.2 (3) — New books and equations** is **Available to internal testers**. The 162-book catalogue is live in `bunko-books` at `07432b0`. No production release was changed by this internal update.
- Catalogue expansion after build 3: the live index now contains 183 editions at `bunko-books` commit `09644d2`, including all nine supplementary Susskind companion books, four other core runs, *Justice with Michael Sandel*, and seven additional edited LazyEarn books. This is downloadable content using the existing category and chapter schema; internal TestFlight and Play build 3 fetch the new index and bundles online, with no binary change. The 162-book figure above records the earlier upload state. Jim Rohn direct transcripts and the raw interview corpus remain outside Bunko.
- Book payloads remain in the separate public `bunko-books` repository. No payloads or private session logs are committed here.
- Native hashes and validation: `artifacts/release-1.0.0.json`.
- Owner testing: TestFlight invitation received and tester state **INSTALLED**; Android internal opt-in and iOS installation instructions emailed on 2026-09-23. Personal invitation links and email evidence are private under `.runtime/store/`.
- The exact shared browser tabs, noVNC URL, Mac paths and current operations are recorded privately in `.runtime/store/handoff.md`.

Do not restart the shared store browser or touch another app's tabs, keys, packages or review state. The source-only layout bug and missing iOS preferences privacy declaration were fixed before these builds.

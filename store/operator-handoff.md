# Bunko store handoff

Updated 2026-09-26. Owner authorized takeover of the prior session and completion of publication on both stores, including formal review submission. The agreed price is USD 0.99 paid up front.

## Current update — 2026-09-26

- **1.0.4 (6)** adds optional update prompts, Settings checks and installed-version details in all four interface languages. The web deployment is live; Play internal and iOS/Mac Bunko Internal TestFlight are available. Apple build IDs: iOS `7f94444e-1598-4e2c-8630-8ad188f9cda1`, Mac `7774df2d-47aa-49a1-9dbe-32f2ecf04285`, both VALID and IN_BETA_TESTING.
- Public iOS remains 1.0.1 (2); iOS 1.0.3 (5) is Waiting for Review, Mac 1.0.2 (4) is In Review, and Google production 1.0.0 (1) remains in review. **1.0.4 is internal only on native platforms**; do not cancel the existing reviews to promote it.
- Android upgrade QA uncovered an old native service worker hiding new reader code. The native startup migration removes registrations and their app-shell precache, preserving IndexedDB and Preferences. The installed 1.0.4 (6) app, saved chapter, feed check and all localized controls passed. Real web waiting-worker, dismissal, multiple-tab and offline tests also passed; 36 automated tests and all signed builds passed.
- **On each public store release**, verify the listing and rollout, then update `public/updates.json`, deploy Pages and verify its live JSON. Never place testing/review-only builds in that feed. See `../docs/app-updates.md` and `artifacts/release-1.0.4.json`.

## Reader update — 2026-09-26

- **1.0.3 (5)** is available in Google Play internal testing and in iOS/Mac Bunko Internal TestFlight. All five reader requests transferred from the LazyOracle session are completed: right-edge back, explicit selection before Dictionary, word/phrase/sentence selection, compact header, and separate main/ruby sizes.
- Apple approved iOS **1.0.1 (2)**. The new iOS **1.0.3 (5)** review was submitted at **2026-09-26 01:58:51 UTC** and is **Waiting for Review**, automatic release after approval. Review ID `67ade8e6-50c0-429f-a5fb-268aea4b5863`.
- Mac **1.0.2 (4)** is **In Review**; the new Mac build 5 is internal only. Google production **1.0.0 (1)** remains in review. Neither active review was replaced.
- Thirty automated checks, native Android selection/back tests, responsive browser checks and WebKit selection tests passed. Physical iPhone interaction was not tested; iOS and universal Mac archives, signatures, Apple validation and uploads passed.
- See `artifacts/release-1.0.3.json`, `updates/1.0.3.json` and `../docs/reading-controls.md`. The temporary Bunko QA browser/emulator was stopped, its Play tab closed, and KVM was used only for headless builds/uploads. Shared GUI and simulator sessions were left with their owners.

## Earlier release history

- PWA: https://lachlan.lazying.art/Bunko/ — deployed by the Pages workflow on `main`; check the latest successful run before reporting deployment status.
- Apple: app `6815137919`, version 1.0.0 (1) **Ready for Sale**. The US public listing resolves and reports USD 0.99. Version 1.0.1 (2) is **Waiting for Review** with automatic release after approval. See `apple/submission.md`.
- Mac: native **1.0.2 (4)** is **Waiting for Review**, submitted 2026-09-25 at 14:11:44 UTC with automatic release after approval. Build `0f2600ec-836f-4924-a423-6cc3a0c3985b` is VALID and IN_BETA_TESTING in Bunko Internal. It shares the existing Apple app record, price and availability. Intel and Apple silicon are compiled; native runtime tests passed on 3040, 7050 iMac and KVM. See `macos/submission.md` and `../docs/macos.md`. The iOS 1.0.1 review was left intact.
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

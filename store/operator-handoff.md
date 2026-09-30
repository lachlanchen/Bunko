# Reader correction available in testing — 2026-09-30 HKT

**Bunko 1.0.10 (16)** is VALID/IN_BETA_TESTING for iOS/paired Watch and universal
Mac, and available to Google Play internal testers. Both Apple uploads passed
validation, retain the existing Bunko Internal group, and have four localized
TestFlight notes. The web reader and corrected book data are live; raw GitHub
and jsDelivr metadata hashes match. Both repository workflows succeeded.

Right swipes now work across the page, with text selection, sliders, long holds,
vertical scrolling and horizontal content scrollers protected. Translation notes
are folded separately. Japanese edition information is localized, and every
Japanese line with kanji in the Bible/Quran has word readings. Publisher body
text, notes and headings remain unchanged. See the source/ruby audit and preview
images for exact coverage and the limits of generated pronunciation aids.

66 client tests, 35 server tests, 8 importer tests, 3 ruby tests, 8 catalogue tests
and 30 mobile-browser checks passed. Real CDP touch input verified swipe-back,
Settings priority and scrolling. Package versions, signatures, iOS embedded
reader assets and Mac architectures were checked. No physical gesture test is
claimed. All owned browser/build runtimes are stopped; peer resources untouched.

**Production reviews are preserved:** iOS1.0.9(14) WAITING_FOR_REVIEW,
Mac1.0.9(14) IN_REVIEW and Google14 Changes in review (172 territories).
Build16 supersedes build15 as the qualified next update once each review clears;
no production16 submission or public update-feed change was made.

[Release receipt](artifacts/reader-1.0.10-16.json) ·
[Reader and book audit](../docs/reader-correction-2026-09-30.md)

## Earlier test release

# Language reader update in testing — 2026-09-30 HKT

**Bunko 1.0.10 (15)** is VALID and IN_BETA_TESTING for iOS/paired Watch and
universal Mac, and **available to Google Play internal testers**. Both Apple
packages passed validation/upload. The actual IPA phone/Watch versions and
embedded native web bundle were checked; signed Android APK/AAB versions and
hashes were recorded. Existing tester groups are retained.

The web update is live and byte-verified. Book bundles are live: Quran has
Arabic/English/Chinese/Japanese, Bible has English/Chinese/Japanese; complete
publisher text, notes, numbering differences and credits are retained. The
Japanese Bible is explicitly identified as the publisher's draft. The other
183 catalogue entries are unchanged. Both repository workflows succeeded.

Reader language layers are data-driven, including RTL/script direction, labels,
regional tags, contents subtitles, passage tools, offline caching and Watch
excerpts. Publisher URLs are clickable. Only en/zh/ja have offline dictionary
packs; other languages use their own online entries. Interface locales remain
separate from book languages. 64 client tests, 35 server tests, 8 importer tests,
8 catalogue tests, 18 mobile-browser checks, Swift model checks, lint, TypeScript
and renderer/build gates passed. No new physical-device test is claimed.

**Production still uses the previous release lane:** iOS1.0.9(14) is
WAITING_FOR_REVIEW; Mac1.0.9(14) is IN_REVIEW; Google production14 remains in
review for 172 regions. These reviews were not cancelled. The public update
feed still names approved versions only. Submit qualified1.0.10(15) as the next
production update once each active review clears; do not mistake test availability
for production approval.

[Release receipt](artifacts/languages-1.0.10-15.json) ·
[Language QA](../evidence/languages-20260930/README.md) ·
[Book publishing guide](../docs/library-publishing.md)

## Earlier release history

# Approved icon update submitted — 2026-09-30 HKT

**Bunko 1.0.9 (14)** is available in TestFlight (iPhone/iPad, paired Watch and
universal Mac) and Google Play internal testing. Both Apple updates are
**WAITING_FOR_REVIEW**, with **AFTER_APPROVAL** release. Google production14
is under **Changes in review**, full rollout to all **172** eligible paid-app
countries, managed publishing off. The Console confirmed **13 changes sent for
review**; its running-check banner later cleared, with no unsent changes. Submission activity explicitly confirms submission 4 is In review.
The owner authorized replacement of the earlier queued Apple and Google builds.
Apple 1.0.8 (10) remains public; `public/updates.json` still advertises approved
releases only.

The approved icon has a white bottom-right gradient and stronger blue upper-left
文 strokes. It is embedded in all platform packages and live on the web (public
512px asset byte-verified). Every previous master remains archived. Google’s new
listing icon has its AI provenance declared; all four descriptions now include
the private document companion. Its data safety covers optional IDs, messages,
files/documents, service interactions, search history and other user content.
Dedicated Bunko demo credentials and instructions were verified privately after
reload; reviewers can post real comments and use documents without an owner
email verification code. No credentials are included in tracked evidence.

58 client and 35 server tests, lint, TypeScript, renderer and web build passed.
Signed Android APK/AAB, iOS/Watch and universal Mac archives passed packaging;
both Apple packages passed validation and upload. Fifteen opaque icon exports
match the approved master. Watch13 native paired-simulator/ruby/offline QA carries
forward because this update changes the icon and build number only. No new
physical Watch or Apple-native demo-login test is claimed.

[Exact release receipt](artifacts/icon-release-1.0.9-14.json) ·
[Icon and Google evidence](../evidence/icon-release14-20260930/README.md) ·
[Reviewer procedure](reviewer-access.md)

## Earlier release history

# Watch ruby update submitted — 2026-09-30 HKT

**iOS/Watch 1.0.9 (13) is VALID, IN_BETA_TESTING and WAITING_FOR_REVIEW.**
Apple review `86b5ae07-b98f-42b2-98ea-979c13076e55` was submitted at
03:13:31 UTC for automatic release after approval. The owner authorized replacing
build 12 after qualification. Mac 1.0.9 (12) remains in its existing review;
Android 1.0.9 (12) remains available internally, with its production draft staged.
Approved Apple 1.0.8 (10) remains available, and the public update feed is unchanged.

Watch excerpts now preserve original Chinese pinyin and Japanese furigana and
interlace the selected languages by the book’s aligned sentence units. Bold
language labels, independent main/ruby sizes, a ruby switch and legacy-cache
compatibility are included. Re-send older excerpts from the updated iPhone app
to add readings. Figure/equation passages stay in the full reader.

58 client and 35 server tests, lint, TypeScript, renderer and web build passed.
Swift model checks and the native paired-simulator build passed. A real reader
button transfer delivered six Daodejing units with 124 ruby tokens; Watch cache
and rendering survived a cold launch with the phone simulator shut down.
Default/maximum font sizes, ruby-off state and second-unit restoration were
inspected. Physical Watch/Crown/tap coverage is not claimed. The simulator’s
stale installation registration was repaired by reinstalling only its Watch app.
The signed release binaries contain no private QA driver. New Watch screenshot
upload completed before submission. Existing dedicated demo credentials remain
in App Store Connect and need no owner email verification code.

See [release receipt](artifacts/watch-release-1.0.9.json),
[QA evidence](../evidence/watch-ruby-20260930/qa.json) and
[Watch behavior](../docs/watchos.md). Sources and screenshots are committed;
packages, private API receipts and test drivers remain ignored. Both Bunko
simulators and archive/upload processes are stopped; peer devices are preserved.

## Earlier release history

# Reviewer access candidate — 2026-09-30 HKT

Bunko’s web reader and backend now offer a visibly labelled **Demo account**
login for invited testers and review teams. Dedicated credentials require no
owner email code. Actual public GitHub commenting/replying and private demo
companion upload/reading/chat were verified; demo content is isolated from
ordinary readers and visibly shared among users of the demo account. Native
Android secure persistence and cold restart passed with its Debug shell using
the production web bundle. Automated verification:54 client/35 server tests,
lint, TypeScript, document renderer and web/native packaging.

**iOS/Watch and universal Mac1.0.9(11) are VALID and IN_BETA_TESTING** in Bunko
Internal. Their production drafts have the exact builds and verified private
demo credentials, but remain **PREPARE_FOR_SUBMISSION**. Existing approved
Apple 1.0.8 (10) stays public. Android’s signed11 APK/AAB is prepared; no Google
review/access change was made. No formal review was submitted or cancelled.

On an actual rejection, use the [reviewer access procedure](reviewer-access.md)
and the qualified replacement binary. Do not give an old8/10 binary the new
demo password: it lacks the Demo account screen. Fresh Apple native demo login
was not separately tested in this update; signed archive/Apple validation and
live web/Android evidence are distinct. The [candidate receipt](artifacts/reviewer-access-1.0.9.json)
records exact artifacts and verification limits. Secrets remain outside Git.
The shared LazyingArt adapter remains unqualified and disabled.

Owned QA browser6187/CDP9487 and emulator5576 are stopped; KVM archive job was
removed. Shared desktops and other projects were preserved. Private continuation:
`.runtime/review-demo-20260930/handoff.md`.

---

# Mac production release — 2026-09-30 HKT

**Bunko Mac 1.0.8 (10) is released and publicly available.** Apple released the
approved version automatically at 2026-09-29 22:50:52 UTC. App Store Connect
confirms READY_FOR_DISTRIBUTION, exact build
`86831728-f214-4e77-b553-59c77470e1ad`, and completed review
`135f98bf-97e0-473a-b148-39817fe20c41`. The public `platform=mac` App Store page
independently confirms version 1.0.8 and that Mac release timestamp.

The Mac update feed now advertises 1.0.8 (10). All 175 Apple territories remain
configured available, including automatic availability in future territories.
The existing US $0.99 base price is retained. No manual release request, new
binary, review replacement, or device runtime was required.

[Open Bunko for Mac](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac).
The detailed receipt is [Mac distribution](artifacts/distribution-macos-1.0.8-20260930.json).
iOS/Watch 1.0.8 is already public; this task did not change Google Play.

Earlier entries below are historical checkpoints.

---

# iOS public distribution — 2026-09-29

**Bunko iOS 1.0.8 (10), including the paired Apple Watch companion, is public.**
Apple released it automatically at 04:55:03 UTC on September 29. App Store Connect
reports READY_FOR_DISTRIBUTION with the exact qualified build
`a561f6e3-1256-4943-ae30-0954299ca5a5`. Public Apple lookup confirms 1.0.8 in the
US, Hong Kong, UK and Japan, and the US App Store page resolves. No manual
release request or new upload was needed.

The iOS update feed is advanced to 1.0.8 (10). Mac 1.0.8 remains IN_REVIEW with
automatic release selected; its existing public feed entry is preserved. Google
was not changed in this iOS distribution task. Eleven README language versions
carry the new iOS status. The detailed receipt is
[distribution-ios-1.0.8-20260929.json](artifacts/distribution-ios-1.0.8-20260929.json).

The entries below are historical checkpoints.

---

# Apple platform release — 2026-09-28

**Bunko 1.0.8 (10) is Waiting for Review on iOS (including Apple Watch) and
macOS**, with automatic release after approval. Both exact builds are VALID and
IN_BETA_TESTING in the existing Bunko Internal group. No tester reinvitation was
needed. The previous pending iOS1.0.7 review was replaced only after both new
archives passed signing, Apple validation and native runtime checks.

The new Watch app keeps three explicitly selected multilingual text excerpts
for offline reading, with paragraph navigation and text size. Mac includes the
latest icon and private document companion. Pricing and existing Apple territory
availability are unchanged; Google Play remains build8 under its previous review.
App Store Connect now reports Mac1.0.6 READY_FOR_DISTRIBUTION. The public update
feed stays on the previously verified listing versions until public store checks
confirm the newer release; review-only1.0.8 is not advertised there.

47 client tests,29 server tests,lint/type/build,compiled renderer,Swift payload
checks,real paired iPhone/Watch simulator transfer and disconnected restart passed.
M5Pro Mac mini passed10 native reading/menu/download/offline/equation/figure checks.
Its direct book-host connectivity failed; a temporary app-scoped proxy enabled the
repeat, then HTTP was blocked to verify offline storage. All owned test runtimes
and temporary tunnels are stopped. No physical Watch or new Mac OAuth test is
claimed; earlier iOS ordinary-reader/document checks remain recorded in1.0.7.

Exact builds, hashes, review IDs and evidence: [release1.0.8](artifacts/release-1.0.8.json)
and [submission receipt](artifacts/submission-1.0.8.json). Unified central auth remains
a separate disabled adapter milestone. Earlier entries below are historical.

---

# Bunko store handoff

Updated 2026-09-27. Owner authorized takeover of the prior session and completion of publication on both stores, including formal review submission. The agreed price is USD 0.99 paid up front.

## iOS 1.0.7 (9) submitted — 2026-09-27

- iOS build9 is VALID and IN_BETA_TESTING in the existing Bunko group.
- Formal review `9fb85eb9-61b8-4944-8116-bb48b55ee9d1` is **WAITING_FOR_REVIEW**,
  with automatic release after approval. Version record
  `635aa670-cf34-4ab8-b46b-f9624e0859c3` selects build
  `96bfb05d-4add-4ee5-a173-05c90e1be93e`. The former iOS build8 review was replaced.
- Four localized descriptions/release notes and dedicated reviewer instructions
  are saved. Existing English iPhone/iPad screenshots remain complete; other
  locales use those fallback screenshots. Apple privacy is published for seven
  optional data categories used for app functionality, linked to identity, with
  no tracking. The public privacy policy describes Mathpix/DeepSeek processing.
- Mac1.0.6(8) remains WAITING_FOR_REVIEW and Google build8 remains the submitted
  production candidate. Neither received a new build9 binary in this milestone.
- iOS1.0.4(6) remains the verified public version; do not update the release feed
  until build9 is approved and publicly available. Source is pushed to main.

## Latest submission and approval checkpoint — 2026-09-27

- Apple iOS and Mac **1.0.4 (6)** are approved and public. The live update feed now advertises that version for both Apple platforms; Android remains null until its production listing is verified public.
- Latest **1.0.6 (8)** has been formally submitted on iOS and Mac, **Waiting for Review**, automatic release after approval. iOS review `d33d74d7-83dd-4780-bcf1-6b93c2c14205` (23:20:52 UTC Sep 26), Mac review `820aa2eb-f4c1-490a-964d-91db06461426` (23:21:07 UTC). See `artifacts/submission-1.0.6.json` for exact version/build IDs and current Google status.
- Google production **1.0.6 (8)** is confirmed **Changes in review** after seven changes were sent and Restart review replaced build 6. Automated checks completed; full rollout targets 172 eligible countries, managed publishing off. There are no unsent changes.
- Apple privacy is published for optional User ID and Other User Content, linked to identity for App Functionality, with no tracking. UGC/messaging age answers are enabled. Google data safety, IARC and four localized descriptions were updated. Dedicated ordinary reviewer credentials were supplied privately to both stores; the owner's personal credentials were not shared.
- Real iOS simulator cloud OAuth, native Keychain, process restart, draft persistence and sign-out passed. A separate non-maintainer account passed real web OAuth, enabled composition, reload/session/draft restoration and sign-out. No public test post was made. Mac native authorization was not separately live-tested; original reader runtime tests on Intel hosts remain the available evidence. Physical iPhone/Apple silicon runtime coverage is not claimed.
- 44 client and eight server tests, lint, type and production build passed. Eleven README approval/status updates passed the profile checker. The owner remains an installed internal tester, with latest8 available on all three internal channels; no repeat invitation was sent.
- Shared LazyingArt login is a **successor milestone**, not included in build 8. Owner requires general signup without an EchoMind invitation and a separate configurable EchoMind usage gate. Detailed notes were delivered to active/app repos; the EchoMind owner was queued to own central identity. See `../docs/shared-account.md`. Preserve the current review while that work proceeds.

Earlier entries below are historical, including superseded pending-QA/review statements.

## Persistent login follow-up — 2026-09-26

- **1.0.6 (8)** is live on the web and available in Play internal testing and iOS/Mac Bunko Internal TestFlight. Apple builds `1e33deac-cacc-4551-9865-a2981a0d50d0` (iOS) and `407ff4ac-0078-42f4-b4fc-4d4d80de204b` (Mac) are VALID and IN_BETA_TESTING. All four release-note languages are set. The mistakenly numbered Mac 1.0.6 (7) was superseded and expired; both Apple build scripts now check the archive version before export. See `artifacts/release-1.0.6.json`.
- The owner reported a generic connection failure and requested persistent login. Secure native storage, web HttpOnly cookies, server refresh-token rotation, lost-response recovery and transient retry are implemented. Live web reload and Android process-restart restoration passed. 44 client tests and eight server tests pass.
- Normal authenticated use keeps login active; 90 inactive days, GitHub expiry/revocation, or explicit sign-out ends it. Existing users must sign in once in the new build to create a persistent session. The precise reported device/error was not supplied; do not claim that report was reproduced exactly.
- Apple native authorization/persistence and ordinary-reader permission still need live verification before a successor formal review. A hard kill immediately after typing can lose the newest WebView draft before its disk flush. No public test comment was posted.

## Discussions update — 2026-09-26

- **1.0.5 (7)** is available in Google Play internal testing and iOS/Mac **Bunko Internal TestFlight**. Apple builds `df651fed-86df-4dfe-8675-adc8b92ced9a` (iOS) and `d9269fa2-985b-476a-a1ca-5c3004277a5e` (Mac) are VALID and IN_BETA_TESTING. All four release-note languages are set. See `artifacts/release-1.0.5.json`.
- GitHub sign-in and passage comments now use the cloud-hosted Bunko discussion service, with no workstation dependency. Drafts/private notes stay local; public comments use the reader's GitHub identity. Live web and Android authorization passed; 41 frontend and five backend security tests passed. No public test comment was posted.
- iOS/Mac native authorization and a separate ordinary-reader account still need live verification. Before a successor formal review, update Apple privacy and Play data safety for optional GitHub identifiers and public user content. Current **1.0.4 (6)** formal submissions were not replaced by this internal release. Keep `public/updates.json` limited to verified public store releases.
- Cloud operations and cleanup receipts are private in `.runtime/github-comments/handoff.md`. The shared store browser and other projects' Mac sessions remain under their owners' control.

## Current update — 2026-09-26

- **1.0.4 (6)** adds optional update prompts, Settings checks and installed-version details in all four interface languages. The web deployment is live; Play internal and iOS/Mac Bunko Internal TestFlight are available. Apple build IDs: iOS `7f94444e-1598-4e2c-8630-8ad188f9cda1`, Mac `7774df2d-47aa-49a1-9dbe-32f2ecf04285`, both VALID and IN_BETA_TESTING.
- Owner then explicitly requested formal review of **1.0.4 (6)**. iOS and Mac were resubmitted and are **Waiting for Review**, automatic release after approval: iOS review `c2b55561-aa37-4eab-93be-da10b70098ba` at 02:47:23 UTC; Mac review `43b3b629-b7e3-4524-b100-1c97495a877f` at 02:49:20 UTC. Google production build 6 was submitted at 100% rollout across the existing 172 territories; Console shows **Changes in review**, with automatic pre-review checks running. Earlier submissions were replaced, restarting review. Public iOS remains 1.0.1 (2) until approval. See `artifacts/submission-1.0.4.json`. Preserve the new reviews unless the owner explicitly requests another replacement.
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

## 2026-09-27 successor 1.0.7 (9)
The vivid icon and private document companion are packaged in iOS build 9; Apple
validation/upload succeeded, delivery/build `96bfb05d-4add-4ee5-a173-05c90e1be93e`,
IPA SHA-256 `afab2e4d18f8adae5bfbaefae708bf37468e89bf7eb77567724b1162f422f998`.
The cloud companion release `d56cd5452c2179b8` is active on the existing Bunko
host; GitHub credentials and sessions were preserved, and central auth remains off.
A first-use disclosure names Mathpix/DeepSeek; storage growth is bounded for the
shared host. Live simulator QA used a non-maintainer GitHub account, native DOCX
file selection, a preserved figure/equation, arXiv Wootters PDF conversion, 243
math elements, a cited reply and process-restart account/library restoration.
Reader width and scroll width both 402 px. No physical iPhone test is claimed.
Current public iOS remains 1.0.4; iOS build9 has replaced the build8 review after
metadata/privacy completion. See the latest submission checkpoint above. Native Android and Mac version9 sources are prepared,
but their binaries have not been built/uploaded.

# Apple release verification · 4 October 2026 HKT

**iOS/Watch 1.0.10 (16) is public; Mac 1.0.10 (16) is still IN_REVIEW.**
At 21:00 UTC on 3 October, App Store Connect confirms the exact iOS build
`2aa119e0-47a3-4ec9-86a5-13cdd6956d82` is READY_FOR_DISTRIBUTION and its review is
COMPLETE. The public US and Hong Kong listings show 1.0.10, released automatically
at **2026-10-03 19:07:58 UTC**. The iOS update feed now advertises build 16.

The owner reported Mac approval, but the fresh Mac version and review both report
IN_REVIEW for build `74b65c86-e6c8-4508-96fa-e2a12db79138`. The public
`platform=mac` page independently still shows **1.0.8 (10)**. Mac 1.0.10 (16) is
configured for automatic release after approval. Its pending review is preserved;
the Mac update feed stays at the verified public build 10.

All 175 Apple territories remain available, including future territories, and
iOS has no phased release. The public US price remains $0.99. Build 16 contains
the approved icon and multilingual reader fixes; the later cloud-plan and owned
book-mirror client work is absent from this Apple binary. Google build 17 was
last verified public on 3 October and was not changed here.

[Platform-specific evidence](artifacts/distribution-apple-20261004.json). No new native build or device GUI was used.

## Earlier records

# Current review checkpoint · 3 October 2026

Android build 16 was rejected for an invalid privacy-policy URL. Build 17 and
an independently hosted static policy passed review and became public at
11:17 HKT on 3 October, with 100% rollout across 172 countries. Build 17 is also
available internally. The dedicated Demo credentials were reverified. At 05:47 UTC,
Google shows No issues found, all 10 declarations Actioned, and no pending or
unsent changes; the corrected privacy URL is saved. Apple iOS/Watch
and Mac build 16 remain WAITING_FOR_REVIEW at the last readback. See
[the current handoff](operator-handoff.md) and
[Android 17 distribution receipt](artifacts/distribution-android-1.0.10-20261003.json).

Cloud purchases remain disabled until app-specific native billing, provider
configuration and real sandbox lifecycle qualification are complete.

## Historical distribution record

# iOS/Watch public release — 2026-10-01 HKT

**Bunko 1.0.9 (14)** passed review and was automatically released at
**2026-09-30 23:09:04 UTC**. App Store Connect reports `READY_FOR_SALE` /
`READY_FOR_DISTRIBUTION`; review `85e827ad-943b-405f-a170-4179e4be3aa7` is
`COMPLETE`. The exact released build is `8fef4a93-7c7e-4506-a284-42bdf30f0092`.
No manual release request or new submission was needed.

The public US, Hong Kong, UK and Japan lookups all show **1.0.9**. All **175**
Apple territories report available, future territories are enabled, and there
is no phased release. US price remains **$0.99**. The iOS public update feed now
names **1.0.9 (14)**, including its paired Watch companion.

Mac **1.0.8 (10)** remains public; Mac **1.0.9 (14)** is still `IN_REVIEW`.
The newer **1.0.10 (16)** remains available internally and was not submitted
in this release confirmation. Google review was not changed or rechecked.
No native build, browser desktop, account or backend change was needed.

[App Store](https://apps.apple.com/app/id6815137919) ·
[Release evidence](artifacts/distribution-ios-1.0.9-20261001.json)

## Earlier records

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

## Remaining product work

Shared LazyingArt identity stays disabled pending central provisioning and end-to-end qualification. Store approval and public propagation are external steps; no owner sign-in is currently needed for these submitted Apple builds.

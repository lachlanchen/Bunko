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
Apple1.0.8(10) stays public. Android’s signed11 APK/AAB is prepared; no Google
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

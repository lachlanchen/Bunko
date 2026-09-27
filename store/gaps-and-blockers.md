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

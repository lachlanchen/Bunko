# Bunko latest review submission · 13 October 2026

The owner requested the latest Bunko and OnlyIdeas updates submitted for review.

| Platform | Candidate | Verified status |
| --- | --- | --- |
| iOS / paired Watch | 1.0.13 (23) | Waiting for Review |
| Universal macOS | 1.0.13 (23) | Waiting for Review |
| Google Play production | 1.0.13 (23) | Changes in review; automatic checks completed |

Both Apple builds are VALID and available in the existing internal TestFlight group. Android23 is available to internal testers. Apple automatic release and Google 100% rollout with managed publishing off remain selected. No unsent Google changes remain. The older Mac22 review was canceled and replaced under this explicit latest-update request. At preflight, iOS22 and Google22 were available; Mac10 remained the published Mac release.

## Included

- Secondary translations now offer passage discussion buttons, with a persistent Settings option to hide them. All language entrances use the same discussion and the selected language's excerpt.
- Native iOS/Android and Mac packages use `https://bunko.lazying.art/bunko`. The original endpoint, GitHub callback and PWA host-scoped cookies remain compatible. Both entrances reach the same backend/session database.
- Current-book translation requests, direct reading of existing languages, ordered main/translation selection, ruby, improved Settings dismissal, swipe-back, Watch excerpts and the approved rounded icon accumulate from the previous candidate.

## Qualification

- `npm run check`: **104 client + 58 server tests (162 total)**, lint, renderer, TypeScript and web build passed.
- Android debug/release assembly, release bundle and release lint passed. APK signature verified. Signed iOS/Watch and universal Intel/Apple-silicon Mac archives exported successfully and Apple processed both as VALID.
- Packaged entry JavaScript hashes match the tested web assets in both Apple archives. Version/build identities match, including Watch23. Direct-host and translation-bubble code is embedded.
- Actual browser checks verified default translation bubbles, Japanese discussion context, and the persistent hide toggle while retaining the main-language button.
- Fresh production PWA Demo login, reload persistence and logout passed without GitHub navigation or OTP. A separate real native-protocol HTTPS test passed direct-origin PKCE Demo login, session restore, agent-state access and logout.
- The actual AppKit/WebKit host with the exact packaged assets passed direct-origin Demo login, WebView reload/session restore and sign-out on KVM macOS15.7.9. **Harness boundary:** this isolated helper uses its own app/session service and the login Keychain under ad-hoc signing. Production uses its unchanged Data Protection Keychain and distribution signing. The ad-hoc helper initially failed its production-entitlement Keychain access; that is recorded as a helper limitation, not a passed production-signing test. No new physical-device, production Data Protection Keychain or GitHub consent run is claimed.
- New Apple phone/iPad/Mac reader screenshots are complete in App Store Connect. Their provenance is Chromium rendering of the exact packaged web assets, not native-device captures. Existing qualified Watch and other screenshots were retained.
- Four-language Apple release notes and the private reviewer credentials were read back. Reviewers use **Reading companion → Demo account**, which requires no owner email code. OnlyIdeas has its own different GitHub reviewer flow.

## Boundaries and receipts

General subscription purchases and the shared-account adapter remain disabled. No pricing, provider accounts, permissions, public feeds, backend data, ingress or PWA deployment changed in this task. The current public releases stay available while the new candidates are reviewed.

Exact review/build IDs, signed hashes, screenshots and test limits: [curated receipt](latest-review-20261013.json). Working logs, upload responses and store screenshots remain in ignored `.runtime/review-20261013/`. The corrected Mac upload command specifies build23/version1.0.13; its first attempt incorrectly named the old build22 and was rejected before the successful delivery.

The owned preview4173, noVNC6190/CDP9490, KVM archive agent and isolated QA helper were stopped after evidence capture. Temporary QA credentials were removed. The persistent store browser profile remains reusable. No Mac mini, shared6165 desktop or peer runtime was changed.

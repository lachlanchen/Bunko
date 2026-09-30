# iOS/Watch 1.0.9 (13) submitted — 2026-09-30

Build 13 is VALID and IN_BETA_TESTING. Review
`86b5ae07-b98f-42b2-98ea-979c13076e55` is WAITING_FOR_REVIEW, submitted
03:13:31 UTC with AFTER_APPROVAL release. It replaces build 12 with owner
authorization after Watch ruby, sentence alignment and offline qualification.
The new Watch screenshot is COMPLETE and the existing demo credentials are
preserved. Mac 12’s separate review is unchanged. See the
[receipt](../artifacts/watch-release-1.0.9.json) and
[QA report](../../evidence/watch-ruby-20260930/qa.json).

## Earlier release history

# Reviewer access candidate — 2026-09-30

iOS/Watch **1.0.9 (11)** is VALID and IN_BETA_TESTING. Its production draft
contains the exact build, dedicated inbox-independent demo credentials and
review instructions; it remains **PREPARE_FOR_SUBMISSION**, not submitted.
Real public comments and replies, companion upload/reading/chat, and web/Android
session persistence were verified. Fresh Apple native demo login was not
separately exercised in this update. Current **1.0.8 (10)** stays public.

[Reviewer procedure](../reviewer-access.md) · [Candidate receipt](../artifacts/reviewer-access-1.0.9.json).

---

# Public distribution — 2026-09-29

iOS **1.0.8 (10)** is **READY_FOR_DISTRIBUTION**, with the paired Apple Watch
companion. Exact build `a561f6e3-1256-4943-ae30-0954299ca5a5` matches the signed
candidate in the release manifest. Automatic release completed at
**2026-09-29 04:55:03 UTC**; no manual release request was needed.

Apple's public lookup returns 1.0.8 in the US, Hong Kong, UK and Japan; the US
listing returns HTTP 200. US price remains USD 0.99. The iOS update feed now
advertises 1.0.8 (10). Mac 1.0.8 is still IN_REVIEW and was not released by this task.

[App Store](https://apps.apple.com/app/id6815137919) ·
[Distribution evidence](../artifacts/distribution-ios-1.0.8-20260929.json)

Earlier submission records below retain their original dates and states.

---

# Current Apple review — 2026-09-28

**IOS1.0.8 (10): Waiting for Review**, automatic release after approval.
Review `df08e230-c2d3-4c5f-97dc-b5a8b7949316`, version `635aa670-cf34-4ab8-b46b-f9624e0859c3`, build `a561f6e3-1256-4943-ae30-0954299ca5a5`;
submitted `2026-09-27T20:09:45.657Z`. The exact build is VALID and IN_BETA_TESTING.

The iOS archive embeds the new native Watch companion. Both versions have four
localized descriptions/release notes and dedicated reusable reviewer access;
Watch and refreshed Mac screenshots were COMPLETE before submission. The existing
privacy label covers optional cloud documents/discussions; Watch transfers only
local text excerpts, without account credentials or private agent documents.

[Release qualification and limits](../artifacts/release-1.0.8.json) ·
[Submission receipt](../artifacts/submission-1.0.8.json).

Earlier records below are historical.

---

# Current submission — 2026-09-27

**IOS 1.0.6 (8): Waiting for Review**, automatic release after approval. Submitted `2026-09-26T23:20:52.376Z`, review `d33d74d7-83dd-4780-bcf1-6b93c2c14205`, version `635aa670-cf34-4ab8-b46b-f9624e0859c3`, build `1e33deac-cacc-4551-9865-a2981a0d50d0`. Apple has already approved and released **1.0.4 (6)** for iOS and Mac; the successor is not yet public.

Four localized descriptions/release notes, delivered screenshots, optional-discussion privacy labels, age declarations and dedicated reviewer access were updated before submission. See [submission receipts and QA limits](../artifacts/submission-1.0.6.json). No personal owner credentials were shared. Native iOS secure-session and ordinary web reader checks passed; Mac native authorization was not separately live-tested in this follow-up.

The records below are historical checkpoints.

---

# App Store submission — 2026-09-23

Bunko: Classics with Ruby (`art.lazying.bunko`, Apple ID `6815137919`) version **1.0.0 (1)** was **Waiting for Review** when submitted on 2026-09-23. Automatic release after approval was selected. US base price is **$0.99**, with availability configured for all 175 Apple territories and future territories (local availability still depends on Apple's regional requirements).

- Review submission: `94daf1ea-f335-40e0-8d0d-854a14246983`.
- Version: `b98be3d1-d25b-4d08-b22b-499403cfc4e3`.
- Build / delivery UUID: `512883f9-e3c0-4972-9546-e5785154c5af`, processing **VALID**.
- TestFlight: `Bunko Internal` group has access to build 1. The owner's invitation was sent and received on 2026-09-23; Apple subsequently reported the tester as **INSTALLED**. Installation links and instructions were also emailed to the owner. Private invitation details remain outside git.
- Four listing languages: en-US, zh-Hans, zh-Hant, ja; five iPhone screenshots and two iPad screenshots accepted.
- Categories: Books, Education. App Privacy published as Data Not Collected; policy explains external book-host requests and GitHub requests.
- Age disclosure covers literary violence, weapons, mature themes, historical profanity, substance references and non-graphic sexuality. There are no graphic audiovisual depictions or prolonged sadistic violence; ordinary literary violence remains declared. Apple applies mature ratings by region (17+ under older systems, 18+ in relevant regions). Do not market as a children's app.
- Validation: eight web tests, production build, archive/export, strict codesign and Apple server validation passed. The app includes a UserDefaults privacy manifest for local preferences (`CA92.1`) and reports no non-exempt encryption. Exact hashes are in `store/artifacts/release-1.0.0.json`.

Public link after approval: https://apps.apple.com/app/id6815137919 . This is a submission record, not an approval or live-publication claim.

Before the first approval, App Store Connect also reported **1.0.1 build 2** (`5fcc84a8-d44c-4b0c-84ed-7bbf8563f02b`) as **VALID** and available to the Bunko Internal TestFlight group. It was not attached to the 1.0.0 review submission.

## Approval and 1.0.1 update — 2026-09-25

App Store Connect now reports 1.0.0 (1) **Ready for Sale**, and its original review submission **Complete**. The public US App Store page resolves; Apple's US lookup reports version 1.0.0 at **USD 0.99**. Availability on other storefronts may follow their local rollout timing.

Version **1.0.1 (2)** was created with build `5fcc84a8-d44c-4b0c-84ed-7bbf8563f02b` (processing **VALID**, marketing version 1.0.1). Its four localized descriptions now say 150 books, and all four have release notes for covers, Light/Dark/System themes, catalogue refresh and offline improvements. Five inherited iPhone and two iPad screenshots remain attached to the English localization. Review notes were updated to explain the live catalogue and the new reader features.

Review submission `e560b7c7-e6e5-4342-bb64-5d8486e69b21` was submitted on 2026-09-25 at 02:05:30 UTC and is **Waiting for Review**. Automatic release after approval remains selected. See [`../artifacts/apple-submission-1.0.1.json`](../artifacts/apple-submission-1.0.1.json) for the curated IDs and state.

Availability rechecked 2026-09-25: App Store Connect lists **175 territories total**, with Bunko marked **available** and content status **AVAILABLE** in all 175. `availableInNewTerritories` is true, so newly added App Store territories are included automatically, subject to Apple's local rules.

On 2026-09-25, the expanded-reader **1.0.2 build 3** IPA was validated and uploaded (delivery UUID `6057045f-30d5-47ae-8beb-047dabb37be2`). App Store Connect reports processing state **VALID**. The Bunko Internal TestFlight group lists builds 1, 2 and 3. This test build was not attached to or substituted into the pending public 1.0.1 review.


## iOS 1.0.3 (5) — 2026-09-26

Apple now reports iOS **1.0.1 (2) Ready for Sale**. Version **1.0.3 (5)** was validated, uploaded and made available in Bunko Internal TestFlight. Its new public review was submitted at **2026-09-26 01:58:51 UTC**, with automatic release after approval, and is **Waiting for Review**.

- Version: `724eb6b6-f757-4419-986b-fae45a885d08`.
- Build / delivery: `37bc403e-26d8-4553-9848-91287d29f8b3`, VALID and IN_BETA_TESTING.
- Review: `67ade8e6-50c0-429f-a5fb-268aea4b5863`.
- Four localized descriptions, release notes and TestFlight notes explain explicit word selection, edge swipe, compact header and independent ruby sizing, plus the owner shelves, local dictionaries and equation support added since 1.0.1.
- Five inherited iPhone and two iPad screenshots were verified COMPLETE; review contact information was copied privately from the approved version. No price, territory or age-disclosure setting was changed.
- Thirty automated tests, Android native selection/back testing and browser/WebKit checks passed. Physical iPhone gestures were not tested in this update.

See [release evidence](../artifacts/release-1.0.3.json) and [reading controls](../../docs/reading-controls.md).

## Update detection — 1.0.4 (6), September 26

iOS build `7f94444e-1598-4e2c-8630-8ad188f9cda1` is VALID and IN_BETA_TESTING in Bunko Internal. The existing 1.0.3 (5) Waiting for Review submission was preserved; 1.0.4 is internal only. Update controls support all four UI languages. See [release evidence](../artifacts/release-1.0.4.json) and [update guide](../../docs/app-updates.md).

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

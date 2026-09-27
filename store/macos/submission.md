# Current Apple review — 2026-09-28

**MAC_OS1.0.8 (10): Waiting for Review**, automatic release after approval.
Review `135f98bf-97e0-473a-b148-39817fe20c41`, version `731c37f4-b4ed-4268-bafa-e5bfda8f7284`, build `86831728-f214-4e77-b553-59c77470e1ad`;
submitted `2026-09-27T20:10:02.462Z`. The exact build is VALID and IN_BETA_TESTING.

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

**MAC_OS 1.0.6 (8): Waiting for Review**, automatic release after approval. Submitted `2026-09-26T23:21:07.428Z`, review `820aa2eb-f4c1-490a-964d-91db06461426`, version `dc8a9e23-89c4-472e-b9c5-878cc080771a`, build `407ff4ac-0078-42f4-b4fc-4d4d80de204b`. Apple has already approved and released **1.0.4 (6)** for iOS and Mac; the successor is not yet public.

Four localized descriptions/release notes, delivered screenshots, optional-discussion privacy labels, age declarations and dedicated reviewer access were updated before submission. See [submission receipts and QA limits](../artifacts/submission-1.0.6.json). No personal owner credentials were shared. Native iOS secure-session and ordinary web reader checks passed; Mac native authorization was not separately live-tested in this follow-up.

The records below are historical checkpoints.

---

# Mac App Store submission — 2026-09-25

Bunko **1.0.2 (4)** was submitted at **2026-09-25 14:11:44 UTC** and App Store Connect confirmed **Waiting for Review**. Automatic release after approval is selected. This is the first native Mac version on the existing Bunko app record; it is not yet a publicly approved Mac release.

| Record | Value |
| --- | --- |
| Apple app / bundle | `6815137919` / `art.lazying.bunko` |
| Platform | `MAC_OS` |
| Version | `e6ebf529-e204-46a7-9f85-f19abe11831b` |
| Build / delivery UUID | `0f2600ec-836f-4924-a423-6cc3a0c3985b` |
| Review submission | `e49ee8d7-3964-40ac-99e4-ec47133ebd51` |
| Processing | `VALID` |
| Internal TestFlight | `IN_BETA_TESTING`, Bunko Internal group |
| Minimum macOS | 12.0 |
| Architectures | Intel `x86_64` and Apple silicon `arm64` |
| Installer SHA-256 | `79b8b3873b548d5a531ed469ed56c55398c239b9b1762d3e4fd68058fc4c20b6` |

The universal purchase uses the same app record, US $0.99 base price and existing territory selection. The Apple account's 175-territory availability was verified earlier on 2026-09-25; no availability selection was narrowed for Mac. Local storefront rules and Apple's approval still apply.

## Listing and review

- Descriptions, keywords and promotional text: English, Simplified Chinese, Traditional Chinese and Japanese, in [`listings.json`](listings.json).
- Three 1280×800 RGB screenshots from the actual 7050 iMac app: library, bilingual ruby reader and physics equations. Apple asset delivery state was COMPLETE for all three before submission. The English screenshot set supplies the primary screenshots.
- Review notes explain offline downloads, native menus, local dictionaries, private notes, optional GitHub discussions and the rights records. No login is required.
- The build declares no non-exempt encryption and includes the preferences privacy manifest. The sandbox permits outgoing network connections.
- The iOS 1.0.1 review remains Waiting for Review and was not replaced. Play production was not modified by this Mac submission.

## Validation

- Web checks: 21 tests, lint, TypeScript and production build passed.
- KVM Mac, macOS 15.7.9: native reader/menu/offline/equation/figure checks passed; Xcode 26.3 universal archive and export passed.
- 7050 iMac, macOS 15.7.7: ten native checks passed, including downloaded book reopening at the saved final chapter while app HTTP requests were blocked, and fully loaded cover artwork.
- 3040, macOS 12.7.6: nine native checks passed, including the saved-chapter offline regression and technical-book rendering.
- Strict app code signature, universal architectures, installer signature and Apple `altool` validation passed. Upload succeeded with no errors.
- Apple silicon runtime testing is still outstanding; both architectures compiled and the universal installer passed Apple validation.

The debug harness exits after capture. Bunko released the shared desktops; coordination is recorded in the owner's requested private `L-And-N/.runtime/macos-20260925/desktop-available.md`. No shared remote desktop or tunnel service was restarted.

See [build and test instructions](../../docs/macos.md) and [curated artifact evidence](../artifacts/macos-release-1.0.2.json).


## Internal update — 2026-09-26

The original Mac 1.0.2 (4) submission is now **In Review**. Mac **1.0.3 (5)** is VALID and **IN_BETA_TESTING** in Bunko Internal, build/delivery `b80dbad6-76ed-4042-919c-8fcccb1e4fb1`. It adds explicit selected-text lookup, Sentence selection, compact header controls, and independent main/ruby sizing. Its four TestFlight notes describe mouse selection and native Mac menus. The ongoing 1.0.2 review was not replaced. See [1.0.3 evidence](../artifacts/release-1.0.3.json).

## Update detection — 1.0.4 (6), September 26

Universal Mac build `7774df2d-47aa-49a1-9dbe-32f2ecf04285` is VALID and IN_BETA_TESTING in Bunko Internal. The existing 1.0.2 (4) In Review submission was preserved; 1.0.4 is internal only. Update controls support all four UI languages. See [release evidence](../artifacts/release-1.0.4.json) and [update guide](../../docs/app-updates.md).

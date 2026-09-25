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

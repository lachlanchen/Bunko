# Bunko 1.0.12 (22): main text and translation labels

11 October 2026. Source `601b65e`. Corrects the label removal in build21 following
the owner's clarification. The first selected language is the main text and has
no language label. Every secondary translation retains its bold language label.
Changing the selection order updates labels in both interlinear and paragraph
layouts. Settings still shows language names and selection numbers.

| Platform | Testing | Formal review |
| --- | --- | --- |
| iOS / paired Watch | TestFlight, VALID and IN_BETA_TESTING | WAITING_FOR_REVIEW |
| macOS, Intel and Apple silicon | TestFlight, VALID and IN_BETA_TESTING | WAITING_FOR_REVIEW |
| Android | Available to internal testers | Changes in review; automatic quick checks recorded separately |

Build22 replaces build21 under the owner's continuing build/submission request.
Apple release remains automatic after approval; Google retains 100% rollout in
172 countries with managed publishing off. Public update feeds and the PWA were
not changed. Earlier translation requests, existing-language direct reading,
selection ordering, Settings closing and swipe-back fixes remain included.

## Verification

- 92 client and 58 server tests pass, with lint, renderer and web/native/Mac builds.
- Four targeted browser checks cover both layouts with English and Japanese as
  the selected main language, labelled translations and narrow-screen overflow.
- Android lint and signed APK/AAB verification pass. Apple archives, exports and
  provider validation pass. Watch version matches22; Mac contains Intel and Apple
  silicon slices. All native reader entry files match the tested JavaScript hash.
- Unchanged authentication carries forward the same-day build19 production-origin
  Demo sign-in/reload check, without GitHub navigation or OTP.
- Thirteen current reader captures cover four UI languages on phone/iPad/Mac plus
  Android. Three English Apple images processed and one English Google image saved.
  Existing book-request, Settings and Watch screenshots remain. The receipt records
  actual platform/locale inventories. Capture is Chromium at platform layout sizes,
  not physical-device evidence. Uploaded screenshots await provider approval.

No new physical-device, Apple-native interaction or purchase test is claimed.
See the [provider receipt and hashes](translation-labels22-20261011.json),
[screenshot manifest](../store/screenshots/translation-labels22-20261011/manifest.json)
and [build21 navigation qualification](navigation21-20261011.md).

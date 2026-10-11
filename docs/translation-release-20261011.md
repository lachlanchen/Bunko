# Bunko 1.0.12 (19) submitted · 11 October 2026

The owner requested building and formal submission of the latest Bunko.

| Platform | Testing | Formal review |
| --- | --- | --- |
| iOS / paired Watch | VALID, in the existing TestFlight group | WAITING_FOR_REVIEW |
| macOS, Intel + Apple silicon | VALID, in the existing TestFlight group | WAITING_FOR_REVIEW |
| Android | Available to internal testers | Changes in review |

Apple will release automatically after approval. Google targets the existing
172 countries at 100% rollout with managed publishing off. The older Mac 18
review was replaced with 19. Pending review is not approval or public availability.
The public baseline remains iOS/Android 18 and Mac 10; update feeds stay unchanged.

## Included

**Request a translation** is available in book details and Settings. Readers
choose one of 11 suggested target languages or enter another language, then
review and submit the prefilled request on GitHub. Opening the form does not
publish an issue or start an automatic translation. Existing reader features,
rounded artwork, offline caching and Watch excerpts are included.

## Qualification

- 83 client and 58 server tests passed; lint, renderer, web/native/Mac web builds passed.
- Android lint, signed APK/AAB and exact package version checks passed.
- Apple archives/export/validation succeeded; the actual packages contain the new
  form. Watch versions match, and Mac contains arm64 and x86_64 slices.
- Browser UI checked at phone, iPad and desktop sizes across all four interface
  locales. Arbitrary target languages and prefilled URLs passed; no overflow.
- Live dedicated Demo login, reload persistence and sign-out passed without
  GitHub/OTP navigation. The localhost attempt was rejected by the existing
  allowed-origin policy; no server policy was weakened.
- Store privacy URL returns direct HTTPS200 without JavaScript or login.

Fresh native-device interaction and purchase tests were not performed. Existing
native reader qualification is retained separately. No price, billing, account,
book-data or public update-feed change accompanies this submission.

## Screenshots

13 current book-detail captures are recorded in the
[screenshot manifest](../store/screenshots/translation-release-20261011/manifest.json).
They render the packaged web UI in Chromium at platform layout sizes; they are
not physical-device captures. Three English Apple screenshots processed fully:
iPhone 6, iPad 3, Mac 4 total; Watch retains 2. Google English phone now has 6 images;
Chinese and Japanese keep 5 each, with 2 screenshots for each tablet class.
Localized alternatives remain prepared locally. Uploaded images await review;
no new public listing appearance is claimed.

[Exact provider identifiers and hashes](translation-release-20261011.json) ·
[Translation feature](translation-requests-20261011.md)

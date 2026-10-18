# Compatibility candidate 1.0.14 (24)

## Changes

The reader keeps the current passage and its position when the reading area changes size. Left and right safe areas are handled independently. Native web assets target Safari 15, and language lookup no longer requires `Object.hasOwn`, improving compatibility with early Monterey WebKit.

The Mac deployment target remains macOS 12.0; iOS remains 15.0. The existing Watch companion is included in the version update. This round does not change account storage, subscriptions or book formats.

## Validation as of 18 October 2026

- 111 client tests and 88 server tests passed, together with lint, type checks, renderer and web builds.
- Browser checks passed for real-book ruby, five reading-area changes, asymmetric safe-area spacing, note drafts and reopening a cached chapter offline.
- Android WebView tests preserved the reading passage through four rotations and a note draft through two rotations. Existing downloaded-book state survived the Debug upgrade. The signed release APK separately passed installation, catalogue/search and Japanese ruby reading checks.
- Android release lint, APK signing and AAB generation passed. Google Play reports build 24 available to the existing internal testers.
- A universal Debug Mac build succeeded. Monterey 12.7.6 loaded the catalogue, covers, settings, search, downloads and ruby. Full resize/offline validation remains pending after correcting the test harness; this is not yet a complete Monterey pass.
- Apple distribution archives and internal TestFlight delivery remain pending the shared build slot. Existing public releases and review candidates were preserved.

## Duo qualification gap

Both phone and tablet orientations remain enabled, without a full-screen-only requirement. Responsive-layout tests are separate from foldable-device tests. The available hosts do not have Xcode 27.1 or an iPhone Duo simulator; opening, closing and partial-fold behavior has not been qualified. See Apple's [Duo layout guidance](https://developer.apple.com/videos/play/tech-talks/111461/) and [Xcode requirements](https://developer.apple.com/xcode/system-requirements).

Android AAB SHA-256: `c4180608b20c973275806b9343dc9088a1e75a03be573d8e8b18f1603b0a8d2e`.

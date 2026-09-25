# Bunko for macOS

The native Mac app uses AppKit and WKWebView, with the same reader as the web, iOS and Android editions. Its stable `bunko://localhost` origin serves bundled assets through `WKURLSchemeHandler`. Books, dictionary packs, notes, preferences and reading positions use the persistent WebKit data store. No HTTP server runs on the Mac. External links open the default browser.

The sandbox permits outgoing network connections. It requests no camera, microphone, contacts, broad filesystem access or incoming connections. The app has no account, analytics or advertising SDK. Native menu strings are supplied in English, Simplified Chinese, Traditional Chinese and Japanese; the reader language is selected in Settings.

## Build

Requires Node dependencies and a Mac with Xcode. The 2026-09-25 release was built using Xcode 26.3, with deployment target macOS 12.0 and both `arm64` and `x86_64` architectures.

```sh
npm ci
npm run check
npm run build:macos
xcodebuild -project macos/Bunko.xcodeproj -scheme Bunko \
  -configuration Debug -destination 'platform=macOS' \
  -derivedDataPath release/DerivedDataMacDebug -jobs 2 build
open release/DerivedDataMacDebug/Build/Products/Debug/Bunko.app
```

`macos/Bunko/web/` is generated and ignored. It contains the app shell, fonts and icons, never book payloads. This build targets Safari 15.6 and disables service-worker registration; the installed bundle supplies offline app assets directly.

For a release, sync the generated Mac tree and `tools/store/build-macos.sh` to the designated Xcode host, then run that script. It produces a universal archive and signed installer, verifies the app signature and prints the installer checksum. Signing uses the existing private release keychain, Bunko Mac App Store provisioning profile and Mac installer certificate. Do not replace shared keychains or commit profiles, keys, archives or packages. The signing names in `macos/ExportOptions.plist` belong to LazyingArt's release environment; another developer must use their own team/profile.

## Keyboard controls

| Action | Shortcut |
| --- | --- |
| Library / find a book | Command-1 / Command-F |
| Settings | Command-comma |
| Chapter list | Command-T |
| Previous / next chapter | Command-[ / Command-] |
| Larger / smaller / default text | Command-+ / Command-- / Command-0 |
| Full screen | Control-Command-F |
| Copy / paste / select all | Command-C / Command-V / Command-A |
| Close window / quit | Command-W / Command-Q |

## Native verification

A Debug-only harness exercises the actual bundled app and saves screenshots plus `result.json` under its sandbox temporary directory, `Bunko-Mac-QA`. It runs only with the explicit flag below and exits the app when complete. Release builds exclude this harness.

```sh
release/DerivedDataMacDebug/Build/Products/Debug/Bunko.app/Contents/MacOS/Bunko --bunko-smoke-test
```

The harness checks the catalogue, rendered cover art, Settings and Find menu commands, a complete downloaded book, ruby and aligned languages, text sizing, chapter navigation, offline relaunch of the reader and physics equations/figures. Its network-off check blocks HTTP inside this app's WebKit instance; it does not disconnect a shared machine. It verifies that the saved final chapter opens after a reader reload with HTTP blocked. This found and fixed a shared-reader bug that had saved the previous chapter during chapter navigation.

| Host | OS | Evidence |
| --- | --- | --- |
| 3040 | macOS 12.7.6, Intel | Nine reading/menu/offline/physics checks passed |
| 7050 iMac | macOS 15.7.7, Intel | Ten checks passed, including loaded covers; 1280×800 store screenshots |
| KVM Mac | macOS 15.7.9, Intel | Native reader tests passed; universal release archive/export, signatures and Apple validation passed |

The final saved-chapter regression was rerun on both physical Macs. Apple silicon has compile/signature validation only; no Apple silicon test host was available. Curated release evidence is in [the Mac submission record](../store/macos/submission.md). Raw host logs and screenshots remain in ignored runtime storage.

## Shared desktop ownership

Check memory, existing Bunko processes and active builds before launching. Use one Bunko instance at a time on each explicitly assigned test host. Stop Bunko after evidence capture; do not restart UU Remote, LazyTunnel or other projects' GUI services. The private coordination note requested by the owner is `../L-And-N/.runtime/macos-20260925/desktop-available.md`. Read it before reusing the shared KVM desktop.

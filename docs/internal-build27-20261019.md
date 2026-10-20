# Bunko 1.0.14 (27) internal test candidate

Build27 packages the reading-companion layout update: a compact header and
composer, messages above the input, conversation controls on one row, and
Reading plans in the More menu. Plan labels are Reader, Creator and Entrepreneur.
Books, dictionaries and offline reading remain included. Product identifiers,
prices, quotas and purchase gates are unchanged.

Source: `074b6dc179b6eba317c1f07be4f9b295cc170881`.

## Qualification

- 119 UI/unit and 95 server tests passed; renderer, TypeScript and web build passed.
- Native resource generation and Capacitor sync passed.
- Android single-worker release lint, Debug APK, signed release APK and AAB passed.
- Package ID `art.lazying.bunko`, version1.0.14/build27 and all86 bundled reader
  resources were verified in both Android artifacts; signatures verified.
- Eight reviewed component screenshots cover compact phone/desktop layouts,
  keyboard-height viewport, Japanese, light/dark and Reading plans. They use
  synthetic transport and are not installed-device or live-provider evidence.

Apple native source differs from qualified26 only in project version fields;
its latest web resources still require new signed Apple archives and uploads.
No new physical-device, Monterey runtime, provider login or purchase test is
claimed. Server-side changes are not deployed by a client-only beta delivery.

## Delivery state

Android27 is **Available to internal testers**, verified in the signed-in Google
Play Console on October19. The new release uses the existing internal track.
The frozen iOS/Watch and universal Mac candidate is awaiting a serialized shared
Mac slot. This is not an Apple upload or tester-availability claim. Production
reviews, public releases, provider activation and billing remain unchanged.

The contextual relationship, place and timeline views were subsequently
implemented in [build28](internal-build28-20261020.md); they are not part of27.
Apple27's unused delivery slot was returned before any remote operation.

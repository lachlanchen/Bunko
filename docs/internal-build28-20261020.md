# Bunko 1.0.14 (28): reading companion

Build 28 includes the compact companion layout and contextual book guides.
Open the sparkle button in the reader to ask about the current text, explore
characters and relationships, follow schematic place connections, or view a
timeline. Each guide entry links to a quoted source passage.

The default range ends at the current passage. Whole-chapter mode is explicit,
and long chapters show the bounded passage range used. Shared guides are keyed
to the public edition and source revision. Personal questions and conversations
remain separate by account and reading context. Saved guides work offline and
are revalidated when the connection returns.

Reading plans use Reader, Creator and Entrepreneur labels in the More menu.
Existing books, dictionaries, ruby readings and offline reading remain included.
Prices, product identifiers, purchase gates and reward policies are unchanged.

Source: `1666e7ea284f3296a080280e4678f61259d898f4`.
See the [reader guide](book-companion.md).

## Qualification

- 125 client tests and 102 server tests passed, along with lint, renderer,
  TypeScript and production web builds.
- Capacitor sync and the separate Mac web-resource build passed.
- Android release lint, Debug APK, signed release APK and AAB builds passed.
  Both release artifacts contain version 1.0.14/build 28 and all 86 expected
  reader resources; package signatures were verified.
- Sixteen browser layout captures/checks cover compact phones, desktop,
  keyboard-height viewports, Japanese, dark mode and enlarged text. Seven
  [reviewed captures](../store/screenshots/book-companion-20261020/manifest.json)
  are retained. These use synthetic content in the actual React renderer;
  they are not installed-device screenshots.
- A real configured-provider check on a public *Pride and Prejudice* excerpt
  verified source quotations, bounded response repair and reuse by a second
  synthetic reader without another model call. Test accounts and messages used
  isolated in-memory storage.
- The companion backend was deployed with state backups and unchanged protected
  configuration. Both the dedicated and legacy HTTPS entrances passed health,
  authentication-boundary and book-cache checks.
- Seventy-three disposable Apple delivery-helper tests passed. These cover
  supervision, signing restoration, artifact checks and preserving unexpected
  checkout edits before staging, including the locked-keychain behavior observed
  on the Mac. The subsequent admitted delivery also passed both native archives,
  exported-payload/resource/signature gates and provider validation/upload.
  Embedded Watch identity/version matches; the Mac executable contains arm64
  and x86_64 slices, each with minimum macOS12.0.

Matching quotations establish source location, not the correctness of every
interpretation. Guides retain AI labels, reporting controls and source links.
No new physical-device, Monterey runtime or purchase test is claimed.

## Distribution

**Android 28 is available to internal testers**, verified in the existing Google
Play track on 20 October at 09:54 UTC. Release notes cover all four configured
locales. The final AAB SHA-256 is
`b22e7d0cc013bfe0b645a389277a7c42f9d4454c46e0b125fc74cf5ee2861f83`.

**iOS/Watch and universal Mac28 are VALID and IN_BETA_TESTING** in the existing
Bunko Internal group, verified on20October after both validated uploads.

- iOS build: `ace5fdfd-3aee-4a38-a45d-45c04d4e5322`.
- Mac build: `c72296a4-1f05-4b96-a9bb-ec421130dfb5`.
- IPA SHA-256: `aaf0e16d30dfab1bfe6248c8364ef9187569970a2354c8fd4c0965cc453e7e4f`.
- PKG SHA-256: `10ab7ac97d50bd843b5103ac613301cb094a1fa10bbc3cfe4163dd34d8a5ba91`.

The first signing-capture attempt stopped before compilation and was cleaned up.
The corrected admitted round succeeded. Its guard was released at12:43:57UTC;
independent12:44:13 readback verified exited processes, all257 source hashes,
17 helper hashes, restored signing search list/profiles and the original locked
keychain state. The shared Mac is returned. Existing public releases and formal
review candidates are preserved.

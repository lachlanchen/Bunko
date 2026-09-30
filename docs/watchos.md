# Bunko for Apple Watch

The native SwiftUI companion is embedded in the iOS application. Open a downloaded
book on iPhone and tap the watch icon in the reader toolbar. The transfer starts
at the currently visible paragraph and includes the selected reading languages.
The latest three excerpts remain on the paired watch for offline reading.

Use the Digital Crown to scroll, Previous/Next to turn between aligned sentence units and the
text-size button to adjust 14–24 point text, toggle ruby, and independently set
7–13 point readings. Each language has a bold label; Chinese pinyin and Japanese
furigana stay above their original tokens. The watch remembers the sentence in
each excerpt. Installation and initial transfer require a paired iPhone with
Bunko and the Watch app installed. Delivery can wait until the devices reconnect;
the phone confirms queueing, not receipt. iPad and Mac are not Watch companions.

Existing excerpts remain readable after updating. Send them again from the
iPhone to obtain ruby and sentence alignment. Older Watch installations can
still read the plain-text fallback from the updated phone. Sentence boundaries
follow the book’s authoritative alignment; missing translations are not invented.

This is a text excerpt reader. Figures and rendered equations remain
in the full illustrated edition on iPhone/iPad/Mac. A transfer stops before an
illustrated or mathematical passage rather than silently flattening it. Excerpts
are bounded to 24 aligned units / 15 KB each; the entire synchronized shelf stays
under 50 KB. Oversized or malformed data is rejected on both devices. Private
agent documents, account credentials, notes and discussion tokens are not sent.

## Build and verify

- `npm run check`: includes excerpt-language, position, mathematical-content and
  UTF-8 payload bounds checks.
- On macOS: `xcrun swiftc shared/apple/WatchReading.swift
  tools/store/WatchModelCheck.swift -o /tmp/bunko-watch-model-check`, then run that
  binary to check Codable/schema/duplicate/payload boundaries.
- The `App` scheme builds and embeds `BunkoWatch`; both version and build must match.
  Deployment target is watchOS 11.0. Signing uses the app-specific Watch profile;
  do not change shared keychain settings.
- Pair isolated Bunko iOS and watchOS simulators. Verify transfer of a real library
  excerpt, navigation, text size and a disconnected cold launch. Capture native
  screenshots at one consistent Watch size for App Store Connect.
- Debug-only `--reading-qa` opens the first already-synchronized excerpt for native
  screenshot inspection; it does not insert content and is excluded from Release.

Release results and any coverage gaps belong in the store handoff. A successful
build is not evidence of a physical Apple Watch test or store approval.

## Build 13 verification · 2026-09-30

Version 1.0.9 (13) is available in TestFlight and submitted to Apple review for
automatic release after approval. Native paired-simulator transfer preserved
six real Daodejing units and 124 ruby annotations. Offline cold launch, default
and maximum font sizes, ruby-off rendering and page restoration were checked.
Physical Watch hardware and Crown/tap interaction are not covered by this run.
See [QA evidence](../evidence/watch-ruby-20260930/qa.json) and the
[submission receipt](../store/artifacts/watch-release-1.0.9.json).

## Arbitrary book languages — 1.0.10 (15)

Available in TestFlight with the paired iPhone build. Excerpts accept any supported book language tag and more than six language layers, within the existing payload size bounds. Labels use the system locale. RTL lines use continuous native text to preserve shaping and direction; Chinese and Japanese ruby retain the existing layout. Re-send excerpts from the updated phone. Swift model tests cover Arabic, Hebrew, regional/script tags, eight layers and old caches; physical Watch testing is not claimed for this update.

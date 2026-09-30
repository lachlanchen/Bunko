# Japanese reading and swipe correction · 2026-09-30

The audit found English edition credits copied into Japanese fields, translation
notes displayed as a second passage, and absent Quran furigana. Bible furigana
covered only text that matched an older edition. The complete verse bodies were
Japanese; source credits and optional notes caused the misleading display.

The corrected importer localizes credits and preserves every publisher passage,
footnote, heading and reference. Japanese word readings use an existing UniDic
installation with scripture-specific readings, exact base-text checks and a gate
for unknown kanji. Existing inline pronunciation is retained without duplicating
it. These are optional reading aids, not a claim of human proofreading of every
pronunciation. Sources remain explicit: WEB/CUVt/Freedom Bible (publisher draft),
and Tanzil/QuranEnc. The original local Bible export remains incomplete; source
files were read only.

The reader folds translation notes into separately labeled sections. Paired
layout omits empty language rows. Watch excerpts follow the main passage without
inserting optional notes as additional sentences.

A deliberate right swipe works across the page, including ordinary buttons and
note headings. This matters because mobile touch targeting can include nearby
whitespace. Inputs, text selection, long holds, multi-touch, vertical movement
and horizontal content scrollers keep their own behavior. An open sheet closes
before the reader goes back. Touch lists support non-iterable mobile WebViews.

## Verification

- Every Bible/Quran passage and note compared with the publisher source cache.
- No English-only Japanese layers remain.
- All 32,349 Bible and 9,702 Quran Japanese lines containing kanji have ruby.
- 30 mobile-browser checks: real touch events, Settings priority, vertical
  scrolling, 320/390px layout, Japanese ruby, Arabic direction, several Bible
  chapters (including Acts 6), the final Quran chapter, and offline cached books.
- 66 client tests, 35 server tests, document renderer/build/lint checks,
  8 importer tests, 3 Japanese-reading tests and 8 catalogue tests passed.
- No physical phone/Watch gesture test is claimed by this receipt.

[Source and ruby audit](../evidence/reader-correction-20260930/edition-validation.json) ·
[Browser checks](../evidence/reader-correction-20260930/reader-qa.json) ·
[Bible preview](../evidence/reader-correction-20260930/bible-mobile.png) ·
[Quran preview](../evidence/reader-correction-20260930/quran-mobile.png)

Build 1.0.10 (16) is available in internal TestFlight for iOS/Watch and Mac,
and in Google Play internal testing. See the [release receipt](../store/artifacts/reader-1.0.10-16.json). Book data
refreshes through the catalogue; active production reviews are preserved.

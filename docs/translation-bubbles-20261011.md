# Translation comment bubbles

11 October 2026. Unreleased successor to build22; active store reviews unchanged.

Comment bubbles appear at the end of each translated passage by default, in both
interlinear and paragraph layouts. Settings → **Comment bubbles on translations**
can hide them; the main-language bubble remains. The preference stays on-device
and defaults to enabled for existing settings that do not contain the new field.
The control and hint are translated into all four interface languages.

All language bubbles use the existing stable passage key. They share one
conversation and draft; the panel quotes the language the reader tapped. No
additional discussion fetch happens until a bubble is opened. Main/translation
language labels continue to follow the build22 rule.

## Verification

- 94 client tests, lint and production web build passed.
- Both layouts verify that main and translated bubbles share a discussion key,
  show the tapped-language excerpt and preserve the main bubble when hidden.
- Five Chromium checks pass: existing-settings default, translated passage context,
  hide/main preservation, persistence across reload, and restore in dark paragraph
  layout at desktop width.
- Current phone reader/Settings and dark desktop captures are prepared locally in
  the [screenshot manifest](../store/screenshots/translation-bubbles-20261011/manifest.json).
  These are browser captures, not physical-device or native-package evidence.

Accumulate this small change into the next test candidate. No new native binary,
store submission, public PWA deployment or server change was made in this step.

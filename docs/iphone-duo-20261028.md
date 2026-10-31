# Adaptive reading and conversations

## Changes

Reading and conversation views keep the visible passage or message as their pane
changes width and height. A temporary zero-size view retains its last visible
anchor. Conversations following the latest answer remain at the bottom; reading
an earlier answer preserves the position within that answer.

The composer remeasures an existing draft when its width or keyboard viewport
changes, retaining the text and selection. Its height is bounded in short panes.
Measuring the editor no longer briefly expands the message viewport and clamps
its scroll position. The reading companion also handles window resize events
when VisualViewport is unavailable.

## Verification

- 183 client and 180 server tests, lint, renderer checks and web build passed.
- Eleven Chromium conversation checks cover narrow/wide/short panes, asymmetric
  insets, a temporary hidden view, older messages, following the latest answer,
  draft selection and zero unintended submissions.
- Ten reader checks preserve a passage and its relative position for both
  document and element scrolling.
- Five additional viewport checks use the actual reading-companion components
  with synthetic local history. The selected graph person and draft survive
  narrow/wide transitions without generating another answer.
- Phone/wide component captures were reviewed locally. They are engineering
  fixtures, not new native store screenshots.

## iPhone Duo delivery boundary

Apple specifies the iOS 27.1 SDK for the full-display Duo experience and provides
official opening, closing, partial-fold and Split View simulation. See
[Apple's preparation guide](https://developer.apple.com/iphone-duo/prepare/) and
[reserved-region layout guidance](https://developer.apple.com/videos/play/tech-talks/111463/).

The inspected compatible Mac has Xcode 27.0 and 26.6, without the 27.1 SDK.
These responsive-layout results do not establish Duo hardware/simulator support.
The 27.1 build, hinge/camera reserved-region integration and native pose checks
remain pending toolchain availability. No deployment target was raised and no
new TestFlight build or formal review was submitted in this source round.
Existing accounts, books, billing and review candidates are unchanged.

## Renewed delivery request · 31 October

The existing adaptive changes are already included in internal build 46. That
build used the older SDK; its native checks and TestFlight availability do not
establish full Duo behavior. Apple distinguishes the display behavior obtained
with iOS 26, 27.0 and 27.1 in its preparation guide above.

A fresh shared Mini metadata inventory at 12:51 UTC on 31 October found Xcode
27.0 and 26.6, with no 27.1-or-later installation in the inspected locations.
The owner has been asked to authorize installing 27.1 alongside the existing
versions. Installation and a native test slot still require their coordinated
resource boundaries. Existing Xcode versions, default developer selection,
simulator states, reviews and public releases are preserved.

No new Duo simulator run or internal upload is claimed by this preparation
checkpoint. The redundant app-owned read collector was left unused after the
fresh shared result became available.

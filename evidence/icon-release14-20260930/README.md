# Bunko approved icon release14 · 30 September 2026

- [Export comparison](assets.json): 15 opaque exports match the approved master.
- [Google internal14](google-internal.png): available to internal testers.
- [Google production14](google-review.png): Changes in review; full rollout in 172 eligible countries. No running checks or unsent changes remained at capture.
- [Submission activity](google-submission-activity.png): submission 4 explicitly In review; previous submissions canceled.
- [Release manifest](../../store/artifacts/icon-release-1.0.9-14.json): exact Apple builds/reviews and artifact hashes.
- [Watch functional QA](../watch-ruby-20260930/qa.json): unchanged implementation from build 13, paired-simulator transfer and offline persistence; no physical Watch coverage claimed.

Source commit: `d3651f0fa7f43e625d75552bea1957114a4a74aa`.
The complete checks passed: 58 client tests, 35 server tests, lint, TypeScript,
renderer and web build. Signed Android, iOS/Watch and universal Mac builds passed;
both Apple packages passed validation and upload. Raw logs, credentials, profiles
and release packages stay outside Git. Earlier icon masters remain in
`assets/brand/concepts/` and `assets/brand/icon-variants.json`.

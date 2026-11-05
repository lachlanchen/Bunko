# Bunko internal 48 · 5 November 2026

Bunko 1.0.16 (48) is VALID and IN_BETA_TESTING on iOS/iPadOS and universal macOS in the existing internal group. The iOS package includes Watch build 48. Android 48 is active on the existing internal track. Tester membership, public releases and formal review selections are unchanged.

## Included

Tap a map place or connection to read its details and source references, move to nearby places or focus the map. Selection stays inside the expanded map. Compact relationship graphs use a portrait layout on phones. Main reading text reaches 250%; interface sizing reaches 150% independently, and ruby keeps its own control. Short reading transitions respect reduced-motion settings. The deployed reading service recovers from qualified transient provider failures within its existing deadline and preserves schema/source validation.

## Qualification

Source `614c399` passed 188 client tests, 184 server tests, renderer checks and the production build. Focused provider-recovery checks also passed on the live server. Real Faxian guide and multi-width browser checks passed before packaging.

All 22 nonactivating native Mac checks passed, including actual menu close/reopen dispatch, saved reader/ruby/offline state and synthetic map/workspace fixtures. Both archived and exported payloads passed source-resource, identity, version and signature checks with Xcode 27.1 (27A9275). The iOS package links SDK 27.1 and retains iOS 15 minimum; Watch retains 11.0. Both Mac Mach-O slices retain macOS 12.0 minimum.

The original cleanup preservation check failed on one existing simulator's `lastUsedAt` field. Independent sealed-byte proof established that only this timestamp moved forward; device state, every other field/byte and the other 30 metadata files were unchanged. Signing profiles and search state were restored. Exact-owner recovery and independent process/guard verification completed without changing device metadata. Original failure records remain intact. Both exact packages were then downloaded, hash-verified and uploaded from Linux; Apple processing and internal-group readback passed.

Official Duo poses/reserved regions, new physical iPhone/Watch runs and new Monterey runtime checks remain unqualified. SDK linkage and deployment targets do not establish those runtime results.

Artifact hashes and provider states are in [the internal delivery receipt](../store/testflight/reading-quality48-20261105.json). Current walkthroughs and screenshots were recorded from genuine web interfaces; they are separate from native runtime evidence.

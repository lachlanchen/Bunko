# Bunko 1.0.16 (47) — internal testing

Bunko 1.0.16 (47) is available in the existing internal TestFlight group for
iOS/iPadOS and macOS. The iOS package includes Watch. Both builds are `VALID`,
unexpired and `IN_BETA_TESTING`, verified on 1 November 2026 at 00:38 UTC.

This candidate packages the current reader, reading assistant and update controls
with Xcode 27.1 (27A9275). It preserves the current public releases and review
selections.

## Validation

- All 22 native Mac checks passed on macOS 27.0: ruby and parallel text, book
  downloads and offline resume, equations and figures, window resizing, repeated
  close/reopen, saved reading positions, conversation branches, drafts and saved
  visualizations. Map and workspace cases use explicit synthetic fixtures.
- Archived and exported packages passed bundle identity, version, resource and
  signature checks. The iOS package links the iOS 27.1 SDK with an iOS 15.0 minimum;
  its embedded Watch app matches build 47 and retains watchOS 11.0 as its minimum.
- The Mac archive and exported package contain both `arm64` and `x86_64`, each
  with a macOS 12.0 minimum. SDK linkage is macOS 27.0.
- The original worker reported a cleanup failure after successful native tests
  and artifact validation. A separate bounded reconciliation established that
  only one simulator metadata `lastUsedAt` timestamp advanced. All device states
  and other fields were preserved. Signing and provisioning were restored, owned
  processes exited, and independent inspection confirmed guard release before
  either upload. The original failure remains in the private evidence.
- Both uploads completed, Apple processing passed, and group membership and
  testing notes were read back for each platform.

No new physical iPhone, Watch, Duo pose or Monterey runtime test ran in this
round. SDK linkage and deployment targets do not establish those runtime passes.
Native Mac checks were nonactivating; they do not establish keyboard focus or a
physical Dock click.

Source revision: `7313e3ce5a19cd6c729621fc6d3a16f618e6b838`.

| Package | Bytes | SHA-256 |
| --- | ---: | --- |
| iOS/Watch IPA | 12,212,681 | `3448b5a300a80572427aefa6fe43ed1733179f11a2220d07c38f15496d7ab555` |
| Universal Mac PKG | 6,506,513 | `f7d7df38d438dd30a74f9dcc289afa19c1ec33ba4a4d6d55d59a274c8127b22e` |

See the [machine-readable receipt](../store/testflight/internal47-20261101.json).

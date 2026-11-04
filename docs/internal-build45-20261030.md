# Bunko 1.0.16 (45) — internal testing

Bunko 1.0.16 (45) is available to the existing internal TestFlight group on
iOS/iPadOS and macOS. The iOS package includes the Watch app. Both builds are
`VALID` and `IN_BETA_TESTING` as verified on 30 October 2026.

This update keeps reading positions, conversations and drafts in place when the
display changes size. It includes the latest reading maps, continuing discussions
and the Mac window reopening correction.

## Validation

- The full application check and 11 adaptive browser cases passed.
- All 22 native Mac checks passed, including ruby and parallel text, offline
  reading, equations and figures, maps, conversation branches, drafts, resizing
  and repeated close/reopen through actual menu actions.
- Archived and exported packages passed identity, version, resource and signature
  checks. The embedded Watch app matches version 1.0.16 (45).
- The Mac executable contains both `arm64` and `x86_64` slices with a macOS 12.0
  minimum target. This round did not run a fresh Monterey or physical iPhone Duo
  test; it does not qualify official fold poses.
- Apple processing completed and both builds were assigned to the existing
  internal tester group. Formal store versions and selected builds were preserved.

Source revision: `0faf156b89865abfc74b956bfafa083e8b051357`.

| Package | Bytes | SHA-256 |
| --- | ---: | --- |
| iOS/Watch IPA | 12,118,740 | `ce40d0251cd7ea02940729b2c3974f57cad34e28293f5b52269b8be0393f2682` |
| Universal Mac PKG | 6,510,659 | `020d6dbc60ec949cad9fa261412a88ebb890003aa06e1e1d3ff2e26f885b2705` |

The machine-readable receipt is
[`internal45-20261030.json`](../store/testflight/internal45-20261030.json).

## Windows preview

The complete [Windows EXE](https://lazying.art/downloads/windows/#bunko) is also
published on the LazyingArt homepage and product directory. The unsigned x64
preview includes .NET and requires Microsoft Edge WebView2 Runtime. Windows 11
testing opened a real multilingual chapter with ruby and parallel text. Actual
provider sign-in and Windows 10 remain unqualified.

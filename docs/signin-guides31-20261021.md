# Bunko 1.0.14 (31): internal test release

Verified on 21 October 2026. Source `85f904c5777f17fab9fa2783b86f4a43410b1bd3`.

| Platform | Availability |
| --- | --- |
| iPhone, iPad and paired Apple Watch | TestFlight: VALID / IN_BETA_TESTING |
| Mac, Apple silicon and Intel | TestFlight: VALID / IN_BETA_TESTING |
| Android | Google Play: Available to internal testers |

The builds use the existing internal test groups. Public releases and review
selections were not changed. Reopen TestFlight and select build31 if an older
build is still installed.

## Reading guides

The companion includes relationship graphs and tree layouts, offline geographic
maps with selectable routes, and timelines with dated events. Select a person,
relationship, route or event to read its cited passage. Touch, pointer and
keyboard controls support zooming and panning; controls remain usable on narrow
screens. Graph search, focused neighborhoods and an expanded view help explore
larger casts.

Guides identify their source coverage. They do not promise exhaustive whole-book
coverage. Ambiguous or fictional places require a reader-selected pin; dates
must be supported by quoted text. Generated illustrations remain disabled.

## Sign-in status

Google, Apple and LazyingArt entrances are implemented through the registered
LazyingArt profile protocol. Existing GitHub login, downloadable book storage
and public discussion storage remain in place. Explicit linking preserves the
original Bunko account; conflicts refuse to replace another account.

**The new methods are not enabled for readers yet.** Both HTTPS service entrances
now reach the new authentication routes, and client registration is verified.
Real browser and installed-app round-trips still require an approved account.
The live methods endpoint currently advertises GitHub only. Synthetic protocol
tests and successful store uploads do not qualify a provider login.

A further server-only safeguard allows operator qualification while keeping both
sign-in buttons and Settings linking hidden (`linkEnabled: false`). Its 126-test
suite and an import check as the actual service user pass; the safeguard is
deployed with identity configuration still disabled. Qualification requires an
approved identity and recorded cleanup ownership. General release also requires account-deletion,
comment-management and corresponding privacy qualification.

## Verification and operations

- 142 client tests, 126 server tests, lint, TypeScript, document rendering and web
  builds passed. The later server-only visibility safeguard also passed all126.
- 73 delivery regressions passed. Thirty guide captures and four sign-in fixture
  layouts cover phone/desktop, Japanese, dark mode and enlarged text.
- iOS and Mac archives, exports, signatures, embedded Watch identity/version,
  and exact reader resources passed. The Mac executable contains arm64 and
  x86_64 slices with minimum macOS12.0. Physical Monterey runtime and actual
  native provider return are not claimed.
- Apple validation, both uploads, processing and existing-group attachment were
  verified. Four localized TestFlight notes were read back.
- The shared Mac guard was released at05:11:09UTC. Independent05:12:32UTC checks
  confirmed process cleanup and original signing/keychain/profile restoration.
- Backend source from the build31 checkpoint and the visibility safeguard are deployed. Existing sessions,
  documents and messages were preserved. Identity configuration remains disabled;
  billing and rewards were unchanged. Both service origins pass TLS, health,
  authentication, method and unknown-route checks. A first safeguard promotion
  failed on file permissions and automatically rolled back; the corrected
  immutable package passed service-user import and126 tests before promotion.

[Machine-readable delivery receipt](../store/updates/signin-guides31-20261021.json)
· [Guide implementation and model evidence](reading-visualizations-20261021.md)
· [Account and GitHub storage design](identity-and-github-storage.md)

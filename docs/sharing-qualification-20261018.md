# Sharing qualification — 18 October 2026

Candidate: Bunko 1.0.14 (26), cumulative with the pending compatibility work.

- 111 client tests plus two native-link parser cases, 89 backend checks, lint and production build passed.
- Real Sanshiro browser checks passed for book/reader share entry, AiMemo's two
  draft intents, EchoMind title/link, dismissal and compact layout.
- The public book-preview service is deployed as a small patch of the existing
  production runtime. Its 17 database table digests and existing login/billing
  configuration were preserved. The direct host admits only GET/HEAD for previews;
  unknown books and POST are denied. Other hosted sites retained their status.
- A first deployment probe used the wrong upstream Host and triggered automatic
  rollback. The corrected Host probe and subsequent deployment passed.
- The development branch includes separately disabled account adapters. The web
  release is prepared from the verified public web baseline with only sharing
  changes; those adapters are not enabled by this feature.
- EchoMind accepted the public-card contract. Its direct receiving route was not
  live at qualification; the labeled copy fallback stays active. AiMemo's exact
  receiving route remains pending. No messages or memos were sent during QA.

Apple archives and Android internal delivery are recorded separately after
provider processing. This document alone does not claim uploaded binaries or
Monterey runtime qualification. Existing production reviews remain unchanged.

## Android and public web delivery

Build26 is available to the existing Google Play internal testers. Build25 was
removed from the unpublished draft after Android WebView QA found differing
custom-scheme URL parsing. The replacement uses an exact validated book-link
contract. Cold and warm book links, the native system share sheet, cached book
retention and Chinese ruby passed on the existing Android emulator. The Debug
upgrade retained app data; the signed release APK and bundle passed signature
and version checks. No messages were sent to contacts.

The public web release contains only the qualified sharing changes over its
previous deployed baseline. The live Sanshiro page, share dialog and icon passed
browser QA. Apple build25 archives are retained as superseded evidence and their
uploads remain gated. Build26 completed its serialized archive/upload round.

## Apple internal delivery

Bunko 1.0.14 (26) is VALID and IN_BETA_TESTING for iOS and macOS in the existing internal group. The exact archived source is 2411c14a1583ccd12e48f934046cca8e6f84df00. Resource hashes and signatures passed; the Mac package declares macOS12.0. This does not replace the outstanding physical Monterey/Duo runtime checks. Both uploads succeeded and the shared host was handed back after exact cleanup. No production review candidate was changed.

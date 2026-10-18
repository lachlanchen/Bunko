# Sharing qualification — 18 October 2026

Candidate: Bunko 1.0.14 (25), cumulative with the pending compatibility work.

- 111 client tests, 89 backend checks, lint and production build passed.
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

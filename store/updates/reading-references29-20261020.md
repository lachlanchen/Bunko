# Reading references and model routing — build 29

Owner-authorized internal successor to 1.0.14(28). Public reviews, pricing and
identity/reward activation remain unchanged. Build 28 is available in both
existing TestFlight platform groups and the Google internal track.

## Implemented

- Right-swipe back preserves selection/scroll controls and suppresses ghost clicks.
- Automatic book context, private chat/draft persistence, compact @ references to
  a book, chapter, paragraph or exact sentence, and cited passage return.
- Source detours use a temporary position/language and preserve saved bookmarks.
- DeepSeek Flash default and qualified Pro alias; optional OpenAI Luna, Sol 6.1
  and Astra with low reasoning. Admin-only settings use the existing state route.
- Pinned AgInTiLite preview source runs bounded structured reading tasks. Bunko
  retains retrieval, citations, account boundaries and quota ownership.

See `docs/agent-runtime.md` for limitations, provider qualification and provenance.

## Qualification

129 client tests across 32 files, 112 server tests, ESLint, TypeScript, native/Mac
web builds and the equation/table/figure/HTML renderer checks passed. One new
App integration test checks source detours and the original bookmark/language.
23 actual component layout captures cover compact/phone/desktop, keyboard-sized
viewport, dark theme, Japanese and 150% text. Four reviewed reference/composer
captures are in `store/screenshots/reading-references-20261020`; they are draft
browser QA assets, not store uploads or native-device proof.

Public Pride and Prejudice guide and paragraph questions passed actual DeepSeek
requests, quotation checks, bounded repair and shared-guide reuse in an isolated
memory database. Both Flash and the Pro compatibility route passed with Bunko's
own server credential. OpenAI transport tests are mocked; no Bunko OpenAI key or
live model qualification is claimed.

The owned backend was promoted at 13:27:59 UTC on 20 October. Immutable release
digest `6b8e224840b76c92b797eaf68039bf4cc63d45d5b07e7185f0b7a4ad2a5910db`.
The prior release, configuration and consistent database backups are retained.
Sessions/documents/messages and subscription/usage counts were preserved.
Dedicated and legacy HTTPS health/cache routes passed; unauthenticated model
administration was refused. No shared ingress or other application was changed.

Native packaging, signing, provider processing and tester availability are
separate delivery evidence; this source receipt does not claim build 29 uploaded.
No additional physical-device or Monterey runtime pass is claimed.

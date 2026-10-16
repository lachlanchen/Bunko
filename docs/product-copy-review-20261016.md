# Product copy review · 16 October 2026

The English phone and Mac descriptions now lead with reading workflows:
language selection order, available pinyin/furigana, offline dictionaries,
passage discussions and translation requests. The phone description retains the
private document companion and paired Apple Watch details. Edition-dependent
readings, processing limits and AI limitations remain explicit.

`store/listing.md` now matches the English description in `store/listings.json`.
Its earlier claims about a fixed catalogue size, readings on every word, no
account/service traffic and no collected information were no longer accurate
after optional discussions and document processing were added.

Only English copy changed. Other locales retain their qualified descriptions.
These are staged listing assets; no store metadata or review was changed.

Existing service regression checks passed: 25 tests across
`server/service.test.mjs`, `server/agent.test.mjs` and
`server/demo-auth.test.mjs`. They cover session rotation and recovery, explicit
public-comment idempotency, ambiguous writes, private-document ownership,
durable history and conversion retries. They are fixture tests, not a fresh
live provider or device qualification.

Optional shared LazyingArt identity and canonical earned LAC points are not
enabled in Bunko. Preserve the exact registered callback, local identities,
purchases and reading data while qualifying the separate adapter. The descriptions
do not advertise shared balances or activated cloud subscriptions.

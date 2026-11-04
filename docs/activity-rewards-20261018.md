# Foreground activity source

The candidate shared LAC integration records the first authenticated foreground
use after account linking and separate points consent. Web/native reader
interaction triggers the request; background polling and login callbacks do not.
The source persists immutable evidence and an outbox entry atomically, using
`bunko-foreground-use-v2` and `lac-daily-activity` version2. It never grants a
local balance. Coin deduplicates the canonical subject/day across participating
apps and old/new policy versions.

The client uses `/bunko/v1/lazyingart/activity` through existing session/origin
checks. Coin source routes are prepared at `/api/lac/source/v1/evidence`,
`/eligibility` and `/final`, with a separate source key, exact actor binding,
fresh nonce, bounded requests and final-decision retention. Runtime enablement,
source ingress and delivery are not active. Missing qualification stays disabled;
ordinary book/discussion use is unaffected.

Source tests cover concurrent opens, restart, atomic outbox failure, original
subject reconnection, source evidence, revoked/held access and disabled routes.
Client lint/tests/build and existing service regression checks pass. The actual
Coin candidate verifier accepted records emitted by both Bunko and OnlyIdeas
in a disposable database and awarded only one5-point daily reward to their
shared synthetic subject. This is fixture evidence, not a live grant.

Reading rewards should cover every rights-cleared public catalogue book. Useful
reading-session criteria, canonical work identity and approved comment/reply
lineage are still being qualified with Coin. They are not enabled by this daily
source implementation. Shared login/points consent, dispatcher delivery and a
controlled live round trip remain required before rewards can be offered.

This source follows internal build26; it does not change its binaries or formal
reviews. The existing app purchase, cloud plans and local reading data are intact.

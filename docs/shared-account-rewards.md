# Shared account and earned LAC points

Bunko remains an independent reader. An optional LazyingArt connection will let
a reader use the same account and see the same earned-points balance in other
participating apps. Book purchases, cloud subscriptions, private notes and local
reading data retain their existing ownership.

## Registered account binding

| Field | Value |
| --- | --- |
| Issuer | `https://chat.lazying.art` |
| Client | `bunko-server` |
| Audience | `bunko-service` |
| Callback | `https://llm.lazying.art/bunko/oauth/lazyingart/callback` |
| Basic login scope | `profile` |

The issuer reported successful registration and HTTPS binding checks on
16 October2026. App callback/native completion is not qualified by registration
alone. The callback remains at the accepted legacy host while the direct Bunko
service hostname serves newer clients.

The existing `server/lazyingart-adapter.mjs` prepares the older `bunko-v1`
GitHub-proof contract. Basic optional profile login can qualify independently;
it must not silently infer GitHub ownership or repurpose that legacy proof flow.
An explicit link requires fresh local and central authentication, unique mapping,
encrypted token storage, independent native PKCE and durable revocation.

## One earned-points balance

Use Coin's `app-lac-fun-points-v1` and asset `lazyingart.fun-points.v1` through the
maintained LinkPrivate client/outbox. These are whole-integer, non-transferable
recognition points with no cash value or spending. They are separate from actual
LAC cryptocurrency, OnlyIdeas usage credits and any purchased allowance.

Each app displays the same account-bound canonical snapshot. It replaces an older
snapshot; it is never added to another app's total. A service outage displays an
unavailable state, not zero. Pending activity is not an awarded balance.

The candidate policy awards5 for explicit daily activity once globally per UTC
day,1 for qualified completed reading up to5/day, and10 for an approved unique
public paper up to50/day. Server policies and finite pilot budgets determine
actual availability. No client timer, page open or repeated tap proves reading.

Bunko's daily and reading evidence rules still need separate qualification.
Reading requires a canonical work identity shared across apps and a defined
completion event. Offline reading continues independently; pending reward work
must preserve the original account and bounded event lifetime. Do not replay old
activity under a newly selected account or backfill pre-link history.

## Integration and qualification

Use the installed `lazyingart-accounts-and-rewards` skill with
`lazyingart-shared-login`. Current protocol references live in:

- `LazyingArtLinkPrivate/docs/fun-points.md` for consent, client and durable outbox.
- `LazyingArtCoin/docs/integrations/LAC-REWARD-POLICIES-V1.md` for evidence and caps.
- `LazyingArtCoin/docs/integrations/LAC-SOURCE-AND-RETENTION-V1.md` for authenticated
  source reads, final decisions, retention and deletion.

Qualify actual callbacks, account switching, refresh interruption, sign-out,
consent revocation, cross-app duplicate claims and canonical balance freshness.
Coordinate app evidence and backups with Coin's retention; app unlink is not
central account deletion. Shared subscriptions and cross-app discounts remain
separate product decisions.

As of 16 October 2026, the first rollout is explicit linking plus read-only shared
points. Reward policies remain outside this phase. The app-owned implementation
is staged and disabled. See [read-only integration qualification](shared-account-read-20261016.md)
for source tests and the remaining deployment and native-app gates.

# Optional account linking and read-only shared points

## Status

The source implementation is staged. Shared linking and LAC balance display are
disabled in production. Current store releases, book data, local accounts,
purchases and subscriptions are unchanged. Tests use synthetic identities and
balances; they do not establish a live issuer or Coin connection.

## Account binding

| Field | Exact value |
| --- | --- |
| Issuer | `https://chat.lazying.art` |
| Client | `bunko-server` |
| Audience | `bunko-service` |
| Callback | `https://llm.lazying.art/bunko/oauth/lazyingart/callback` |

`server/lazyingart-profile.mjs` and `server/shared-link-store.mjs` implement
optional profile linking independently of the older `bunko-v1` GitHub-proof
adapter. Both local and central authentication must be fresh. An immutable
issuer/subject pair has one local owner; no email or username is used to merge
accounts. Encrypted attempts, credentials and revocation records survive restarts.
Refresh uses a durable lease and an uncertain result requires reconnection.

`server/service.mjs` exposes app-owned status, start, complete, cancel, disconnect
and balance routes under `/bunko/v1/lazyingart/`. The browser entrance is
`/bunko/oauth/lazyingart`; the callback remains at the registered legacy host.
Local session binding, browser state and a separate app PKCE verifier protect the
flow. Cancellation and logout prevent a late callback from attaching an account.
Linking preserves the existing GitHub login and discussion identity. It does not
yet provide central-only Bunko registration or GitHub ownership proof.

## Read-only points consumer

`server/lac-balance.mjs` requires a qualified SDK provider, the exact app binding,
and separate `lac.points.balance.read` consent. A configuration flag alone cannot
enable it. No production provider is registered yet. The provider must retain its
own credentials; the consumer never forwards a profile token to Coin.

The consumer validates `app-lac-fun-points-v1`, asset
`lazyingart.fun-points.v1`, the original subject, all immutable asset properties,
integer precision and snapshot freshness. Durable revision checks reject rollback
and conflicting values at one revision. The already-net awarded balance is
displayed directly; balances from different apps are never added together.

Settings contains the optional connection panel and a separate shared-points
panel. Loading, missing link, missing consent and unavailable states do not become
zero. The four existing interface languages are covered. No grants, transfers,
reward rules or purchased-credit mutations are included.

## Qualification and remaining gates

- Protocol, encrypted persistence, actual local HTTP routes, cancellation,
  account-switch races, revision conflicts and UI recovery have fixture coverage.
- The full lint, UI/unit, server, document-renderer and web-build checks pass.
  Local browser evidence covers 390 and 1280 pixel widths using synthetic API
  responses. It is not native-device or live-account evidence.
- The maintained Python SDK bridge, separate app points consent and Coin resource
  qualification are still required. The SDK's protected Fernet storage key cannot
  be substituted for this staged Node adapter's AES key.
- Exact deployed ingress paths and a complete HTTPS callback must be qualified
  before enabling linking. No new ingress configuration was deployed here.
- Capacitor completion needs device qualification. The existing Mac browser bridge
  does not accept this new authorization entrance, so Mac linking is explicitly
  unavailable. No native package was built or uploaded for this slice.

Existing reading, GitHub sign-in and cloud billing remain independent of shared
account availability. Points consent withdrawal must clear the shared display;
unlinking an app is not central account deletion.

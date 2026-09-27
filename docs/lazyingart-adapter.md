# LazyingArt account adapter preparation

2026-09-27. **Disabled preparation only; not a feature of Bunko 1.0.6 (8).**
`server/service.mjs`, the client apps, Caddy routes, store submissions and the
deployed discussion service do not import or enable this module.

## Accepted contract and ownership

| Field | Accepted value |
| --- | --- |
| Contract | `bunko-v1` |
| Confidential client | `bunko-server` |
| Audience | `bunko-service` |
| Callback | `https://llm.lazying.art/bunko/oauth/lazyingart/callback` |
| Issuer | Pending central qualification; no URL assumed |
| Registration and credential delivery | Pending; no credentials generated here |

Source: EchoMind's
[versioned contract](https://github.com/lazyingart/EchoMind/blob/701cff109c31de6775124d22aeb13990cef3b894/EchoMind/docs/lazyingart_bunko_adapter_contract_v1.md),
documentation commit `701cff109c31de6775124d22aeb13990cef3b894`, implementation
baseline `fc05a2a6ae70e5fa51ddd237739d948e5a2bb138`. That baseline is not a
qualified deployment of all `bunko-v1` extensions. EchoMind owns central auth,
its migrations, provider flows and registration. Bunko owns only its adapters,
local account mappings, comment permissions and reader experience.

### Intermediate central checkpoint: `f5b099e1`

Reviewed the pinned central source at
[`f5b099e134739b0afd47e69a03450780be93f504`](https://github.com/lazyingart/EchoMind/commit/f5b099e134739b0afd47e69a03450780be93f504).
It adds authenticated profile-scoped introspection, stored authentication and
issuance times, additive schema 2, and transactional operator suspension and
reactivation revocation. The central owner reports 105 tests and 35 subtests,
including PostgreSQL races; Bunko has not independently rerun those backend
tests or applied the migration.

Discovery still advertises `adapter_contracts: []` and only scope `profile`.
Fresh GitHub numeric-ID proof and dual-proof linking remain pending. There is
no deployment, issuer/client provisioning or credential receipt. This is an
intermediate implementation checkpoint, not full `bunko-v1` readiness. Bunko
rejects this discovery even if a previous discovery had passed its checks.

Old migrated credentials without provable authentication/issuance timestamps
return `active: false`; Bunko must obtain a new authorization rather than fall
back to the legacy profile endpoint or invent recent authentication on refresh.
Active responses must have positive authentication time no later than issuance;
the 30-second local clock tolerance applies only to issuance versus Bunko's clock.
Inactive verdicts remain authoritative for old tokens after a new login succeeds.
The corresponding Bunko tests use synthetic responses; they do not exercise a
live suspension or establish the central database's race guarantees.

## Prepared code

`server/lazyingart-adapter.mjs` is a server-only protocol module with no new
dependencies. Absent `enabled: true`, its factory returns `{ enabled: false }`
without using configuration or the network. There is currently no production
configuration loader or service route for this adapter.

- Exact configured HTTPS issuer and fixed client, audience and callback.
  Discovery requires `bunko-v1`, exact endpoint paths, S256, authenticated token
  exchange, introspection, required scopes and invitation-independent signup.
  `contract_version: 1` alone is rejected. GitHub provider unavailability blocks
  legacy linking while leaving available sign-in providers usable.
- Form-encoded server requests with `client_secret_post`, no redirects, an
  eight-second timeout and a 64 KiB JSON response limit. Credential responses
  require `Cache-Control: no-store`. Only fixed local errors escape the module.
- Fresh central state and PKCE verifier per authorization, independent of the
  frontend's existing Bunko flow. Callback state, issuer, exact URL, initiating
  binding and expiry are checked; attempts are consumed before exchange.
- Strict audience, client, subject, scope, account status, timestamps and proof
  validation. Introspection has no positive cache. Display names remain
  untrusted text; responses are reconstructed from allowed fields.
- `verifyGithubLink()` performs a new authenticated introspection for every
  call. It requires explicit consent, recent central authentication, a fresh
  scoped GitHub numeric-ID proof, and equality with Bunko's own server-verified
  legacy ID. It returns a candidate mapping, not a merge or posting permission.
  It does not accept a frontend account/proof object or merge by email.
- `refreshOnce()` performs one token request and checks that scopes do not
  change. An ambiguous response requires a fresh authorization; there is no
  automatic retry of an old refresh token. `revoke()` requires acknowledgement.

All returned credential envelopes are **server-only**. They must never be
serialized to a frontend, logged, or stored unencrypted. Native/web clients
continue to receive only Bunko's own opaque session or HttpOnly cookie.

## Required storage and service integration

This preparation deliberately does not supply a production attempt store,
refresh coordinator, identity migration or new UI. Tests use an in-memory
fixture; they do not prove crash safety or coordination between server workers.
The constructor requires these attempt-store operations before it can be used:

| Operation | Required behavior |
| --- | --- |
| `create(record)` | Persist the initiating attempt ID, binding/state hashes, issuer, callback, scope, purpose, timestamps and encrypted central verifier; reject collisions. |
| `consume({stateHash,bindingHash,now})` | Atomically return and consume a matching unexpired attempt once across all workers. A wrong binding must not consume a legitimate attempt. |

The service must validate the initiating frontend attempt and its session/browser
binding before calling this module. `binding` is server-controlled and must not
come from arbitrary callback input. `complete()` validates the central leg; it
does **not** replace the frontend verifier check, native callback allowlist,
cookie/origin checks, secure storage or one-use Bunko completion receipt.

Before using `refreshOnce()`, a durable transaction must claim the current
credential generation for a single worker. Persist the encrypted replacement
conditionally on that generation and an active Bunko session. A worker crash,
lost response or uncertain commit requires authorization again, never replay of
the claimed credential. A concurrent logout must prevent session resurrection.
Enforce the central family's absolute 30-day limit; do not extend it on refresh.
These storage semantics remain a mandatory integration gate, not an implemented
multi-worker guarantee of this protocol helper.

Commit subject/legacy mappings atomically with uniqueness constraints in both
directions. Identical retries should succeed; collisions require recovery.
Preserve original user IDs, authorship, private data and app-local entitlements.
Neither a link proof nor `emailVerified` confers permission to post to GitHub.
Non-GitHub posting still needs Bunko-owned attribution, moderation and ownership
checks, to be implemented in the successor milestone.

## Error and lifecycle handling

| Result | Required service/client behavior |
| --- | --- |
| `authorization_cancelled` | Keep the previous session, reader state and drafts. |
| `active: false` / `account_inactive` | Stop authenticated actions and offer reconnect; preserve local content. |
| `temporarily_unavailable` | Keep session UI/drafts, defer protected work, show Retry. Never treat this as an inactive account. |
| `client_configuration_error` | Operator failure; do not label it an incorrect user password. |
| `reauthorization_required` | Start a fresh code/PKCE attempt through browser SSO; do not replay code/refresh. |
| `contract_mismatch` / `not_ready` | Fail closed; do not enable the provider or guess missing claims. |

A failure after a login attempt is consumed requires fresh authorization even
if the failure occurred during its final introspection. No new Bunko session is
issued in that case. Integration must bound the retention of abandoned login
families and arrange revocation where credentials were received; this module
does not persist an outbox or retry those exchanges.

Introspect on foreground/reconnect and before protected writes, private sync or
linking. Sign-out clears the Bunko session locally and on its service; retry
central revocation via a protected, bounded outbox when needed. Never claim a
remote revocation without acknowledgement. Global suspension/reactivation tests
must demonstrate that old credentials remain invalid after reactivation.
EchoMind invitation or app-local suspension must not block a healthy Bunko user.

## Enablement gates and evidence

1. Receive the central implementation/deployment receipt, qualified discovery,
   issuer, provider readiness and client registration for these exact values.
2. Deliver a dedicated secret privately over the existing verified SSH route,
   using a protected config directory/file (0700/0600); document only non-secret
   ownership and delivery facts. No secret belongs in Git, logs or handoffs.
3. Implement and verify the durable stores, refresh coordination, session
   lifecycle, collision handling, posting permissions and profile UI above.
4. Exercise real web/iOS/Android/Mac authorization, both PKCE legs, denied
   scopes, cross-client/audience failures, stale/removed proofs, concurrent
   refresh, lost responses, suspension/reactivation, revocation and drafts.
5. Qualify a successor build, privacy declarations and reviewer access before
   internal distribution and review. Preserve the existing build 8 submissions.

Run `node --test server/lazyingart-adapter.test.mjs` for the synthetic contract
fixtures, and `npm run test:server` for these plus the existing GitHub service
tests. Passing fixtures is not a live issuer or store-release receipt.

Preparation verification on 2026-09-27: `npm run check` passed lint, 44 client
tests, 18 server tests (10 adapter and 8 existing service cases), TypeScript
and the web/PWA build. The existing large JavaScript chunk warning remains.
The 11-language README validation also passed. No native build, deployment,
live central authorization or store submission was performed in this step.

The `f5b099e1` follow-up adds four adapter regression cases and tightens timestamp
validation. `npm run test:server` passes all 22 server tests (14 adapter and 8
existing service cases); `git diff --check` passes. Client/native code is unchanged,
so the earlier full-build evidence remains separate from this focused check.

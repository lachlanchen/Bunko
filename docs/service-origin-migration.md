# Dedicated Bunko service origin

## Current rollout state

Activated on 12 October 2026. **New builds default to the direct origin**;
`VITE_BUNKO_DIRECT_ORIGIN=0` prepares a legacy-origin build if needed. Strict TLS,
public discussions, cache reads/revalidation, legal pages and negative route/auth
checks passed. The same backend and all 14 existing ingress sites stayed running.
Existing installed binaries, the deployed Pages reader and store reviews are
unchanged; this source change takes effect in the next build.

The original optional discussion service reused the existing `llm.lazying.art`
gateway. Installed clients therefore contain that hostname. Moving the backend
alone preserved those URLs and sessions; it did not update installed binaries.
The dedicated hostname removes the extra legacy-edge hop for updated clients.

## Candidate qualification · 13 October 2026

Build23 now includes the dedicated native service origin and is in TestFlight,
Google internal testing and production review on all three store platforms.
Direct native-protocol Demo login/session/agent-state and Mac WebKit
login/reload/logout passed. The Mac helper used an isolated login Keychain under
ad-hoc signing; this does not requalify production Data Protection Keychain or
fresh GitHub provider consent. Existing production authentication source is
unchanged. See [the exact receipt and limits](latest-review-20261013.md).
PWA cookies and the GitHub callback retain the legacy hostname. Both service
entrances must remain available during and after review for installed clients.

## Compatibility contract

| Consumer | New-build default (or flag `1`) | Rollback build (flag `0`) |
| --- | --- | --- |
| iOS/Android native and Mac | `https://bunko.lazying.art/bunko` | `https://llm.lazying.art/bunko` |
| PWA account operations | Legacy endpoint, preserving its host-only cookie | Legacy endpoint |
| Public books | GitHub → CDN → direct cache → legacy cache | GitHub → CDN → legacy cache |
| Privacy/terms links | Dedicated endpoint | Legacy endpoint |

The flag is a boolean selecting two fixed owned endpoints, not an arbitrary
URL that could receive saved credentials. Normal builds now select the qualified
direct site. Native Keychain/Keystore tokens are unchanged because both entrances
use the same session database.

During this phase the dedicated ingress preserves the backend's expected
`Host: llm.lazying.art` and exact `/bunko/...` path/method contract. The existing
GitHub callback remains `https://llm.lazying.art/bunko/oauth/callback`; no GitHub
registration, encryption key, database or shared-login contract changes are
needed. `/` on the dedicated host opens the existing Pages reader.

Account requests stay on one selected origin. A network failure does not replay
an upload, chat request or checkout on another host. Existing discussion retries
retain their original request ID and origin. Public book downloads may use the
legacy cache last because those requests omit credentials and only read public
repository paths.

## Activation evidence and remaining release checks

1. **Passed:** owner-authorized additive ingress activation with managed TLS.
   Existing route semantics and all 14 sibling status/redirect/content-type
   probes were unchanged. Caddy and Bunko kept their process IDs; no second
   writer, backend restart, database move or DNS edit.
2. **Passed:** direct health and an existing public discussion; cache GET/HEAD
   and ETag 304; preserved Range baseline (200 full body, not partial download);
   legal-page hashes; rejected invalid session, callback and origin; forbidden
   paths and methods. Legacy HTTPS remained healthy. No payment or comment
   mutation was used as a probe.
3. **Passed:** a canceled OAuth flow started on the direct origin, used the
   retained legacy callback and completed on the direct origin with PKCE intact.
   This did not call GitHub or create a session. Test an ordinary-reader native
   restore/login before shipping; transport probes and fixtures alone do not
   qualify real provider authorization.
4. Build the next authorized native/Mac candidate with the new default. Record
   the qualified origin in its release receipt, test the installed binary, then
   follow the existing test and review workflow. No signed binaries, TestFlight
   or store submissions are part of this hostname activation.
5. Keep legacy paths, TLS, callback and private forwarding available while old
   installed clients or web sessions need them. Removing that dependency needs
   a later callback/cookie migration and installed-client review. No automatic
   retirement date is assumed.

If a new candidate needs the legacy endpoint, build with
`VITE_BUNKO_DIRECT_ORIGIN=0`. This cannot remotely change an installed binary. Once
direct-enabled binaries ship, preserve both origins during any infrastructure
rollback; do not restore stale backend data. The deployment packet and current
evidence stay in the owner's private operational handoff, outside Git.

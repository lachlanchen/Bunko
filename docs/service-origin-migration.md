# Dedicated Bunko service origin

## Current rollout state

Prepared on 12 October 2026; **direct-origin build switch is off by default**.
DNS for `bunko.lazying.art` resolves to the destination, but the first inspection
found its TLS endpoint unavailable. The infrastructure owner must qualify that
host before enabling any client build. This document is not a live-activation
receipt. Existing builds and reviews are unchanged.

The original optional discussion service reused the existing `llm.lazying.art`
gateway. Installed clients therefore contain that hostname. Moving the backend
alone preserved those URLs and sessions; it did not update installed binaries.
The dedicated hostname removes the extra legacy-edge hop for updated clients.

## Compatibility contract

| Consumer | Default | With `VITE_BUNKO_DIRECT_ORIGIN=1` |
| --- | --- | --- |
| iOS/Android native and Mac | `https://llm.lazying.art/bunko` | `https://bunko.lazying.art/bunko` |
| PWA account operations | Legacy endpoint | Legacy endpoint, preserving its host-only cookie |
| Public books | GitHub → CDN → legacy cache | GitHub → CDN → direct cache → legacy cache |
| Privacy/terms links | Legacy endpoint | Dedicated endpoint |

The flag is a boolean selecting two fixed owned endpoints, not an arbitrary
URL that could receive saved credentials. It remains unset in normal builds
until the direct site passes acceptance. Native Keychain/Keystore tokens are
unchanged because both entrances use the same session database.

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

## Activation checklist

1. Infrastructure owner installs the exact dedicated-host route with valid
   managed TLS and verifies that unrelated sites retain their behavior. Both
   entrances must use the same running Bunko backend. No second writer.
2. Qualify direct health, existing discussion, GET/HEAD/ETag/Range baseline,
   legal-page hashes, invalid session/callback/origin, forbidden paths and
   methods. Compare with the retained legacy entrance. Do not test payments or
   create unsolicited comments as health probes.
3. Confirm the existing OAuth redirect and persistent session contract. Test
   an ordinary-reader native restore/login using the dedicated entrance before
   shipping; fixture tests alone do not qualify real provider authorization.
4. Build the next authorized native/Mac candidate with
   `VITE_BUNKO_DIRECT_ORIGIN=1`. Record the flag and qualified origin in its
   release receipt, test the installed binary, then follow the existing test
   and review workflow. A normal build without the flag preserves old behavior.
5. Keep legacy paths, TLS, callback and private forwarding available while old
   installed clients or web sessions need them. Removing that dependency needs
   a later callback/cookie migration and installed-client review. No automatic
   retirement date is assumed.

If direct-host qualification fails, leave the flag unset. Once direct-enabled
binaries ship, preserve both origins during any infrastructure rollback; do not
restore stale backend data. The deployment packet and current evidence stay in
the owner's private operational handoff, outside Git.

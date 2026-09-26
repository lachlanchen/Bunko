# Bunko discussions service

A small Node.js 22 service on the cloud gateway. It does not require a workstation, reverse tunnel, container, or npm dependencies. GitHub Issues in `lachlanchen/bunko-books` remain the public conversation store.

## GitHub App registration

Register a GitHub App named **Bunko Reading Conversations** with:

- Homepage: `https://lachlan.lazying.art/Bunko/`
- Callback: `https://llm.lazying.art/bunko/oauth/callback`
- Repository permission: **Issues: read and write**; implicit metadata read only.
- No contents, email, organization, or account permissions; no webhooks or device flow.
- Expiring user access tokens enabled.
- Install on **only** `lachlanchen/bunko-books` in the owner's account.

The code exchange further restricts user tokens to repository ID `1381952467`. Test with an ordinary reader account as well as the repository owner before release. Do not test by posting unsolicited comments to the live repository.

Store `publicUrl`, `clientId`, `clientSecret`, `appId`, the generated PEM `appPrivateKey`, and a base64-encoded random 32-byte `encryptionKey` in a regular mode-600 JSON file under the server administrator's `~/.config/bunko/`. Never add this file to Git. The included systemd unit passes it through `LoadCredential`; systemd's private credential mount may expose a root-owned 0440 file with an ACL for the service user. The service accepts that exact managed credential path in addition to owner-only regular files.

An absent client ID/secret leaves sign-in disabled (`503 not_configured`) while health reports `ready: false`.

## Deployment

Package the reviewed files with SHA-256 receipts. Install each release under a new immutable directory; mutable SQLite state belongs in the service's private state directory. Use the provided unprivileged, memory-limited systemd unit and a loopback-only listener. The Caddy snippet imports **inside** the existing HTTPS gateway site and exposes only its declared paths/methods. Preserve the prior Caddy file and all unrelated routes. Validate before reload; probe both preserved sites and new routes before accepting. No firewall or port 80/443 changes are needed.

The operator's private `.runtime/github-comments/` receipt records exact release hashes, service ownership, backup paths, probes, and rollback. Server setup is not complete until health says `ready: true` and real browser authorization has been verified.

## Security and retention

- OAuth state and GitHub PKCE are single-use and expire in ten minutes. Completing a flow also requires the client's original verifier. Return links contain only a noncredential flow ID.
- GitHub access tokens are encrypted with AES-256-GCM in SQLite. Refresh tokens are discarded. Sessions expire within eight hours; the client keeps only an opaque session in memory.
- Signing out deletes the Bunko session and encrypted token. GitHub authorization can also be revoked from GitHub settings. A cold app launch requires sign-in again.
- No request bodies, OAuth callback queries, tokens, or raw upstream errors are logged. Do not enable unrestricted access logging on the callback route.
- Exact host, method, path, allowed origin, and custom request header; bounded body size, concurrency, upstream timeouts and rate limits. There is no general-purpose GitHub proxy.
- Read responses have a short bounded in-memory cache. Passage mappings preserve links across GitHub search indexing delays. Anonymous reads use a short-lived installation token with **Issues: read** permission for this repository only when the app ID and private key are configured. That token stays in memory. Without those optional settings, reads fall back to GitHub's smaller anonymous server-IP quota; configure them before public launch.
- Posts require an authenticated user and an explicit action. Idempotency receipts last seven days. A transport-ambiguous write fails closed and must be checked on GitHub before a reader sends it again.
- The app escapes comment text. Readers can hide authors locally and report on GitHub; repository maintainers moderate there. Private notes and unpublished drafts stay on the device.

## Verification

```sh
node --test server/service.test.mjs
npm run check
```

Tests cover state replay, verifier binding, expiry, cancellation, repository restriction, token isolation, origin/path rejection, duplicate submissions, and ambiguous writes. UI tests cover drafts, sign-in errors, pagination, HTML escaping, and hidden readers. Real OAuth, ordinary-reader permission, native callback and store privacy review remain release gates; fixture tests do not prove those integrations.

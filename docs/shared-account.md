# Shared LazyingArt account follow-up

Updated 2026-09-27. This is planned work for a successor Bunko release.
The submitted 1.0.6 (8) candidate still uses optional GitHub sign-in.

## Owner decisions

- One account across LazyingArt apps: email/password, Google, Apple and GitHub.
- General registration without invitation; EchoMind may require an invitation
  only for EchoMind usage, controlled by its own service policy.
- Verified linking preserves existing accounts, data and authorship.
- Eligible non-GitHub users can comment with clear LazyingArt attribution.
- Keep Bunko reading/offline features available without an account.
- Avatar opens Profile; Sign out is separate. Preserve drafts across login,
  cancellation, connection failure and relaunch.

## Ownership and current evidence

The Company playbook `playbooks/unified-lazyingart-account-v1.md` contains the
shared contract. The active EchoMind owner has been sent the central identity,
app entitlement and authorization/PKCE work. Bunko owns its reader/discussion
adapter; OnlyIdeas owns private paper, import, agent history and native clients.
Detailed local handoffs were delivered to 31 workspaces, covering all 14 apps
listed in App Store Connect and the active projects. Delivery is not acceptance.
No shared service is advertised as live and no peer product runtime was changed.

EchoMind's current formal checkout already contains Google/Apple federation.
LazyArtCoin currently binds accounts to existing EchoMind user IDs. Preserve
those IDs through additive mappings; shared identity must not merge wallets,
purchases, app roles or private content.

## Bunko implementation sequence

1. Obtain a tested issuer/client/PKCE contract and invitation-independent signup.
2. Add optional account discovery with disabled-by-default activation. Keep the
   current GitHub sign-in compatible while existing users link their accounts.
3. Add server-owned identity/comment attribution and edit/delete/report/block
   behavior for non-GitHub users; keep existing GitHub authors intact.
4. Test ordinary accounts on web/iOS/Android/Mac, wrong-audience/replay failures,
   collision/linking, refresh recovery, revocation and private-draft preservation.
5. Update privacy/reviewer access, build a successor candidate, distribute to
   internal testing, then submit the verified version. Preserve build 8 review.

No password, provider token, local runtime identity or private paper data belongs
in this document or in the public content repositories.

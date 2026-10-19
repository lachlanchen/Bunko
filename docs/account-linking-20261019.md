# Account-linking recovery

The account containing the reader's books, notes and plan remains primary.
A login already assigned to another local account is refused. No account merging,
purchase transfer or credit grant is offered.

## Behavior

- Settings names GitHub as the existing local sign-in method. Connecting
  LazyingArt is optional and remains capability-gated.
- A verified collision returns a structured refusal to the initiating app,
  with Cancel and Choose another LazyingArt account actions.
- An expired local proof offers same-account GitHub reauthentication. The server
  binds it to the original session and numeric GitHub identity; a different
  account cannot replace the current session.
- Cancelled reauthentication preserves the existing session and unsent note.
- Provider credentials and target-account details are not included in UI errors.

## Qualification

`npm run check` passed: 117 UI/unit tests, 94 server tests, renderer checks,
TypeScript and production web build. The production build retains the existing
large-chunk warning. Six synthetic browser captures across Bunko and OnlyIdeas
cover 320/390/1280-pixel widths, Japanese and Arabic; all preserve the fixture
note without horizontal overflow. These are local component QA, not store assets.

This is a source checkpoint, not a deployment or new native binary. The Mac
shared-login bridge remains unavailable; no central-only Bunko signup is
advertised. App callback, route and native qualification are still required
before activation. Store candidates and billing are unchanged.

## Peer comparison

AiMemo's October 19 implementation uses the same initiating-account and refusal
rule. The app-owned source retains its existing mapping and purchase boundaries.
A subsequent copy correction distinguishes a login owned by another local account
from an attempt to replace this account's existing LazyingArt connection. The
latter now asks the reader to reconnect the original LazyingArt account, matching
the structured recovery action and translated UI.

AiMemo's deployed and native-test evidence does not qualify this app's runtime.
Direct-provider convergence remains a separate qualification requirement.

## Delivered central management contract

EchoMind's October 19 issuer receipt supplies the exact entrance:
`https://chat.lazying.art/account#sign-in-methods`, labelled **Manage LazyingArt
account**. The issuer reports live web release `132d6ef9`, source `0043b6ea` and
verified-TLS health/discovery at 00:45:28 UTC. This closes the missing contract
dependency; it is peer evidence, not a Bunko callback or native test.

- Open management in the system authentication browser on native, with a warning
  to check the central account shown. It may differ from the app's linked account.
- Management uses first-party browser forms. Do not construct provider/password
  POSTs, scrape HTML as proof, or adopt an app session from visiting the page.
- Standalone success and cancellation return to `/account`; there is no app
  management API, arbitrary return URL or automatic native completion callback.
- Central `identity_link_conflict` (409) refuses and preserves both accounts.
  It is distinct from Bunko's structured local collision errors.
- Password changes revoke central access. Independent local sessions require
  reconciliation; they do not disappear merely because the browser signs out.

Bunko Connect remains the separately bound `bunko-server` / `bunko-service` flow
with `https://llm.lazying.art/bunko/oauth/lazyingart/callback`. Preserve the
initiating local ID, session, draft and disconnect reservation. Central provider
linking supplies no proof that a legacy local GitHub identity should be changed.

The standalone management entry is not yet implemented in Bunko. App route and
live callback acceptance, revocation reconciliation and the Mac bridge remain
app-owned qualification work. This documentation receipt activates nothing.

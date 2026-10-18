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
shared-login bridge remains unavailable; no central-only Bunko signup or central
management URL is advertised. Live issuer/client and native qualification are
still required before activation. Store candidates and billing are unchanged.

# Sign-in methods and GitHub storage

Bunko can offer Google, Apple, GitHub and LazyingArt sign-in while retaining
the existing public book repository, mirrors, local downloads and GitHub issue
discussions. Authentication and content storage have separate responsibilities.

## Account flow

Reuse the EchoMind-owned LazyingArt issuer and the app adapter pattern used by
AiMemo. Each new provider entrance resolves a verified central issuer/subject
to one Bunko account. Existing GitHub readers first connect from the account
containing their data and plan; their current local owner key remains unchanged.
Conflicts refuse the connection. Email equality never merges accounts.

The legacy GitHub entrance still resolves the verified GitHub numeric ID. A
central Google/Apple/GitHub sign-in proves a central identity, not repository
permission or a legacy GitHub alias. Provider linking on the central account
management page cannot silently retarget Bunko's existing login button.

## Content flow

| Content | Storage and authorization |
| --- | --- |
| Public books, chapters, figures and covers | Existing `bunko-books` repository, mirrors and local cache; reading requires no social-provider account. |
| Existing GitHub-authored discussions | Keep original issue/comment IDs and GitHub authors. |
| Public comments from other sign-in methods | Bunko's repository-limited GitHub App writes on behalf of a verified Bunko author. Show that author in Bunko and explicit service attribution on GitHub. |
| Private drafts, uploads, conversations and account mappings | Existing private/local storage; never published as a side effect of sign-in. |

GitHub supports issue-comment creation using installation access tokens with
appropriate repository permissions. See the
[GitHub issue comment API](https://docs.github.com/en/rest/issues/comments#create-an-issue-comment).
Bunko already uses a narrowly scoped installation token for its separately
labelled demo account; the current candidate adds ordinary non-GitHub authorship with a durable Bunko author mapping.

App-mediated posts need durable mappings from GitHub issue/comment IDs to the
verified Bunko author, with ownership checks for changes and moderation. An
author name embedded in Markdown is display text, never authorization proof.
Keep duplicate-submission protection and uncertain-write reconciliation. The
GitHub App's private key stays on the server.

## Readiness checked on 21 October 2026 HKT

EchoMind's live discovery returned HTTP 200 / no-store and advertised password,
Google, Apple and GitHub. This establishes advertised central capabilities;
it does not qualify any new Bunko provider callback.

AiMemo source demonstrates separate login/link intents, preserved local IDs,
fresh introspection, durable credential adoption, conflict refusal and native
completion binding. These patterns fit Bunko's existing encrypted link store.

The current candidate implements central-created Bunko sessions, explicit provider selection, original-ID reuse, repository-app comments and the Mac system-authentication return path. It keeps the exact registered client/audience/callback. The GitHub login remains separate from central provider identity, with no email matching.

Ten HTTP fixture tests cover provider gates, independent PKCE/browser binding,
cancellation, replay, concurrent completion, persistent local-ID reuse, linked
GitHub-account reuse, author attribution, collisions, outages and revocation.
These are synthetic protocol tests, not real provider sign-in receipts. The
Mac Swift bridge compiled and was delivered in TestFlight31; actual installed-app
provider qualification is still pending.

`lazyingart.loginProviders` lists app-qualified methods advertised to readers.
`qualificationProviders` permits a bounded operator round-trip before a button
is advertised; it grants no alternate token, identity or repository permission.
Both remain empty unless configured by the Bunko operator. During operator
qualification, also set `linkEnabled: false` so Settings does not expose an
unqualified connection. This additive server safeguard is tested and deployed with the existing
identity configuration still disabled. Issuer discovery
also has to advertise the requested method. Methods are qualified and enabled
independently; a successful password route does not establish Google or Apple.

Ordinary Bunko session handles remain in native protected storage or the PWA's
HttpOnly cookie. Central credentials remain encrypted server-side. Fresh
introspection protects writes; revocation rejects the local session, while a
transport outage preserves its handle for recovery. Public book access remains
independent of accounts.

Before general release, complete actual provider/browser/native round-trips,
account-deletion and comment-management qualification, and corresponding store
privacy review. No new production availability is asserted by source tests.

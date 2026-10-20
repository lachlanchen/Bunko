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
labelled demo account; normal non-GitHub authorship still needs implementation.

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

Bunko's 23 profile-protocol, encrypted-store and local-HTTP tests passed. Current
Bunko source remains profile-link-only: central-created sessions and general
non-GitHub discussion authors are not implemented. Its Mac authentication bridge
accepts only the legacy GitHub authorization entrance. The Bunko client/audience
and registered legacy callback remain unchanged.

Complete those app-owned session, authorship and native-return paths, then
qualify each provider's real round-trip, cancellation, reopening, revocation,
collision and posting behavior before exposing its button. No provider or
deployment was enabled by this assessment. Build 29's delivery is unchanged.

# Optional GitHub connection — build 32

Google, Apple and LazyingArt can identify a Bunko reader through the registered
LazyingArt profile service. Public books remain in the shared book repository.
An optional GitHub connection lets that reader post using their own GitHub
identity. Without a connection, public comments use Bunko's repository-scoped
application with durable reader attribution. No personal repository is created.

Settings offers one optional GitHub connection. It requires explicit consent,
fresh authentication of the current Bunko account and GitHub authorization.
The initiating Bunko ID remains authoritative. A GitHub identity already owned
by a different Bunko account is refused; data, plans and local drafts do not
move. Subsequent GitHub sign-in resolves to the same linked Bunko ID.

Encrypted provider credentials rotate with a single in-process request and a
database lease. An uncertain refresh requires reconnection. A canceled or
expired completion cannot attach a provider. A connection failure never silently
posts through a different author. GitHub permissions can be managed on GitHub.
Account deletion must include `github_connections` and `bunko_local_accounts`
alongside the existing profile/session/private-data records.

The public method-discovery request is independent of anonymous session restore.
An initial session 401 therefore cannot cancel discovery and leave the interface
stuck showing GitHub alone.

## Qualification at this checkpoint

- 146 client tests (145 full-suite plus one focused connection test) and 137 server tests pass, plus lint and renderer checks.
- Live password and Google browser round-trips passed; Google retained the
  existing GitHub-created Bunko ID. Central profile refresh also passed.
- Apple browser verification is pending an interactive password step.
- The optional GitHub connection is scoped to the approved qualification owner.
  General provider visibility and linking remain gated during qualification.
- Build 32 native packaging and internal delivery are in progress. This document
  does not claim upload, native OAuth return or public review completion.

Runtime evidence and credentials remain outside Git. Public release candidates,
prices, subscriptions and reward policies are unchanged.

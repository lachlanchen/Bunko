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
- Apple accepted the provider sign-in, but the Bunko consent flow expired before
  completion. A fresh complete app callback remains unqualified.
- The optional GitHub connection is scoped to the approved qualification owner.
  General provider visibility and linking remain gated during qualification.
- Build 32 (1.0.14) is VALID and IN_BETA_TESTING in the existing iOS/Watch and
  Mac internal group. Android32 is available to the existing internal testers.
- The approved password fixture completed the Android system-browser return and
  restored the same account after a WebView reload. This AVD used the AOSP browser;
  iOS/Mac provider UI returns and a new real public comment were not tested here.
- The approved owner completed the optional GitHub connection, retaining their
  original Bunko ID. No other reader uses that owner's personal identity.

The password fixture completed normal web/native signout. Its exact local profile
and account registry were removed through the profile-removal path; credential
revocation drained and no fixture content or sessions remained. Central erasure
is handed back to the issuer owner. The permanent owner account is preserved.

Runtime evidence and credentials remain outside Git. Public release candidates,
prices, subscriptions and reward policies are unchanged.

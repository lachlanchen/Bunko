# Reviewer access · Bunko Demo account

Bunko’s dedicated GitHub review account can encounter GitHub’s new-device email
verification. Disabling two-factor authentication does not prevent that check; see [GitHub’s new-device verification documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/verifying-new-devices-when-signing-in).
The owner’s inbox cannot be part of the review procedure.

## Access supplied with the replacement build

1. Open **Reading companion** from the library, or a book’s passage **Discussion**.
2. Expand **Demo account** below the GitHub button.
3. Enter the dedicated Bunko demo username and password from the store’s private
   review fields. Choose **Sign in to demo**. No email, OTP or GitHub consent is
   involved in this path.
4. Open Daodejing, choose **Read**, then the first passage’s speech bubble.
   Enter a comment and choose **Post comment**. Comments and replies are real
   public GitHub content, clearly attributed to **Bunko demo account** through
   the repository’s GitHub App.
5. Return to **Reading companion** to attach a supported document, read it and
   ask questions. Demo documents and conversations are shared among demo-account
   testers, separate from every ordinary reader. Use non-sensitive material.
6. Sign out from the discussion or companion. Reading books, local dictionaries
   and private device notes do not need any sign-in.

This is an openly labelled demonstration identity available through the same UI
on all platforms. It is not an automatic reviewer detector, a hidden exemption,
or a simulated comment service. Normal quotas, moderation and explicit public
posting apply. The unified LazyingArt adapter remains a separate qualification.

## Verified on 30 September 2026 (Hong Kong)

- Real fresh-browser password sign-in, cookie persistence and sign-out/sign-in.
- Real comment and reply in [discussion #3](https://github.com/lachlanchen/bunko-books/issues/3), reloaded with explicit demo attribution.
- Real document upload/conversion, equation rendering, a model answer, and
  persistent document/chat retrieval after a fresh sign-in and reload.
- Native Android Debug-shell checks with the production web bundle verified
  secure-storage sign-in, cold restart, real discussion reading/posting controls,
  sign-out and preservation of the existing downloaded book. Fresh Apple native
  demo sign-in was not separately exercised in this update; the secure-storage
  bridges are unchanged, and the signed archives passed Apple validation.
- Automated coverage for incorrect credentials, rate limiting, origin/PKCE
  boundaries, password rotation/disablement, expiry, duplicate prevention,
  public attribution and isolation from ordinary readers’ documents and chats.

The authenticated backend and web reader are deployed. iOS/Watch and universal
Mac **1.0.9 (14)** are **VALID**, **IN_BETA_TESTING** and **WAITING_FOR_REVIEW**,
with the verified dedicated demo credentials in both private review records.
Android **1.0.9 (14)** is available internally and its production release is
**Changes in review**. Google’s demo username, password and instructions were
verified after reloading the saved form, following withdrawal of the incompatible
build8 review. Both stores are configured for release after approval. See the
[build14 receipt](artifacts/icon-release-1.0.9-14.json). The currently public
Apple 1.0.8 (10) apps do **not** contain the new demo sign-in screen.

## On rejection and resubmission

Keep the current approved apps available. First read the actual rejection and
confirm the affected platform, version and build. If credentials alone suffice,
correct the review information and respond to the reviewer. If the old binary
has the GitHub device-verification obstacle, attach the qualified replacement
binary containing Demo account, put the dedicated credentials in the private
review fields, and include the steps above. Check privacy answers against the
submitted build, then submit once and verify the store’s resulting state.

Do not put the new password into an old build’s review instructions: that build
has no demo sign-in. Do not cancel an unrelated active review or claim a future
resubmission happened. Build14 was submitted with owner authorization after qualification; later updates must record their actual store state.

## Operator handling

The password is random, separate from the owner and the GitHub test account,
and stored outside Git in protected private configuration. Only its salted
scrypt hash is installed on the server. Sessions use the existing encrypted
server store, native secure storage or web HttpOnly cookies. They expire after
90 days of inactivity; logout, disabling or rotating demo credentials revokes
access. Never place passwords, cookies or provider tokens in handoffs or logs.

The service uses GitHub installation tokens scoped to Issues in **only**
`lachlanchen/bunko-books`. Anonymous reading continues to use a separate read-only
token. No owner GitHub credential is used to impersonate a commenter. Public
posts can be reported on GitHub; maintainers can moderate or remove demo posts
on request. Demo companion data can be deleted from the app.

## Reverified for build16 · 3 October 2026

Apple iOS/Watch and Mac build16 were submitted as WAITING_FOR_REVIEW with the
same dedicated Demo account. Google build16 is Changes in review. The saved
Google username/password and full-access assertion were checked after reload;
its single entry is now titled “Bunko Demo account — no GitHub or email code”.
Instructions start with Reading companion > Demo account and explicitly exclude
the GitHub sign-in button. A fresh production browser signed in without GitHub
navigation and retained the session after reload. The historical build14 states
above remain dated evidence, not the current release status.

## Android reviewer clarification · 3 October 2026, 03:19 UTC

Google production **1.0.10 (17)** became public at 11:17 HKT while this check
was running. The single saved sign-in entry
is **Bunko Demo account — no GitHub or email code**. Its username/password were
compared privately with the dedicated Demo credential file after a page reload;
both match, and the full-access declaration remains selected. The instructions
now explicitly name build17 (also supported by builds14/16) and add this recovery:
if GitHub asks for a verification code, close that browser and return to
**Reading companion > Demo account > Sign in to demo**. These credentials belong
in Bunko's in-app form. They are not a GitHub account password.

A new isolated browser session signed into the live Demo service and retained
the session after reload, without navigating to GitHub. It was signed out after
verification. Native Android17 login, secure-storage restart, discussion access
and enabled posting were verified earlier the same day; see the
[Android17 receipt](artifacts/android-1.0.10-17-20261003.json). The real public
comment/reply qualification remains the dated September30 evidence above. This
clarification changes reviewer instructions only; Google lists that follow-up
as IN_REVIEW. No replacement binary was submitted, and GitHub's security checks
for ordinary GitHub sign-in remain in place.

Private evidence: `.runtime/google-recheck-20261003/reviewer-readback.json`,
`reviewer-instructions.txt`, `demo-fresh.json` and the associated UI screenshots.
No credentials are included in this repository.

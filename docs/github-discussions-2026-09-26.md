# In-app GitHub conversations — 26 September 2026

The owner approved a small cloud service behind LazyEdge, with no local-computer dependency. This is an exception to the original serverless brief for optional public discussions only.

## Implemented

- English, Simplified Chinese, Traditional Chinese and Japanese composer, account status, errors, and public-post notice.
- Drafts on device, explicit posting, repeat-submission protection, paginated comments, hidden-reader controls, external reporting, and sign-out.
- Secure browser authorization on iOS/Android; macOS `ASWebAuthenticationSession`; web popup. GitHub authorization is never loaded in the reader WebView.
- Repository-restricted cloud OAuth service, PKCE/state validation, encrypted eight-hour server token storage, bounded routes and rate limits.
- Updated privacy description for optional server processing; no automatic upload of notes or drafts.

## Release status

The cloud service is active at `https://llm.lazying.art/bunko`. The public GitHub App, [Bunko Reading Conversations](https://github.com/apps/bunko-reading-conversations), is installed only on `lachlanchen/bunko-books` with Issues read/write and Metadata read permissions. Live browser authorization, an authenticated discussion read, the in-app composer, and sign-out passed with the owner account. No public test comment was posted.

Validation: 41 reader tests and five server security tests pass; the 390px and 320px browser review covers sign-in, failed-post draft retention, successful fixture posting, and layout. Android, iOS and universal macOS compile successfully. Public ingress probes reject wrong origins, missing authorization, wrong methods, encoded paths and undeclared paths. The cloud service has no local-workstation dependency.

Android API 34 also passed the live cloud read, system-browser launch, OAuth completion, callback intent, enabled composer, and sign-out with draft retention. GitHub consent took place in the shared authenticated browser and its callback was delivered to Android. iOS and macOS callback handlers compile and Apple accepted both signed uploads, but their native authorization sessions have not yet been exercised on a device.

Posting is covered by mocked GitHub responses and UI fixtures; a real public write and a separate ordinary-reader account were not tested. These remain explicit verification limits.

Existing 1.0.4 (6) store submissions are separate from this work. They have not been withdrawn or replaced. Version **1.0.5 (7)** is available to Google Play internal testers and the Bunko Internal TestFlight group for both iOS and macOS. All four beta release-note languages are populated. See [release receipt](../store/artifacts/release-1.0.5.json). Before a successor formal review, update App Store privacy and Google Play data-safety disclosures for GitHub identifiers and public user content, and verify ordinary-reader access and the remaining Apple callback paths.

See [service operations and registration](../server/README.md). Private deployment receipts and QA screenshots are in `.runtime/github-comments/` and must not be committed.

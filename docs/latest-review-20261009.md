# Latest Bunko review submission · 9 October 2026

The owner requested the latest fixes and builds submitted to both stores,
superseding the 7 October instruction to keep the rounded icons in testing.

| Platform | Candidate | Verified outcome |
| --- | --- | --- |
| iOS / paired Apple Watch | 1.0.11 (18) | Waiting for Review |
| Universal Mac | 1.0.11 (18) | Waiting for Review |
| Google Play production | 1.0.11 (18) | Changes in review; automatic checks passed |

Apple submissions are configured for release after approval. Google received the
production change at 100% rollout across the existing targeted countries, with
managed publishing off. The older Mac 1.0.10 (16) review was withdrawn and replaced
under the owner's latest direction. No unrelated review was changed.

## Qualification

- Fresh `npm run check`: 81 client tests, 58 server tests, renderer checks,
  TypeScript, lint and production build passed.
- Uploaded build18 was reused. Its native inputs are unchanged; subsequent
  commits contain documentation and the corrected Play banner. Both Android
  artifact hashes match the previously qualified internal upload.
- The signed Apple archives, universal Mac architectures, Watch version match,
  approved artwork and internal TestFlight qualification remain recorded in the
  [build18 receipt](rounded-icons-20261007.json).
- All copied Apple screenshot sets were complete. The exact version, build,
  automatic release setting and private review credentials were read back.
- Fresh live Demo sign-in and reload persistence passed without GitHub navigation
  or an email code. The review notes explicitly direct reviewers to Reading
  companion → Demo account. Existing real comment/reply qualification remains
  the dated evidence in [reviewer access](../store/reviewer-access.md).
- The standalone cloud privacy page returned HTTPS200. Google preview reported
  no lost supported devices or blocking release errors.

The rounded icon and resilient book downloads are included. Optional cloud plans
remain informational, with general purchasing disabled. No price, billing,
account, book data or public update-feed changes were made. This task did not
perform a new physical-device test or payment transaction.

At preflight, the public versions were iOS1.0.10(16), Mac1.0.8(10) and Android
1.0.10(17). Submission does not establish approval or public availability.

[Provider receipt](latest-review-20261009.json). Private API/UI evidence is under
`.runtime/latest-review-20261009/`; credentials are excluded from tracked records.

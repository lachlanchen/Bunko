# Bunko 1.0.14 (37) submitted · 24 October 2026

The owner requested the latest qualified build, current screenshots and concise
reader-facing descriptions. Build37 was already available in the existing
TestFlight and Google internal groups. The same binaries are now submitted.

| Platform | Submitted update | Verified state | Release setting |
| --- | --- | --- | --- |
| iOS and bundled Apple Watch | 1.0.14 (37) | Waiting for Review | Automatic after approval |
| Universal macOS | 1.0.14 (37) | Waiting for Review | Automatic after approval |
| Google Play production | 1.0.14 (37) | Changes in review | Full rollout; managed publishing off |

Apple confirmed both submissions at 23:01 UTC on October23. Google confirmed
eight changes sent for review at 23:22 UTC. No unsent Google submission button
remained. The approved build23 apps remain available; build37 is not yet an
approved public release. The former Mac build23 review has completed successfully.

## Included changes

The cumulative update adds the book reading companion and continuing Ask, People,
Places and Timeline workspace; saved results, follow-up questions, whole-book
scope, exact passage references, relationship graphs and tree layouts, geographic
and story maps, and timelines. It also includes compact chapter titles, persistent
library ordering, reading-context navigation and response-format recovery.

The four store descriptions were rewritten in English, Simplified Chinese,
Traditional Chinese and Japanese. They explain reading order, offline books,
dictionary lookup, discussions, saved guides and private documents. Provider
consent, limits and possible errors remain disclosed. Android copy excludes the
Apple Watch section. No new login, reward or subscription availability is claimed.

## Checks and corrections

- `npm run check`: 162 client tests and 149 server tests passed, together with
  lint, type checks, renderer validation and the production web build.
- No application source changes since build37 source `7a3767d1b76c99a99b3ba1a36e2f9194be722ddc`.
  Existing signed-artifact, payload, Watch identity and universal Mac/minOS gates
  are recorded in the [internal delivery receipt](../store/testflight/reading-workspace37-receipt.json).
- A fresh live Demo login required no GitHub navigation or verification code.
  A real whole-book request returned eight people, four places and six events.
  Saved guides reopened after reload; changing tabs did not generate another answer.
  Browser sign-out and the direct native HTTPS session protocol were checked.
- Both Apple private review records and Google's retained sign-in form matched
  the dedicated Demo credentials. No personal account password was supplied.
- The public privacy page was outdated. Both service hosts now serve the exact
  current privacy and terms files, including book-guide and provider disclosures.
  Immutable legal releases and rollback backups were retained. Only Bunko's
  static legal root changed; no application restart, DNS change or data migration.
- Capture-size and upload-path errors in the screenshot tooling were corrected.
  The fictional-location example uses the actual story-map view; an empty
  geographic-reference capture was excluded.

## Store assets

The [screenshot manifest](../store/screenshots/review37-20261024/manifest.json)
records 22 selected captures, dimensions, hashes, source and order. Apple readback
confirmed all assets processed: five phone, four iPad and six Mac screenshots
(including the retained equations image), plus two retained Watch screenshots.
Google saved five phone screenshots and three current images in each tablet set.
All four Google descriptions and the saved default asset order were reloaded and
verified. Existing icon and feature graphic were retained.

These are genuine Chromium captures of the exact packaged build37 web interface
at the corresponding layouts, using public books and a live Demo response.
They are not new physical Apple-device or simulator captures. English images are
the localized listings' fallback. The earlier installed Android and signed Apple
package qualifications remain dated evidence; no new Apple hardware test is claimed.

## Records and boundaries

- [Submission identifiers and checks](latest-review37-20261024.json)
- [Apple/iOS copy](../store/listings.json), [Mac copy](../store/macos/listings.json),
  [Google copy](../store/google/listings.json)
- Private operating evidence: `.runtime/review37-20261024/`

No new binary was built. Prices, billing, provider activation, shared rewards,
PWA application deployment and sibling app reviews were unchanged. Store approval
and public screenshot visibility remain pending. Verify those states before
announcing build37 as released or advancing the public update feed.

# Translation requests · 11 October 2026

Book details and Settings now offer **Request a translation**. A book-specific
request includes its ID, author, available languages and Bunko link. Eleven
common target languages and a free-text language field are available. Existing
issues are linked to help readers avoid duplicate requests.

GitHub receives the prefilled form when opened; readers review and submit it
there. Opening does not publish an issue or start a paid translation. Completed,
cleared editions remain library data and do not each require an app update.

Validation: lint, three request/form tests, web build, native web build, and
macOS Safari-targeted web build passed. A real Chromium UI check at 390px and
1200px verified the form, arbitrary Arabic target, URL and absence of horizontal
overflow. No issue was submitted. Light-phone and dark-desktop captures are
staged in `store/screenshots/translation-request-20261011/`.

The owner subsequently authorized building and submission. Version **1.0.12 (19)**
contains this feature on iOS/Watch, universal Mac and Android. Full project checks
passed (83 client and 58 server tests), as did signed native packaging. See
[the release receipt](translation-release-20261011.md) for store review and beta
status. The original Settings captures remain archived; current book-detail
screenshots accompany the new submission.

## Follow-up in build 21

Requests in book details and reading Settings now default to that book. Existing
languages offer direct reading instead of a duplicate issue; missing languages
retain the reviewed GitHub request. Native/localized names and tags are matched
without collapsing script or classical/modern distinctions.

Numbered Settings chips preserve selection order. The first language is main,
removing it promotes the next, and reselecting appends. At least one remains
selected. Both reading layouts and main-text-only mode follow that order; repeated
language labels were removed. Language changes preserve the current paragraph
and reuse cached chapters, including offline.

[Build 21 validation and submission receipt](navigation21-20261011.md).

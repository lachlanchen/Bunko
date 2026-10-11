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

This small feature is accumulated on the current test branch for the next
native candidate. Installed build18 and production reviews are unchanged.
The staged screenshots have not been uploaded to stores.

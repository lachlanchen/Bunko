# Compact chapters and library order

Chapter rows show one title line with an independent expansion control for the
full title and its interface-language translation. Reader headings collapse to
one line when they overflow; the chapter toolbar stays compact. Full ruby text
remains available in the expanded heading.

The library defaults to **Recently read**. The selector also offers **Newest
added**, **Title** and **Author**. Its device-local preference survives restarts
and language changes. Opening a reader or moving its bookmark updates recency;
visiting a companion source excerpt preserves the original bookmark. Existing
bookmarks without dates remain ahead of unread books, without invented reading
timestamps. Concurrent bookmark writes are serialized.

Newest-added order uses the first catalog publication date. The book repository
backfilled 186 dates from its committed catalog history, and preserves those dates
when editions are refreshed. Older offline catalogs without dates sort stably by
title until the catalog refreshes. No extra book-body download is required.

## Qualification

- 153 client tests, 141 server tests, renderer validation, lint and web build passed.
- The final reader change passed 14 focused tests and native/Mac web builds.
- Chrome layout and interaction QA: 320, 390 and 1280px; light/dark; sorting and
  reading recency after reload; filtering; actual public book data; no horizontal
  page overflow. Synthetic extreme-title QA measured 24px collapsed text height
  and verified expansion does not open a chapter.
- Installed Android API34 Debug34: native preference reload, actual public Adler
  chapters (12 rows, maximum 24px text height), expansion without navigation,
  and most-recent reading order passed. Screenshots remain internal QA drafts.
- Catalog: nine tests and full validation of 186 books passed. Existing book
  content hashes and chapter payloads are unchanged.

Build34 is VALID / IN_BETA_TESTING for iOS/Watch and Mac, and available on the
Google internal track. Its delivery and cleanup receipt is in
`store/testflight/library-order34-receipt.json`. Public reviews and provider-login
gates remain unchanged.

## Reader-heading correction · build35

The nested ruby line had its own whitespace rule, so a reader heading could still
wrap despite its parent clamp. Build35 applies the collapsed whitespace rule to
that line too. Actual English and Chinese reader QA verifies a single base-text
line, intact ruby, full expansion and collapse, with saved order and bookmarks.
Both the expanded and collapsed layouts were visually reviewed at 320px.
Installed Android Debug35 additionally verified the corrected heading at 36px
(one line), the 24px chapter-row text, native preference reload, reading recency
and no horizontal overflow. Both signed Android packages contain all88 expected
resources. This successor retains all build34 changes.

## Final internal delivery · 23 October 2026 HKT

Build35 is VALID / IN_BETA_TESTING for iOS/Watch and universal Mac in the
existing internal TestFlight group, and available to Google internal testers.
Both Apple packages passed provider validation, upload, signature, resource,
Watch identity/version and actual Mac arm64/x86_64 minimum12.0 checks. All four
localized beta notes and group membership were read back.

The shared Mac guard and owned processes were released, original signing state
and six profiles restored, and the local browser/emulator/preview stopped.
No new iOS/Mac GUI test or public review/PWA deployment is claimed.
`store/testflight/library-order35-receipt.json` records the final evidence.

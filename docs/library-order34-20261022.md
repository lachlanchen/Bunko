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
- Catalog: nine tests and full validation of 186 books passed. Existing book
  content hashes and chapter payloads are unchanged.

Internal build34 delivery is tracked separately; this source checkpoint does not
claim an uploaded or publicly released binary. Public reviews and provider-login
gates remain unchanged.

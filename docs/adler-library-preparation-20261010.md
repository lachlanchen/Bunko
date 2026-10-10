# Adler reader bundle — 2026-10-10

## Status

*What Life Should Mean to You / 自卑与超越 / 人生の意味の心理学* is
prepared as a complete Bunko schema-1 bundle. Public publication is on hold for
rights clearance. No files were added to the public `bunko-books` repository.
No app build, store submission or deployment was made.

The current reader supports the bundle's English, Chinese and Japanese layers.
After clearance, publishing the catalogue and book files is sufficient; readers
can refresh the library. See [library publishing](library-publishing.md).

## Source and validation

Read-only source in `../ZhJpBook`:

`data/interlinear/adler-what-life-should-mean-to-you/assembled/adler-what-life-should-mean-to-you.trilingual.json`

Source SHA-256:
`0d4a07241c26614bffe59c5e247241b3b81e4e12ad3fce361c171ebbdde9cadc`

- Current manifest: **250/250 chunks**, zero stale or missing chunks.
- **12 chapters, 1,104 paragraphs, 4,232 aligned units** in each language.
- Source trilingual validator passed. The older bilingual validator is not
  applicable to this source format.
- Every exported text layer matches its source tokens exactly; English spaces,
  paragraph IDs and source text are preserved.
- **132,204 Chinese reading tokens and 40,020 Japanese reading tokens** retained;
  no Han-containing Chinese/Japanese body token lacks a reading.
- All compact body lines pass the existing catalogue token validator; chapter
  hashes, byte totals and paragraph totals match.
- Chapters total **8,149,793 bytes**; the largest is **1,203,131 bytes**.
- Existing textless cover artwork was visually checked and encoded as a
  **600 × 900 WebP, 134,798 bytes**. Source artwork was not changed.
- Source SHA-256 was checked again after export and remained unchanged.

Private, Git-ignored output:

`Bunko/.runtime/adler-20261010/library/books/adler-what-life-should-mean-to-you/`

The sibling `validation.json`, `prepare.py`, and
`adler-what-life-should-mean-to-you.bunko.zip` retain the local preparation receipt,
reproduction script and packaged bundle. The bundle retains `rights.status: hold`;
the catalogue validator correctly excludes it. It must not be copied into a
public Git repository while that hold remains.

## Publication evidence

The original is registered as **A42453, 11 September 1931**, with renewal
**R231693, 24 February 1959**, by Raissa Adler. This is recorded in the
[Copyright Office's 1959 January–June renewal catalogue](https://www.gutenberg.org/cache/epub/11819/pg11819.txt),
under Alfred Adler.

[Copyright Office Circular 15A](https://www.copyright.gov/circs/circ15a.pdf)
describes the 95-year term and year-end expiry for these renewed works. Applied
to the recorded 1931 original, that points to **1 January 2027** for U.S. public
domain entry. This does not independently clear later additions or translations.
The supplied Capricorn scan's copyright page lists 1931 and 1958 notices.

The registry therefore records a hold and a 2027-01-01 recheck date. Earlier
publication needs a redistribution permission record. Before changing to `ship`,
also verify the selected edition's later additions and final translation
provenance. A modern reference filename alone is not the reason for this hold;
the original's documented renewal is material evidence.

Once cleared, update the scoped registry entry, export with
`tools/publish_library.py`, retain the reviewed textless cover, and run the
`bunko-books` catalogue validator before publication. Book data remains outside
the app repository.

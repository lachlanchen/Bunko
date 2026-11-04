# Adler reader bundle — 2026-10-10

## Status

*What Life Should Mean to You / 自卑与超越 / 人生の意味の心理学* is
prepared as a complete Bunko schema-1 bundle. On 2026-10-10, after being shown
the original's renewal evidence, the owner confirmed: “I checked it’s ok to
redistribute plz add it”. The scoped registry entry is now approved for public
publication on that owner confirmation. This is not a declaration of worldwide
public-domain status.

Published to `bunko-books/main` as
[`7da0111bc2945c6f013758272c2e49656bca604d`](https://github.com/lachlanchen/bunko-books/commit/7da0111bc2945c6f013758272c2e49656bca604d).
The public catalogue now has **186 books**. All 185 prior catalogue entries are
unchanged. [Open this edition in Bunko](https://lachlan.lazying.art/Bunko/?book=adler-what-life-should-mean-to-you).

The current reader supports the bundle's English, Chinese and Japanese layers.
Publishing the catalogue and book files is sufficient; readers
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
`adler-what-life-should-mean-to-you.bunko.zip` retain the initial local preparation
receipt, reproduction script and packaged bundle. These historical artifacts
record the initial hold. The published edition is exported afresh from the
approved registry into `../bunko-books`, with `rights.status: ship` and the
owner's redistribution confirmation.

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

The initial registry hold and 2027-01-01 recheck date were based on that evidence.
The owner's subsequent express redistribution confirmation resolves the
publication gate for this selected edition. The underlying renewal evidence is
retained here; no independent license document was supplied or inspected.

The publication uses `tools/publish_library.py`, retains the reviewed textless
cover, and runs the `bunko-books` catalogue validator before publication. Book
data remains outside the app repository. No app build or store submission is
required.

## Publication verification

- All eight existing `bunko-books` validator tests passed.
- Full catalogue validation passed: 186 books, schema 1.
- Fresh public GitHub downloads of the catalogue, metadata, rights, every one
  of the 12 chapters, and the cover returned HTTP 200 and exactly matched the
  published local files, including chapter checksums.
- The remote `main` SHA matched the publication commit above.
- Live response hashes and byte counts are recorded privately at
  `.runtime/adler-20261010/publication-verification.json`.
- [GitHub library validation](https://github.com/lachlanchen/bunko-books/actions/runs/38033116746)
  was running when this receipt was written; the local full validation and
  public-download checks above had already passed.
- No source checkout, app binary, store review or production app code changed.

Readers can reopen Bunko or press the library refresh button, then search for
the English title or `自卑与超越`. Existing cached catalogues and CDN mirrors can
take a few minutes to revalidate.

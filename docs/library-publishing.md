# Publish books without an app build

The catalogue and book files live in [lachlanchen/bunko-books](https://github.com/lachlanchen/bunko-books). The app loads that catalogue online and caches downloaded chapters for offline reading. Adding books, correcting text, changing metadata, or replacing a cover does not rebuild the app.

The deployed management page is [Bunko library management](https://lachlan.lazying.art/Bunko/admin/). `bunko.lazying.art` has not been configured for this deployment; the GitHub Pages address is the working admin route.

## Upload with the management page

1. Prepare one book folder containing `meta.json`, `rights.json`, its chapter files, and an optional reviewed cover. Use the schema below or the exporter.
2. Open the management page and select that folder. It displays the title, languages, chapter count and size.
3. Connect a GitHub fine-grained token restricted to `bunko-books`, with **Contents** and **Pull requests** read/write. The page holds it in memory and sends it only to `api.github.com`; Disconnect or reload clears it.
4. Confirm the original work's rights, the final generated translation, completeness and cover review, then create the publishing pull request.
5. Open the resulting GitHub link. Wait for **Validate and publish library** to pass, review the diff, and merge. The workflow derives the new catalogue automatically. A failed check must be repaired before merging.

The UI handles bundles up to 250 MB and files below 20 MB. Use the Git workflow for larger bundles. The page does not generate translations from PDFs: it accepts prepared reader bundles. Disconnect after an upload on a shared computer.

## Publish with Git or an automation job

For books from the local collection, add/update an approved entry in `Bunko/docs/library-editions.json`. Pin the actual complete source; mark only finished, cleared language layers. Then:

```sh
python3 tools/publish_library.py --slug nihon-shoki --out ../bunko-books
cd ../bunko-books
python3 -m unittest discover -s tools -p 'test_*.py'
python3 tools/catalogue.py --write
git add books/nihon-shoki reader-index.json
git commit -m 'Update Nihon Shoki reader edition'
git push
```

The source checkout is read only. The exporter supports complete assembled/preview files and manifest-validated legacy bilingual chunks. It stops on missing or stale text. Keep prior chapter files available for readers holding an older metadata revision. For a hosted import job, create a branch and pull request with the same bundle layout; use the workflow as the publication gate.

Entries with `kind: publisher-scripture` use the publisher importer instead:

```sh
python3 tools/import_scripture.py --fetch --cache .runtime/scripture-sources --out ../bunko-books
python3 -m unittest discover -s tools -p 'test_import_scripture.py'
python3 ../bunko-books/tools/catalogue.py --write
```

The importer preserves source text, notes, section headings, credits and versions.
The Bible contains all 66 books in English (World English Bible), traditional
Chinese (Chinese Union Version), and Japanese (Freedom Bible, labelled by its
publisher as a draft). These editions are public domain at eBible.org. Combined
Chinese verses remain together, and genuine numbering/manuscript differences
remain visible rather than being filled with invented translations. Optional
`--bible-ruby <sqlite>` transfers only unchanged readings from an audited earlier
edition; `prepare_scripture_ruby.py` creates that cache from the read-only source.

The Quran contains Arabic, English, Chinese and Japanese: all 114 surahs and
6,236 numbered verses per language. Arabic is the verbatim [Tanzil Uthmani 1.1](https://tanzil.net/docs/Text_License)
text, including its opening basmalahs and notices. QuranEnc translations retain
all markers and footnotes under the publisher's [republication terms](https://quranenc.com/en/home/api).
The old local text exports are not shipped as-is: their source omissions and
removed notes were caught by the publication audit. Source payloads remain in
`bunko-books` only; hashes, coverage and permission evidence are in rights files.

Book languages are data-driven BCP 47 tags (for example `ar`, `he`, `hi`, `fr-CA`,
`az-Arab`), with no fixed language list or layer count. Legacy aliases remain
supported. The reader uses per-layer language names and script direction;
passage tools, offline storage and Watch transfer keep all selected layers.
Watch payload byte limits still apply. Only English, Chinese and Japanese have
downloadable offline dictionaries; other languages use their own Wiktionary
entries when available. Interface translations are separate from book languages.
Book corrections refresh through the catalogue. The improved RTL, language
labels and Watch handling require the successor reader/native app build.

For owner editions containing diagrams or photographs, follow the
[figure-preservation audit and repair procedure](owner-figures-2026-09-26.md).
It checks source figure counts, renders TeX diagrams and rejects missing images
before publication.

Direct GitHub editing also works for small metadata changes. Upload a prepared folder to `books/<id>/`, preserve the declared filenames, and merge through a pull request. Do not hand-edit `reader-index.json`: the workflow derives it from validated metadata.

## Bundle contract

- `meta.json`: schema `1`, id, mode, language keys, primary language, titles, author, chapter list, byte/paragraph totals, category (`chinese`, `japanese`, `world`), and optional cover filename.
- `rights.json`: matching id, `status: "ship"`, published languages, original-author/work basis, references and review date. The owner confirmed the final translations were generated by Codex. A reference filename alone does not disqualify them. `status: "hold"` removes a book from the next catalogue.
- Chapters: compact JSON with `id`, `n`, `title`, `p`; paragraphs carry `id`, `src`, `u`; units carry language token arrays. Tokens are strings or `[text, reading, grammarRole]`. All published languages must exist on substantive units. A source-free annotation may explicitly use `annotation: true` and its available languages.
- Filenames: `cNNNNpNN-<sha256-prefix>.json`. Every file stays below 20,000,000 bytes. The exporter splits long chapters at paragraph boundaries. Legacy `cNNNN.json` files remain supported.
- Covers: `cover-<sha256-prefix>.webp`, `.png`, or `.jpg`; less than 10 MB, preferably a small portrait WebP. Titles remain selectable text outside the image. Declare `rights.cover.textFree: true` and the artwork's provenance in `rights.cover.basis`; visually review for lettering before publishing.

After all books validate, the workflow atomically generates `reader-index.json`. It never needs App Store Connect or Google Play access. Raw GitHub is the reader's first origin; jsDelivr is the fallback and can take longer to refresh.

## Reader updates and rollback

The enhanced reader refreshes the catalogue on opening, returning to the foreground, reconnecting, or pressing Refresh. Installed 1.0.0 clients already fetch the same catalogue; reopening may be needed to display their background refresh. They can read the additional books. Cover rendering and the visible theme selector are reader features delivered in the newer web/native build.

To roll back a book, revert its metadata/rights change and let the workflow regenerate the catalogue. Keep existing content-addressed chapter files for offline and older clients. Hiding a title does not erase a reader's downloaded copy. Future app-code features still require a web deployment or native release; book content does not.

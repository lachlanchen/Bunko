# Sentences and paragraphs

Choose **Sentences** or **Paragraphs** under **Settings → Arrangement**.
Sentences is the default. Bunko remembers your choice across books. The main
text, translations and ruby follow the language order you select.

Sentences uses the book’s existing alignment first. If an aligned passage
contains several sentences, Bunko gives each sentence its own line within its
language. A translation can combine or divide sentences differently from the
original. Bunko keeps those languages in the same passage group and retains the
passage’s bookmark and discussion. Figures, equations and notes keep their
own layout.

## Book catalog maintenance

Publish sentence maps alongside new or updated editions in `bunko-books`.
`sentences-v1.json` contains only display offsets for the existing chapters.
The catalog pins the map by SHA-256. Each chapter entry identifies the exact
parsed chapter it describes, including older chapters with unversioned names.
Existing chapter files, offline copies and passage links can be reused.

After preparing a cleared edition in the books checkout, generate its map from
the Bunko checkout, then rebuild the catalog. Omit `BOOK_ID` to scan every title
already in the catalog.

```sh
node tools/build-sentence-maps.mjs ../bunko-books ../bunko-books BOOK_ID
python3 ../bunko-books/tools/catalogue.py --write
```

The generator and reader use the same locale aware splitter. The reader can
calculate boundaries locally for older downloads, missing maps and maps from
another chapter revision. The splitter preserves ruby tokens, text and grammar
roles. Where a boundary cannot be identified safely, the supplied passage stays
together.

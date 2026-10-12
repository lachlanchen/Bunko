# Final Polished Physics Editions

`tools/import_polished_physics.py` updates existing physics book identities in
`../bunko-books`. It reads accepted final English TeX and source-bound Japanese
and Chinese caches from `../leonardsusskind`, not OCR or earlier drafts. The
exporter makes no translation API calls.

```sh
python tools/import_polished_physics.py --preflight
python tools/import_polished_physics.py --dry-run
python tools/import_polished_physics.py
python ../bunko-books/tools/catalogue.py --write
python -m unittest discover -s tools -p 'test*polished*py'
python tools/check_polished_reader.py --book physics-particle-physics-2
# After publishing the content repository:
python tools/check_polished_reader.py --live
```

`--preflight` checks content while PDFs rebuild and cannot write bundles.
Publication also requires both standalone PDFs to pass their completeness,
source/hash, semantic-sample and layout gates.

## Reader Contract

- Retain schema 1, existing book IDs, source rights and textless covers.
- English is primary; Japanese and Chinese use `ja` and `zh`.
- Preserve every prepared chapter segment, including overviews, questions,
  responses, footnotes, captions, tables, equations and diagrams.
- Align by source-segment identity. Coalesce adjacent prose only inside the
  same segment when Japanese grammar crosses a layout macro boundary.
- Freeze math before Pandoc: leading commutators must not disappear as optional
  equation arguments. Unwrap table scaling boxes rather than lose their cells.
- Convert simple tables to reader-supported arrays with real text cells.
  Unsupported spanning cells and unknown structures block publication.
- Put captions in rich units so math and all chosen languages render in existing
  apps. Do not duplicate them in plain figure-caption fields.
- Check every rich math expression using the same KaTeX options/macros as
  `RichLine`. Remove only unsupported spacing instructions, never content.
- Keep matched passage IDs and old content-addressed chapters for bookmarks
  and offline readers. Updated metadata and chapters get fresh hashes.

Each `translation-audit.json` records source hashes, paragraph/figure counts,
retained anchors and math-renderer checks. PDF correctness does not imply reader
correctness; both gates are required. Semantic review is sampled, not exhaustive.

Content updates require publishing `bunko-books`, not a new app binary. Do not
deploy unrelated app branches merely to refresh the catalogue.

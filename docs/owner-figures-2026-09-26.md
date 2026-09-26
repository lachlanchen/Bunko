# Owner-edition figure preservation

The 2026-09-26 audit compares the 33 published owner editions with the edited
manuscripts and structured travel/multilingual sources. Cover artwork is counted
separately from body figures. A placement means one image in its reading position;
the same asset may occur more than once.

## Verified result

| Collection | Books | Figure placements |
| --- | ---: | ---: |
| Physics, including supplementary courses | 19 | 2,108 |
| Travel | 3 | 125 |
| Learning | 2 | 49 |
| Finance, including How You Got Rich | 9 | 414 |
| **Total** | **33** | **2,696** |

The repair adds 799 previously omitted placements. All referenced assets exist,
all 35,834 previous passages keep their IDs and text, and all original covers
remain unchanged. Per-book counts are in [the audit report](owner-figure-audit.json).

Validation passed: six importer regression tests, seven bundle-validator tests,
the full 183-book catalogue validation, and eleven browser checks. The browser
checks cover seven representative books at 390 pixels, translated Chinese
captions, a complete How You Got Rich download, and reopening its figure from
the local cache with networking disabled. Source diagram spot checks and phone
screenshots are retained privately under `.runtime/owner-figures/qa/`.

## Corrections

- Resolve physics images beside the chapter manuscript and in the course's
  `assets/` directory, as well as `figures/`. This restores 152 placements in
  General Relativity 2008 and 21 in Advanced Quantum Mechanics.
  For General Relativity 2008, the source book explicitly gives chapter-local
  assets precedence. Its 41 improved replacements for previously imported
  course-level images receive new hashed filenames; old cached images remain
  immutable.
- Render 622 original TikZ diagram placements: 247 in physics, 345 in finance
  notes, and 30 in learning notes. Use the author's TeX preamble, fonts and
  drawing commands, with tight page bounds. XeLaTeX handles the finance source
  that uses `fontspec`; other sources use pdfLaTeX. Diagram WebP assets use
  lossless compression, preserving fine lines and labels.
- Unwrap image-only `resizebox`/`scalebox` layout containers before Pandoc;
  the reader's responsive CSS controls their displayed size.
- Restore two source photographs in How You Build a Business and two in
  How You Got Rich. The latter retain the reviewed English, Chinese and Japanese
  captions and existing source passage IDs.
- Ignore editorial comments when looking for a TeX document terminator.
  Existing published chapter boundaries are retained during this repair.
- Leave the three travel guides' 125 existing placements intact. Wealth From
  First Principles has cover artwork but no body image or TikZ diagram.

No replacement illustration is invented. Source repositories remain read only;
the downloadable payloads belong exclusively in `bunko-books`. Original covers,
rights declarations and the physics GPL terms remain in place.

## Reproduce and validate

Requirements: Pandoc, Pillow, CairoSVG, Poppler, pdfLaTeX, XeLaTeX and the source
books' TeX packages/fonts. Existing shared installations are sufficient.

```sh
python3 tools/repair_owner_figures.py --render
python3 tools/repair_owner_figures.py --write
python3 -m unittest discover -s tools -p 'test_owner_figures.py'
python3 tools/audit_owner_figures.py
cd ../bunko-books
python3 -m unittest discover -s tools -p 'test_*.py'
python3 tools/catalogue.py --write
```

The renderer caches reproducible diagrams and compilation logs privately under
`.runtime/owner-figures/`. The audit compares every source placement with the
currently referenced chapter files, checks each asset path, preserves covers,
and checks that existing passage IDs have not been reassigned to different text.
Missing assets, failed TeX diagrams or Pandoc figure loss fail the import.

Old immutable chapters stay available. New chapters have new content hashes and
the catalogue revision changes so the app can fetch the corrected edition.
Choose **Refresh library**, then download an updated book again for offline use.
Figures are stored by the existing reader's book-asset cache; this data update
does not require a new App Store or Google Play build.

Passage IDs and old chapter files are preserved, but the current reader's note
key also includes the chapter filename. Notes attached to a previous chapter
revision are retained under that revision; they are not automatically migrated
to the corrected chapter. This repair does not change note storage or restart
the app reviews.

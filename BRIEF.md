# Bunko — product brief

Written 2026-09-22 by the L & N session from the owner's request. This is the contract for the reader app. The app code lives in this repository (`../Bunko`); the book data and its pipeline stay in `../ZhJpBook`. Refine it in place and date every change.

## 1. The app

**Bunko** (文庫 / 文库, "pocket library") is a beautiful reader for public-domain classics in English, Chinese and Japanese, with ruby readings on every character and an AI reading companion beside the text.

- Store name: **Bunko — Classics with Ruby**. Bundle id `art.lazying.bunko`, developer LazyingArt LLC. (If the owner vetoes the name, the runner-up is *Yomitomo* 読み友.)
- Icon: a deep indigo rounded tile, a cream 文 glyph centred, one coral ruby stroke floating above it like a furigana annotation. No text beyond the glyph, legible at 60 px.
- Platforms: PWA first, then Android and iOS through Capacitor, exactly like `../L-And-N`. Interface languages en, zh-Hans, zh-Hant, ja.
- Price: **US$0.99 paid up front on both stores** (Apple tier 1 is US$0.99 / CNY 8 / HKD 8), decided 2026-09-23 from the owner's "app is one usd". Not a free app with an unlock. The consequence is a hard ordering constraint: **the Play listing must be created as paid before its first upload**, because Google Play can never convert a published free app to paid. That mistake is exactly why L & N ships an in-app product instead. There is no billing code in this app at all, which removes the whole purchase, restore and entitlement surface.

## 2. What the owner asked for, point by point

1. **Language choice.** The reader picks which languages are shown: source only, source plus one gloss, or all three. Per-book and per-session, remembered on the device.
2. **Smart, dynamic layout.** The same JSON drives several layouts, the way the PDF pipeline already does: paired, interlinear block, interlinear run, and source-with-gloss. The app chooses a sensible default from the book's `mode` field and the screen width, and the reader can override it. Ruby is a first-class citizen, not an afterthought.
3. **Public-domain books only, JSON as the data, downloadable for speed.** Ship nothing that is not cleared. The book payloads are downloaded on demand and cached on the device, so reading is instant and offline.
4. **Request a book.** A reader can ask for a title. The app opens a prefilled GitHub issue on `bunko-books`; there is no queue of ours to run and no account to keep.
5. **A tutor beside you.** The companion explains a passage, draws the map of a history book, and shows who is who in a novel, always anchored to the page being read.
6. **Every public-domain classic, including the Chinese canon.**

## 3. Data

`../ZhJpBook/data/interlinear/<slug>/assembled/*.json` holds 212 assembled books in three modes that share one container: `chapters` → `paragraphs` → `units` → tokens, where a token is `{"t": text, "r": reading, "g": grammar role}`. The modes are `trilingual_standard` (184 books, languages en/zh/ja, source English), `quadrilingual_wenyan_main` (27 books, wenyan/zh_modern/ja_modern/en, source classical Chinese) and `wenyan_ja_zh` (1 book). That uniformity is why one renderer can show every book.

**Rights are the gate, and the gate is `docs/catalogue.md`.** Every title has a row there with a verdict, the reason and the date; `tools/build_reader.py --all-cleared` parses that file and builds only the rows that say `ship`, so an uncleared book cannot reach the app by accident. The audit of 2026-09-23 cleared **56** titles: 27 of the Chinese canon, 27 of world literature published before 1930, and 2 Japanese classics whose authors died more than 70 years ago.

The test that did the work was not the publication date, which is easy, but the recorded sources of each assembled book. Where they are Wikisource, Project Gutenberg, Aozora Bunko or the curated public-domain canon, the generated glosses are a clean derivative of a public-domain text and LazyingArt owns them. Where a modern commercial edition sits among the sources, a translation someone else owns may have shaped the output; 41 otherwise-ancient titles are held on exactly that ground until the pipeline re-runs them from public-domain sources alone. 金瓶梅, 肉蒲團 and 素女經 are excluded on age rating whatever their copyright status.

## 4. Architecture

```
../ZhJpBook/data/interlinear/<slug>/assembled/*.json   (private working copy, never published)
        ↓  tools/build_reader.py   (catalogue gate, compaction, per-chapter split)
bunko-books, a public GitHub repository of JSON and nothing else
        ↓  cdn.jsdelivr.net/gh/lachlanchen/bunko-books@main/...
app  →  IndexedDB  →  ruby renderer  →  companion
```

**GitHub is the backend; we run no server.** The owner's instruction of 2026-09-23 is that the app relies on the `bunko-books` repository and on itself. So: the reader payloads live in that public repo, the PWA is served from GitHub Pages, a book request opens a GitHub issue, and `bunko.lazying.art` is at most a later CNAME, never a dependency. `LinguaLeaf` is the PDF shelf and is not touched at all; its `docs/library/CANONICAL-LIBRARY.json` may be read for ids, titles and categories, because the slugs match.

The payload per cleared book, written by the builder:

- `books/<id>/meta.json` — titles and author with their readings, the language list, the mode, and a chapter table with each chapter's file, byte size and paragraph count, so the app can show a book before downloading a word of it.
- `books/<id>/cNNN.json` — one chapter. A reader downloads only what they open, which is what makes a 400 MB source book usable on a phone.
- `reader-index.json` — every published book with its languages, chapter count, total bytes and a checksum.

Tokens are compacted on the way out: `{"t":"道","r":"dào","g":"subject"}` becomes `["道","dào","s"]`, and a token with no reading and no role becomes the bare string. Measured on the Daodejing, the reader payload is **16%** of the assembled JSON, 5.2 MB down to 0.8 MB.

Files are committed as plain minified JSON rather than as `.gz`, deliberately. jsDelivr and raw.githubusercontent already serve text with gzip or brotli transfer encoding, so the bytes on the wire are compressed either way, and the browser decompresses natively. Committing `.gz` would compress twice and force a JavaScript gunzip path that older iOS WebViews do not have. The index carries `bytes` and `sha256` so the app can verify a download and skip one that has not changed. jsDelivr refuses files above 20 MB, which the per-chapter split keeps us well under.

- **Shell:** React + TypeScript + Vite PWA in Capacitor, copied from `../L-And-N` (its `tools/`, `store/` layout, i18n pattern, Android flavors, iOS project).
- **Rendering:** real `<ruby><rt>` markup so the platform handles line breaking; `ruby-position: over` for both furigana and pinyin; a CSS fallback for WebViews that break ruby.
- **Companion packs.** Per book, a precomputed JSON pack in the same repo: characters and their relationships, a timeline, places, a glossary, and one short note per chapter. The reader shows these with no network and no model. A live tutor on the owner's workstation may exist as an extra, but nothing in the shipping path may require that machine to be awake.
- **Offline is the default.** Once a book is downloaded it is readable with the network off, and the reader's place, notes and settings never leave the device.

## 5. Design

Paper-first: warm off-white page, one serif for the source text with a CJK face that has proper ruby metrics, generous line height, a reading progress line rather than a bar, and a quiet dark mode. The companion lives in a drawer that never covers the text it is explaining. Everything the reader does must survive going offline.

## 6. Milestones

1. Catalogue audit (`app/docs/catalogue.md`) and the bundle builder, with one book end to end.
2. PWA reader: layouts, ruby, language switch, offline download, progress.
3. Companion packs and the drawer.
4. Android and iOS shells, US$0.99 paid-up-front releases, store assets and listings in four languages.
5. TestFlight and Play internal, then the formal release for review on both stores.

## 7. Publishing

Reuse the L & N pipeline and its hard-won lessons, which are written up in `../L-And-N/store/publishing-runbook.md`, `../L-And-N/store/operator-handoff.md` and `../Company/playbooks/new-app-publication.md`: the CDP/noVNC store browser, the App Store Connect API helper, the Mac build host `echomind-kvm-macos`, `MARKETING_VERSION` must match the version you create, and never send a Play change while another review is running.

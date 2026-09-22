# Bunko — product brief

Written 2026-09-22 by the L & N session from the owner's request. This is the contract for the reader app. The app code lives in this repository (`../Bunko`); the book data and its pipeline stay in `../ZhJpBook`. Refine it in place and date every change.

## 1. The app

**Bunko** (文庫 / 文库, "pocket library") is a beautiful reader for public-domain classics in English, Chinese and Japanese, with ruby readings on every character and an AI reading companion beside the text.

- Store name: **Bunko — Classics with Ruby**. Bundle id `art.lazying.bunko`, developer LazyingArt LLC. (If the owner vetoes the name, the runner-up is *Yomitomo* 読み友.)
- Icon: a deep indigo rounded tile, a cream 文 glyph centred, one coral ruby stroke floating above it like a furigana annotation. No text beyond the glyph, legible at 60 px.
- Platforms: PWA first, then Android and iOS through Capacitor, exactly like `../L-And-N`. Interface languages en, zh-Hans, zh-Hant, ja.
- Price: free download with a one-time **US$0.99** unlock for the full library and the companion. Reuse the L & N billing code (`PlayBillingPlugin.java`, `src/lib/purchases.ts`) and its lesson: on Google Play the unlock must be an in-app product, because a published free app cannot become paid.

## 2. What the owner asked for, point by point

1. **Language choice.** The reader picks which languages are shown: source only, source plus one gloss, or all three. Per-book and per-session, remembered on the device.
2. **Smart, dynamic layout.** The same JSON drives several layouts, the way the PDF pipeline already does: paired, interlinear block, interlinear run, and source-with-gloss. The app chooses a sensible default from the book's `mode` field and the screen width, and the reader can override it. Ruby is a first-class citizen, not an afterthought.
3. **Public-domain books only, JSON as the data, downloadable for speed.** Ship nothing that is not cleared. The book payloads are downloaded on demand and cached on the device, so reading is instant and offline.
4. **Request a book.** A reader can ask for a title; the request goes into a queue this repository's pipeline can process later.
5. **A tutor beside you.** The companion explains a passage, draws the map of a history book, and shows who is who in a novel, always anchored to the page being read.
6. **Every public-domain classic, including the Chinese canon.**

## 3. Data

`data/interlinear/<slug>/` already holds 239 books in the token schema: `t` text, `r` reading (furigana or pinyin), `g` grammar role. `schema_version` and `mode` (for example `zh_main_ja_comment`) are on the root object; the tree is sections → subsections → stories → paragraphs → units → tokens. Reuse it; do not invent a second format. `scripts/interlinear/validate_interlinear_json.py` is the validator.

**Rights are the hard constraint.** `NOTICE.md` is explicit: most of what is in a local working copy may not be redistributed. The 239 folders include Harry Potter, A Song of Ice and Fire, Hawking, and many living authors' work. Before a title ships:

- The original must be public domain in the United States, the European Union and Japan, or the app must not offer it in the places where it is not.
- A translation must be public domain too, or must be one the pipeline generated from a public-domain original, which LazyingArt then owns.
- Write the verdict, the reason and the date into `app/docs/catalogue.md`, one row per title. A title with no row does not ship.

A safe first catalogue: the Chinese canon (道德經, 論語 in 四書集注, 詩經, 尚書, 唐詩三百首, 古文觀止, 紅樓夢, 三國演義, 西遊記, 水滸傳, 淮南子, 千字文, 幼學瓊林, 增廣賢文, 聲律啟蒙, 笠翁對韻, 夢溪筆談, 史記, 漢書, 洛陽伽藍記, 大唐西域記, 人間詞話), Japanese classics out of copyright (古事記, 万葉集, 漱石: 坊っちゃん・こころ・吾輩は猫である・三四郎, 芥川: 羅生門・河童, 宮沢賢治: 銀河鉄道の夜・注文の多い料理店), and Western works published before 1930 (Homer, Virgil, Ovid, Plato, Marcus Aurelius, Austen, the Brontës, Dickens, Twain, Defoe, Swift, Thoreau, Tolstoy, Dostoevsky, Flaubert, Hugo, Dumas, Cervantes, Goethe, Kafka, Proust's first volumes, Gatsby, Gitanjali, The Prophet).

**Exclude on age-rating grounds** even though they are old: 金瓶梅, 肉蒲團, 素女經.

**Never commit a book payload to this repository.** Its GitHub remote is public and `NOTICE.md` limits the export to tooling and samples. Cleared books are built into signed bundles and served from `bunko.lazying.art`; the app downloads them. Keep the build output out of git.

## 4. Architecture

```
data/interlinear/<slug>/*.json      (existing pipeline output)
        ↓  app/tools/build_catalogue.py
cleared, compressed book bundles + a signed catalogue index
        ↓  CDN (bunko.lazying.art)
app: download → IndexedDB → render (ruby, layouts) → companion
```

- **Shell:** React + TypeScript + Vite PWA in Capacitor, copied from `../L-And-N` (its `tools/`, `store/` layout, i18n pattern, Android flavors, iOS project, `tools/deploy-web.sh`).
- **Rendering:** real `<ruby><rt>` markup so the platform handles line breaking; a CSS fallback for WebViews that break ruby; `ruby-position` above for Japanese, and pinyin above Chinese. `../EchoMind/EchoMind/echomind/enhancements/japanese_enhancement.py` and `cantonese_enhancement.py` show how readings and grammar roles were produced there; the reading data here is already in the JSON, so the app only renders it.
- **Companion packs.** For each cleared book the pipeline precomputes a JSON pack: characters and their relationships, a timeline, places for the map, a glossary, and one short note per chapter. The reader shows these with no network and no model. A live question is optional and goes to the owner's workstation model through LazyEdge; it is off by default and never required.
- **Book requests** post to a small queue endpoint on the same host, stored as JSON the pipeline can read. No account, no personal data beyond the title asked for.

## 5. Design

Paper-first: warm off-white page, one serif for the source text with a CJK face that has proper ruby metrics, generous line height, a reading progress line rather than a bar, and a quiet dark mode. The companion lives in a drawer that never covers the text it is explaining. Everything the reader does must survive going offline.

## 6. Milestones

1. Catalogue audit (`app/docs/catalogue.md`) and the bundle builder, with one book end to end.
2. PWA reader: layouts, ruby, language switch, offline download, progress.
3. Companion packs and the drawer.
4. Android and iOS shells, the US$0.99 unlock, store assets and listings in four languages.
5. TestFlight and Play internal, then the formal release for review on both stores.

## 7. Publishing

Reuse the L & N pipeline and its hard-won lessons, which are written up in `../L-And-N/store/publishing-runbook.md`, `../L-And-N/store/operator-handoff.md` and `../Company/playbooks/new-app-publication.md`: the CDP/noVNC store browser, the App Store Connect API helper, the Mac build host `echomind-kvm-macos`, `MARKETING_VERSION` must match the version you create, and never send a Play change while another review is running.

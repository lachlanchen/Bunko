# Bunko — product brief

Written 2026-09-22 by the L & N session from the owner's request. This is the contract for the reader app. The app code lives in this repository (`../Bunko`); the book data and its pipeline stay in `../ZhJpBook`. Refine it in place and date every change.

**2026-09-25 scope amendment:** The owner requested their own books from LazyTravel, HowYouGotRich, LazyEarn, LazyLearn and the independent Leonard Susskind companion-note project. Bunko now accepts public-domain classics **and rights-cleared owner editions**. Each bundle is still separately reviewed and documented in `bunko-books/rights.json`; source repositories are read only during import. Books may have one, two, three or more language layers. Figures and TeX equations are preserved for mobile reading. The original public-domain-only points below describe the first catalogue, not the expanded catalogue.

**2026-09-25 macOS amendment:** The owner requested a native Mac edition, tested on the 3040, 7050 iMac and shared KVM Mac, and submitted under the existing Apple app record. The Mac app uses an AppKit window and native menus around the bundled reader, with persistent on-device storage, offline downloads, and no local web server. The release supports Intel and Apple silicon, with a macOS 12.0 deployment target. Physical runtime tests cover Intel Macs on macOS 12.7.6 and 15.7.7; the KVM test covers macOS 15.7.9. Apple silicon is compiled and signed but has not been tested on physical hardware.

**2026-09-26 discussion-service amendment:** The owner approved one-tap GitHub sign-in through LazyEdge and requested that it run on the cloud server without depending on the local workstation. This supersedes the serverless restriction below only for optional public discussions. Books, offline dictionaries, reading progress and private notes remain local/public-repository features. GitHub remains the public discussion store; Bunko's small cloud service performs OAuth and repository-limited comment operations. GitHub consent uses a secure system browser; composing and reading comments happen in Bunko. The owner subsequently requested persistent login. From 1.0.6, access and refresh tokens stay encrypted server-side; access tokens rotate automatically. Native opaque sessions use Keychain/Keystore and the canonical web reader uses a Secure, HttpOnly cookie. Authenticated use extends the session, with a 90-day inactivity limit and explicit sign-out. No private notes or drafts are uploaded automatically. The implementation must pass live authorization verification before being advertised as available or included in a new store submission.

**2026-09-27 shared-account direction:** The owner requested one LazyingArt identity across Bunko, OnlyIdeas, EchoMind and the other products, supporting email/password, Google, Apple and GitHub. General account registration must not require an EchoMind invitation; any EchoMind invitation gate belongs to EchoMind usage only and should be configurable. Existing users, local data and app entitlements must be preserved through verified linking. Eligible users without GitHub must be able to post with clear LazyingArt author attribution. This is a successor implementation milestone, not a feature of 1.0.6 (8). The shared contract is recorded in the Company playbook and local peer handoffs. The current Bunko submission remains the priority.

## 1. The app

**Bunko** (文庫 / 文库, "pocket library") is a beautiful reader for public-domain classics in English, Chinese and Japanese, with ruby readings on every character and an AI reading companion beside the text.

- Store name: **Bunko — Classics with Ruby**. Bundle id `art.lazying.bunko`, developer LazyingArt LLC. (If the owner vetoes the name, the runner-up is *Yomitomo* 読み友.)
- Icon: a deep indigo rounded tile, a cream 文 glyph centred, one coral ruby stroke floating above it like a furigana annotation. No text beyond the glyph, legible at 60 px.
- Platforms: PWA, Android and iOS through Capacitor, and macOS through AppKit/WebKit. Interface languages en, zh-Hans, zh-Hant, ja.
- Price: **US$0.99 paid up front on both stores** (Apple tier 1 is US$0.99 / CNY 8 / HKD 8), decided 2026-09-23 from the owner's "app is one usd". Not a free app with an unlock. The consequence is a hard ordering constraint: **the Play listing must be created as paid before its first upload**, because Google Play can never convert a published free app to paid. That mistake is exactly why L & N ships an in-app product instead. There is no billing code in this app at all, which removes the whole purchase, restore and entitlement surface.

## 2. What the owner asked for, point by point

1. **Language choice.** The reader picks which languages are shown: source only, source plus one gloss, or all three. Per-book and per-session, remembered on the device.
2. **Smart, dynamic layout.** The same JSON drives several layouts, the way the PDF pipeline already does: paired, interlinear block, interlinear run, and source-with-gloss. The app chooses a sensible default from the book's `mode` field and the screen width, and the reader can override it. Ruby is a first-class citizen, not an afterthought.
3. **Public-domain books only, JSON as the data, downloadable for speed.** Ship nothing that is not cleared. The book payloads are downloaded on demand and cached on the device, so reading is instant and offline.
4. **Request a book.** A reader can ask for a title. The app opens a prefilled GitHub issue on `bunko-books`; there is no queue of ours to run and no account to keep.
5. **A tutor beside you.** The companion explains a passage, draws the map of a history book, and shows who is who in a novel, always anchored to the page being read.
6. **Every public-domain classic, including the Chinese canon.**

## 3. Data

Updated 2026-09-23 after the owner's clarification: final translations are generated by Codex; listed translation reference files are not the final published text. Audit the original author and work. Do not hold a generated edition solely because its plan mentions a modern reference.

The read-only source collection includes assembled JSON, work previews and completed bilingual chunks in `../ZhJpBook`. The current registry, `docs/library-editions.json`, inventories 336 editions/plans and clears 150 complete editions. `docs/catalogue.md` explains each result. Unfinished and modern-original works remain outside the catalogue. 金瓶梅, 肉蒲團 and 素女經 remain excluded for the agreed age rating.

Only the separate public `bunko-books` repository holds downloadable book payloads and reviewed, text-free cover art. Every published bundle carries a `rights.json` declaration. `tools/publish_library.py` exports approved complete editions without modifying the source checkout; the public repository validates them and derives `reader-index.json`.

## 4. Architecture

```
../ZhJpBook assembled / previews / completed chunks   (read-only working copy)
        ↓  tools/publish_library.py   (registry gate, compaction, chapter split)
bunko-books, public JSON bundles and reviewed text-free cover art
        ↓  cdn.jsdelivr.net/gh/lachlanchen/bunko-books@main/...
app  →  IndexedDB  →  ruby renderer  →  companion
```

**GitHub is the backend; we run no server.** The owner's instruction of 2026-09-23 is that the app relies on the `bunko-books` repository and on itself. So: the reader payloads live in that public repo, the PWA is served from GitHub Pages, a book request opens a GitHub issue, and `bunko.lazying.art` is at most a later CNAME, never a dependency. `LinguaLeaf` is the PDF shelf and is not touched at all; its `docs/library/CANONICAL-LIBRARY.json` may be read for ids, titles and categories, because the slugs match.

The payload per cleared book, written by the builder:

- `books/<id>/meta.json` — titles and author with their readings, the language list, the mode, and a chapter table with each chapter's file, byte size and paragraph count, so the app can show a book before downloading a word of it.
- `books/<id>/cNNNNpNN-<hash>.json` — an immutable chapter or chapter part (legacy filenames remain supported). A reader downloads only what they open, which is what makes a 400 MB source book usable on a phone.
- `reader-index.json` — every published book with its languages, chapter count, total bytes and a checksum.

Tokens are compacted on the way out: `{"t":"道","r":"dào","g":"subject"}` becomes `["道","dào","s"]`, and a token with no reading and no role becomes the bare string. Measured on the Daodejing, the reader payload is **16%** of the assembled JSON, 5.2 MB down to 0.8 MB.

Files are committed as plain minified JSON rather than as `.gz`, deliberately. jsDelivr and raw.githubusercontent already serve text with gzip or brotli transfer encoding, so the bytes on the wire are compressed either way, and the browser decompresses natively. Committing `.gz` would compress twice and force a JavaScript gunzip path that older iOS WebViews do not have. The index carries `bytes` and a metadata `sha256` revision so the app refreshes changed editions. The publisher validates chapter checksums; the client uses HTTPS and caches the returned JSON. jsDelivr refuses files above 20 MB, which the per-chapter split keeps us well under.

- **Shell:** React + TypeScript + Vite PWA in Capacitor, copied from `../L-And-N` (its `tools/`, `store/` layout, i18n pattern, Android flavors, iOS project).
- **Rendering:** real `<ruby><rt>` markup so the platform handles line breaking; `ruby-position: over` for both furigana and pinyin; a CSS fallback for WebViews that break ruby.
- **Companion packs.** Per book, a precomputed JSON pack in the same repo: characters and their relationships, a timeline, places, a glossary, and one short note per chapter. The reader shows these with no network and no model. A live tutor on the owner's workstation may exist as an extra, but nothing in the shipping path may require that machine to be awake.
- **Offline is the default.** Once a book is downloaded it is readable with the network off, and the reader's place, notes and settings never leave the device.

## 5. Design

Updated 2026-09-23: text-free cover art, visible Light / Dark / System selection on the library, and automatic catalogue refresh when returning online or reopening the app. The web management page at `/Bunko/admin/` uploads prepared book folders as GitHub pull requests. Future books, corrections and covers publish without an app build once the reader supports those fields.

Updated 2026-09-26: Ordinary taps keep the reader on the page. Long-press selects a word using native selection handles; readers adjust a phrase or choose Sentence, then explicitly choose Dictionary. Only the selected base text becomes the query; ruby annotations and language labels are excluded. Selections spanning different language layers are not submitted. The reading desk shows definitions and aligned English, Chinese and Japanese passages where available. Dictionary lookups cache locally, and the query remains editable. Each passage has a stable discussion anchor. Readers can keep a private note on-device or open a public GitHub issue for that passage; existing issue comments appear in the reading desk. Posting and moderation use GitHub accounts and the `passage` label in `bunko-books`. Language labels use bold, high-contrast badges.

Updated 2026-09-26: A rightward swipe beginning at the left screen edge goes back. Sheets close before the reader navigates; Android's system Back follows the same order. Selection, sliders, multi-touch and vertical scrolling do not trigger swipe-back. The library title, theme selector and Settings share a row even at 320 pixels. Main text and ruby sizes are separate, persistent controls with a live preview; changing main text size does not change ruby size.

Updated 2026-09-25: Optional full dictionary packs download to the phone from `bunko-books/dictionaries/`. CC-CEDICT covers Chinese, JMdict covers Japanese, and Open English WordNet covers English. The packs are separately attributed and licensed; the app install does not bundle them. IndexedDB holds compressed, checksum-verified shards, and lookup runs locally once a pack is installed. Wiktionary remains the online fallback before installation.

Updated 2026-09-25: Mobile web visitors see a dismissible, localized store suggestion on the library and book pages. The iOS action opens the live App Store listing. The Android Play action stays hidden until its public listing resolves; visitors can keep reading on the web. The suggestion is absent in native apps, installed PWAs and the reading view, and dismissal is remembered for 30 days.

Paper-first: warm off-white page, one serif for the source text with a CJK face that has proper ruby metrics, generous line height, a reading progress line rather than a bar, and a quiet dark mode. The companion lives in a drawer that never covers the text it is explaining. Everything the reader does must survive going offline.

Updated 2026-09-26: Bunko detects app updates and offers an optional prompt on the library/book screens. Settings provides a manual check in all four UI languages. Web updates wait for an explicit reload, with reading and downloads protected; native apps open their store only for a newer verified public release. Test builds never cause downgrade prompts. The release feed lives on GitHub Pages; no new server is required. See `docs/app-updates.md`.

## 6. Milestones

1. Catalogue audit (`app/docs/catalogue.md`) and the bundle builder, with one book end to end.
2. PWA reader: layouts, ruby, language switch, offline download, progress.
3. Companion packs and the drawer.
4. Android and iOS shells, US$0.99 paid-up-front releases, store assets and listings in four languages.
5. TestFlight and Play internal, then the formal release for review on both stores.

## 7. Publishing

Reuse the L & N pipeline and its hard-won lessons, which are written up in `../L-And-N/store/publishing-runbook.md`, `../L-And-N/store/operator-handoff.md` and `../Company/playbooks/new-app-publication.md`: the CDP/noVNC store browser, the App Store Connect API helper, the Mac build host `echomind-kvm-macos`, `MARKETING_VERSION` must match the version you create, and preserve active reviews unless the owner explicitly requests replacing them with a newer tested build.

Updated 2026-09-26: After internal testing of 1.0.4 (6), the owner requested formal review. Earlier iOS, Mac and Play submissions were replaced so the stores review that build; this restarts review timing. Price and country availability remain unchanged.

## 2026-09-27 private document companion amendment

The owner requested PDF and Word upload, other useful document formats, a chat
composer and history, paper discovery/download, and high-quality flowing mobile
reading. This authorizes a private cloud document companion alongside the
existing optional discussion service. Initial formats are PDF, DOCX, Markdown,
Mathpix Markdown, UTF-8 text and TeX. PDF conversion preserves equations and
figures through Mathpix; DOCX/TeX use a restricted converter. Temporary originals
are removed after successful conversion. Users can remove documents and their
associated conversations. Nothing uploads automatically or becomes public.
The original document remains separate from AI answers. Shared-account
production enablement is still gated by the central owner's readiness contract.

The owner also requested a simpler, vibrant update to the existing icon. The
successor keeps 文 with its ぶん reading, with electric blue and coral accents.
Current build 8 reviews are preserved while the successor is developed/tested.

**2026-09-30 icon amendment:** The owner prefers the original indigo colors and
rounded cream border. Restore the original 文 / coral ぶん artwork as the active
source for subsequent builds. Explore a more vibrant background in a separate
preview while retaining the lettering and border; preview concepts are not a
store release. Existing uploaded binaries retain their embedded artwork.

## Apple platform expansion · 2026-09-28

The owner requested macOS and Apple Watch support with formal production review.
Bunko keeps its native AppKit Mac reader and adds an iPhone-paired SwiftUI Watch
companion. An explicit reader button transfers a bounded text excerpt from the
current paragraph, retaining selected languages. The latest three excerpts and
Watch reading positions persist offline. Figures/equations stay in the full
edition; no private companion documents or authentication tokens are transferred.
WatchOS11 minimum; iOS/watch marketing version and build must match. Real native
transport and offline QA plus signed archive validation precede review submission.

## Reviewer access amendment · 2026-09-30

The owner requested reviewer access without verification codes sent to their
inbox and explicitly required the test account to post comments. The 1.0.9
candidate adds visible, password-protected Demo account sign-in for invited
testers and store review. It uses a separate identity and private document
namespace, with clearly attributed real public posts through a repository-only
GitHub App. Demo data is shared among people holding those demo credentials;
the UI explains this before login and while signed in. This is separate from
public account registration and the still-unqualified shared-account adapter.
Keep approved releases available and prepare any resubmission against the
actual rejection. See store/reviewer-access.md.

**2026-09-30 final icon selection:** The owner approved the sky-blue/cyan 文 and
rounded border, salmon ぶん and mostly white background. Use this design for
all Bunko platform packages. Keep the original and every intermediate concept
for future reuse; the variant registry makes the source choice explicit.

## Watch reading amendment · 2026-09-30

The owner requested Chinese pinyin, Japanese furigana and sentence-level
multilingual interlacing on Apple Watch, with testing before replacing the iOS
review submission. Transfer the book’s aligned units and original ruby tokens,
show bold language labels, and retain independent text/ruby size controls. Keep
older excerpt caches readable and prompt re-sending to add ruby. Bound the same
WatchConnectivity shelf; figures/equations remain in the full reader. An already
qualified Mac review need not restart for a Watch-only change.

**2026-09-30 icon refinement approved:** Use the white-bottom-right variant:
subtle cyan toward the upper-left, clean white toward the bottom-right, and
stronger upper-left 文 strokes. Preserve the salmon ぶん and rounded border.
The owner approved applying, pushing and submitting this variant. Archive all
prior icon masters. Qualified build14 replaces the queued Apple and Google
updates after platform packaging and current review declarations are checked.

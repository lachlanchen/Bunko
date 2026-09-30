[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*A quiet library for classics in three languages, with readings above the text.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko is a reader for public-domain classics and rights-cleared original books. Choose the visible languages and layout, read pinyin or furigana above characters, and keep downloaded chapters available offline. The interface offers English, Simplified Chinese, Traditional Chinese and Japanese. The book catalogue lives in the separate [bunko-books](https://github.com/lachlanchen/bunko-books) repository; this app repository contains no book payloads.

<p align="center"><a href="store/assets/play-phone-01.png"><img src="store/assets/play-phone-01.png" alt="Bunko reader screenshot" width="300"></a></p>

## Inside the repository

| Path | Description |
| --- | --- |
| [`src/`](src/) | Reader, ruby layout, offline cache and theme controls |
| [`macos/`](macos/) | Native Mac window, menus, sandbox and Xcode project |
| [`docs/catalogue.md`](docs/catalogue.md) | Rights audit and publishing guide |
| [`store/`](store/) | Store status and operator handoff |

## Run the reader

Install dependencies, run checks, then open the Vite development server. iOS and Android packages use Capacitor; macOS uses AppKit and WebKit. Private signing material stays outside Git.

```sh
npm ci
npm run check
npm run dev
```

## Bunko for Mac

**1.0.8 (10) is now available on the [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac).** The Mac edition includes a resizable reading window, native menus, keyboard chapter navigation, offline books, and local dictionaries. It supports macOS 12 or later with a universal Intel/Apple silicon binary. Build and test instructions are in [docs/macos.md](docs/macos.md); the public release record is in [store/macos/submission.md](store/macos/submission.md).

## Library and release

The live catalogue has 183 cleared editions: 150 classics and 33 owner editions. New book bundles publish through GitHub without an app build; changes to reader code still need a new web or native release. Platform availability and update reviews are tracked in the release record below.

[store/release.yaml](store/release.yaml)

## Reading controls

Long-press a word, adjust the native selection handles, then choose **Dictionary**. **Sentence** expands the selection; ordinary taps leave the page open. Swipe right from the left edge to go back. Settings includes independent main-text and ruby size controls, with a live preview. Theme and Settings fit beside the library title on narrow phones. See the [reading controls guide](docs/reading-controls.md).

## Support Bunko

Bunko is a LazyingArt project. If it helps your reading or research, you can support its ongoing work:

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Citation

If you use Bunko in research, cite this repository. GitHub reads [CITATION.cff](CITATION.cff) and provides a “Cite this repository” panel.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## Scope and feedback

Study renderings and companion notes can be AI-assisted and may contain errors. The catalogue publishes only audited, complete editions; public-domain rules vary by territory. Report reader bugs in [Bunko issues](https://github.com/lachlanchen/Bunko/issues), or book and rights problems in [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues).
## Read Bunko

The library now includes 150 public-domain classics and 33 rights-cleared owner editions: 19 physics companion books (including all nine supplementary courses), two learning books, nine finance books, and three multilingual travel guides. Each book may offer one or several languages. Equations and figures are kept in the mobile reader.

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play · publication pending](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## App updates

Bunko checks for updates automatically and offers a dismissible prompt when a public release is available. Settings includes a manual check. Web updates wait until you choose to reload; native apps open their store. Reading, downloads and saved data are preserved. See the [update guide](docs/app-updates.md).

## Conversations in Bunko

Read and compose public passage comments inside Bunko, using GitHub sign-in. Drafts and private notes stay on your device until you explicitly post. A small cloud service handles authorization without requiring the owner’s computer; GitHub stores the public conversation. The interface supports English, Simplified Chinese, Traditional Chinese and Japanese. Version 1.0.6 (8) adds persistent login with secure device storage and automatic token refresh, plus recovery from brief connection failures. iOS **1.0.8 (10)**, including Apple Watch, is publicly available as of 29 September 2026. Mac **1.0.8 (10)** is also publicly available as of 30 September 2026 (Hong Kong time). Android 1.0.6 (8) remains available in Google Play internal testing; see the release records for its production status.

[Discussion implementation and verification](docs/github-discussions-2026-09-26.md).

## Mac and Apple Watch

Version **1.0.8 (10)** adds a native Apple Watch companion and updates the Mac app. From the iPhone reader, send a multilingual text excerpt to your paired watch. The latest three excerpts stay available offline, with passage navigation and adjustable text size. Figures and equations remain in the full phone and Mac reader.

The refreshed icon and private document companion support PDF, Word (.docx), Markdown, text and TeX, paper search and document questions. Ten native reader checks passed on an M5 Pro Mac mini, including offline reopening, reading position, equations and figures. The Watch simulator passed real iPhone transfer and disconnected restart; a physical Watch has not been tested.

[macOS](docs/macos.md) · [watchOS](docs/watchos.md) · [1.0.8](store/artifacts/release-1.0.8.json)

## Reviewer access candidate

The 1.0.9 (11) candidate adds a clearly labelled Demo account for invited testers and store reviewers. Its separate password needs no email code. Real public comments and replies carry a demo attribution; demo documents and conversations are shared only among users of that account. Fresh-browser posting, document reading and chat persistence were verified. Approved Apple 1.0.8 (10) remains available; any resubmission will follow the actual rejection.

[Reviewer access and verification](store/reviewer-access.md)

**2026-09-30 · Bunko** — The approved sky-blue and salmon icon is live on the web. Version **1.0.9 (12)** is available in TestFlight (iPhone/iPad, Watch companion and Mac) and Google Play internal testing. Both Apple production updates are waiting for review, with automatic release after approval. The Google production update and listing icon are staged; the existing review is preserved. All earlier icon designs remain archived.

**Watch update — 1.0.9 (13):** Chinese pinyin and Japanese furigana now accompany sentence-aligned multilingual excerpts, with separate text/ruby sizes. Available in TestFlight; the iOS/Watch update is submitted for automatic release after Apple approval. Re-send older excerpts from the updated iPhone app. Verified with a real paired-simulator transfer and offline cold launch; physical Watch testing is not claimed. Mac and Android remain on build 12 for internal testing.

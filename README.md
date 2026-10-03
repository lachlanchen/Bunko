[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*A quiet multilingual library, with readings above the text.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko is a reader for public-domain classics and rights-cleared original books. Choose the visible languages and layout, read pinyin or furigana above characters, and keep downloaded chapters available offline. The interface offers English, Simplified Chinese, Traditional Chinese and Japanese. The book catalogue lives in the separate [bunko-books](https://github.com/lachlanchen/bunko-books) repository; this app repository contains no book payloads.

Books may contain any number of language layers using standard language tags, including Arabic and other right-to-left scripts. Select the languages you want; matching passages stay together. Book languages and interface translations are independent.

<p align="center"><a href="store/assets/play-phone-01.png"><img src="store/assets/play-phone-01.png" alt="Bunko reader screenshot" width="300"></a></p>

## Current status · 3 October 2026

Android 1.0.10 (17) has been sent to Google for review after fixing the rejected privacy-policy URL. It adds a direct Settings privacy link and resilient book downloads. Android and iOS/Watch 1.0.9 (14) are public; Mac 1.0.8 (10) is public. Apple iOS/Watch and Mac 1.0.10 (16) remain waiting for review. Reviewers use the separate Bunko Demo account without GitHub email codes.

Optional cloud plans for PDF conversion and AI replies are being prepared at US$2.99 / $14.99 / $29.99 monthly. The plans page is available with purchases disabled. Books, dictionaries and offline reading remain included. Book downloads use GitHub first, then the public CDN, then our bounded cache as a final fallback.

[Submission receipt](store/artifacts/android-1.0.10-17-20261003.json) · [Cloud plans](docs/cloud-subscriptions.md)

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

The live catalogue has 185 cleared editions, covering classics, translated editions and owner books. New book bundles publish through GitHub without an app build; changes to reader code still need a new web or native release. Platform availability and update reviews are tracked in the release record below.

[store/release.yaml](store/release.yaml)

## Reading controls

Long-press a word, adjust the native selection handles, then choose **Dictionary**. **Sentence** expands the selection; ordinary taps leave the page open. Swipe right across the page to go back; the left-edge gesture also works. Settings includes independent main-text and ruby size controls, with a live preview. Theme and Settings fit beside the library title on narrow phones. See the [reading controls guide](docs/reading-controls.md).

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

The library contains 185 cleared editions, including classics, physics companion notes, learning and finance books, and multilingual travel guides. Books may offer one or several languages; equations and figures remain readable on mobile.


Web and installed PWA readers offer optional, device-aware store links. You can keep reading here; store buttons are enabled only after public availability is verified.

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## App updates

Bunko checks for updates automatically and offers a dismissible prompt when a public release is available. Settings includes a manual check. Web updates wait until you choose to reload; native apps open their store. Reading, downloads and saved data are preserved. See the [update guide](docs/app-updates.md).

## Conversations in Bunko

Read and compose public passage comments inside Bunko, using GitHub sign-in. Drafts and private notes stay on your device until you explicitly post. A small cloud service handles authorization without requiring the owner’s computer; GitHub stores the public conversation. The interface supports English, Simplified Chinese, Traditional Chinese and Japanese. Version 1.0.6 (8) adds persistent login with secure device storage and automatic token refresh, plus recovery from brief connection failures. iOS **1.0.8 (10)**, including Apple Watch, is publicly available as of 29 September 2026. Mac **1.0.8 (10)** is also publicly available as of 30 September 2026 (Hong Kong time). Android 1.0.9 (14) remains available in Google Play internal testing; see the release records for its production status.

[Discussion implementation and verification](docs/github-discussions-2026-09-26.md).

## Mac and Apple Watch

Version **1.0.8 (10)** adds a native Apple Watch companion and updates the Mac app. From the iPhone reader, send a multilingual text excerpt to your paired watch. The latest three excerpts stay available offline, with passage navigation and adjustable text size. Figures and equations remain in the full phone and Mac reader.

The refreshed icon and private document companion support PDF, Word (.docx), Markdown, text and TeX, paper search and document questions. Ten native reader checks passed on an M5 Pro Mac mini, including offline reopening, reading position, equations and figures. The Watch simulator passed real iPhone transfer and disconnected restart; a physical Watch has not been tested.

[macOS](docs/macos.md) · [watchOS](docs/watchos.md) · [1.0.8](store/artifacts/release-1.0.8.json)

## Testing and review

**2026-09-30 · 1.0.9 (14)** uses the approved icon with more white at the bottom-right and clearer blue upper-left strokes of 文. Earlier designs remain archived. The web icon is live; build 14 is available in TestFlight for iPhone/iPad, the Watch companion and Mac, and in Google Play internal testing.

Build 14 has been submitted to Apple and Google for automatic release after approval. Approval is pending; Apple 1.0.8 (10) remains the public release. Google’s reviewer instructions now use Bunko’s separate demo account, with real comments and document conversations and no owner email code. Document-companion privacy declarations were updated.

Watch excerpts retain Chinese pinyin, Japanese furigana and sentence-level language alignment, with separate text/ruby sizes. Re-send older excerpts from the updated iPhone app. The paired-simulator transfer and offline restart checks from build 13 still apply to this icon-only update; no physical Watch test is claimed. All 58 client and 35 server tests passed.

[Release receipt](store/artifacts/icon-release-1.0.9-14.json) · [Reviewer access](store/reviewer-access.md) · [Watch QA](evidence/watch-ruby-20260930/qa.json)

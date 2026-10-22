[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*Read across languages. Stay close to the book.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko brings public-domain classics and rights-cleared original books to one multilingual shelf. Read aligned passages, see pinyin and furigana above the text, and keep downloaded books with you offline. Literature, travel, learning and technical editions share the same reader, including figures and equations.

## Read your way

- Choose one language or interlace several, sentence by sentence. Selection order sets the main language; translations keep clear labels.
- Adjust text and ruby sizes independently. Use light, dark or system appearance, and long-press a word for the dictionary.
- Download books and optional English, Chinese and Japanese dictionary packs. Reopen them offline at your saved position.
- Read on iPhone, iPad, Android, the web and Mac. Send multilingual excerpts with ruby to a paired Apple Watch.
- Books can contain any number of languages, including right-to-left scripts. The interface supports English, Simplified Chinese, Traditional Chinese and Japanese.

## Preview: a companion beside the book

The next test update builds on automatic book context, compact @ references to books, chapters and passages, and links back to the exact text. Explore character relationships as graphs or trees, place names on an offline geographic map, and events on a dated timeline. Each guide keeps its supporting passages accessible. Book conversations follow you across chapters, and saved guides can be reopened from a compact picker. Whole-book questions can draw on broader book knowledge, clearly labelled separately from verified passages.

Chapter titles stay on one line and expand when needed. Sort the library by recently read, newest added, title or author; the app remembers your choice on each device.

**Test preview, not a public-release announcement.** Guides cover selected or sampled excerpts and may be incomplete. Uncertain places and dates remain explicit. The images below are actual component captures; the map and timeline use a labelled demonstration journey. [Preview details](docs/reading-guides-preview.md).

<p>
<a href="docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — test preview" width="190"></a>
<a href="docs/images/reading-guides-20261021/phone-map.png"><img src="docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="docs/images/reading-guides-20261021/phone-timeline.png"><img src="docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## Run and build

Use Node.js 22. Install both dependency sets, run the checks, then start the reader. The app uses React/TypeScript, Capacitor on iOS and Android, and AppKit/WebKit on Mac. Signing credentials stay outside Git.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

Prepare the bundled web assets for native packages:

```sh
npm run build:native
npm run build:macos
```

## Inside the repository

| Path | Contents |
| --- | --- |
| [src/](src/) | Reader, language layout, local cache and companion UI |
| [server/](server/) | Account, discussion and optional companion services |
| [ios/ · android/ · macos/](ios/) | Platform projects and Apple Watch companion |
| [docs/](docs/) | Reader controls, book publishing and platform guides |


## Books, discussions and privacy

Book bundles and their rights records live in [bunko-books](https://github.com/lachlanchen/bunko-books), separately from app code. New compatible editions can arrive without an app update. GitHub is the primary download source, with CDN and owned-cache fallbacks. Public passage discussions use GitHub sign-in; private notes, unpublished drafts and personal companion conversations are not public comments. Ordinary downloaded reading does not require a subscription. Generated study material can contain errors; check the cited text. See the stores for current public versions and regional availability.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Support Bunko

Bunko is a LazyingArt project. Voluntary support helps maintain the reader and its open library tools.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Citation

If you use Bunko in research, cite this repository. GitHub reads [CITATION.cff](CITATION.cff) to provide its citation panel.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

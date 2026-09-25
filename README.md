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
| [`docs/catalogue.md`](docs/catalogue.md) | Rights audit and publishing guide |
| [`store/`](store/) | Store status and operator handoff |

## Run the reader

Install dependencies, run checks, then open the Vite development server. Native packages use Capacitor and private signing material outside Git.

```sh
npm ci
npm run check
npm run dev
```

## Library and release

The live catalogue has 183 cleared editions: 150 classics and 33 owner editions. New book bundles publish through GitHub without an app build; changes to reader code still need a new web or native release. Platform availability and update reviews are tracked in the release record below.

[store/release.yaml](store/release.yaml)

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

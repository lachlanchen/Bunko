[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Une bibliothèque paisible de classiques en trois langues, avec les lectures au-dessus du texte.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko est un lecteur de classiques du domaine public en chinois, japonais et anglais. Choisissez les langues et la mise en page, lisez le pinyin ou les furigana au-dessus des caractères et gardez les chapitres téléchargés hors ligne. L’interface existe en anglais, chinois simplifié, chinois traditionnel et japonais. Le catalogue se trouve dans [bunko-books](https://github.com/lachlanchen/bunko-books) ; ce dépôt ne contient pas les textes des livres.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Capture du lecteur Bunko" width="300"></a></p>

## Dans ce dépôt

| Chemin | Description |
| --- | --- |
| [`src/`](../src/) | Lecteur, mise en page ruby, cache hors ligne et thèmes |
| [`docs/catalogue.md`](../docs/catalogue.md) | Audit des droits et guide de publication |
| [`store/`](../store/) | État des boutiques et passation |

## Lancer le lecteur

Installez les dépendances, lancez les vérifications, puis ouvrez le serveur de développement Vite. Les versions natives utilisent Capacitor et des clés de signature privées hors de Git.

```sh
npm ci
npm run check
npm run dev
```

## Bibliothèque et versions

Le catalogue public compte 183 éditions autorisées. Les nouveaux livres sont publiés via GitHub sans reconstruire l’application ; les changements du lecteur demandent une nouvelle version web ou native. Le dossier ci-dessous indique la disponibilité et les examens des mises à jour selon la plateforme.

[store/release.yaml](../store/release.yaml)

## Soutenir Bunko

Bunko est un projet LazyingArt. Si cet outil aide votre lecture ou votre recherche, vous pouvez soutenir son développement :

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Citation

Si vous utilisez Bunko dans une recherche, citez ce dépôt. GitHub lit [CITATION.cff](../CITATION.cff) et affiche un panneau de citation.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## Portée et retours

Les rendus d’étude produits par IA peuvent comporter des erreurs. Seules les éditions complètes et auditées sont publiées ; le domaine public varie selon les territoires. Signalez les bugs du lecteur dans [Bunko issues](https://github.com/lachlanchen/Bunko/issues) et les problèmes de livres ou de droits dans [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues).
## Lire dans Bunko

La bibliothèque réunit 150 classiques du domaine public et 33 éditions autorisées par leur auteur : notes de physique, guide d’apprentissage, livres de finance et trois guides de voyage multilingues. Chaque livre peut proposer une ou plusieurs langues ; les équations et figures restent lisibles sur mobile.

[App Store d’Apple](https://apps.apple.com/app/id6815137919) · [Google Play · publication en attente](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko pour Mac

La version 1.0.2 (4) a été soumise à la validation du Mac App Store et est disponible dans TestFlight interne. Elle propose des menus natifs, des raccourcis clavier et la lecture hors ligne sur macOS 12 ou ultérieur. Le binaire prend en charge Intel et Apple silicon ; les tests ont été effectués sur des Mac Intel.

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

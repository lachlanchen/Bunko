[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Eine ruhige Bibliothek für Klassiker in drei Sprachen, mit Lesungen über dem Text.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko ist ein Reader für gemeinfreie Klassiker auf Chinesisch, Japanisch und Englisch. Wähle sichtbare Sprachen und Layout, lies Pinyin oder Furigana über den Zeichen und öffne heruntergeladene Kapitel offline. Die Oberfläche gibt es auf Englisch, vereinfachtem und traditionellem Chinesisch sowie Japanisch. Der Katalog liegt im separaten Repository [bunko-books](https://github.com/lachlanchen/bunko-books); dieser App-Code enthält keine Buchtexte.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko-Reader-Bildschirm" width="300"></a></p>

## In diesem Repository

| Pfad | Beschreibung |
| --- | --- |
| [`src/`](../src/) | Reader, Ruby-Layout, Offline-Cache und Themen |
| [`docs/catalogue.md`](../docs/catalogue.md) | Rechteprüfung und Veröffentlichungsleitfaden |
| [`store/`](../store/) | Store-Status und Betriebsübergabe |

## Reader starten

Installiere Abhängigkeiten, führe die Prüfungen aus und starte den Vite-Entwicklungsserver. Native Pakete verwenden Capacitor und private Signaturdaten außerhalb von Git.

```sh
npm ci
npm run check
npm run dev
```

## Bibliothek und Releases

Der öffentliche Katalog umfasst 150 geprüfte Ausgaben. Neue Bücher erscheinen über GitHub ohne neuen App-Build; Änderungen am Reader-Code brauchen dagegen ein neues Web- oder natives Release. Das folgende Release-Protokoll zeigt Verfügbarkeit und Update-Prüfungen je Plattform.

[store/release.yaml](../store/release.yaml)

## Bunko unterstützen

Bunko ist ein LazyingArt-Projekt. Wenn es dir beim Lesen oder Forschen hilft, kannst du die weitere Arbeit unterstützen:

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Zitieren

Wenn du Bunko für Forschung nutzt, zitiere dieses Repository. GitHub liest [CITATION.cff](../CITATION.cff) und zeigt eine Zitierfunktion an.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## Umfang und Rückmeldung

KI-erzeugte Lernfassungen können Fehler enthalten. Der Katalog veröffentlicht nur geprüfte, vollständige Ausgaben; Gemeinfreiheit hängt vom Gebiet ab. Reader-Fehler bitte bei [Bunko issues](https://github.com/lachlanchen/Bunko/issues), Buch- und Rechteprobleme bei [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues) melden.

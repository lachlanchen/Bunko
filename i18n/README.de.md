[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*Über Sprachgrenzen hinweg lesen. Nah am Buch bleiben.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko vereint gemeinfreie Klassiker und zur Verbreitung freigegebene Originalwerke in einer mehrsprachigen Bibliothek. Lies aufeinander abgestimmte Passagen, nutze Pinyin und Furigana über dem Text und behalte heruntergeladene Bücher auch offline. Literatur, Reisen, Lernen und Fachbücher teilen sich einen Reader, der Abbildungen und Formeln erhält.

## Lesen, wie es zu dir passt

- Wähle eine Sprache oder wechsle Satz für Satz zwischen mehreren. Die Auswahlreihenfolge bestimmt die Hauptsprache; Übersetzungen behalten eindeutige Sprachlabels.
- Stelle Text und Ruby-Lesehilfen getrennt ein. Nutze ein helles, dunkles oder systemgesteuertes Design und halte ein Wort gedrückt, um das Wörterbuch zu öffnen.
- Lade Bücher und optionale englische, chinesische und japanische Wörterbuchpakete herunter. Öffne sie offline an deiner gespeicherten Lesestelle.
- Lies auf iPhone, iPad, Android, im Web und auf dem Mac. Sende mehrsprachige Auszüge mit Ruby an eine gekoppelte Apple Watch.
- Bücher können beliebig viele Sprachen enthalten, auch Schriften von rechts nach links. Die Oberfläche unterstützt Englisch, vereinfachtes und traditionelles Chinesisch sowie Japanisch.

## Ein Begleiter beim Lesen

Der Lesebegleiter verbindet den automatisch übernommenen Buchkontext, kompakte @-Verweise auf Bücher, Kapitel und Passagen sowie die Rückkehr zur genauen Textstelle. Erkunde Figurenbeziehungen als Graph oder Baum, Orte auf einer geografischen Offlinekarte und Ereignisse auf einer datierten Zeitleiste. Die belegenden Passagen bleiben in jedem Leseführer erreichbar.

**Verfügbar in iOS und Android 1.0.14 (37). Mac40 wird noch geprüft; die öffentliche Mac-Version ist 1.0.13 (23). Der Webreader wird separat aktualisiert.** Die Leseführer behandeln ausgewählte oder stichprobenartig erfasste Auszüge und können unvollständig sein. Unsichere Orte und Daten werden gekennzeichnet. Die Bilder zeigen echte Komponenten; Karte und Zeitleiste verwenden eine ausdrücklich gekennzeichnete Beispielreise. [Details zur Vorschau](../docs/reading-guides-preview.md).

**Historische Karten im internen Test:** farbige Provinzflächen, benannte Stadtmarkierungen und Folgefragen, die eine gespeicherte Karte erweitern. Die Ebene der Östlichen Han nennt Bezugsjahr und Quellen. [Kartendetails und Vorschau](../docs/reading-tools-and-historical-maps.md).

**Lesegespräche fortsetzen · interner Testbuild 43:** Setzen Sie das Gespräch nahe Ihrer Leseposition fort oder wählen Sie einen früheren Zweig. Ergänzen Sie gespeicherte Beziehungsgraphen, Karten und Zeitleisten; frühere Versionen bleiben erhalten. Größere Graphen lassen sich nach Gruppen filtern. [Details](../docs/reading-workspace-20261026.md).

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — component example" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## Starten und bauen

Verwende Node.js 22. Installiere beide Abhängigkeitssätze, führe die Prüfungen aus und starte den Reader. Die App nutzt React/TypeScript, Capacitor auf iOS und Android sowie AppKit/WebKit auf dem Mac. Signaturzugangsdaten bleiben außerhalb von Git.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

Bereite die eingebetteten Webressourcen für native Pakete vor:

```sh
npm run build:native
npm run build:macos
```

## Im Repository

| Pfad | Inhalt |
| --- | --- |
| [src/](../src/) | Reader, Sprachanordnung, lokaler Cache und Begleiter-Oberfläche |
| [server/](../server/) | Konto-, Diskussions- und optionale Begleiterdienste |
| [ios/ · android/ · macos/](../ios/) | Plattformprojekte und Apple-Watch-Begleiter |
| [docs/](../docs/) | Anleitungen für Lesen, Buchveröffentlichung und Plattformen |


## Bücher, Diskussionen und Datenschutz

Buchpakete und Rechtebelege liegen in [bunko-books](https://github.com/lachlanchen/bunko-books), getrennt vom App-Code. Neue kompatible Ausgaben können ohne App-Update hinzukommen. GitHub ist die primäre Downloadquelle; CDN und eigener Cache dienen als Ausweichwege. Öffentliche Passagendiskussionen nutzen die GitHub-Anmeldung. Private Notizen, unveröffentlichte Entwürfe und persönliche Begleitergespräche sind keine öffentlichen Kommentare. Das Lesen heruntergeladener Bücher benötigt kein Abonnement. Generiertes Lernmaterial kann Fehler enthalten; prüfe den zitierten Text. Aktuelle öffentliche Versionen und regionale Verfügbarkeit stehen in den Stores.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Bunko unterstützen

Bunko ist ein LazyingArt-Projekt. Freiwillige Unterstützung hilft, den Reader und seine offenen Bibliothekswerkzeuge zu pflegen.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Zitieren

Wenn du Bunko in der Forschung nutzt, zitiere dieses Repository. GitHub liest [CITATION.cff](../CITATION.cff) für sein Zitierfeld.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

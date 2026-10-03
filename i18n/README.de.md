[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Eine ruhige mehrsprachige Bibliothek mit Lesehilfen über dem Text.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko ist ein Reader für gemeinfreie Klassiker auf Chinesisch, Japanisch und Englisch. Wähle sichtbare Sprachen und Layout, lies Pinyin oder Furigana über den Zeichen und öffne heruntergeladene Kapitel offline. Die Oberfläche gibt es auf Englisch, vereinfachtem und traditionellem Chinesisch sowie Japanisch. Der Katalog liegt im separaten Repository [bunko-books](https://github.com/lachlanchen/bunko-books); dieser App-Code enthält keine Buchtexte.

Bücher können beliebig viele Sprachebenen mit standardisierten Sprachkennungen enthalten, einschließlich Arabisch und anderer Schriften von rechts nach links. Wähle die gewünschten Sprachen; entsprechende Textstellen bleiben zusammen. Buchsprachen und Übersetzungen der Oberfläche sind unabhängig voneinander.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko-Reader-Bildschirm" width="300"></a></p>

## Aktueller Stand · 4. Oktober 2026

iOS/Watch 1.0.10 (16) ist mit dem freigegebenen Symbol und Korrekturen für mehrsprachiges Lesen veröffentlicht. Mac 1.0.10 (16) wird noch geprüft und nach Freigabe automatisch veröffentlicht; öffentlich bleibt Mac 1.0.8 (10). Android 1.0.10 (17) ist nach der Datenschutzkorrektur in 172 Ländern verfügbar, mit Datenschutzlink in den Einstellungen und zuverlässigeren Buchdownloads. Prüfer verwenden das separate Bunko-Demokonto ohne GitHub-E-Mail-Code; Google hat die präzisierten Anmeldehinweise akzeptiert.

Optionale Cloud-Tarife für PDF-Konvertierung und KI-Antworten sind für monatlich 2,99 / 14,99 / 29,99 US-Dollar geplant. Die Tarifseite ist verfügbar, Käufe sind deaktiviert. Bücher, Wörterbücher und Offline-Lesen bleiben im App-Kauf enthalten. Downloads versuchen zuerst GitHub, dann das öffentliche CDN und zuletzt unseren begrenzten Cache.

[Veröffentlichungsnachweis](../store/artifacts/distribution-apple-20261004.json) · [Cloud-Tarife](../docs/cloud-subscriptions.md)

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

Der öffentliche Katalog umfasst 185 geprüfte Ausgaben. Neue Bücher erscheinen über GitHub ohne neuen App-Build; Änderungen am Reader-Code brauchen dagegen ein neues Web- oder natives Release. Das folgende Release-Protokoll zeigt Verfügbarkeit und Update-Prüfungen je Plattform.

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
## Bunko lesen

Die Bibliothek enthält 185 freigegebene Ausgaben: Klassiker, Physik-Begleittexte, Lern- und Finanzbücher sowie mehrsprachige Reiseführer. Bücher können eine oder mehrere Sprachen haben; Formeln und Abbildungen bleiben im mobilen Reader erhalten.


Web und installierte PWA bieten optionale, zum Gerät passende Store-Links. Hier weiterlesen bleibt möglich; Store-Schaltflächen werden erst nach bestätigter öffentlicher Verfügbarkeit aktiviert.

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko für Mac

Version 1.0.8 (10) ist im Mac App Store verfügbar. Sie unterstützt macOS 12 oder neuer mit nativen Menüs, Tastaturkürzeln und Offline-Lesen. Die Universaldatei unterstützt Intel und Apple silicon; Laufzeittests wurden auf beiden Mac-Typen durchgeführt. [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## App-Updates

Bunko sucht automatisch nach Updates und zeigt einen aufschiebbaren Hinweis, sobald eine neue öffentliche Version verfügbar ist. In den Einstellungen lässt sich die Suche auch manuell starten. Die Webversion lädt erst auf Wunsch neu; native Apps öffnen ihren Store. Lesestand, Downloads und gespeicherte Daten bleiben erhalten. Siehe die [Update-Anleitung](../docs/app-updates.md).

## Lesesteuerung

Ein Wort lange drücken, die Auswahlgriffe anpassen und dann Wörterbuch wählen. Satz erweitert die Auswahl auf den ganzen Satz; normales Tippen lässt die Seite offen. Auf der Seite nach rechts wischen führt zurück; die Geste funktioniert auch vom linken Rand aus. In den Einstellungen lassen sich Text und Ruby-Lesungen unabhängig mit Vorschau vergrößern. Thema und Einstellungen passen auch auf schmalen Handys neben den Bibliothekstitel.

[docs/reading-controls.md](../docs/reading-controls.md)

## Gespräche in Bunko

Mit der GitHub-Anmeldung kannst du öffentliche Kommentare zu Textstellen direkt in Bunko lesen und verfassen. Entwürfe und private Notizen bleiben auf deinem Gerät, bis du sie ausdrücklich veröffentlichst. Ein kleiner Cloud-Dienst übernimmt die Autorisierung, ohne dass der Computer des Betreibers eingeschaltet sein muss; GitHub speichert das öffentliche Gespräch. Die Oberfläche unterstützt Englisch, vereinfachtes und traditionelles Chinesisch sowie Japanisch. Version 1.0.6 (8) hält die Anmeldung durch sicheren Gerätespeicher und automatische Token-Erneuerung aufrecht und erholt sich von kurzen Verbindungsstörungen. iOS **1.0.8 (10)** einschließlich Apple Watch ist seit dem 29. September 2026 öffentlich verfügbar. Mac **1.0.8 (10)** ist ebenfalls seit dem 30. September 2026 (Hongkonger Zeit) öffentlich verfügbar. Android 1.0.9 (14) bleibt im internen Google-Play-Test verfügbar; der Produktionsstatus steht in den Release-Protokollen.

[Umsetzung und Prüfung der Diskussionsfunktion](../docs/github-discussions-2026-09-26.md).

## Mac und Apple Watch

Version **1.0.8 (10)** ergänzt eine native Apple-Watch-Begleitapp und aktualisiert die Mac-App. Im iPhone-Leser lassen sich mehrsprachige Textauszüge an die gekoppelte Uhr senden. Die letzten drei Auszüge bleiben offline verfügbar; Absatznavigation und Schriftgröße sind einstellbar. Abbildungen und Formeln bleiben im vollständigen Leser auf Telefon und Mac.

Das neue Symbol und der private Dokumentassistent unterstützen PDF, Word (.docx), Markdown, Text und TeX, Artikelsuche und Fragen zu Dokumenten. Zehn native Prüfungen bestanden auf einem M5-Pro-Mac-mini, darunter Offline-Wiederöffnung, Leseposition, Formeln und Abbildungen. Im Watch-Simulator wurden eine echte Übertragung aus der iPhone-App und ein Neustart ohne Verbindung geprüft. Eine physische Watch wurde noch nicht getestet.

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## Testverlauf · 30. September 2026

**2026-09-30 · 1.0.9 (14)** verwendet das freigegebene Symbol mit mehr Weiß unten rechts und deutlicheren blauen Strichen oben links im Zeichen 文. Frühere Entwürfe bleiben archiviert. Das Websymbol ist veröffentlicht; Build 14 ist in TestFlight für iPhone/iPad, die Watch-Begleitapp und Mac sowie im internen Google-Play-Test verfügbar.

Build 14 wurde bei Apple und Google zur automatischen Veröffentlichung nach Freigabe eingereicht. Die Freigabe steht noch aus; Apple 1.0.8 (10) bleibt die öffentliche Version. Googles Prüfanleitung verwendet jetzt das separate Bunko-Demokonto mit echten Kommentaren und Dokumentgesprächen, ohne E-Mail-Code des Eigentümers. Die Datenschutzerklärungen für den Dokumentassistenten wurden aktualisiert.

Watch-Auszüge behalten chinesisches Pinyin, japanisches Furigana und die satzweise Sprachanordnung mit getrennten Größen für Text und Lesungen. Ältere Auszüge bitte aus der aktualisierten iPhone-App erneut senden. Die Prüfungen der Übertragung zwischen gekoppelten Simulatoren und des Offline-Neustarts aus Build 13 gelten für dieses reine Symbolupdate weiter; eine physische Watch wurde nicht getestet. Alle 58 Client- und 35 Servertests bestanden.

[Release-Nachweis](../store/artifacts/icon-release-1.0.9-14.json) · [Prüfzugang](../store/reviewer-access.md) · [Watch-Prüfung](../evidence/watch-ruby-20260930/qa.json)

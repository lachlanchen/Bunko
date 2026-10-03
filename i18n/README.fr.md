[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Une bibliothèque multilingue paisible, avec des aides à la lecture au-dessus du texte.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko est un lecteur de classiques du domaine public en chinois, japonais et anglais. Choisissez les langues et la mise en page, lisez le pinyin ou les furigana au-dessus des caractères et gardez les chapitres téléchargés hors ligne. L’interface existe en anglais, chinois simplifié, chinois traditionnel et japonais. Le catalogue se trouve dans [bunko-books](https://github.com/lachlanchen/bunko-books) ; ce dépôt ne contient pas les textes des livres.

Les livres peuvent contenir autant de langues que nécessaire, identifiées par des balises standard, dont l’arabe et les écritures de droite à gauche. Choisissez les langues à afficher ; les passages correspondants restent ensemble. Les langues des livres sont indépendantes des traductions de l’interface.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Capture du lecteur Bunko" width="300"></a></p>

## État actuel · 4 octobre 2026

iOS/Watch 1.0.10 (16) est publié avec l’icône approuvée et les corrections de lecture multilingue. Mac 1.0.10 (16) est encore en cours d’examen et sera publié automatiquement après approbation ; la version Mac publique reste 1.0.8 (10). Android 1.0.10 (17) est disponible dans 172 pays après la correction de confidentialité, avec un lien dans les réglages et des téléchargements de livres plus fiables. Les examinateurs utilisent le compte de démonstration Bunko distinct, sans code GitHub par e-mail ; Google a accepté les instructions de connexion clarifiées.

Des offres cloud facultatives pour la conversion PDF et les réponses IA sont prévues à 2,99 / 14,99 / 29,99 USD par mois. La page des offres est disponible, mais les achats sont désactivés. Livres, dictionnaires et lecture hors ligne restent inclus dans l’achat de l’application. Les téléchargements essaient GitHub, puis le CDN public et, en dernier recours, notre cache à capacité limitée.

[Preuve de publication](../store/artifacts/distribution-apple-20261004.json) · [Offres cloud](../docs/cloud-subscriptions.md)

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

Le catalogue public compte 185 éditions autorisées. Les nouveaux livres sont publiés via GitHub sans reconstruire l’application ; les changements du lecteur demandent une nouvelle version web ou native. Le dossier ci-dessous indique la disponibilité et les examens des mises à jour selon la plateforme.

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

La bibliothèque réunit 185 éditions autorisées : classiques, notes de physique, livres de formation et de finance, et guides de voyage multilingues. Les livres proposent une ou plusieurs langues ; les équations et illustrations restent lisibles sur mobile.


Le site et la PWA installée proposent des liens facultatifs vers les boutiques adaptées à votre appareil. Vous pouvez continuer à lire ici ; les boutons sont activés après vérification de la disponibilité publique.

[App Store d’Apple](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko pour Mac

La version 1.0.8 (10) est disponible sur le Mac App Store. Elle propose des menus natifs, des raccourcis clavier et la lecture hors ligne sur macOS 12 ou ultérieur. Le binaire universel prend en charge Intel et Apple silicon, avec des tests d’exécution sur les deux types de Mac. [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## Mises à jour de l’application

Bunko recherche automatiquement les mises à jour et propose une notification que vous pouvez reporter lorsqu’une version publique est disponible. Une vérification manuelle est aussi possible dans les réglages. La version web attend votre accord pour se recharger ; les applications natives ouvrent leur boutique. La lecture, les téléchargements et les données enregistrées sont préservés. Consultez le [guide des mises à jour](../docs/app-updates.md).

## Commandes de lecture

Appuyez longuement sur un mot, ajustez les poignées de sélection, puis choisissez Dictionnaire. Phrase étend la sélection ; un appui ordinaire laisse la page ouverte. Glissez vers la droite sur la page pour revenir ; le geste fonctionne aussi depuis le bord gauche. Les réglages séparent la taille du texte et celle des lectures ruby, avec aperçu. Le thème et les réglages restent à côté du titre sur les petits écrans.

[docs/reading-controls.md](../docs/reading-controls.md)

## Conversations dans Bunko

Lisez et rédigez des commentaires publics sur les passages dans Bunko en vous connectant avec GitHub. Les brouillons et les notes privées restent sur votre appareil jusqu’à ce que vous choisissiez de les publier. Un petit service cloud gère l’autorisation sans dépendre de l’ordinateur du propriétaire ; GitHub conserve la conversation publique. L’interface propose l’anglais, le chinois simplifié, le chinois traditionnel et le japonais. La version 1.0.6 (8) conserve la connexion grâce au stockage sécurisé et au renouvellement automatique des jetons, et reprend après de brèves coupures réseau. iOS **1.0.8 (10)**, avec son application compagnon Apple Watch, est disponible publiquement depuis le 29 septembre 2026. Mac **1.0.8 (10)** est également disponible publiquement depuis le 30 septembre 2026, heure de Hong Kong. Android 1.0.9 (14) reste disponible en test interne sur Google Play ; consultez les dossiers de publication pour son état en production.

[Implémentation et vérification des discussions](../docs/github-discussions-2026-09-26.md).

## Mac et Apple Watch

La version **1.0.8 (10)** ajoute une application compagnon native pour Apple Watch et met à jour celle pour Mac. Envoyez un extrait multilingue depuis le lecteur de l’iPhone vers la montre jumelée. Les trois derniers extraits restent disponibles hors ligne, avec navigation entre paragraphes et taille du texte réglable. Les figures et équations restent dans le lecteur complet sur téléphone et Mac.

L’icône renouvelée et l’assistant privé prennent en charge PDF, Word (.docx), Markdown, texte et TeX, la recherche d’articles et les questions sur les documents. Dix contrôles natifs ont réussi sur un Mac mini M5 Pro : réouverture hors ligne, position de lecture, équations et figures notamment. Le simulateur Watch a validé le transfert réel depuis l’application iPhone et le redémarrage déconnecté ; aucune montre physique n’a encore été testée.

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## Historique des tests · 30 septembre 2026

**2026-09-30 · 1.0.9 (14)** utilise l’icône approuvée, plus blanche en bas à droite et avec des traits bleus plus nets en haut à gauche de 文. Les anciens modèles restent archivés. L’icône web est publiée ; le build 14 est disponible dans TestFlight pour iPhone/iPad, l’app compagnon Watch et Mac, ainsi qu’en test interne Google Play.

Le build 14 a été soumis à Apple et Google pour publication automatique après approbation. Celle-ci reste en attente ; Apple 1.0.8 (10) demeure la version publique. Les instructions destinées à Google utilisent désormais le compte de démonstration Bunko distinct, avec de vrais commentaires et conversations sur les documents, sans code envoyé au propriétaire par e-mail. Les déclarations de confidentialité de l’assistant documentaire ont aussi été mises à jour.

Les extraits Watch conservent le pinyin chinois, les furigana japonais et l’alignement des langues par phrase, avec des tailles séparées pour le texte et les lectures. Renvoyez les anciens extraits depuis l’app iPhone mise à jour. Les vérifications du transfert entre simulateurs jumelés et du redémarrage hors ligne du build 13 restent applicables à cette modification d’icône ; aucune Watch physique n’a été testée. Les 58 tests client et les 35 tests serveur ont réussi.

[Dossier de publication](../store/artifacts/icon-release-1.0.9-14.json) · [Accès pour examen](../store/reviewer-access.md) · [Vérification Watch](../evidence/watch-ruby-20260930/qa.json)

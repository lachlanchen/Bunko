[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*Lisez entre les langues, au plus près du livre.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko réunit des classiques du domaine public et des ouvrages originaux autorisés à la diffusion dans une bibliothèque multilingue. Lisez des passages alignés, consultez le pinyin et les furigana au-dessus du texte et emportez vos livres téléchargés hors connexion. Littérature, voyages, apprentissage et ouvrages techniques partagent un lecteur qui conserve figures et équations.

## Lisez à votre façon

- Choisissez une langue ou alternez-en plusieurs, phrase par phrase. L’ordre de sélection définit la langue principale ; les traductions gardent des étiquettes claires.
- Réglez séparément la taille du texte et des annotations ruby. Choisissez le thème clair, sombre ou système et maintenez un mot appuyé pour consulter le dictionnaire.
- Téléchargez des livres et les dictionnaires facultatifs anglais, chinois et japonais. Retrouvez-les hors connexion à votre position enregistrée.
- Lisez sur iPhone, iPad, Android, le web et Mac. Envoyez des extraits multilingues avec ruby à une Apple Watch jumelée.
- Les livres acceptent un nombre quelconque de langues, y compris les écritures de droite à gauche. L’interface existe en anglais, chinois simplifié, chinois traditionnel et japonais.

## Aperçu : un compagnon auprès du livre

La prochaine mise à jour de test enrichit le contexte automatique du livre, les références @ compactes aux livres, chapitres et passages, et le retour au texte exact. Explorez les relations entre personnages sous forme de graphe ou d’arbre, les lieux sur une carte géographique hors connexion et les événements sur une frise datée. Les passages qui étayent chaque guide restent accessibles.

**Aperçu de test, pas une annonce de sortie publique.** Les guides portent sur des extraits choisis ou échantillonnés et peuvent être incomplets. Les lieux et dates incertains sont signalés. Les images sont de vraies captures des composants ; la carte et la frise utilisent un parcours de démonstration explicitement indiqué. [Détails de l’aperçu](../docs/reading-guides-preview.md).

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — test preview" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## Lancer et compiler

Utilisez Node.js 22. Installez les deux ensembles de dépendances, lancez les vérifications puis le lecteur. L’application utilise React/TypeScript, Capacitor sur iOS et Android, et AppKit/WebKit sur Mac. Les identifiants de signature restent hors de Git.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

Préparez les ressources web embarquées dans les applications natives :

```sh
npm run build:native
npm run build:macos
```

## Dans le dépôt

| Chemin | Contenu |
| --- | --- |
| [src/](../src/) | Lecteur, disposition des langues, cache local et interface du compagnon |
| [server/](../server/) | Services de compte, discussions et compagnon facultatif |
| [ios/ · android/ · macos/](../ios/) | Projets des plateformes et compagnon Apple Watch |
| [docs/](../docs/) | Guides de lecture, de publication et des plateformes |


## Livres, discussions et confidentialité

Les livres et leurs justificatifs de droits sont dans [bunko-books](https://github.com/lachlanchen/bunko-books), séparément du code. De nouvelles éditions compatibles peuvent arriver sans mise à jour de l’application. GitHub est la source principale de téléchargement, avec un CDN et un cache propre en secours. Les discussions publiques utilisent la connexion GitHub ; notes privées, brouillons non publiés et conversations personnelles avec le compagnon ne sont pas des commentaires publics. La lecture des téléchargements ne nécessite pas d’abonnement. Les contenus générés peuvent comporter des erreurs ; vérifiez le texte cité. Consultez les boutiques pour les versions publiques et la disponibilité régionale.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Soutenir Bunko

Bunko est un projet LazyingArt. Votre soutien volontaire contribue à entretenir le lecteur et ses outils ouverts de bibliothèque.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Citation

Si vous utilisez Bunko en recherche, citez ce dépôt. GitHub lit [CITATION.cff](../CITATION.cff) pour afficher son panneau de citation.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Спокойная библиотека классики на трёх языках с чтением над строкой.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko — приложение для чтения классики общественного достояния на китайском, японском и английском. Можно выбрать языки и макет, видеть пиньинь или фуригану над иероглифами и читать загруженные главы без сети. Интерфейс доступен на английском, упрощённом и традиционном китайском и японском. Каталог находится в отдельном [bunko-books](https://github.com/lachlanchen/bunko-books); этот репозиторий не содержит тексты книг.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Снимок читалки Bunko" width="300"></a></p>

## Содержимое репозитория

| Путь | Описание |
| --- | --- |
| [`src/`](../src/) | Читалка, руби-разметка, офлайн-кеш и темы |
| [`docs/catalogue.md`](../docs/catalogue.md) | Проверка прав и руководство по публикации |
| [`store/`](../store/) | Статус магазинов и передача проекта |

## Запуск читалки

Установите зависимости, запустите проверки и откройте сервер разработки Vite. Нативные пакеты используют Capacitor и закрытые ключи подписи вне Git.

```sh
npm ci
npm run check
npm run dev
```

## Библиотека и выпуски

В открытом каталоге 150 проверенных изданий. Новые книги публикуются через GitHub без пересборки приложения; изменения кода читалки требуют нового веб- или нативного выпуска. Доступность по платформам и проверка обновлений указаны в журнале выпуска ниже.

[store/release.yaml](../store/release.yaml)

## Поддержать Bunko

Bunko — проект LazyingArt. Если он помогает вам читать или исследовать, вы можете поддержать дальнейшую работу:

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Цитирование

Если вы используете Bunko в исследовании, цитируйте этот репозиторий. GitHub читает [CITATION.cff](../CITATION.cff) и показывает панель цитирования.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## Охват и обратная связь

Учебные тексты, созданные ИИ, могут содержать ошибки. Публикуются только полные проверенные издания; статус общественного достояния зависит от страны. Об ошибках читалки сообщайте в [Bunko issues](https://github.com/lachlanchen/Bunko/issues), о книгах и правах — в [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues).
## Читать в Bunko

В библиотеке теперь 150 классических произведений из общественного достояния и 12 изданий, разрешённых автором: заметки по физике, учебное руководство, книги о финансах и три многоязычных путеводителя. Книги доступны на одном или нескольких языках; формулы и иллюстрации сохраняются в мобильном чтении.

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play · публикация ожидается](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

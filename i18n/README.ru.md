[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*Читайте на разных языках, оставаясь рядом с текстом.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko собирает классику в общественном достоянии и авторские книги с разрешением на распространение в одной многоязычной библиотеке. Читайте сопоставленные отрывки, смотрите пиньинь и фуригану над текстом и сохраняйте книги для чтения без интернета. Литература, путешествия, учебные и технические издания используют одну читалку с рисунками и формулами.

## Читайте по-своему

- Выберите один язык или чередуйте несколько по предложениям. Порядок выбора определяет основной язык; у переводов остаются понятные языковые метки.
- Настраивайте размеры текста и подсказок ruby отдельно. Выбирайте светлую, тёмную или системную тему; удерживайте слово для обращения к словарю.
- Загружайте книги и необязательные словарные пакеты для английского, китайского и японского. Открывайте их без интернета на сохранённом месте.
- Читайте на iPhone, iPad, Android, в браузере и на Mac. Отправляйте многоязычные отрывки с ruby на сопряжённые Apple Watch.
- Книга может содержать любое число языков, включая письменности справа налево. Интерфейс доступен на английском, упрощённом и традиционном китайском, японском.

## Помощник рядом с книгой

Помощник для чтения объединяет автоматический контекст книги, компактные @-ссылки на книги, главы и отрывки и возврат к точному месту в тексте. Изучайте связи персонажей в виде графа или дерева, места на автономной географической карте и события на шкале времени с датами. Подтверждающие отрывки доступны из каждого путеводителя по книге.

**Доступно в iOS и Android 1.0.14 (37). Mac39 ещё проходит проверку; публичная версия для Mac — 1.0.13 (23). Веб-версия обновляется отдельно.** Путеводители охватывают выбранные отрывки или выборку и могут быть неполными. Неопределённые места и даты отмечены явно. Ниже — реальные снимки компонентов; карта и шкала времени используют обозначенный демонстрационный маршрут. [Подробнее о предпросмотре](../docs/reading-guides-preview.md).

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — component example" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## Запуск и сборка

Используйте Node.js 22. Установите оба набора зависимостей, выполните проверки и запустите читалку. Приложение использует React/TypeScript, Capacitor на iOS и Android, AppKit/WebKit на Mac. Учётные данные для подписи хранятся вне Git.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

Подготовьте веб-ресурсы, включаемые в нативные пакеты:

```sh
npm run build:native
npm run build:macos
```

## Содержимое репозитория

| Путь | Содержимое |
| --- | --- |
| [src/](../src/) | Читалка, языковая вёрстка, локальный кеш и интерфейс помощника |
| [server/](../server/) | Сервисы аккаунта, обсуждений и необязательного помощника |
| [ios/ · android/ · macos/](../ios/) | Проекты платформ и приложение для Apple Watch |
| [docs/](../docs/) | Руководства по чтению, публикации книг и платформам |


## Книги, обсуждения и конфиденциальность

Книги и сведения об их правах находятся в [bunko-books](https://github.com/lachlanchen/bunko-books), отдельно от кода приложения. Совместимые новые издания можно добавлять без обновления приложения. GitHub — основной источник загрузки, CDN и собственный кеш служат резервными. Публичные обсуждения используют вход через GitHub; личные заметки, неопубликованные черновики и разговоры с помощником не являются публичными комментариями. Для чтения загруженных книг подписка не нужна. Созданные моделью учебные материалы могут содержать ошибки; сверяйтесь с цитируемым текстом. Актуальные публичные версии и доступность по регионам указаны в магазинах.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Поддержать Bunko

Bunko — проект LazyingArt. Добровольная поддержка помогает поддерживать читалку и открытые библиотечные инструменты.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Цитирование

Если вы используете Bunko в исследованиях, цитируйте этот репозиторий. GitHub читает [CITATION.cff](../CITATION.cff), чтобы показать панель цитирования.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

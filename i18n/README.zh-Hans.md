[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*一座安静的三语古典文库，让读音自然浮现在文字上方。*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko 是阅读中文、日文与英文公版经典的应用。读者可选择显示语言与排版，在汉字上方查看拼音或假名，并离线阅读已下载的章节。界面支持英语、简体中文、繁体中文和日语。书目存放在独立的 [bunko-books](https://github.com/lachlanchen/bunko-books) 仓库；此应用仓库不收录书籍正文。

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko 阅读器截图" width="300"></a></p>

## 仓库内容

| 路径 | 说明 |
| --- | --- |
| [`src/`](../src/) | 阅读器、注音排版、离线缓存和主题设置 |
| [`docs/catalogue.md`](../docs/catalogue.md) | 版权审核与发布指南 |
| [`store/`](../store/) | 商店状态与交接记录 |

## 运行阅读器

安装依赖、执行检查，然后启动 Vite 开发服务器。原生应用使用 Capacitor；私密签名材料保存在 Git 之外。

```sh
npm ci
npm run check
npm run dev
```

## 书库与版本

在线书目已有 150 种通过审核的版本。新书可以通过 GitHub 发布，无须重新构建应用；阅读器代码的改动仍需发布新版网页或原生应用。各平台的上架情况与更新审核状态见下方发布记录。

[store/release.yaml](../store/release.yaml)

## 支持 Bunko

Bunko 是 LazyingArt 项目。如果它帮助了你的阅读或研究，可以支持持续维护：

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 引用

如在研究中使用 Bunko，请引用此仓库。GitHub 会读取 [CITATION.cff](../CITATION.cff) 并提供引用面板。

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## 范围与反馈

AI 生成的学习文本可能有误。书目只发布经过审核的完整版本，公版规则也因地区而异。阅读器问题请提交至 [Bunko issues](https://github.com/lachlanchen/Bunko/issues)；书籍或版权问题请提交至 [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)。

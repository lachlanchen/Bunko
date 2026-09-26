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

在线书目已有 183 种通过审核的版本。新书可以通过 GitHub 发布，无须重新构建应用；阅读器代码的改动仍需发布新版网页或原生应用。各平台的上架情况与更新审核状态见下方发布记录。

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
## 在 Bunko 阅读

书库现有 150 部公共领域经典和 33 部经作者授权的作品：物理学伴读笔记、学习指南、财经书籍，以及三本多语旅行指南。每本书可有一种或多种语言，公式和插图也能在手机上阅读。

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play · 待上架](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Mac 版 Bunko

1.0.2 (4) 已提交 Mac App Store 审核，并已开放内部 TestFlight 测试。支持 macOS 12 及以上，提供原生菜单、键盘快捷键与离线阅读。通用二进制包含 Intel 与 Apple 芯片架构；实际运行测试在 Intel Mac 上完成。

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## 应用更新

文库会自动检查更新，有正式新版时显示可稍后处理的提示，也可在设置中手动检查。网页版等您选择后才重新载入，原生应用则打开对应商店。阅读、下载和已保存的数据均予以保留。详见[更新指南](../docs/app-updates.md)。

## 阅读操作

长按一个词语，使用系统自带的选择手柄调整选取范围，再明确点击“查词”。“整句”按钮可以将选区扩大到完整句子；普通点击不会打开词典，也不会把整句自动作为查询内容。从屏幕左边缘向右滑动即可返回上一层，打开的面板会优先关闭。设置中提供独立的正文字号和注音字号滑块，附带实时预览，并会在本机保存您的偏好。即使在较窄的手机屏幕上，主题选择器和设置按钮也与书库标题保持在同一行，留出更多阅读空间。

[docs/reading-controls.md](../docs/reading-controls.md)

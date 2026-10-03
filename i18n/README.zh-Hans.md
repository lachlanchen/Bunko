[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*安静的多语言书库，在正文上方显示注音。*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko 是阅读中文、日文与英文公版经典的应用。读者可选择显示语言与排版，在汉字上方查看拼音或假名，并离线阅读已下载的章节。界面支持英语、简体中文、繁体中文和日语。书目存放在独立的 [bunko-books](https://github.com/lachlanchen/bunko-books) 仓库；此应用仓库不收录书籍正文。

书籍可使用标准语言标签包含任意数量的语言层，支持阿拉伯语等从右向左书写的文字。选择想看的语言，对应段落保持对齐。书籍语言与界面翻译彼此独立。

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko 阅读器截图" width="300"></a></p>

## 当前状态 · 2026年10月3日

Android 1.0.10 (17) 修正隐私政策网址后已在 Google Play 正式发布，覆盖 172 个国家，发布比例为 100%。本次新增设置中的隐私直达链接和更可靠的图书下载。iOS/Watch 1.0.9 (14)、Mac 1.0.8 (10) 已发布；Apple iOS/Watch 和 Mac 1.0.10 (16) 仍在等待审核。审核人员使用独立 Bunko 演示账户，无需 GitHub 邮箱验证码；更明确的演示登录返回步骤也已提交。

用于 PDF 转换和 AI 回答的可选云端方案正在准备中，预计月费为 2.99 / 14.99 / 29.99 美元。方案页面已提供，购买功能尚未启用。图书、词典和离线阅读仍包含在应用购买中。图书下载优先使用 GitHub，其次使用公共 CDN，最后才使用有容量限制的自有缓存。

[发布记录](../store/artifacts/distribution-android-1.0.10-20261003.json) · [云端方案](../docs/cloud-subscriptions.md)

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

在线书目已有 185 种通过审核的版本。新书可以通过 GitHub 发布，无须重新构建应用；阅读器代码的改动仍需发布新版网页或原生应用。各平台的上架情况与更新审核状态见下方发布记录。

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

书库现有185种通过权利审核的版本，包括经典、物理学伴读笔记、学习与财经书籍，以及多语旅行指南。每本书可有一种或多种语言，公式和插图也能在手机上阅读。


网页版和已安装的 PWA 提供适合当前设备的可选商店链接，也可以继续在这里阅读。只有确认正式上架后，才会启用对应的商店按钮。

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Mac 版 Bunko

1.0.8 (10) 已在 Mac App Store 正式发布。支持 macOS 12 及以上，提供原生菜单、键盘快捷键与离线阅读。通用二进制支持 Intel 与 Apple 芯片，两类 Mac 均有实际运行测试记录。 [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## 应用更新

文库会自动检查更新，有正式新版时显示可稍后处理的提示，也可在设置中手动检查。网页版等您选择后才重新载入，原生应用则打开对应商店。阅读、下载和已保存的数据均予以保留。详见[更新指南](../docs/app-updates.md)。

## 阅读操作

长按一个词语，使用系统自带的选择手柄调整选取范围，再明确点击“查词”。“整句”按钮可以将选区扩大到完整句子；普通点击不会打开词典，也不会把整句自动作为查询内容。在页面上向右滑动即可返回上一层，也支持从左边缘开始滑动，打开的面板会优先关闭。设置中提供独立的正文字号和注音字号滑块，附带实时预览，并会在本机保存您的偏好。即使在较窄的手机屏幕上，主题选择器和设置按钮也与书库标题保持在同一行，留出更多阅读空间。

[docs/reading-controls.md](../docs/reading-controls.md)

## 在 Bunko 里交流

使用 GitHub 登录，即可在 Bunko 内阅读和撰写段落的公开评论。草稿和私人笔记留在本机，只有你明确选择发表时才会公开。小型云端服务处理授权，无需让所有者的电脑保持开机；公开讨论保存在 GitHub。界面支持英语、简体中文、繁体中文和日语。1.0.6 (8) 通过设备安全存储和令牌自动刷新保持登录，并可从短暂连接故障中恢复。iOS **1.0.8 (10)**（含 Apple Watch 伴侣）已于 2026 年 9 月 29 日正式发布。Mac **1.0.8 (10)** 也已于香港时间 2026 年 9 月 30 日正式发布。Android 1.0.9 (14) 继续提供 Google Play 内部测试；正式版状态见发布记录。

[讨论功能实现与验证](../docs/github-discussions-2026-09-26.md).

## Mac 与 Apple Watch

**1.0.8 (10)** 新增原生 Apple Watch 伴侣并更新 Mac 应用。在 iPhone 阅读器中，将多语言文字选段发送到配对手表。最近三份选段可离线阅读，支持段落切换与字号调整。插图和公式保留在手机及 Mac 的完整阅读器中。

新图标与私人文档助手支持 PDF、Word（.docx）、Markdown、文本、TeX、论文搜索与文档问答。M5 Pro Mac mini 通过十项原生阅读检查，包括离线重开、进度恢复、公式和插图。Watch 模拟器通过真实 iPhone 传输与断开连接后重启测试；尚未测试实体手表。

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## 测试与审核

**2026-09-30 · 1.0.9 (14)** 使用已确认的图标：右下方更洁白，文的左上方蓝色笔画更清晰。早期设计均保留归档。网页图标已上线；版本 14 已提供 iPhone/iPad、Watch 配套应用和 Mac 的 TestFlight，以及 Google Play 内部测试。

版本 14 已提交 Apple 与 Google，通过审核后自动发布。目前仍待批准；Apple 正式版保持为 1.0.8 (10)。Google 审核说明已改用独立的 Bunko 演示账户，支持真实评论和文档对话，无需所有者邮箱验证码。文档助手的隐私声明也已更新。

Watch 摘录保留中文拼音、日语振假名及逐句多语言对照，正文和注音字号可分别调整。请从更新后的 iPhone 应用重新发送旧摘录。版本 13 的配对模拟器传输与离线重启验证适用于此次仅更换图标的更新；尚无实体 Watch 测试。58 项客户端和 35 项服务端测试全部通过。

[发布记录](../store/artifacts/icon-release-1.0.9-14.json) · [审核访问](../store/reviewer-access.md) · [Watch 验证](../evidence/watch-ruby-20260930/qa.json)

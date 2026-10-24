[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*跨越语言，贴近书本。*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko 将公版经典与已获分发许可的原创书籍收进同一个多语言书架。对照阅读对应段落，查看汉字上方的拼音与假名，下载后也能离线阅读。文学、旅行、学习及专业书籍使用同一个阅读器，图表和公式也随正文保留。

## 按自己的习惯阅读

- 只看一种语言，或逐句交错显示多种语言。选择顺序决定主语言，译文保留清晰的语言标签。
- 正文字号和注音大小独立调整。支持浅色、深色及跟随系统主题；长按选中单词后可以查词典。
- 下载书籍，以及可选的英语、中文和日语词典包。离线重新打开时，继续上次保存的阅读位置。
- 支持 iPhone、iPad、Android、网页和 Mac。可将带注音的多语言摘录发送到已配对的 Apple Watch。
- 一本书可包含任意数量的语言，也支持从右向左书写的文字。应用界面提供英语、简体中文、繁体中文和日语。

## 陪你读书的助手

阅读助手延续了打开助手时自动带入书籍上下文的体验，支持用紧凑的 @ 引用指定书籍、章节和段落，并返回原文的准确位置。人物关系可用网络图或树状图查看，地名可放到离线地理地图上，事件可按日期排列成时间轴。每份导读都能打开对应的原文依据。

**iOS 和 Android 1.0.14 (37) 已正式发布。Mac39 仍在审核，Mac 当前正式版为 1.0.13 (23)。网页版单独更新。** 导读覆盖选定或抽样的文本，未必涵盖全书；不确定的地点和日期会明确标出。下方图片来自实际组件界面，其中地图和时间轴使用了明确标注的演示旅程。[查看预览说明](../docs/reading-guides-preview.md)。

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — component example" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## 运行与构建

使用 Node.js 22。安装前端与服务端两组依赖，运行检查，再启动阅读器。应用采用 React/TypeScript，iOS 和 Android 使用 Capacitor，Mac 使用 AppKit/WebKit。签名凭据不放入 Git。

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

构建原生应用包内使用的网页资源：

```sh
npm run build:native
npm run build:macos
```

## 仓库内容

| 路径 | 内容 |
| --- | --- |
| [src/](../src/) | 阅读器、多语言排版、本地缓存与助手界面 |
| [server/](../server/) | 账号、讨论和可选的助手服务 |
| [ios/ · android/ · macos/](../ios/) | 各平台工程与 Apple Watch 配套应用 |
| [docs/](../docs/) | 阅读操作、书籍发布和各平台指南 |


## 书籍、讨论与隐私

书籍数据包及其权利记录保存在独立的 [bunko-books](https://github.com/lachlanchen/bunko-books) 仓库，与应用代码分开。兼容的新版本书籍无需更新应用即可加入。下载优先使用 GitHub，CDN 与自有缓存作为备用。公开的段落讨论使用 GitHub 登录；私人笔记、未发布的草稿及个人助手对话不会作为公开评论发布。阅读已下载的书籍不需要订阅。生成的学习资料可能出错，请核对引用原文。当前公开版本和地区可用情况以商店为准。

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## 支持 Bunko

Bunko 是 LazyingArt 项目。自愿支持有助于维护阅读器及开放的书库工具。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 引用

如果在研究中使用 Bunko，请引用本仓库。GitHub 会读取 [CITATION.cff](../CITATION.cff)，提供引用信息面板。

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

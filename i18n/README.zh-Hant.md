[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*跨越語言，貼近書本。*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko 將公版經典與已獲散布許可的原創書籍收進同一個多語言書架。對照閱讀相應段落，查看漢字上方的拼音與假名，下載後也能離線閱讀。文學、旅行、學習及專業書籍使用同一個閱讀器，圖表和公式也隨正文保留。

## 按照自己的習慣閱讀

- 只看一種語言，或逐句交錯顯示多種語言。選取順序決定主要語言，譯文保留清楚的語言標籤。
- 正文字級和注音大小可分別調整。支援淺色、深色及跟隨系統主題；長按選取單字後可以查字典。
- 下載書籍，以及選用的英語、中文和日語字典包。離線重新開啟時，繼續上次儲存的閱讀位置。
- 支援 iPhone、iPad、Android、網頁和 Mac。可將附注音的多語言摘錄傳送到已配對的 Apple Watch。
- 一本書可包含任意數量的語言，也支援從右向左書寫的文字。應用程式介面提供英語、簡體中文、繁體中文和日語。

## 陪你讀書的助手

閱讀助手延續開啟助手時自動帶入書籍脈絡的體驗，支援用精簡的 @ 參照指定書籍、章節和段落，並返回原文的準確位置。人物關係可用網絡圖或樹狀圖查看，地名可放到離線地理地圖上，事件可按日期排列成時間軸。每份導讀都能開啟相應的原文依據。

**iOS 和 Android 1.0.14 (37) 已正式發布。Mac40 仍在審核，Mac 目前正式版為 1.0.13 (23)。網頁版單獨更新。** 導讀涵蓋選定或抽樣的文本，未必涵蓋全書；不確定的地點和日期會明確標示。下方圖片來自實際元件畫面，其中地圖和時間軸使用明確標示的示範旅程。[查看預覽說明](../docs/reading-guides-preview.md)。

**內測中的歷史地圖：** 州域分色顯示，城市使用名稱標記，可接續上次的地圖提問和補充地點。東漢圖層註明參考年代和來源。[地圖說明與預覽](../docs/reading-tools-and-historical-maps.md)。

**持續讀書對話 · 內測版43：** 自動接續離目前閱讀位置最近的對話，也可選擇較早的分支。在已儲存的人物關係圖、地圖和時間線上繼續補充，保留先前版本；較大的關係圖可按陣營或家族分組查看。[詳情](../docs/reading-workspace-20261026.md)。

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — component example" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## 執行與建置

使用 Node.js 22。安裝前端與伺服器端兩組相依套件，執行檢查，再啟動閱讀器。應用程式採用 React/TypeScript，iOS 和 Android 使用 Capacitor，Mac 使用 AppKit/WebKit。簽署憑證不放入 Git。

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

建置原生應用程式套件內使用的網頁資源：

```sh
npm run build:native
npm run build:macos
```

## 儲存庫內容

| 路徑 | 內容 |
| --- | --- |
| [src/](../src/) | 閱讀器、多語言排版、本機快取與助手介面 |
| [server/](../server/) | 帳號、討論及選用的助手服務 |
| [ios/ · android/ · macos/](../ios/) | 各平台專案與 Apple Watch 配套應用程式 |
| [docs/](../docs/) | 閱讀操作、書籍發布及各平台指南 |


## 書籍、討論與隱私

書籍資料包及權利紀錄保存在獨立的 [bunko-books](https://github.com/lachlanchen/bunko-books) 儲存庫，與應用程式程式碼分開。相容的新版本書籍無需更新應用程式即可加入。下載優先使用 GitHub，CDN 與自有快取作為備援。公開的段落討論使用 GitHub 登入；私人筆記、未發布的草稿及個人助手對話不會作為公開留言發布。閱讀已下載的書籍不需要訂閱。生成的學習資料可能有誤，請核對引用原文。目前公開版本和地區供應情況以商店為準。

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## 支持 Bunko

Bunko 是 LazyingArt 專案。自願支持有助於維護閱讀器及開放的書庫工具。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 引用

如果在研究中使用 Bunko，請引用本儲存庫。GitHub 會讀取 [CITATION.cff](../CITATION.cff)，提供引用資訊面板。

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

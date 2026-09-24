[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*一座安靜的三語古典文庫，讓讀音自然浮現在文字上方。*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko 是閱讀中文、日文與英文公版經典的應用程式。讀者可選擇顯示語言與排版，在漢字上方查看拼音或假名，並離線閱讀已下載的章節。介面支援英語、簡體中文、繁體中文與日語。書目存放在獨立的 [bunko-books](https://github.com/lachlanchen/bunko-books) 儲存庫；此應用程式儲存庫不收錄書籍正文。

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko 閱讀器截圖" width="300"></a></p>

## 儲存庫內容

| 路徑 | 說明 |
| --- | --- |
| [`src/`](../src/) | 閱讀器、注音排版、離線快取與主題設定 |
| [`docs/catalogue.md`](../docs/catalogue.md) | 版權審核與發布指南 |
| [`store/`](../store/) | 商店狀態與交接紀錄 |

## 執行閱讀器

安裝依賴、執行檢查，然後啟動 Vite 開發伺服器。原生應用程式使用 Capacitor；私密簽署資料存放於 Git 之外。

```sh
npm ci
npm run check
npm run dev
```

## 書庫與版本

線上書目已有 150 種通過審核的版本。新書可透過 GitHub 發布，無須重新建置應用程式；閱讀器程式碼的變更仍需發布新版網頁或原生應用程式。首個付費版本正由商店審核，即時狀態請查看連結中的發布紀錄。

[store/release.yaml](../store/release.yaml)

## 支持 Bunko

Bunko 是 LazyingArt 專案。如果它幫助了你的閱讀或研究，可以支持持續維護：

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 引用

如在研究中使用 Bunko，請引用此儲存庫。GitHub 會讀取 [CITATION.cff](../CITATION.cff) 並提供引用面板。

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## 範圍與回饋

AI 生成的學習文本可能有誤。書目只發布經過審核的完整版本，公版規則也因地區而異。閱讀器問題請提交至 [Bunko issues](https://github.com/lachlanchen/Bunko/issues)；書籍或版權問題請提交至 [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)。

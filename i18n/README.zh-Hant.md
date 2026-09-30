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

線上書目已有 183 種通過審核的版本。新書可透過 GitHub 發布，無須重新建置應用程式；閱讀器程式碼的變更仍需發布新版網頁或原生應用程式。各平台的上架情況與更新審核狀態見下方發布紀錄。

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
## 在 Bunko 閱讀

書庫現有 150 部公共領域經典與 33 部經作者授權的作品：物理學伴讀筆記、學習指南、財經書籍，以及三本多語旅行指南。每本書可有一種或多種語言，公式與插圖也能在手機上閱讀。

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play · 待上架](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Mac 版 Bunko

1.0.8 (10) 已在 Mac App Store 正式發佈。支援 macOS 12 及以上，提供原生選單、鍵盤快捷鍵與離線閱讀。通用二進位檔支援 Intel 與 Apple 晶片，兩類 Mac 均有實際執行測試紀錄。 [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## 應用程式更新

文庫會自動檢查更新，有正式新版時顯示可稍後處理的提示，也可在設定中手動檢查。網頁版等您選擇後才重新載入，原生應用程式則開啟對應商店。閱讀、下載和已儲存的資料均予以保留。詳見[更新指南](../docs/app-updates.md)。

## 閱讀操作

長按一個詞語，使用系統內建的選取控制點調整選取範圍，再明確點擊「查詞」。「整句」按鈕可以將選取範圍擴大到完整句子；一般點擊不會開啟詞典，也不會把整句自動作為查詢內容。從螢幕左邊緣向右滑動即可返回上一層，開啟的面板會優先關閉。設定中提供獨立的正文字級和注音字級滑桿，附帶即時預覽，並會在本機儲存您的偏好。即使在較窄的手機螢幕上，主題選擇器和設定按鈕也與書庫標題保持在同一行，留出更多閱讀空間。

[docs/reading-controls.md](../docs/reading-controls.md)

## 在 Bunko 裡交流

使用 GitHub 登入，即可在 Bunko 內閱讀和撰寫段落的公開評論。草稿和私人筆記留在本機，只有你明確選擇發表時才會公開。小型雲端服務處理授權，無需讓擁有者的電腦保持開機；公開討論儲存在 GitHub。介面支援英語、簡體中文、繁體中文和日語。1.0.6 (8) 透過裝置安全儲存和權杖自動更新保持登入，並可從短暫連線故障中恢復。iOS **1.0.8 (10)**（含 Apple Watch 伴侶）已於 2026 年 9 月 29 日正式發佈。Mac **1.0.8 (10)** 也已於香港時間 2026 年 9 月 30 日正式發佈。Android 1.0.9 (14) 繼續提供 Google Play 內部測試；正式版狀態見發佈紀錄。

[討論功能實作與驗證](../docs/github-discussions-2026-09-26.md).

## Mac 與 Apple Watch

**1.0.8 (10)** 新增原生 Apple Watch 伴侶並更新 Mac 應用程式。在 iPhone 閱讀器中，將多語言文字選段傳送到配對手錶。最近三份選段可離線閱讀，支援段落切換與字級調整。插圖和公式保留在手機及 Mac 的完整閱讀器中。

新圖示與私人文件助手支援 PDF、Word（.docx）、Markdown、文字、TeX、論文搜尋與文件問答。M5 Pro Mac mini 通過十項原生閱讀檢查，包括離線重開、進度還原、公式和插圖。Watch 模擬器通過真實 iPhone 傳輸與中斷連線後重新啟動測試；尚未測試實體手錶。

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## 測試與審查

**2026-09-30 · 1.0.9 (14)** 使用已確認的圖示：右下方更潔白，文的左上方藍色筆畫更清楚。早期設計均保留封存。網頁圖示已上線；版本 14 已提供 iPhone/iPad、Watch 配套應用程式和 Mac 的 TestFlight，以及 Google Play 內部測試。

版本 14 已提交 Apple 與 Google，通過審查後自動發佈。目前仍待批准；Apple 正式版維持為 1.0.8 (10)。Google 審查說明已改用獨立的 Bunko 示範帳戶，支援真實評論和文件對話，無需擁有者信箱驗證碼。文件助手的隱私聲明也已更新。

Watch 摘錄保留中文拼音、日語振假名及逐句多語言對照，正文與注音字級可分別調整。請從更新後的 iPhone 應用程式重新傳送舊摘錄。版本 13 的配對模擬器傳輸與離線重新啟動驗證適用於此次僅更換圖示的更新；尚無實體 Watch 測試。58 項用戶端與 35 項伺服器端測試全部通過。

[發佈紀錄](../store/artifacts/icon-release-1.0.9-14.json) · [審查存取](../store/reviewer-access.md) · [Watch 驗證](../evidence/watch-ruby-20260930/qa.json)

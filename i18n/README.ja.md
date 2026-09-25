[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*中国語・日本語・英語の古典を、文字の上の読みとともに静かに読む。*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko はパブリックドメインの中国語・日本語・英語の古典を読むアプリです。表示言語とレイアウトを選び、漢字の上のピンインやふりがなを読み、保存した章をオフラインで開けます。UI は英語・簡体字中国語・繁体字中国語・日本語に対応しています。書籍カタログは別の [bunko-books](https://github.com/lachlanchen/bunko-books) にあり、このリポジトリには書籍本文を置きません。

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko リーダーの画面" width="300"></a></p>

## リポジトリの内容

| パス | 説明 |
| --- | --- |
| [`src/`](../src/) | リーダー、ルビ表示、オフラインキャッシュ、テーマ設定 |
| [`docs/catalogue.md`](../docs/catalogue.md) | 権利調査と公開手順 |
| [`store/`](../store/) | ストアの状態と運用引き継ぎ |

## リーダーを動かす

依存関係を入れ、チェックを実行し、Vite 開発サーバーを起動します。ネイティブ版は Capacitor と Git 外の非公開署名情報を使います。

```sh
npm ci
npm run check
npm run dev
```

## 書庫とリリース

公開カタログには確認済みの 183 版があります。新しい本はアプリの再ビルドなしに GitHub から公開できます。リーダーのコード変更には Web またはネイティブ版の更新が必要です。各プラットフォームの公開状況と更新審査は下記のリリース記録で確認できます。

[store/release.yaml](../store/release.yaml)

## Bunko を支援

Bunko は LazyingArt のプロジェクトです。読書や研究に役立ったら、継続的な開発を支援できます。

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 引用

研究で Bunko を使う場合は、このリポジトリを引用してください。GitHub は [CITATION.cff](../CITATION.cff) を読み、引用パネルを表示します。

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## 対象と報告先

AI が生成した学習用の文章には誤りがあり得ます。カタログは調査済みの完結版だけを公開し、パブリックドメインの扱いは地域で異なります。リーダーの不具合は [Bunko issues](https://github.com/lachlanchen/Bunko/issues)、書籍や権利の問題は [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues) に報告してください。
## Bunko で読む

書庫には、パブリックドメインの古典150点に加え、権利を確認した著者自身の版33点を収録しています。物理学の伴読ノート、学習ガイド、金融の本、多言語の旅行ガイド3冊です。単言語・多言語に対応し、数式と図もモバイルで表示します。

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play · 公開待ち](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Mac 版 Bunko

1.0.2 (4) を Mac App Store の審査に提出し、内部 TestFlight でも利用できるようにしました。macOS 12 以降で、ネイティブメニュー、キーボード操作、オフライン読書に対応します。Intel と Apple silicon の両方を含むバイナリを作成し、実機の動作確認は Intel Mac で行いました。

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

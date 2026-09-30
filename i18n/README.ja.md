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

1.0.8 (10) は Mac App Store で公開されています。macOS 12 以降で、ネイティブメニュー、キーボード操作、オフライン読書に対応します。ユニバーサルバイナリは Intel と Apple silicon に対応し、両方の Mac で動作確認を行っています。 [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## アプリの更新

Bunko は更新を自動確認し、新しい正式版があると、あとで表示できる案内を出します。設定から手動で確認することもできます。ウェブ版は選択するまで再読み込みせず、ネイティブ版はストアを開きます。読書、ダウンロード、保存データは維持されます。[更新ガイド](../docs/app-updates.md)をご覧ください。

## 読書の操作

単語を長押しし、標準の選択ハンドルで範囲を調整してから「辞書」を選びます。「文を選択」で文全体に広げられ、通常のタップでは辞書を開きません。左端から右へスワイプすると戻ります。本文とルビの大きさは設定で個別に調整でき、プレビューと設定保存に対応しています。細いスマートフォンでも、テーマと設定は書庫のタイトルと同じ行に収まります。

[docs/reading-controls.md](../docs/reading-controls.md)

## Bunko 内の会話

GitHub でログインして、本文の箇所ごとの公開コメントを Bunko 内で読んだり書いたりできます。下書きと個人メモは、明示的に投稿するまで端末に残ります。小さなクラウドサービスが認証を処理するため、所有者のパソコンを起動しておく必要はありません。公開の会話は GitHub に保存されます。画面は英語、簡体字中国語、繁体字中国語、日本語に対応します。1.0.6 (8) では、安全な端末内保存とトークンの自動更新でログインを保持し、一時的な接続障害から復帰します。iOS **1.0.8 (10)** は Apple Watch の連携アプリを含め、2026年9月29日に一般公開されました。Mac **1.0.8 (10)** も香港時間2026年9月30日に一般公開されました。Android 1.0.6 (8) は Google Play の内部テストで利用できます。製品版の状況はリリース記録を参照してください。

[ディスカッションの実装と検証](../docs/github-discussions-2026-09-26.md).

## MacとApple Watch

**1.0.8 (10)** ではネイティブのApple Watchアプリを追加し、Mac版を更新しました。iPhoneのリーダーから、ペアリングした時計に多言語のテキスト抜粋を送れます。最新3件をオフライン保存し、段落の移動と文字サイズの調整が可能です。図や数式はiPhone・Macの完全版で表示します。

新しいアイコンと非公開の文書アシスタントは、PDF、Word（.docx）、Markdown、テキスト、TeX、論文検索、文書への質問に対応します。M5 Pro Mac miniでオフライン再表示、読書位置、数式、図を含む10項目に合格。Watchシミュレータでは実際のiPhoneアプリからの転送と切断後の再起動を検証しました。実機のWatchは未検証です。

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## 審査用アクセスの候補版

1.0.9 (11) 候補版には、招待されたテスターとストア審査員向けに明示されたデモアカウントがあります。専用パスワードでログインでき、メール確認コードは不要です。実際の公開コメントと返信にはデモの投稿であることが表示され、文書と会話は同じデモアカウントの利用者間でのみ共有されます。新しいブラウザーでの投稿、文書閲覧、会話の保存を確認しました。承認済みの Apple 1.0.8 (10) は引き続き公開され、再提出は実際の却下理由に対応して行います。

[審査用アクセスと検証](../store/reviewer-access.md)

**2026-09-30 · Bunko** — 承認された空色とサーモン色のアイコンをウェブに公開しました。**1.0.9 (12)** は TestFlight（iPhone/iPad、Watch コンパニオン、Mac）と Google Play 内部テストで利用できます。Apple の両製品版更新は審査待ちで、承認後に自動公開されます。Google の製品版更新とストアアイコンは準備済みで、既存の審査は維持しています。以前のアイコン案もすべて保存しています。

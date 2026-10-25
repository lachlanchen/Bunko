[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*言葉を越えて、物語のそばへ。*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko は、パブリックドメインの古典と配布許可を確認したオリジナル作品を集めた多言語の本棚です。対応する文章を並べ、漢字の上にピンインやふりがなを表示し、ダウンロードした本をオフラインで読めます。文学、旅行、学習、専門書を同じリーダーで開き、図や数式も本文と一緒に読めます。

## 自分に合った読み方

- 一つの言語だけを表示したり、複数の言語を文ごとに交互表示したりできます。選択した順番で主言語が決まり、翻訳には言語ラベルが残ります。
- 本文とルビの大きさを個別に調整できます。ライト・ダーク・システム設定に対応し、単語を長押しすると辞書を使えます。
- 本と、英語・中国語・日本語の任意の辞書パックをダウンロードできます。オフラインでも保存した読書位置から再開できます。
- iPhone、iPad、Android、ウェブ、Mac に対応。ルビ付きの多言語抜粋をペアリング済みの Apple Watch に送れます。
- 本に含める言語数に制限はなく、右から左へ書く言語にも対応します。画面表示の言語は英語・簡体字中国語・繁体字中国語・日本語です。

## 本に寄り添う読書アシスタント

読書アシスタントでは、本を開いた状態から引き継ぐ文脈、本・章・段落を指定するコンパクトな @ 参照、引用元の位置へ戻るリンクをさらに活用できます。人物の関係をグラフやツリーで、地名をオフラインの地理地図で、出来事を日付付きの年表で確認できます。各ガイドから根拠となる本文を開けます。

**iOS・Android 1.0.14 (37) で利用できます。Mac40 は審査中で、Mac の公開版は 1.0.13 (23) です。Web 版は別途更新されます。** ガイドの対象は選択した抜粋や抽出した範囲で、本全体を網羅するとは限りません。不確かな地名や日付は明示します。以下は実際のコンポーネント画面です。地図と年表は、デモであることを明記した旅程を使用しています。[プレビューの詳細](../docs/reading-guides-preview.md)。

**内部テスト中の歴史地図：** 州を色分けし、都市名を表示します。保存した地図について続けて質問し、地点を追加できます。後漢の地図には参考年代と出典を記載しています。[地図の説明とプレビュー](../docs/reading-tools-and-historical-maps.md)。

**読書の会話を続ける · 内部テスト版43：** 読書位置に近い会話を再開したり、以前の分岐を選んだりできます。過去の版を残しながら、保存した人物関係図・地図・年表を補足できます。大きな関係図はグループ別に表示できます。[詳細](../docs/reading-workspace-20261026.md)。

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — component example" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## 起動とビルド

Node.js 22 を使用してください。アプリとサーバーの依存関係をインストールし、チェックを実行してからリーダーを起動します。React/TypeScript を使用し、iOS・Android は Capacitor、Mac は AppKit/WebKit で構成しています。署名用の認証情報は Git に含めません。

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

ネイティブアプリに同梱するウェブ資材をビルドします：

```sh
npm run build:native
npm run build:macos
```

## リポジトリの構成

| パス | 内容 |
| --- | --- |
| [src/](../src/) | リーダー、言語レイアウト、ローカルキャッシュ、アシスタント画面 |
| [server/](../server/) | アカウント、公開コメント、任意のアシスタント機能のサービス |
| [ios/ · android/ · macos/](../ios/) | 各プラットフォームのプロジェクトと Apple Watch アプリ |
| [docs/](../docs/) | 読書操作、書籍公開、プラットフォーム別のガイド |


## 本・公開コメント・プライバシー

書籍データと権利記録は、アプリのコードとは別の [bunko-books](https://github.com/lachlanchen/bunko-books) にあります。互換性のある新しい版はアプリ更新なしで追加できます。ダウンロードは GitHub を優先し、CDN と自社キャッシュを予備経路に使います。本文への公開コメントには GitHub ログインを使います。非公開メモ、未投稿の下書き、個人的なアシスタントとの会話は公開コメントにはなりません。ダウンロード済みの本を読むためにサブスクリプションは不要です。生成された学習資料には誤りがあり得るため、引用元を確認してください。現在の一般公開版と地域別の提供状況は各ストアで確認できます。

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Bunko を支援する

Bunko は LazyingArt のプロジェクトです。任意のご支援は、リーダーと公開ライブラリ用ツールの保守に役立ちます。

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 引用

研究で Bunko を使用する場合は、このリポジトリを引用してください。GitHub は [CITATION.cff](../CITATION.cff) を読み取り、引用パネルを表示します。

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

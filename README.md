# Bunko 文庫

Read public-domain classics in Chinese, Japanese and English with pinyin and furigana, multilingual layouts, and downloads for offline reading.

[Open the reader](https://lachlan.lazying.art/Bunko/) · [Privacy](https://lachlan.lazying.art/Bunko/privacy.html) · [Support](https://lachlan.lazying.art/Bunko/support.html)

Bunko uses React, TypeScript and Capacitor. The 56 cleared books are downloaded from the separate [bunko-books](https://github.com/lachlanchen/bunko-books) repository; no book payloads are stored in this repository. The rights gate is [docs/catalogue.md](docs/catalogue.md). Study renderings are AI-generated and may contain errors.

The interface supports English, Simplified Chinese, Traditional Chinese and Japanese. Readers can select displayed languages, switch between source-only, interlinear and paragraph layouts, control ruby and grammar colors, and choose text size and theme. Reading position and preferences stay on the device.

Store release 1.0.0 is US$0.99 paid up front, with no subscription or in-app purchase. Apple is waiting for review and Google Play production is in review. Both will publish after approval. [Current release state](store/release.yaml) · [Publishing handoff](store/operator-handoff.md).

```sh
npm ci
npm run check
npm run dev
```

See [BRIEF.md](BRIEF.md) for the product contract and planned companion features. Native builds use private signing material outside the repository. [L & N](https://github.com/lachlanchen/L-And-N) supplied the publishing infrastructure.

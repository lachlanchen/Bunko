# Multilingual reader validation — 2026-09-30

390 × 844 mobile browser, production web bundle, real corrected local catalogue.
18 checks passed: both editions, three Bible and four Quran layers, independent
Arabic RTL, publisher notes, Chinese ruby, first/last Quran passages, no page
horizontal overflow, cold reload with both library origins blocked, no runtime
errors. Screenshots were visually inspected. This is browser evidence, not a
claim of physical iPhone, Android or Watch testing.

- [Quran](quran-mobile.png): Arabic from [Tanzil 1.1](https://tanzil.net/docs/Text_License), with unchanged [QuranEnc translations and notes](https://quranenc.com/en/home/api).
- [Bible](bible-mobile.png): [English WEB](https://ebible.org/engwebp/), [traditional Chinese CUV](https://ebible.org/cmn-cu89t/) and [Japanese Freedom Bible](https://ebible.org/jpnm/) (publisher draft), all public domain.
- [Machine-readable UI checks](reader-qa.json).
- [Complete source coverage](../../docs/library-language-validation-2026-09-30.json).

Reader tests additionally exercise eight language layers, regional tags,
per-script direction (including ar-Latn and az-Arab), passage tools, dictionary
routing and Watch serialization. Native Swift model checks passed on the Mac
build host, including more than six languages and legacy cache compatibility.

## Published test packages

iOS/Watch and Mac1.0.10(15) are VALID and IN_BETA_TESTING; Android15 is available internally ([Console evidence](google-internal15.png)). All packages passed signing, version checks and upload validation. [Release receipt](../../store/artifacts/languages-1.0.10-15.json) records hashes, build IDs and preserved production review states.

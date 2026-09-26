[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*مكتبة هادئة للكلاسيكيات بثلاث لغات، مع القراءات فوق النص.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko قارئ لكلاسيكيات الملك العام بالصينية واليابانية والإنجليزية. اختر اللغات والتخطيط الظاهرين، واقرأ البينيين أو الفوريغانا فوق الحروف، واحتفظ بالفصول المحمّلة للقراءة دون اتصال. تتوفر الواجهة بالإنجليزية والصينية المبسطة والتقليدية واليابانية. يوجد فهرس الكتب في مستودع [bunko-books](https://github.com/lachlanchen/bunko-books) المنفصل؛ ولا يحتوي هذا المستودع على نصوص الكتب.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="صورة قارئ Bunko" width="300"></a></p>

## محتويات المستودع

| المسار | الوصف |
| --- | --- |
| [`src/`](../src/) | القارئ وتخطيط القراءات والتخزين دون اتصال والسمات |
| [`docs/catalogue.md`](../docs/catalogue.md) | تدقيق الحقوق ودليل النشر |
| [`store/`](../store/) | حالة المتاجر وتسليم العمل |

## تشغيل القارئ

ثبّت الاعتماديات، وشغّل الفحوص، ثم افتح خادم تطوير Vite. تستخدم الحزم الأصلية Capacitor ومواد توقيع خاصة خارج Git.

```sh
npm ci
npm run check
npm run dev
```

## المكتبة والإصدار

يضم الفهرس الحي 183 طبعة معتمدة. تُنشر حزم الكتب الجديدة عبر GitHub دون إعادة بناء التطبيق؛ أما تغييرات كود القارئ فتحتاج إصدار ويب أو تطبيق جديد. يوضح سجل الإصدار أدناه توفر التطبيق ومراجعة التحديثات لكل منصة.

[store/release.yaml](../store/release.yaml)

## ادعم Bunko

Bunko مشروع من LazyingArt. إذا أفاد قراءتك أو بحثك، يمكنك دعم استمرار العمل:

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## الاقتباس

إذا استخدمت Bunko في بحثك فاستشهد بهذا المستودع. يقرأ GitHub ملف [CITATION.cff](../CITATION.cff) ويعرض لوحة الاقتباس.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## النطاق والملاحظات

قد تحتوي النصوص الدراسية المنشأة بالذكاء الاصطناعي على أخطاء. ينشر الفهرس الطبعات المكتملة والمدققة فقط، وتختلف قواعد الملك العام حسب الإقليم. أبلغ عن أخطاء القارئ في [Bunko issues](https://github.com/lachlanchen/Bunko/issues) وعن مشكلات الكتب والحقوق في [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues).
## اقرأ Bunko

تضم المكتبة 150 عملاً كلاسيكياً من الملكية العامة و33 إصداراً مرخّصاً من المؤلف: ملاحظات في الفيزياء، ودليل تعليمي، وكتباً مالية، وثلاثة أدلة سفر متعددة اللغات. يدعم القارئ لغة واحدة أو لغات متعددة، مع المعادلات والصور.

[متجر Apple](https://apps.apple.com/app/id6815137919) · [Google Play · النشر قيد الانتظار](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko على Mac

أُرسل الإصدار 1.0.2 (4) إلى مراجعة متجر Mac App Store، وهو متاح للاختبار الداخلي عبر TestFlight. يدعم macOS 12 أو أحدث، مع قوائم أصلية واختصارات لوحة المفاتيح والقراءة دون اتصال. يتضمن التطبيق بنيتين لـ Intel وApple silicon؛ أُجريت اختبارات التشغيل على أجهزة Intel.

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## تحديثات التطبيق

يتحقق Bunko من التحديثات تلقائيًا ويعرض تنبيهًا يمكن تأجيله عند توفر إصدار عام. يمكنك أيضًا التحقق يدويًا من الإعدادات. ينتظر إصدار الويب اختيارك لإعادة التحميل، بينما تفتح التطبيقات الأصلية متجرها. تبقى القراءة والتنزيلات والبيانات المحفوظة محفوظة. راجع [دليل التحديث](../docs/app-updates.md).

## أدوات القراءة

اضغط مطولًا على كلمة، واضبط مقابض التحديد، ثم اختر القاموس. يوسّع زر الجملة التحديد إلى الجملة كاملة؛ ولا تفتح النقرات العادية القاموس. اسحب يمينًا من الحافة اليسرى للرجوع. تتيح الإعدادات ضبط حجم النص والقراءات العلوية بشكل مستقل مع معاينة فورية. يظهر اختيار المظهر والإعدادات بجوار عنوان المكتبة حتى على الهواتف الضيقة.

[docs/reading-controls.md](../docs/reading-controls.md)

## المحادثات داخل Bunko

اقرأ التعليقات العامة على المقاطع واكتبها داخل Bunko باستخدام تسجيل الدخول إلى GitHub. تبقى المسودات والملاحظات الخاصة على جهازك حتى تختار نشرها. تتولى خدمة سحابية صغيرة عملية التفويض دون الحاجة إلى تشغيل حاسوب المالك، ويحفظ GitHub المحادثات العامة. تدعم الواجهة الإنجليزية والصينية المبسطة والتقليدية واليابانية. يضيف الإصدار 1.0.6 (8) تسجيل دخول مستمرًا مع تخزين آمن على الجهاز وتجديد تلقائي للرموز، والتعافي من انقطاعات الاتصال القصيرة. يُوزع عبر الاختبار الداخلي على Google Play وTestFlight لنظامي iOS وMac؛ وتستمر مراجعات الإصدار 1.0.4 للنشر العام.

[تنفيذ المناقشات والتحقق منها](../docs/github-discussions-2026-09-26.md).

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

يضم الفهرس الحي 185 طبعة معتمدة. تُنشر حزم الكتب الجديدة عبر GitHub دون إعادة بناء التطبيق؛ أما تغييرات كود القارئ فتحتاج إصدار ويب أو تطبيق جديد. يوضح سجل الإصدار أدناه توفر التطبيق ومراجعة التحديثات لكل منصة.

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

تضم المكتبة 185 طبعة معتمدة، تشمل الكلاسيكيات وملاحظات الفيزياء وكتب التعلم والمال وأدلة السفر متعددة اللغات. تتوفر الكتب بلغة واحدة أو عدة لغات، مع الحفاظ على المعادلات والصور على الهاتف.

[متجر Apple](https://apps.apple.com/app/id6815137919) · [Google Play · النشر قيد الانتظار](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko على Mac

الإصدار 1.0.8 (10) متاح على Mac App Store. يدعم macOS 12 أو أحدث، مع قوائم أصلية واختصارات لوحة المفاتيح والقراءة دون اتصال. يدعم التطبيق Intel وApple silicon، مع اختبارات تشغيل على كلا النوعين من أجهزة Mac. [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## تحديثات التطبيق

يتحقق Bunko من التحديثات تلقائيًا ويعرض تنبيهًا يمكن تأجيله عند توفر إصدار عام. يمكنك أيضًا التحقق يدويًا من الإعدادات. ينتظر إصدار الويب اختيارك لإعادة التحميل، بينما تفتح التطبيقات الأصلية متجرها. تبقى القراءة والتنزيلات والبيانات المحفوظة محفوظة. راجع [دليل التحديث](../docs/app-updates.md).

## أدوات القراءة

اضغط مطولًا على كلمة، واضبط مقابض التحديد، ثم اختر القاموس. يوسّع زر الجملة التحديد إلى الجملة كاملة؛ ولا تفتح النقرات العادية القاموس. اسحب يمينًا من الحافة اليسرى للرجوع. تتيح الإعدادات ضبط حجم النص والقراءات العلوية بشكل مستقل مع معاينة فورية. يظهر اختيار المظهر والإعدادات بجوار عنوان المكتبة حتى على الهواتف الضيقة.

[docs/reading-controls.md](../docs/reading-controls.md)

## المحادثات داخل Bunko

اقرأ التعليقات العامة على المقاطع واكتبها داخل Bunko باستخدام تسجيل الدخول إلى GitHub. تبقى المسودات والملاحظات الخاصة على جهازك حتى تختار نشرها. تتولى خدمة سحابية صغيرة عملية التفويض دون الحاجة إلى تشغيل حاسوب المالك، ويحفظ GitHub المحادثات العامة. تدعم الواجهة الإنجليزية والصينية المبسطة والتقليدية واليابانية. يضيف الإصدار 1.0.6 (8) تسجيل دخول مستمرًا مع تخزين آمن على الجهاز وتجديد تلقائي للرموز، والتعافي من انقطاعات الاتصال القصيرة. أصبح إصدار iOS **1.0.8 (10)**، مع تطبيق Apple Watch المرافق، متاحًا للجمهور في 29 سبتمبر 2026. أصبح إصدار Mac **1.0.8 (10)** متاحًا للجمهور أيضًا في 30 سبتمبر 2026 بتوقيت هونغ كونغ. يبقى إصدار Android 1.0.9 (14) متاحًا في الاختبار الداخلي على Google Play؛ راجع سجلات الإصدار لمعرفة حالة النشر العام.

[تنفيذ المناقشات والتحقق منها](../docs/github-discussions-2026-09-26.md).

## Mac وApple Watch

يضيف الإصدار **1.0.8 (10)** تطبيقًا أصليًا مرافقًا لـApple Watch ويحدّث تطبيق Mac. أرسل مقتطفًا نصيًا متعدد اللغات من قارئ iPhone إلى الساعة المقترنة. تبقى آخر ثلاثة مقتطفات متاحة دون اتصال، مع التنقل بين الفقرات وتعديل حجم النص. تبقى الرسوم والمعادلات في القارئ الكامل على الهاتف وMac.

يدعم الرمز المحدّث ومساعد المستندات الخاص ملفات PDF وWord (.docx) وMarkdown والنص وTeX، والبحث عن الأوراق والأسئلة حول المستندات. نجحت عشرة اختبارات قراءة أصلية على Mac mini بمعالج M5 Pro، بما فيها الفتح دون اتصال وموضع القراءة والمعادلات والرسوم. تحققنا من النقل الحقيقي من تطبيق iPhone وإعادة التشغيل دون اتصال في محاكي Watch؛ لم نختبر ساعة فعلية بعد.

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## الاختبار والمراجعة

**2026-09-30 · 1.0.9 (14)** يستخدم الأيقونة المعتمدة، ببياض أكثر أسفل اليمين وخطوط زرقاء أوضح أعلى يسار الرمز 文. بقيت التصاميم السابقة محفوظة. نُشرت أيقونة الويب، والبناء 14 متاح في TestFlight لهواتف iPhone وأجهزة iPad وتطبيق Watch المرافق وMac، وكذلك في الاختبار الداخلي على Google Play.

أُرسل البناء 14 إلى Apple وGoogle للنشر التلقائي بعد الموافقة. الموافقة ما زالت قيد الانتظار؛ ويظل Apple 1.0.8 (10) الإصدار العام. تستخدم تعليمات مراجعة Google الآن حساب Bunko التجريبي المستقل، مع تعليقات ومحادثات مستندات حقيقية دون رمز يُرسل إلى بريد المالك. حُدّثت أيضًا إقرارات خصوصية مساعد المستندات.

تحتفظ مقتطفات Watch بالبينيين الصيني والفوريغانا اليابانية ومحاذاة اللغات جملة بجملة، مع حجمين مستقلين للنص والقراءات. أعد إرسال المقتطفات القديمة من تطبيق iPhone المحدّث. تظل اختبارات النقل بين المحاكيين المقترنين وإعادة التشغيل دون اتصال من البناء 13 صالحة لهذا التحديث الذي يغيّر الأيقونة فقط؛ لم تُختبر ساعة فعلية. نجحت اختبارات العميل الـ58 واختبارات الخادم الـ35 جميعها.

[سجل الإصدار](../store/artifacts/icon-release-1.0.9-14.json) · [وصول المراجعين](../store/reviewer-access.md) · [اختبارات Watch](../evidence/watch-ruby-20260930/qa.json)

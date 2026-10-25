[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*اقرأ بلغات متعددة، وابقَ قريبًا من الكتاب.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

يجمع Bunko كلاسيكيات الملكية العامة والكتب الأصلية المصرّح بتوزيعها في مكتبة متعددة اللغات. اقرأ مقاطع متقابلة مع بينيين وفوريغانا فوق النص، واحتفظ بالكتب المنزّلة للقراءة دون اتصال. يستخدم الأدب والسفر والتعلّم والكتب التقنية القارئ نفسه، مع الأشكال والمعادلات.

## اقرأ بطريقتك

- اختر لغة واحدة أو اعرض عدة لغات بالتناوب جملةً بجملة. يحدد ترتيب الاختيار اللغة الأساسية، وتبقى الترجمات مميزة بعناوين واضحة.
- اضبط حجم النص وعلامات النطق كلًا على حدة. اختر المظهر الفاتح أو الداكن أو إعداد النظام، واضغط مطولًا على كلمة لفتح القاموس.
- نزّل الكتب وحزم القواميس الاختيارية للإنجليزية والصينية واليابانية، ثم افتحها دون اتصال عند موضعك المحفوظ.
- اقرأ على iPhone وiPad وAndroid والويب وMac. أرسل مقتطفات متعددة اللغات مع علامات النطق إلى Apple Watch المقترنة.
- يمكن أن يحتوي الكتاب أي عدد من اللغات، ومنها اللغات المكتوبة من اليمين إلى اليسار. تتوفر الواجهة بالإنجليزية والصينية المبسطة والتقليدية واليابانية.

## مساعد بجانب الكتاب

يجمع مساعد القراءة سياق الكتاب التلقائي وإشارات @ المختصرة إلى الكتب والفصول والمقاطع، مع العودة إلى النص المحدد. استكشف علاقات الشخصيات عبر شبكة أو شجرة، والأماكن على خريطة جغرافية دون اتصال، والأحداث على خط زمني مؤرّخ. تظل المقاطع الداعمة متاحة في كل دليل.

**متاح في iOS وAndroid بالإصدار 1.0.14 (37). لا يزال Mac40 قيد المراجعة؛ إصدار Mac العام هو 1.0.13 (23). يُحدَّث قارئ الويب بصورة مستقلة.** تغطي الأدلة مقتطفات مختارة أو عيّنات، وقد لا تكون شاملة. تظهر الأماكن والتواريخ غير المؤكدة بوضوح. الصور أدناه لقطات فعلية للمكوّنات؛ تستخدم الخريطة والخط الزمني رحلة توضيحية موسومة بذلك. [تفاصيل المعاينة](../docs/reading-guides-preview.md).

**خرائط تاريخية قيد الاختبار الداخلي:** مناطق ملوّنة للمقاطعات، وعلامات بأسماء المدن، وأسئلة متابعة توسّع الخريطة المحفوظة. تتضمن طبقة هان الشرقية السنة المرجعية والمصادر. [تفاصيل الخريطة ومعاينتها](../docs/reading-tools-and-historical-maps.md).

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — component example" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## التشغيل والبناء

استخدم Node.js 22. ثبّت مجموعتي الاعتماديات، وشغّل الفحوص، ثم شغّل القارئ. يستخدم التطبيق React/TypeScript وCapacitor على iOS وAndroid، وAppKit/WebKit على Mac. تبقى بيانات التوقيع خارج Git.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

جهّز موارد الويب المضمّنة في حزم التطبيقات:

```sh
npm run build:native
npm run build:macos
```

## داخل المستودع

| المسار | المحتوى |
| --- | --- |
| [src/](../src/) | القارئ وتخطيط اللغات والتخزين المحلي وواجهة المساعد |
| [server/](../server/) | خدمات الحساب والنقاش والمساعد الاختياري |
| [ios/ · android/ · macos/](../ios/) | مشاريع المنصات ومرافق Apple Watch |
| [docs/](../docs/) | أدلة التحكم بالقراءة ونشر الكتب والمنصات |


## الكتب والنقاشات والخصوصية

توجد حزم الكتب وسجلات حقوقها في [bunko-books](https://github.com/lachlanchen/bunko-books)، منفصلة عن شيفرة التطبيق. يمكن إضافة طبعات متوافقة دون تحديث التطبيق. GitHub هو مصدر التنزيل الأساسي، مع بدائل عبر CDN وذاكرة تخزين مؤقت خاصة بالخدمة. تستخدم نقاشات المقاطع العامة تسجيل الدخول عبر GitHub؛ الملاحظات الخاصة والمسودات غير المنشورة ومحادثات المساعد الشخصية ليست تعليقات عامة. لا تتطلب قراءة الكتب المنزّلة اشتراكًا. قد تحتوي المواد الدراسية المولّدة على أخطاء؛ راجع النص المستشهد به. تعرض المتاجر الإصدارات العامة الحالية والتوفر حسب المنطقة.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## دعم Bunko

Bunko مشروع من LazyingArt. يساعد الدعم الطوعي في صيانة القارئ وأدوات المكتبة المفتوحة.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## الاستشهاد

إذا استخدمت Bunko في البحث، فاستشهد بهذا المستودع. يقرأ GitHub ملف [CITATION.cff](../CITATION.cff) لعرض لوحة الاستشهاد.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

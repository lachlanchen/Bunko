[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*Đọc qua nhiều ngôn ngữ, luôn gần với cuốn sách.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko tập hợp tác phẩm kinh điển thuộc phạm vi công cộng và sách nguyên tác đã được phép phân phối trong một thư viện đa ngôn ngữ. Đọc các đoạn tương ứng, xem pinyin và furigana phía trên chữ, và giữ sách đã tải để đọc ngoại tuyến. Văn học, du lịch, học tập và sách chuyên môn dùng chung trình đọc, giữ cả hình ảnh và công thức.

## Đọc theo cách của bạn

- Chọn một ngôn ngữ hoặc xen kẽ nhiều ngôn ngữ theo từng câu. Thứ tự chọn xác định ngôn ngữ chính; bản dịch vẫn có nhãn rõ ràng.
- Điều chỉnh riêng cỡ chữ và chú âm ruby. Dùng giao diện sáng, tối hoặc theo hệ thống; nhấn giữ một từ để tra từ điển.
- Tải sách và các gói từ điển tùy chọn cho tiếng Anh, Trung và Nhật. Mở lại ngoại tuyến tại vị trí đã lưu.
- Đọc trên iPhone, iPad, Android, web và Mac. Gửi trích đoạn đa ngôn ngữ có ruby đến Apple Watch đã ghép đôi.
- Sách có thể chứa số lượng ngôn ngữ bất kỳ, kể cả chữ viết từ phải sang trái. Giao diện hỗ trợ tiếng Anh, tiếng Trung giản thể, phồn thể và tiếng Nhật.

## Xem trước: trợ lý bên trang sách

Bản cập nhật thử nghiệm tiếp theo mở rộng ngữ cảnh sách tự động, tham chiếu @ gọn cho sách, chương và đoạn văn, cùng liên kết trở về đúng vị trí trong bản gốc. Khám phá quan hệ nhân vật bằng đồ thị hoặc cây, địa danh trên bản đồ địa lý ngoại tuyến và sự kiện trên dòng thời gian có ngày tháng. Các đoạn làm căn cứ luôn có thể mở từ hướng dẫn.

**Đây là bản xem trước thử nghiệm, không phải thông báo phát hành công khai.** Hướng dẫn chỉ bao quát các trích đoạn được chọn hoặc lấy mẫu và có thể chưa đầy đủ. Địa điểm và ngày tháng chưa chắc chắn được ghi rõ. Ảnh dưới đây chụp các thành phần giao diện thực; bản đồ và dòng thời gian dùng hành trình minh họa có nhãn. [Chi tiết bản xem trước](../docs/reading-guides-preview.md).

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — test preview" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## Chạy và biên dịch

Dùng Node.js 22. Cài cả hai bộ phụ thuộc, chạy kiểm tra rồi khởi động trình đọc. Ứng dụng dùng React/TypeScript, Capacitor trên iOS và Android, AppKit/WebKit trên Mac. Thông tin ký ứng dụng được giữ ngoài Git.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

Chuẩn bị tài nguyên web đóng gói trong ứng dụng native:

```sh
npm run build:native
npm run build:macos
```

## Cấu trúc kho mã

| Đường dẫn | Nội dung |
| --- | --- |
| [src/](../src/) | Trình đọc, bố cục ngôn ngữ, bộ nhớ đệm cục bộ và giao diện trợ lý |
| [server/](../server/) | Dịch vụ tài khoản, thảo luận và trợ lý tùy chọn |
| [ios/ · android/ · macos/](../ios/) | Dự án nền tảng và ứng dụng Apple Watch |
| [docs/](../docs/) | Hướng dẫn đọc, xuất bản sách và từng nền tảng |


## Sách, thảo luận và quyền riêng tư

Dữ liệu sách và hồ sơ quyền nằm trong [bunko-books](https://github.com/lachlanchen/bunko-books), tách khỏi mã ứng dụng. Có thể thêm ấn bản tương thích mà không cập nhật ứng dụng. GitHub là nguồn tải chính, với CDN và bộ nhớ đệm riêng làm dự phòng. Thảo luận công khai dùng đăng nhập GitHub; ghi chú riêng, bản nháp chưa đăng và hội thoại cá nhân với trợ lý không phải bình luận công khai. Đọc sách đã tải không cần thuê bao. Tài liệu học do mô hình tạo có thể sai; hãy kiểm tra đoạn được dẫn. Xem cửa hàng để biết bản công khai hiện tại và khu vực hỗ trợ.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Ủng hộ Bunko

Bunko là dự án của LazyingArt. Đóng góp tự nguyện giúp duy trì trình đọc và các công cụ thư viện mở.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Trích dẫn

Nếu dùng Bunko trong nghiên cứu, hãy trích dẫn kho mã này. GitHub đọc [CITATION.cff](../CITATION.cff) để hiển thị bảng trích dẫn.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

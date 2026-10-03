[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*Thư viện đa ngôn ngữ yên tĩnh, với cách đọc phía trên văn bản.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko là ứng dụng đọc tác phẩm kinh điển thuộc phạm vi công cộng bằng tiếng Trung, Nhật và Anh. Bạn có thể chọn ngôn ngữ và bố cục hiển thị, xem pinyin hoặc furigana phía trên chữ, rồi đọc các chương đã tải khi ngoại tuyến. Giao diện hỗ trợ tiếng Anh, Trung giản thể, Trung phồn thể và Nhật. Danh mục sách nằm ở kho [bunko-books](https://github.com/lachlanchen/bunko-books) riêng; kho này không chứa nội dung sách.

Sách có thể chứa số lượng ngôn ngữ tùy ý bằng thẻ ngôn ngữ chuẩn, gồm tiếng Ả Rập và các hệ chữ viết từ phải sang trái. Chọn những ngôn ngữ muốn xem; các đoạn tương ứng luôn đi cùng nhau. Ngôn ngữ của sách độc lập với bản dịch giao diện.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Ảnh trình đọc Bunko" width="300"></a></p>

## Tình trạng hiện tại · 3 tháng 10 năm 2026

iOS/Watch và Android 1.0.9 (14) đã phát hành; Mac 1.0.8 (10) vẫn được cung cấp. Bản mới 1.0.10 (16), gồm biểu tượng đã được duyệt, đã gửi Apple và Google để tự động phát hành sau khi được phê duyệt. Người xét duyệt dùng tài khoản Bunko Demo riêng, không cần mã xác minh email GitHub.

Các gói đám mây tùy chọn cho chuyển đổi PDF và câu trả lời AI đang được chuẩn bị với mức 2,99 / 14,99 / 29,99 USD mỗi tháng. Trang gói đã có nhưng chức năng mua chưa bật. Sách, từ điển và đọc ngoại tuyến vẫn nằm trong giá mua ứng dụng. Tải sách ưu tiên GitHub, tiếp theo là CDN công cộng, rồi mới đến bộ nhớ đệm riêng có giới hạn dung lượng.

[Biên nhận gửi duyệt](../store/artifacts/submission-1.0.10-16-20261003.json) · [Gói đám mây](../docs/cloud-subscriptions.md)

## Trong kho mã

| Đường dẫn | Mô tả |
| --- | --- |
| [`src/`](../src/) | Trình đọc, bố cục ruby, bộ nhớ ngoại tuyến và chủ đề |
| [`docs/catalogue.md`](../docs/catalogue.md) | Kiểm tra quyền và hướng dẫn xuất bản |
| [`store/`](../store/) | Trạng thái cửa hàng và bàn giao vận hành |

## Chạy trình đọc

Cài các gói phụ thuộc, chạy kiểm tra rồi mở máy chủ phát triển Vite. Bản ứng dụng gốc dùng Capacitor và thông tin ký riêng bên ngoài Git.

```sh
npm ci
npm run check
npm run dev
```

## Thư viện và bản phát hành

Danh mục trực tuyến hiện có 185 ấn bản đã được duyệt. Sách mới được xuất bản qua GitHub mà không cần tạo lại ứng dụng; thay đổi mã trình đọc vẫn cần bản web hoặc ứng dụng mới. Hồ sơ phát hành bên dưới ghi trạng thái từng nền tảng và các bản cập nhật đang xét duyệt.

[store/release.yaml](../store/release.yaml)

## Ủng hộ Bunko

Bunko là dự án LazyingArt. Nếu ứng dụng hữu ích cho việc đọc hoặc nghiên cứu, bạn có thể hỗ trợ công việc tiếp tục:

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Trích dẫn

Nếu sử dụng Bunko trong nghiên cứu, hãy trích dẫn kho này. GitHub đọc [CITATION.cff](../CITATION.cff) và hiển thị bảng trích dẫn.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## Phạm vi và phản hồi

Bản trình bày học tập do AI tạo có thể có lỗi. Danh mục chỉ xuất bản ấn bản hoàn chỉnh đã được kiểm tra; quy định phạm vi công cộng khác nhau theo lãnh thổ. Báo lỗi trình đọc tại [Bunko issues](https://github.com/lachlanchen/Bunko/issues), lỗi sách hoặc quyền tại [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues).
## Đọc bằng Bunko

Thư viện có 185 ấn bản đã được duyệt quyền, gồm tác phẩm kinh điển, ghi chú vật lý, sách học tập và tài chính, cùng cẩm nang du lịch đa ngôn ngữ. Sách có thể có một hoặc nhiều ngôn ngữ; công thức và hình ảnh vẫn hiển thị trên điện thoại.


Trang web và PWA đã cài đặt có liên kết cửa hàng tùy chọn phù hợp với thiết bị. Bạn có thể tiếp tục đọc tại đây; nút cửa hàng chỉ được bật sau khi xác minh ứng dụng đã phát hành công khai.

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Bunko dành cho Mac

Phiên bản 1.0.8 (10) đã có trên Mac App Store. Ứng dụng hỗ trợ macOS 12 trở lên, với menu gốc, phím tắt và đọc ngoại tuyến. Bản dựng hỗ trợ cả Intel và Apple silicon, với kết quả thử nghiệm chạy ứng dụng trên cả hai loại máy Mac. [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## Cập nhật ứng dụng

Bunko tự động kiểm tra bản cập nhật và hiển thị lời nhắc có thể để sau khi có bản phát hành công khai mới. Bạn cũng có thể kiểm tra thủ công trong Cài đặt. Bản web chỉ tải lại khi bạn chọn; ứng dụng gốc mở cửa hàng tương ứng. Việc đọc, tải xuống và dữ liệu đã lưu được giữ nguyên. Xem [hướng dẫn cập nhật](../docs/app-updates.md).

## Thao tác đọc

Nhấn giữ một từ, điều chỉnh tay nắm chọn văn bản rồi chọn Từ điển. Nút Câu mở rộng vùng chọn ra cả câu; chạm thông thường không mở từ điển. Vuốt sang phải trên trang để quay lại; thao tác từ mép trái vẫn hoạt động. Cài đặt cho phép chỉnh riêng cỡ chữ chính và chú âm ruby, kèm xem trước. Nút giao diện và Cài đặt nằm cạnh tiêu đề thư viện cả trên điện thoại hẹp.

[docs/reading-controls.md](../docs/reading-controls.md)

## Trò chuyện trong Bunko

Đăng nhập bằng GitHub để đọc và viết bình luận công khai về từng đoạn ngay trong Bunko. Bản nháp và ghi chú riêng ở lại trên thiết bị cho đến khi bạn chủ động đăng. Một dịch vụ đám mây nhỏ xử lý việc xác thực, không cần máy tính của chủ sở hữu hoạt động; GitHub lưu cuộc trò chuyện công khai. Giao diện hỗ trợ tiếng Anh, tiếng Trung giản thể, tiếng Trung phồn thể và tiếng Nhật. Phiên bản 1.0.6 (8) duy trì đăng nhập bằng bộ nhớ bảo mật và tự động làm mới mã truy cập, đồng thời khôi phục khi kết nối bị gián đoạn ngắn. iOS **1.0.8 (10)**, gồm ứng dụng đồng hành Apple Watch, đã phát hành công khai ngày 29 tháng 9 năm 2026. Mac **1.0.8 (10)** cũng đã phát hành công khai ngày 30 tháng 9 năm 2026 theo giờ Hồng Kông. Android 1.0.9 (14) tiếp tục có trong thử nghiệm nội bộ Google Play; xem hồ sơ phát hành để biết trạng thái bản chính thức.

[Triển khai và kiểm chứng tính năng thảo luận](../docs/github-discussions-2026-09-26.md).

## Mac và Apple Watch

Phiên bản **1.0.8 (10)** thêm ứng dụng đồng hành gốc cho Apple Watch và cập nhật ứng dụng Mac. Gửi trích đoạn văn bản đa ngôn ngữ từ trình đọc iPhone đến đồng hồ đã ghép đôi. Ba trích đoạn gần nhất được lưu ngoại tuyến, có chuyển đoạn và điều chỉnh cỡ chữ. Hình ảnh và công thức vẫn nằm trong trình đọc đầy đủ trên điện thoại và Mac.

Biểu tượng mới và trợ lý tài liệu riêng tư hỗ trợ PDF, Word (.docx), Markdown, văn bản và TeX, tìm bài nghiên cứu và hỏi về tài liệu. Mười kiểm tra gốc đã đạt trên Mac mini M5 Pro, gồm mở lại ngoại tuyến, vị trí đọc, công thức và hình ảnh. Trình mô phỏng Watch đã kiểm chứng truyền dữ liệu thật từ ứng dụng iPhone và khởi động lại khi ngắt kết nối; chưa kiểm tra đồng hồ thật.

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## Thử nghiệm và xét duyệt

**2026-09-30 · 1.0.9 (14)** dùng biểu tượng đã duyệt, trắng hơn ở góc dưới bên phải và rõ nét xanh hơn ở phía trên bên trái chữ 文. Mọi thiết kế trước đều được lưu giữ. Biểu tượng web đã phát hành; bản dựng 14 có trên TestFlight cho iPhone/iPad, ứng dụng đồng hành Watch và Mac, cùng thử nghiệm nội bộ Google Play.

Bản dựng 14 đã gửi Apple và Google để tự động phát hành sau khi được chấp thuận. Hiện vẫn chờ duyệt; bản công khai trên Apple là 1.0.8 (10). Hướng dẫn xét duyệt Google nay dùng tài khoản demo Bunko riêng, hỗ trợ bình luận và trò chuyện tài liệu thật mà không cần mã email của chủ sở hữu. Khai báo quyền riêng tư của trợ lý tài liệu cũng đã cập nhật.

Đoạn trích Watch giữ pinyin tiếng Trung, furigana tiếng Nhật và đối chiếu đa ngôn ngữ theo câu, với cỡ chữ chính và phiên âm riêng. Hãy gửi lại đoạn cũ từ ứng dụng iPhone đã cập nhật. Kiểm tra truyền giữa hai trình mô phỏng ghép đôi và khởi động lại ngoại tuyến của bản dựng 13 vẫn áp dụng cho lần chỉ đổi biểu tượng này; chưa kiểm thử Watch vật lý. Cả 58 kiểm thử phía ứng dụng và 35 kiểm thử máy chủ đều đạt.

[Hồ sơ phát hành](../store/artifacts/icon-release-1.0.9-14.json) · [Quyền truy cập xét duyệt](../store/reviewer-access.md) · [Kiểm thử Watch](../evidence/watch-ruby-20260930/qa.json)

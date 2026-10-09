[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# Bunko 文庫

*본문 위에 읽기 도움을 제공하는 조용한 다국어 도서관.*

[![Reader](https://img.shields.io/badge/Open-Bunko-303F68?style=for-the-badge)](https://lachlan.lazying.art/Bunko/) [![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

Bunko는 공개 도메인 중국어·일본어·영어 고전을 읽는 앱입니다. 표시 언어와 화면 구성을 고르고, 글자 위의 병음이나 후리가나를 보며, 다운로드한 장을 오프라인에서 읽을 수 있습니다. 인터페이스는 영어, 중국어 간체·번체, 일본어를 지원합니다. 책 목록은 별도 [bunko-books](https://github.com/lachlanchen/bunko-books)에 있으며 이 저장소에는 책 본문을 넣지 않습니다.

책은 표준 언어 태그를 사용해 원하는 수의 언어를 담을 수 있으며, 아랍어 등 오른쪽에서 왼쪽으로 쓰는 언어도 지원합니다. 표시할 언어를 선택하면 대응하는 구절을 함께 읽을 수 있습니다. 책의 언어와 인터페이스 번역은 서로 독립적입니다.

<p align="center"><a href="../store/assets/play-phone-01.png"><img src="../store/assets/play-phone-01.png" alt="Bunko 리더 화면" width="300"></a></p>

## 최신 심사 제출 · 2026년 10월 9일

Bunko 1.0.11 (18)을 iOS/Watch, Mac, Android 심사에 제출했습니다. Apple은 심사 대기, Google은 변경사항 심사 중입니다. 이전 Mac 심사를 교체했습니다. 승인된 둥근 아이콘과 다운로드 개선이 포함되며 승인 후 자동 출시됩니다.

[제출 및 검증 기록](../docs/latest-review-20261009.md)

## 현재 상태 · 2026년 10월 4일

iOS/Watch 1.0.10 (16)이 승인된 아이콘과 다국어 읽기 수정 사항을 포함해 정식 출시되었습니다. Mac 1.0.10 (16)은 심사 중이며 승인 후 자동 출시됩니다. 현재 Mac 공개 버전은 1.0.8 (10)입니다. Android 1.0.10 (17)은 개인정보 처리방침 수정 후 172개국에 출시되었으며 설정의 개인정보 링크와 안정적인 도서 다운로드를 제공합니다. 심사자는 GitHub 이메일 인증 코드가 필요 없는 별도 Bunko 데모 계정을 사용하며, Google은 보완된 로그인 안내도 승인했습니다.

PDF 변환과 AI 답변을 위한 선택형 클라우드 요금제를 월 US$2.99 / $14.99 / $29.99 수준으로 준비하고 있습니다. 요금제 화면은 제공되지만 구매는 비활성화되어 있습니다. 책, 사전, 오프라인 읽기는 앱 구매에 계속 포함됩니다. 책은 GitHub, 공개 CDN, 용량이 제한된 자체 캐시 순서로 다운로드합니다.

[출시 기록](../store/artifacts/distribution-apple-20261004.json) · [클라우드 요금제](../docs/cloud-subscriptions.md)

## 저장소 구성

| 경로 | 설명 |
| --- | --- |
| [`src/`](../src/) | 리더, 루비 배치, 오프라인 캐시, 테마 설정 |
| [`docs/catalogue.md`](../docs/catalogue.md) | 권리 검토와 출판 안내 |
| [`store/`](../store/) | 스토어 상태와 운영 인계 |

## 리더 실행

의존성을 설치하고 검사를 실행한 뒤 Vite 개발 서버를 시작하세요. 네이티브 빌드는 Capacitor와 Git 외부의 비공개 서명 자료를 사용합니다.

```sh
npm ci
npm run check
npm run dev
```

## 도서관과 릴리스

공개 목록에는 확인된 판본 185종이 있습니다. 새 책은 앱을 다시 빌드하지 않고 GitHub로 게시할 수 있습니다. 리더 코드가 바뀌면 웹 또는 네이티브 새 버전이 필요합니다. 플랫폼별 공개 상태와 업데이트 심사는 아래 릴리스 기록에서 확인하세요.

[store/release.yaml](../store/release.yaml)

## Bunko 후원

Bunko는 LazyingArt 프로젝트입니다. 독서나 연구에 도움이 되었다면 지속적인 작업을 후원할 수 있습니다.

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 인용

연구에 Bunko를 사용한다면 이 저장소를 인용하세요. GitHub는 [CITATION.cff](../CITATION.cff)를 읽어 인용 패널을 표시합니다.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

## 범위와 의견

AI가 생성한 학습용 번역에는 오류가 있을 수 있습니다. 목록에는 검토된 완결 판본만 게시하며 공개 도메인 기준은 지역마다 다릅니다. 리더 오류는 [Bunko issues](https://github.com/lachlanchen/Bunko/issues), 책이나 권리 문제는 [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)에 알려 주세요.
## Bunko에서 읽기

서재에는 권리를 확인한 판본 185종이 있습니다. 고전, 물리학 해설, 학습 및 금융 도서, 다국어 여행 안내서를 포함합니다. 한 언어 또는 여러 언어로 읽을 수 있으며 수식과 그림도 모바일에서 표시됩니다.


웹과 설치된 PWA에서 기기에 맞는 스토어 링크를 선택할 수 있습니다. 여기에서 계속 읽을 수 있으며, 스토어 버튼은 정식 공개를 확인한 뒤 활성화됩니다.

[Apple App Store](https://apps.apple.com/app/id6815137919) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko) · [Web reader](https://lachlan.lazying.art/Bunko/)

## Mac용 Bunko

1.0.8 (10)은 Mac App Store에서 공개되었습니다. macOS 12 이상에서 기본 메뉴, 키보드 단축키, 오프라인 읽기를 지원합니다. 범용 바이너리는 Intel과 Apple silicon을 지원하며, 두 종류의 Mac에서 실제 실행 테스트를 진행했습니다. [Mac App Store](https://apps.apple.com/us/app/bunko-classics-with-ruby/id6815137919?platform=mac)

[macOS — build & test](../docs/macos.md) · [App Store — review status](../store/macos/submission.md)

## 앱 업데이트

Bunko는 업데이트를 자동으로 확인하고 새 정식 버전이 있으면 나중으로 미룰 수 있는 안내를 표시합니다. 설정에서 직접 확인할 수도 있습니다. 웹 버전은 사용자가 선택할 때 다시 불러오며, 네이티브 앱은 스토어를 엽니다. 읽기 상태, 다운로드와 저장 데이터는 유지됩니다. [업데이트 안내](../docs/app-updates.md)를 참고하세요.

## 읽기 조작

단어를 길게 누르고 기본 선택 핸들로 범위를 조절한 뒤 사전을 선택하세요. 문장 버튼으로 문장 전체를 선택할 수 있으며 일반 탭은 사전을 열지 않습니다. 페이지에서 오른쪽으로 밀면 돌아갑니다. 왼쪽 가장자리에서 시작해도 됩니다. 설정에서 본문과 루비의 크기를 따로 조절하고 미리 볼 수 있습니다. 좁은 휴대폰에서도 테마와 설정이 서재 제목 옆에 표시됩니다.

[docs/reading-controls.md](../docs/reading-controls.md)

## Bunko 안에서 나누는 대화

GitHub로 로그인하면 Bunko 안에서 구절에 대한 공개 댓글을 읽고 작성할 수 있습니다. 초안과 비공개 메모는 직접 게시하기 전까지 기기에 보관됩니다. 작은 클라우드 서비스가 인증을 처리하므로 소유자의 컴퓨터를 켜 둘 필요가 없으며, 공개 대화는 GitHub에 저장됩니다. 화면은 영어, 중국어 간체·번체, 일본어를 지원합니다. 1.0.6 (8)는 안전한 기기 저장소와 자동 토큰 갱신으로 로그인을 유지하고 짧은 연결 장애에서 복구합니다. Apple Watch 앱을 포함한 iOS **1.0.8 (10)** 이 2026년 9월 29일 정식 출시되었습니다. Mac **1.0.8 (10)** 도 홍콩 시간 2026년 9월 30일 정식 출시되었습니다. Android 1.0.9 (14)은 Google Play 내부 테스트에서 계속 사용할 수 있으며, 정식 출시 상태는 출시 기록을 확인하세요.

[토론 기능 구현 및 검증](../docs/github-discussions-2026-09-26.md).

## Mac 및 Apple Watch

**1.0.8 (10)** 에 네이티브 Apple Watch 앱을 추가하고 Mac 앱을 업데이트했습니다. iPhone 리더에서 페어링된 시계로 다국어 텍스트 발췌문을 보낼 수 있습니다. 최근 세 개를 오프라인으로 보관하며 문단 이동과 글자 크기 조절을 지원합니다. 그림과 수식은 휴대폰과 Mac의 전체 리더에서 표시합니다.

새 아이콘과 비공개 문서 도우미는 PDF, Word(.docx), Markdown, 텍스트, TeX, 논문 검색과 문서 질문을 지원합니다. M5 Pro Mac mini에서 오프라인 재열기, 읽던 위치, 수식과 그림을 포함한 네이티브 검사 10개를 통과했습니다. Watch 시뮬레이터에서 실제 iPhone 앱 전송과 연결 해제 후 재시작을 검증했습니다. 실물 Watch는 아직 테스트하지 않았습니다.

[macOS](../docs/macos.md) · [watchOS](../docs/watchos.md) · [1.0.8](../store/artifacts/release-1.0.8.json)

## 테스트 기록 · 2026년 9월 30일

**2026-09-30 · 1.0.9 (14)** 는 오른쪽 아래를 더 하얗게 하고 文의 왼쪽 위 파란 획을 선명하게 한 승인된 아이콘을 사용합니다. 이전 디자인은 모두 보관합니다. 웹에는 새 아이콘을 배포했으며 빌드 14는 iPhone/iPad·Watch 연동 앱·Mac의 TestFlight와 Google Play 내부 테스트에서 이용할 수 있습니다.

빌드 14를 Apple과 Google에 제출했으며 승인 후 자동 출시됩니다. 아직 승인을 기다리고 있고 Apple의 공개 버전은 1.0.8 (10)입니다. Google 심사 안내는 별도의 Bunko 데모 계정을 사용하도록 갱신했습니다. 소유자에게 이메일 인증 코드를 요청하지 않고 실제 댓글과 문서 대화를 이용할 수 있습니다. 문서 도우미의 개인정보 신고도 갱신했습니다.

Watch 발췌문은 중국어 병음, 일본어 후리가나, 문장별 다국어 정렬과 별도의 본문·발음 글자 크기를 유지합니다. 이전 발췌문은 업데이트한 iPhone 앱에서 다시 보내세요. 이번에는 아이콘만 변경했으므로 빌드 13의 페어링한 시뮬레이터 전송 및 오프라인 재실행 검증을 이어 사용합니다. 실제 Watch 기기는 테스트하지 않았습니다. 클라이언트 테스트 58개와 서버 테스트 35개가 모두 통과했습니다.

[출시 기록](../store/artifacts/icon-release-1.0.9-14.json) · [심사 접근](../store/reviewer-access.md) · [Watch 검증](../evidence/watch-ruby-20260930/qa.json)

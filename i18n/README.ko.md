[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# Bunko 文庫

*언어를 넘나들며, 책에 더 가까이.*

[Web / PWA](https://lachlan.lazying.art/Bunko/) · [iPhone / iPad / Apple Watch](https://apps.apple.com/app/id6815137919) · [Mac App Store](https://apps.apple.com/app/id6815137919?platform=mac) · [Google Play](https://play.google.com/store/apps/details?id=art.lazying.bunko)

Bunko는 퍼블릭 도메인 고전과 배포 허가를 확인한 창작 도서를 한데 모은 다국어 서재입니다. 서로 대응하는 구절을 읽고, 글자 위의 병음과 후리가나를 확인하며, 내려받은 책을 오프라인에서도 읽을 수 있습니다. 문학·여행·학습·전문 도서 모두 같은 리더에서 그림과 수식까지 함께 보여 줍니다.

## 나에게 맞는 읽기

- 한 언어만 보거나 여러 언어를 문장별로 교차 표시할 수 있습니다. 선택 순서로 주 언어가 정해지며 번역에는 언어 표시가 남습니다.
- 본문과 루비 크기를 따로 조절합니다. 밝은 테마, 어두운 테마, 시스템 설정을 지원하며 단어를 길게 누르면 사전을 사용할 수 있습니다.
- 책과 선택 사항인 영어·중국어·일본어 사전 팩을 내려받으세요. 오프라인에서도 저장된 읽기 위치에서 다시 열 수 있습니다.
- iPhone, iPad, Android, 웹, Mac에서 읽고, 루비가 포함된 다국어 발췌문을 연결된 Apple Watch로 보낼 수 있습니다.
- 책에는 오른쪽에서 왼쪽으로 쓰는 언어를 포함해 여러 언어를 제한 없이 담을 수 있습니다. 인터페이스는 영어, 중국어 간체·번체, 일본어를 지원합니다.

## 미리 보기: 책 곁의 독서 도우미

다음 테스트 업데이트는 자동으로 이어지는 책 문맥, 책·장·구절을 지정하는 간결한 @ 참조, 정확한 원문 위치로 돌아가는 링크를 바탕으로 발전합니다. 인물 관계는 그래프나 트리로, 장소는 오프라인 지리 지도로, 사건은 날짜가 있는 타임라인으로 살펴볼 수 있습니다. 각 가이드의 근거 구절도 열어 볼 수 있습니다.

**테스트 미리 보기이며 정식 공개 안내가 아닙니다.** 가이드는 선택하거나 표본으로 뽑은 발췌문을 다루므로 전체를 포괄하지 않을 수 있습니다. 불확실한 장소와 날짜는 명확히 표시합니다. 아래 이미지는 실제 컴포넌트 화면이며 지도와 타임라인은 데모임을 표시한 여정을 사용합니다. [미리 보기 자세히](../docs/reading-guides-preview.md).

<p>
<a href="../docs/images/reading-guides-20261021/phone-graph-focused.png"><img src="../docs/images/reading-guides-20261021/phone-graph-focused.png" alt="Character relationships — test preview" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-map.png"><img src="../docs/images/reading-guides-20261021/phone-map.png" alt="Geographic map — demonstration journey" width="190"></a>
<a href="../docs/images/reading-guides-20261021/phone-timeline.png"><img src="../docs/images/reading-guides-20261021/phone-timeline.png" alt="Calendar timeline — demonstration journey" width="190"></a>
</p>

## 실행 및 빌드

Node.js 22를 사용하세요. 두 의존성 집합을 설치하고 검사를 실행한 다음 리더를 시작합니다. 앱은 React/TypeScript, iOS·Android의 Capacitor, Mac의 AppKit/WebKit을 사용합니다. 서명 자격 증명은 Git 밖에 보관합니다.

```sh
npm ci
npm ci --prefix server
npm run check
npm run dev
```

네이티브 패키지에 포함할 웹 리소스를 준비합니다:

```sh
npm run build:native
npm run build:macos
```

## 저장소 구성

| 경로 | 내용 |
| --- | --- |
| [src/](../src/) | 리더, 언어 배치, 로컬 캐시 및 도우미 UI |
| [server/](../server/) | 계정, 토론 및 선택적 도우미 서비스 |
| [ios/ · android/ · macos/](../ios/) | 플랫폼 프로젝트와 Apple Watch 앱 |
| [docs/](../docs/) | 읽기 조작, 도서 출판 및 플랫폼 안내 |


## 책, 토론 및 개인정보

책 데이터와 권리 기록은 앱 코드와 분리된 [bunko-books](https://github.com/lachlanchen/bunko-books)에 있습니다. 호환되는 새 판본은 앱 업데이트 없이 추가할 수 있습니다. GitHub를 기본 다운로드 경로로 사용하고 CDN과 자체 캐시를 보조 경로로 둡니다. 공개 구절 토론은 GitHub 로그인을 사용하며, 비공개 메모·미게시 초안·개인 도우미 대화는 공개 댓글이 아닙니다. 내려받은 책을 읽는 데 구독은 필요하지 않습니다. 생성된 학습 자료에는 오류가 있을 수 있으므로 인용 원문을 확인하세요. 현재 공개 버전과 지역별 제공 여부는 스토어에서 확인할 수 있습니다.

[Bunko issues](https://github.com/lachlanchen/Bunko/issues) · [bunko-books issues](https://github.com/lachlanchen/bunko-books/issues)

## Bunko 후원

Bunko는 LazyingArt 프로젝트입니다. 자발적 후원은 리더와 공개 도서관 도구를 유지하는 데 도움이 됩니다.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## 인용

연구에 Bunko를 사용한다면 이 저장소를 인용해 주세요. GitHub는 [CITATION.cff](../CITATION.cff)를 읽어 인용 패널을 제공합니다.

```bibtex
@software{chen_bunko_2026,
  author = {Chen, Lachlan},
  title = {Bunko: Classics with Ruby},
  year = {2026},
  url = {https://github.com/lachlanchen/Bunko}
}
```

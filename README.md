# DevTools Lab

Chrome DevTools 공식 문서 구조를 기준으로, 문서를 읽으면서 바로 옆 `LAB`에서 실습할 수 있도록 구성한 인터랙티브 학습 사이트입니다.

- Production: https://devtools-lab.vercel.app
- Stack: Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query
- Structure: Guide(Next.js) + `public/labs/*` static LAB

## 현재 상태 (2026-03-08)

### 구현 완료 범위

- 홈(`/`)
  - 패널 배너 캐러셀
  - 데스크톱/모바일 분기 레이아웃
  - `/about/environment` 환경 점검 페이지 연결
- Elements 계열
  - `/elements`
  - `/dom`
  - `/dom/properties`
  - `/dom/badges`
  - `/css`
  - `/css/issues`
  - `/css/color`
  - `/css/grid`
  - `/css/flexbox`
  - `/css/container-queries`
  - `/css/reference`
- Console 계열
  - `/console`
  - `/console/understand-messages`
  - `/console/log`
  - `/console/javascript`
  - `/console/live-expressions`
  - `/console/format-style`
  - `/console/reference`
  - `/console/api`
  - `/console/utilities`
- Placeholder 가이드 패널
  - `/sources`, `/network`, `/recorder`, `/performance`, `/memory`, `/application`, `/security`

### 현재 UX 규칙

- 헤더 대메뉴는 영어 표기 (`Elements`, `Console`, `Sources`, `Network` ...)
- 문서 페이지는 3열 구조 유지
  - 좌측: 공식 문서형 사이드바
  - 중앙: 문서 본문
  - 우측: `LAB` 또는 페이지 목차
- 실습 가능한 섹션에는 `{ / }` LAB 트리거 버튼 제공
- `LAB`은 문서 내용을 중복 렌더링하지 않고, 해당 섹션을 직접 조작할 수 있는 상태만 제공
- 개요 페이지는 `개요` 시나리오를 초기 LAB 상태로 사용
- 개요 외 페이지는 해당 페이지의 첫 번째 LAB 가능 섹션을 초기 상태로 사용

## 아키텍처

### 1. Guide 레이어

- 위치: `src/app`, `src/components`
- 역할:
  - 패널 문서 라우팅
  - 좌측 사이드바 / 본문 / 우측 LAB 레이아웃 렌더링
  - 공식 문서형 목차와 앵커 이동 제공

### 2. LAB 레이어

- 위치: `public/labs/*`
- 역할:
  - 패널별 정적 HTML/CSS/JS 실습 환경
  - iframe sandbox 내부에서 DOM/Console 예제 실행
  - Chii/Eruda 기반 Preview DevTools 연결

### 3. 문서 데이터 레이어

- 위치: `public/docs/*`
- 역할:
  - 공식 문서 본문을 정적 HTML로 보관
  - 런타임 실시간 크롤링 없이 로컬 정적 문서를 읽어 렌더링

## 정보구조

헤더와 패널 소메뉴 정보구조의 단일 소스는 `src/lib/devtoolsDocsMenu.ts`입니다.

### Elements 소메뉴 (11)

- 개요
- DOM 보기 및 변경
- DOM 객체의 속성 보기
- 배지 참조
- CSS 보기 및 변경
- 잘못된 CSS, 재정의된 CSS, 비활성 CSS 및 기타 CSS 찾기
- 색상 선택 도구로 CSS 색상 검사 및 디버그
- 그리드 검사
- Flexbox 검사 및 디버그
- 컨테이너 쿼리 검사 및 디버그
- CSS 기능 참조

### Console 소메뉴 (9)

- 개요
- 콘솔 통계로 오류 및 경고 이해하기
- 로그 메시지
- 자바스크립트 실행
- 실시간으로 자바스크립트 보기
- 메시지 서식 및 스타일 지정
- 기능 참조
- API 참조 문서
- Utilities API 참조

## 스타일/구현 원칙

- 전역 배경은 흰색 기준으로 유지
- 데스크톱과 모바일에서 같은 정보구조를 유지하되 레이아웃만 분기
- 모바일에서는 헤더, 사이드바, LAB 헤더가 겹치지 않도록 별도 대응
- 문서 본문은 공식 문서 톤을 우선
- LAB은 문서 예제를 그대로 조작 가능한 상태로 제공
- 공식 문서에 없는 임의 예제는 만들지 않음
- `Elements` / `Console`을 기준 품질로 삼고 이후 패널 확장

## SEO / 배포 설정

- favicon: `/branding/options/favicon-option-a-v6.svg`
- sitemap: `/sitemap.xml`
- robots: `/robots.txt`
- canonical / metadataBase / sitemap / robots host는 `src/lib/siteUrl.ts`를 통해 계산
- 우선순위:
  - `NEXT_PUBLIC_SITE_URL`
  - `VERCEL_PROJECT_PRODUCTION_URL`
  - `VERCEL_URL`
  - production fallback: `https://devtools-lab.vercel.app`
  - local fallback: `http://localhost:3000`

## 주요 파일

```text
src/
├── app/
│   ├── page.tsx
│   ├── about/environment/page.tsx
│   ├── elements/page.tsx
│   ├── dom/page.tsx
│   ├── dom/properties/page.tsx
│   ├── dom/badges/page.tsx
│   ├── css/*
│   ├── console/*
│   ├── sources/page.tsx
│   ├── network/page.tsx
│   ├── performance/page.tsx
│   ├── memory/page.tsx
│   ├── application/page.tsx
│   ├── security/page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── home/
│   ├── layout/
│   ├── guide/
│   └── labs/
│       ├── LabViewer.tsx
│       ├── LabTrigger.tsx
│       ├── elements/ElementsLabWorkspace.tsx
│       └── console/ConsoleLabWorkspace.tsx
└── lib/
    ├── devtoolsDocsMenu.ts
    ├── panels.ts
    └── siteUrl.ts

public/
├── docs/
│   ├── console-*.html
│   └── ...
├── labs/
│   ├── elements/
│   └── console/
└── branding/options/
```

## 실행

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 다음 우선순위

1. `Sources` 패널을 Elements/Console과 같은 문서+LAB 구조로 확장
2. `Network` 패널을 같은 구조로 확장
3. 공통 문서 정규화/추출 로직 유틸화
4. 미구현 패널 placeholder를 실제 문서형 워크스페이스로 순차 전환

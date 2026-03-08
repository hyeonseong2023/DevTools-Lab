# DevTools-Lab

Chrome DevTools 공식 문서 구조를 기준으로, 읽기와 실습을 한 화면에서 연결하는 인터랙티브 학습 사이트입니다.

## 현재 구현 상태

- Elements 계열 11개 페이지 구현
- Console 계열 9개 페이지 구현
- 홈(`/`) 및 환경 점검(`/about/environment`) 반응형 대응
- Sources / Network / Recorder / Performance / Memory / Application / Security는 가이드형 placeholder 상태
- 공용 `LAB` 트리거와 우측 LAB 패널 동작 정리 완료
- SEO / favicon / sitemap / robots 적용 완료

## 핵심 원칙

- 헤더 정보구조의 단일 소스는 `src/lib/devtoolsDocsMenu.ts`
- 공식 문서는 `public/docs/*.html` 정적 파일 기준으로 렌더링
- 문서 페이지는 좌측 사이드바 / 중앙 본문 / 우측 LAB 구조 유지
- `LAB`은 설명 복제가 아니라 직접 조작 가능한 상태만 제공
- 실습 가능한 섹션에만 `{ / }` 트리거 부여
- 데스크톱 스타일을 기준선으로 두고 모바일은 별도 분기

## 주요 경로

- 홈: `/`
- 환경 점검: `/about/environment`
- Elements: `/elements`, `/dom`, `/dom/properties`, `/dom/badges`, `/css/*`
- Console: `/console`, `/console/*`
- Placeholder: `/sources`, `/network`, `/recorder`, `/performance`, `/memory`, `/application`, `/security`

## 주요 파일

- `src/components/home/HomeOverviewHero.tsx`
- `src/components/layout/Header.tsx`
- `src/components/labs/LabViewer.tsx`
- `src/components/labs/LabTrigger.tsx`
- `src/components/labs/elements/ElementsLabWorkspace.tsx`
- `src/components/labs/console/ConsoleLabWorkspace.tsx`
- `src/lib/devtoolsDocsMenu.ts`
- `src/lib/siteUrl.ts`

## 명령어

- `npm run dev`
- `npm run lint`
- `npm run build`

## 작업 시 주의사항

- 문서 본문과 LAB 예제가 어긋나지 않도록 같이 수정할 것
- 헤더, 홈, 3열 레이아웃은 회귀 테스트를 같이 할 것
- 메뉴 구조를 바꾸면 문서 파일(`README.md`, `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`)도 같이 갱신할 것

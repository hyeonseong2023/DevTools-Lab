# DevTools-Lab Agent Guide (Codex)

이 문서는 Codex 작업 시 현재 프로젝트 상태와 구현 규칙을 정리한 작업 가이드입니다.

## 프로젝트 개요

- 프로젝트명: DevTools-Lab
- 목적: Chrome DevTools 학습을 위한 인터랙티브 문서 + 실습 플랫폼
- 핵심 구조: Guide(Next.js) + LAB(`public/labs` 정적 실습) 이중 구조
- 기준 레퍼런스: Chrome DevTools 공식 문서

## 현재 상태 (2026-03-08)

- 완료 패널
  - Elements 계열 11개
  - Console 계열 9개
- 가이드형 placeholder 패널
  - Sources, Network, Recorder, Performance, Memory, Application, Security
- 홈/환경 페이지
  - `/` 반응형 히어로
  - `/about/environment` 환경 점검 페이지
- 브랜딩/SEO
  - 커스텀 favicon 적용
  - `robots.txt`, `sitemap.xml`, OG/Twitter 메타 적용
  - `src/lib/siteUrl.ts`로 배포 URL 계산

## 핵심 UX 규칙

- 헤더 정보구조는 `src/lib/devtoolsDocsMenu.ts`를 단일 소스로 사용한다.
- 대메뉴는 영어 표기를 유지한다.
  - `Elements`, `Console`, `Sources`, `Network`, `Recorder`, `Performance`, `Memory`, `Application`, `Security`
- 문서 페이지는 3열 구조를 유지한다.
  - 좌측: 문서 사이드바
  - 중앙: 문서 본문
  - 우측: `LAB` 또는 페이지 목차
- 실습 가능한 섹션에만 `{ / }` LAB 트리거를 붙인다.
- `LAB`은 문서 설명을 중복 렌더링하지 않고, 해당 조작을 직접 실행할 수 있는 상태만 보여준다.
- 개요 페이지는 `개요` 시나리오를 초기 LAB 상태로 사용한다.
- 개요가 아닌 페이지는 첫 번째 LAB 가능 섹션을 초기 LAB 상태로 사용한다.

## 문서 데이터 원칙

- 공식 문서는 런타임에서 실시간 크롤링하지 않는다.
- `public/docs/*.html`에 정적 보관한 문서를 읽어 렌더링한다.
- 공식 문서의 섹션 구조, 앵커, 예제 흐름은 가능한 한 유지한다.
- author 카드, 상단 영상, 라이선스/업데이트/피드백 등 잡음은 제거할 수 있다.
- 공식 문서에 없는 임의 예제는 만들지 않는다.

## 헤더 메뉴 구조

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

## 기술 스택

- Framework: Next.js (App Router)
- Language: TypeScript
- UI: React + Tailwind CSS
- 상태관리: Zustand
- 데이터 페칭: TanStack Query
- DB/ORM: Vercel Postgres + Prisma
- 인증: NextAuth.js (Google OAuth)
- 배포: Vercel

## 주요 명령어

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`

## 디렉토리 요약

- `src/app/`: 페이지 및 메타 라우트
- `src/components/`: `home/`, `layout/`, `guide/`, `labs/`
- `src/lib/`: 메뉴, 패널 메타, SEO/URL 유틸
- `public/docs/`: 정적 문서 HTML
- `public/labs/`: 패널별 정적 LAB

## 작업 규칙

- 패널 단위로 작업한다. 한 번에 여러 패널을 동시에 크게 수정하지 않는다.
- `public/labs/` 실습 파일과 `src/app/` 가이드 페이지는 항상 함께 점검한다.
- 새 패널 작업 시 `Elements` 또는 `Console` 구조를 먼저 참고한다.
- 스타일 회귀가 나기 쉬운 영역은 다음 세 가지다.
  - 헤더
  - 홈 히어로
  - 문서 3열 레이아웃
- 헤더 메뉴 구조를 바꾸면 `README.md`, `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`를 함께 갱신한다.

## 세션 운영

- 긴 작업은 `HANDOFF.md`에 진행 상황을 갱신한다.
- 다음 세션 시작 시 `README.md`와 `HANDOFF.md`를 먼저 확인한다.

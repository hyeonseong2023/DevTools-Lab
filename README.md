# Chrome DevTools Guide

Chrome DevTools 공식 문서 구조를 기준으로, 문서를 읽으면서 바로 옆 `LAB`에서 실습할 수 있는 인터랙티브 학습 사이트입니다.

- Production: https://developer-chrome-guide.vercel.app
- Stack: Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query
- Structure: Guide(Next.js) + `public/labs/*` static LAB

## 현재 구현 상태 (2026-03-08)

### 구현 완료 범위

- 홈(`/`) 반응형 히어로 및 `/about/environment` 환경 점검 페이지
- Elements 계열 11개 페이지
- Console 계열 9개 페이지
- 가이드형 placeholder 패널: `Sources`, `Network`, `Performance`, `Memory`, `Application`, `Security`, `Lighthouse`

### 검증 상태

- `npm run lint` 통과
- `npm run build` 통과
- 주요 라우트 응답 200 확인

## 아키텍처 개요

- Guide 레이어: `src/app`, `src/components`
- LAB 레이어: `public/labs/*`
- 문서 데이터 레이어: `public/docs/*` 정적 HTML

## 공식 문서 기준 URL (Network)

- 개요: `https://developer.chrome.com/docs/devtools/network/overview?hl=ko`
- 기능 참조: `https://developer.chrome.com/docs/devtools/network/reference?hl=ko`
- 페이지 리소스: `https://developer.chrome.com/docs/devtools/resources?hl=ko`

## 실행

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 디렉토리 요약

```text
src/
├── app/
├── components/
└── lib/

public/
├── docs/
└── labs/
```

## 로드맵

다음 로드맵은 현재 탭 정보구조(`Elements → Console → Sources → Network → Performance → Memory → Application → Security → Lighthouse`) 기준으로 정리했습니다.

### 1개월차 - 기반 구축 + 핵심 패널 2개 완성

> 목표: "실제로 쓸 수 있는 교육 플랫폼" 만들기

#### 1주차 - 문서화 + 빈 사이트 배포

목표: 구조 확정 / 기술 스택 확정 / 기본 라우팅 구성 / Vercel 배포 완료

작업:
- README 작성
- 아키텍처 다이어그램 작성
- 패널 목록 정의
- 기본 레이아웃 (Header + Sidebar)
- 각 패널 페이지 빈 화면 생성
- `/public/labs` 폴더 생성
- 배포 완료

결과물:
- 실제 접속 가능한 사이트
- 모든 패널 메뉴는 있으나 내용은 "Coming Soon"

#### 2주차 - Elements 패널 MVP

목표: 첫 번째 완성 패널 출시

작업:
- elements 전용 lab 페이지 작성
- 단순 DOM 구조 설계
- DOM 편집 실습 가이드 작성
- 하이라이트 연습 구조
- 체크리스트 UI 제작

결과: Elements 패널 완성 - 사용자가 실제로 DevTools 열어서 실습 가능

#### 3주차 - Console 패널

목표: 코드 실행 + 에러 디버깅 실습

작업:
- 동적 JS 실행 환경
- sourceURL 적용
- 의도적 에러 버튼 구현
- try/catch 학습 구조
- Console 실습 가이드 작성

결과: Console 패널 완성

#### 4주차 - Sources 패널 MVP

목표: 브레이크포인트 기반 디버깅 학습 시작

작업:
- 함수 체인 코드 작성
- 브레이크포인트 실습 구조
- Call Stack 실습
- async 디버깅 실습

결과: Sources 패널 기본 디버깅 흐름 완성

### 2개월차 - 고급 패널 + 실습 품질 향상

> 목표: DevTools의 "디버깅 영역" 완성

#### 5주차 - Network 패널 MVP

목표: 네트워크 요청 100% 통제

작업:
- `/api/labs/network` route 생성
- 버튼 클릭 → fetch 발생
- 상태코드 실습
- 캐시 비교 실습
- Network 분석 단계 가이드

결과: 실제 요청 분석 가능

#### 6주차 - Performance 패널

작업:
- 의도적 프레임 드랍 코드
- heavy loop 실습
- 애니메이션 비교
- Performance 분석 가이드

결과: 성능 분석 실습 가능

#### 7주차 - Memory 패널

작업:
- 이벤트 리스너 누수 코드
- setInterval 누수
- Heap Snapshot 가이드
- Detached DOM 실습

결과: 메모리 분석 가능

#### 8주차 - Application 패널

작업:
- localStorage 실습
- sessionStorage 실습
- 쿠키 조작
- 서비스워커 등록 예제

결과: 저장소 분석 실습 가능

### 3개월차 - 완성도 + 커뮤니티 + 확장

> 목표: "학습 플랫폼"에서 "지속 가능한 서비스"로

#### 9주차 - Security 패널

작업:
- 혼합 콘텐츠 페이지
- self-signed cert 예제 설명
- CSP 예제
- 보안 경고 분석 가이드

결과: 보안 분석 실습 가능

#### 10주차 - Lighthouse 패널

작업:
- Lighthouse 측정 시나리오 설계
- 성능/접근성/SEO 지표 읽기 가이드
- 개선 전/후 비교 실습 흐름 정리
- 결과 리포트 해석 기준 정리

결과: Lighthouse 기반 품질 점검 루프 확보

#### 11주차 - 커뮤니티 기능

작업:
- Vercel Postgres + Prisma 연동
- NextAuth.js Google OAuth 설정
- 팁 등록 UI (로그인 시에만 작성/수정/삭제 가능)
- 패널별 팁 목록 (비로그인 열람 가능)

결과: 사용자 간 팁 공유 가능

#### 12주차 - 최종 안정화 + 문서화

작업:
- 전체 패널 QA
- iframe 통신 개선
- 성능 최적화
- 모바일 최소 대응
- 프로젝트 문서화 정리
- 발표 자료 제작
- 최종 데모 시나리오 구성

결과: 프로젝트 완성 및 배포 안정화 완료

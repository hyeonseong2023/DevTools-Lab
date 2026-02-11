# DevTools-Lab

Chrome DevTools 학습을 위한 인터랙티브 실습 플랫폼

---

## 주요 기능

### Guide Platform

- 패널별 학습 페이지 (Elements / Network / Sources 등)
- 단계별 실습 가이드
- 사용자 공략/팁 등록 시스템
- 패널별 커뮤니티 피드

### Labs

- iframe 기반 실습 샌드박스
- 패널별 전용 실습 페이지 분리
- 네트워크 요청 시뮬레이션
- 에러/메모리 누수/프레임드랍 유도 코드
- 브레이크포인트 실습 코드
- 서비스워커 실습 환경

---

## 기술 스택

### Frontend

- **Framework:** Next.js (App Router)
- **UI:** React
- **Language:** TypeScript
- **Styling:** Tailwind + ShadCN
- **상태관리:** Zustand
- **데이터 페칭:** TanStack Query

### 실습 환경

- `/public/labs` 정적 HTML/CSS/JS
- iframe sandbox 사용
- Blob / sourceURL 활용

### 배포

- Vercel

---

## 브랜치 전략

- **`main`** - 항상 배포 가능한 상태 유지, Vercel 프로덕션 배포 연결
- **`feature/*`** - 작업 단위 브랜치 (`feature/elements-panel`, `feature/community-ui` 등)

### 워크플로우

1. `feature/*` 브랜치에서 작업
2. PR 생성 → Vercel Preview 배포로 변경사항 확인
3. 확인 후 `main`에 merge → 프로덕션 자동 배포

### 커밋 컨벤션

```
feat: Elements 패널 실습 페이지 추가
fix: iframe sandbox 통신 오류 수정
docs: README 로드맵 업데이트
style: Sidebar 반응형 스타일 수정
refactor: LabViewer 컴포넌트 분리
```

### 환경 변수

- `.env.local` - 로컬 개발용 (`.gitignore`에 포함, push 안 됨)
- Vercel 대시보드 > Settings > Environment Variables에서 Production / Preview 환경 분리 관리

---

## 시작하기

```bash
git clone https://github.com/hyeonseong2023/DevTools-Lab.git
cd DevTools-Lab
npm install
npm run dev
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── tips/route.ts              # 사용자 팁 목록
│   │   ├── tips/[id]/route.ts
│   │   └── labs/
│   │       ├── network/route.ts       # 네트워크 실습용 API
│   │       └── performance/route.ts   # 성능 실습용 API
│   │
│   ├── elements/page.tsx
│   ├── console/page.tsx
│   ├── network/page.tsx
│   ├── sources/page.tsx
│   ├── performance/page.tsx
│   ├── memory/page.tsx
│   ├── application/page.tsx
│   ├── security/page.tsx
│   │
│   ├── community/
│   │   ├── page.tsx
│   │   └── [panel]/page.tsx
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── guide/
│   │   ├── StepGuide.tsx
│   │   ├── HintBox.tsx
│   │   └── PanelIntro.tsx
│   │
│   ├── labs/
│   │   ├── LabViewer.tsx              # iframe 래퍼
│   │   └── LabController.tsx          # 실습 제어
│   │
│   ├── community/
│   │   ├── TipCard.tsx
│   │   └── TipEditor.tsx
│   │
│   └── ui/
│       ├── Badge.tsx
│       ├── Tabs.tsx
│       ├── Modal.tsx
│       └── Skeleton.tsx
│
├── features/
│   ├── tips/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   └── store.ts
│   │
│   ├── panels/
│   │   ├── hooks.ts
│   │   └── config.ts
│   │
│   └── labs/
│       ├── api.ts
│       ├── hooks.ts
│       └── store.ts
│
├── store/
│   └── uiStore.ts
│
├── lib/
│   ├── types.ts
│   ├── constants.ts
│   ├── panelConfig.ts
│   └── utils.ts
```

### Labs 구조 (`public` 폴더)

```
public/
└── labs/
    ├── elements/
    │   ├── index.html
    │   ├── styles.css
    │   └── app.js
    │
    ├── console/
    │   ├── index.html
    │   └── app.js
    │
    ├── network/
    │   ├── index.html
    │   └── app.js
    │
    ├── sources/
    │   ├── index.html
    │   └── app.js
    │
    ├── performance/
    │   ├── index.html
    │   └── app.js
    │
    ├── memory/
    │   ├── index.html
    │   └── app.js
    │
    ├── application/
    │   ├── index.html
    │   └── app.js
    │
    └── security/
        ├── index.html
        └── app.js
```

---

## 데이터 흐름 구조

```
사용자
  ↓
Guide Page (Next)
  ↓
LabViewer (iframe)
  ↓
/public/labs/*
  ↓
DevTools로 실습
```

---

## 패널별 실습 설계 방식

| 패널 | 실습 방식 |
|------|-----------|
| Elements | DOM 구조 단순화 + 클릭 하이라이트 |
| Console | sourceURL 붙인 동적 코드 실행 |
| Network | 버튼 클릭 → API route 호출 |
| Sources | 의도적 함수 체인 + 브레이크포인트 |
| Performance | 프레임 드랍 애니메이션 |
| Memory | 이벤트 리스너 누수 |
| Application | localStorage, cookie, SW |
| Security | 혼합 콘텐츠 예제 |

---

## 로드맵

### 1개월차 - 기반 구축 + 핵심 패널 2개 완성

> **목표:** "실제로 쓸 수 있는 교육 플랫폼" 만들기

#### 1주차 - 문서화 + 빈 사이트 배포

**목표:** 구조 확정 / 기술 스택 확정 / 기본 라우팅 구성 / Vercel 배포 완료

**작업:**
- README 작성
- 아키텍처 다이어그램 작성
- 패널 목록 정의
- 기본 레이아웃 (Header + Sidebar)
- 각 패널 페이지 빈 화면 생성
- `/public/labs` 폴더 생성
- 배포 완료

**결과물:**
- 실제 접속 가능한 사이트
- 모든 패널 메뉴는 있으나 내용은 "Coming Soon"

#### 2주차 - Elements 패널 MVP

**목표:** 첫 번째 완성 패널 출시

**작업:**
- elements 전용 lab 페이지 작성
- 단순 DOM 구조 설계
- DOM 편집 실습 가이드 작성
- 하이라이트 연습 구조
- 체크리스트 UI 제작

**결과:** Elements 패널 완성 - 사용자가 실제로 DevTools 열어서 실습 가능

#### 3주차 - Console 패널

**목표:** 코드 실행 + 에러 디버깅 실습

**작업:**
- 동적 JS 실행 환경
- sourceURL 적용
- 의도적 에러 버튼 구현
- try/catch 학습 구조
- Console 실습 가이드 작성

**결과:** Console 패널 완성

#### 4주차 - Network 패널 MVP

**목표:** 네트워크 요청 100% 통제

**작업:**
- `/api/labs/network` route 생성
- 버튼 클릭 → fetch 발생
- 상태코드 실습
- 캐시 비교 실습
- Network 분석 단계 가이드

**결과:** 실제 요청 분석 가능

---

### 2개월차 - 고급 패널 + 실습 품질 향상

> **목표:** DevTools의 "디버깅 영역" 완성

#### 5주차 - Sources 패널

**작업:**
- 함수 체인 코드 작성
- 브레이크포인트 실습 구조
- Call Stack 실습
- async 디버깅 실습

**결과:** 브레이크포인트 학습 가능

#### 6주차 - Performance 패널

**작업:**
- 의도적 프레임 드랍 코드
- heavy loop 실습
- 애니메이션 비교
- Performance 분석 가이드

**결과:** 성능 분석 실습 가능

#### 7주차 - Memory 패널

**작업:**
- 이벤트 리스너 누수 코드
- setInterval 누수
- Heap Snapshot 가이드
- Detached DOM 실습

**결과:** 메모리 분석 가능

#### 8주차 - Application 패널

**작업:**
- localStorage 실습
- sessionStorage 실습
- 쿠키 조작
- 서비스워커 등록 예제

**결과:** 저장소 분석 실습 가능

---

### 3개월차 - 완성도 + 커뮤니티 + 확장

> **목표:** "학습 플랫폼"에서 "지속 가능한 서비스"로

#### 9주차 - Security 패널

**작업:**
- 혼합 콘텐츠 페이지
- self-signed cert 예제 설명
- CSP 예제
- 보안 경고 분석 가이드

**결과:** 보안 분석 실습 가능

#### 10주차 - 커뮤니티 기능

**작업:**
- 팁 등록 UI
- 패널별 팁 목록
- 관리자 승인 구조 (임시 in-memory)

**결과:** 사용자 간 팁 공유 가능

#### 11주차 - 최종 안정화 + UX 개선

**작업:**
- 전체 패널 QA
- iframe 통신 개선
- 성능 최적화
- 모바일 최소 대응
- Lighthouse 측정

**결과:** 전체 패널 안정화 및 배포 완료

#### 12주차 - 마무리 + 문서화 + 발표 준비

**작업:**
- 11주차 미완료 항목 마무리
- 프로젝트 문서화 정리
- 발표 자료 제작
- 최종 데모 시나리오 구성

**결과:** 프로젝트 완성 및 발표 준비 완료

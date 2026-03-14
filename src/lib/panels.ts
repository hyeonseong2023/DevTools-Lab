export const PANEL_SLUGS = [
  "elements",
  "console",
  "sources",
  "network",
  "performance",
  "memory",
  "application",
  "security",
  "lighthouse",
] as const;

export type PanelSlug = (typeof PANEL_SLUGS)[number];

export interface PanelDefinition {
  slug: PanelSlug;
  name: string;
  description: string;
}

export const PANEL_DEFINITIONS: PanelDefinition[] = [
  {
    slug: "elements",
    name: "Elements",
    description: "DOM 구조 확인, 스타일 수정, 레이아웃 디버깅을 학습합니다.",
  },
  {
    slug: "console",
    name: "Console",
    description: "에러 로그 분석, 코드 실행, 디버깅 출력을 연습합니다.",
  },
  {
    slug: "sources",
    name: "Sources",
    description: "브레이크포인트, Call Stack, 변수 상태 추적을 실습합니다.",
  },
  {
    slug: "network",
    name: "Network",
    description: "요청/응답 흐름, 상태 코드, 캐시 동작을 분석합니다.",
  },
  {
    slug: "performance",
    name: "Performance",
    description: "프레임 드랍과 병목 구간을 확인하고 최적화를 연습합니다.",
  },
  {
    slug: "memory",
    name: "Memory",
    description: "메모리 누수 패턴과 Heap Snapshot 분석을 학습합니다.",
  },
  {
    slug: "application",
    name: "Application",
    description: "Local Storage, Cookie, Service Worker 상태를 확인합니다.",
  },
  {
    slug: "security",
    name: "Security",
    description: "혼합 콘텐츠, 인증서, 보안 헤더 점검 포인트를 학습합니다.",
  },
  {
    slug: "lighthouse",
    name: "Lighthouse",
    description: "Lighthouse 리포트로 성능, 접근성, SEO 개선 포인트를 확인합니다.",
  },
];

export function getPanelBySlug(slug: string) {
  return PANEL_DEFINITIONS.find((panel) => panel.slug === slug);
}

export function getPanelOrThrow(slug: PanelSlug) {
  const panel = getPanelBySlug(slug);

  if (!panel) {
    throw new Error(`Unknown panel slug: ${slug}`);
  }

  return panel;
}

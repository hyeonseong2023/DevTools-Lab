export interface DevtoolsDocsItem {
  label: string;
  href: string;
  external?: boolean;
  deprecated?: boolean;
}

export interface DevtoolsDocsSection {
  title?: string;
  items: DevtoolsDocsItem[];
}

export interface DevtoolsDocsGroup {
  id: string;
  label: string;
  href?: string;
  matchPaths?: string[];
  sections: DevtoolsDocsSection[];
}

export const DEVTOOLS_DOCS_MENU: DevtoolsDocsGroup[] = [
  {
    id: "elements",
    label: "Elements",
    href: "/elements",
    matchPaths: ["/elements", "/dom", "/css"],
    sections: [
      {
        title: "개요",
        items: [
          {
            label: "개요",
            href: "/elements",
          },
        ],
      },
      {
        title: "DOM",
        items: [
          {
            label: "DOM 보기 및 변경",
            href: "/dom",
          },
          {
            label: "DOM 객체의 속성 보기",
            href: "/dom/properties",
          },
          {
            label: "배지 참조",
            href: "/dom/badges",
          },
        ],
      },
      {
        title: "CSS",
        items: [
          {
            label: "CSS 보기 및 변경",
            href: "/css",
          },
          {
            label: "잘못된 CSS, 재정의된 CSS, 비활성 CSS 및 기타 CSS 찾기",
            href: "/css/issues",
          },
          {
            label: "색상 선택 도구로 CSS 색상 검사 및 디버그",
            href: "/css/color",
          },
          {
            label: "그리드 검사",
            href: "/css/grid",
          },
          {
            label: "Flexbox 검사 및 디버그",
            href: "/css/flexbox",
          },
          {
            label: "컨테이너 쿼리 검사 및 디버그",
            href: "/css/container-queries",
          },
          {
            label: "CSS 기능 참조",
            href: "/css/reference",
          },
        ],
      },
    ],
  },
  {
    id: "console",
    label: "Console",
    href: "/console",
    matchPaths: [
      "/console",
      "/console/understand-messages",
      "/console/log",
      "/console/javascript",
      "/console/live-expressions",
      "/console/format-style",
      "/console/reference",
      "/console/utilities",
      "/console/api",
    ],
    sections: [
      {
        items: [
          {
            label: "개요",
            href: "/console",
          },
          {
            label: "콘솔 통계로 오류 및 경고 이해하기",
            href: "/console/understand-messages",
          },
          {
            label: "로그 메시지",
            href: "/console/log",
          },
          {
            label: "자바스크립트 실행",
            href: "/console/javascript",
          },
          {
            label: "실시간으로 자바스크립트 보기",
            href: "/console/live-expressions",
          },
          {
            label: "메시지 서식 및 스타일 지정",
            href: "/console/format-style",
          },
          {
            label: "기능 참조",
            href: "/console/reference",
          },
          {
            label: "API 참조 문서",
            href: "/console/api",
          },
          {
            label: "Utilities API 참조",
            href: "/console/utilities",
          },
        ],
      },
    ],
  },
  {
    id: "sources",
    label: "Sources",
    href: "/sources",
    matchPaths: [
      "/sources",
      "/sources/javascript",
      "/sources/breakpoints",
      "/sources/workspaces",
      "/sources/snippets",
      "/sources/reference",
      "/sources/overrides",
    ],
    sections: [
      {
        items: [
          {
            label: "개요",
            href: "/sources",
          },
          {
            label: "자바스크립트 디버깅 시작하기",
            href: "/sources/javascript",
          },
          {
            label: "중단점을 사용하여 코드 일시중지",
            href: "/sources/breakpoints",
          },
          {
            label: "작업공간에서 파일 수정 및 저장하기",
            href: "/sources/workspaces",
          },
          {
            label: "자바스크립트 스니펫 실행",
            href: "/sources/snippets",
          },
          {
            label: "자바스크립트 디버깅 참조",
            href: "/sources/reference",
          },
          {
            label: "로컬에서 웹 콘텐츠 및 HTTP 응답 헤더 재정의",
            href: "/sources/overrides",
          },
        ],
      },
    ],
  },
  {
    id: "network",
    label: "Network",
    href: "/network",
    matchPaths: ["/network"],
    sections: [
      {
        items: [
          {
            label: "네트워크 활동 검사",
            href: "https://developer.chrome.com/docs/devtools/network?hl=ko",
            external: true,
          },
          {
            label: "네트워크 기능 참조",
            href: "https://developer.chrome.com/docs/devtools/network/reference?hl=ko",
            external: true,
          },
          {
            label: "페이지 리소스 보기",
            href: "https://developer.chrome.com/docs/devtools/resources?hl=ko",
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    href: "/performance",
    matchPaths: ["/performance"],
    sections: [
      {
        items: [
          {
            label: "웹사이트 속도 최적화",
            href: "https://developer.chrome.com/docs/devtools/lighthouse?hl=ko",
            external: true,
          },
          {
            label: "런타임 성능 분석",
            href: "https://developer.chrome.com/docs/devtools/performance?hl=ko",
            external: true,
          },
          {
            label: "성능 기능 참조",
            href: "https://developer.chrome.com/docs/devtools/performance/reference?hl=ko",
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "memory",
    label: "Memory",
    href: "/memory",
    matchPaths: ["/memory"],
    sections: [
      {
        items: [
          {
            label: "메모리 문제 해결",
            href: "https://developer.chrome.com/docs/devtools/memory-problems?hl=ko",
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "application",
    label: "Application",
    href: "/application",
    matchPaths: ["/application"],
    sections: [
      {
        items: [
          {
            label: "프로그레시브 웹 앱 디버그",
            href: "https://developer.chrome.com/docs/devtools/progressive-web-apps?hl=ko",
            external: true,
          },
          {
            label: "로컬 저장소 보기 및 수정하기",
            href: "https://developer.chrome.com/docs/devtools/storage/localstorage?hl=ko",
            external: true,
          },
          {
            label: "쿠키 보기, 추가, 수정, 삭제",
            href: "https://developer.chrome.com/docs/devtools/application/cookies?hl=ko",
            external: true,
          },
          {
            label: "오리진 트라이얼 정보 보기",
            href: "https://developer.chrome.com/docs/devtools/application/frames?hl=ko",
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    href: "/security",
    matchPaths: ["/security"],
    sections: [
      {
        items: [
          {
            label: "보안 문제 이해하기",
            href: "https://developer.chrome.com/docs/devtools/security?hl=ko",
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "lighthouse",
    label: "Lighthouse",
    href: "/lighthouse",
    matchPaths: ["/lighthouse"],
    sections: [
      {
        items: [
          {
            label: "웹사이트 속도 최적화",
            href: "https://developer.chrome.com/docs/devtools/lighthouse?hl=ko",
            external: true,
          },
        ],
      },
    ],
  },
];

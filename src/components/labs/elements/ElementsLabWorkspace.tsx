"use client";

import {
  createLabTriggerButton,
  LAB_TRIGGER_DOC_BUTTON_CLASS_NAME,
  LabTriggerButton,
} from "@/components/labs/LabTrigger";
import { LabViewer } from "@/components/labs/LabViewer";
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

type TopicId =
  | "elements-overview"
  | "dom-view-edit"
  | "dom-properties"
  | "badges-reference"
  | "css-view-edit"
  | "css-issues"
  | "css-color"
  | "css-grid"
  | "css-flexbox"
  | "css-container-queries"
  | "css-reference";

type TopicCategory = "요소" | "DOM" | "CSS";

interface TopicDoc {
  id: TopicId;
  label: string;
  category: TopicCategory;
  concept: string;
  details: string[];
  usage: string[];
  example: string;
}

interface PageContentsSection {
  id: string;
  label: string;
}

const TOPIC_DOCS: TopicDoc[] = [
  {
    id: "elements-overview",
    label: "개요",
    category: "요소",
    concept:
      "Elements 패널은 페이지의 DOM과 CSS를 검사하고 즉시 수정하면서 렌더링 결과를 확인하는 DevTools의 기본 작업 공간입니다.",
    details: [
      "Elements 트리에서 노드를 선택하면 오른쪽 패널이 선택 대상 기준으로 동기화되고, DOM 구조를 직접 편집할 수 있습니다.",
      "Styles 탭에서 규칙을 수정하고, Computed 탭에서 최종 적용값을 확인해 CSS 충돌 여부를 빠르게 좁힐 수 있습니다.",
      "Layout 탭은 Grid/Flex/간격 오버레이를 통해 시각적으로 레이아웃을 점검할 수 있게 해줍니다.",
      "Event Listeners, DOM Breakpoints, Properties, Accessibility 탭으로 동작, 상태, 접근성까지 한 화면에서 이어서 분석할 수 있습니다.",
    ],
    usage: [
      "요소 선택 도구 또는 DOM 트리에서 대상 노드를 선택합니다.",
      "DOM 또는 속성을 임시로 수정해 변경 의도를 먼저 검증합니다.",
      "Styles와 Computed를 함께 보며 어떤 규칙이 최종값을 만드는지 확인합니다.",
      "필요하면 Layout, Event Listeners, DOM Breakpoints, Accessibility까지 확장해 원인을 확정합니다.",
    ],
    example:
      "예시: 버튼이 클릭되지 않으면 Elements에서 `disabled` 상태와 이벤트 리스너 연결 여부를 먼저 확인하고, 필요 시 DOM Breakpoint로 변경 시점을 추적합니다.",
  },
  {
    id: "dom-view-edit",
    label: "DOM 보기 및 변경",
    category: "DOM",
    concept:
      "DOM 트리를 읽고 노드, 속성, 텍스트를 직접 편집해 화면과 동작이 어떻게 바뀌는지 확인하는 항목입니다.",
    details: [
      "트리에서 부모, 자식, 형제 관계를 확인해 레이아웃 그룹의 실제 구조를 파악합니다.",
      "텍스트와 속성은 인라인으로 수정할 수 있고, 구조는 Edit as HTML로 블록 편집이 가능합니다.",
      "노드 복제, 삭제, 이동과 실행 취소를 통해 구조 변경 영향을 빠르게 검증할 수 있습니다.",
      "선택 노드와 화면 하이라이트를 함께 보며 대상 일치 여부를 검증합니다.",
    ],
    usage: [
      "DOM 트리에서 대상 노드를 선택합니다.",
      "텍스트나 속성을 먼저 인라인으로 수정합니다.",
      "구조 변경이 필요하면 Edit as HTML을 사용합니다.",
      "수정 결과가 화면과 동작에 미치는 변화를 즉시 확인합니다.",
    ],
    example:
      "예시: 버튼의 disabled 속성을 제거하면 버튼 상태와 클릭 가능 여부가 즉시 바뀝니다.",
  },
  {
    id: "dom-properties",
    label: "DOM 객체의 속성 보기",
    category: "DOM",
    concept:
      "Properties 뷰는 선택 노드의 JavaScript 프로퍼티 상태를 보여주며, 속성(attribute)과 프로퍼티(property) 차이를 확인할 때 사용합니다.",
    details: [
      "검색으로 value, checked, dataset, style 같은 상태를 빠르게 찾을 수 있습니다.",
      "Show all로 null 또는 undefined까지 포함한 전체 상태 확인이 가능합니다.",
      "own 프로퍼티와 상속 프로퍼티가 구분되어 런타임 상태 판단이 쉬워집니다.",
      "HTML에 보이는 값과 런타임 값이 다를 때 원인 추적의 기준이 됩니다.",
    ],
    usage: [
      "노드를 선택하고 Properties 탭을 엽니다.",
      "검색으로 확인할 프로퍼티를 찾습니다.",
      "필요 시 Show all을 켜서 빠진 값이 없는지 확인합니다.",
      "Attributes와 비교해 불일치가 있는지 확인합니다.",
    ],
    example:
      "예시: input의 초기 value와 런타임 value 프로퍼티가 다른 시점을 구분해 확인할 수 있습니다.",
  },
  {
    id: "badges-reference",
    label: "배지 참조",
    category: "DOM",
    concept:
      "배지는 노드의 레이아웃 또는 구조 특성을 빠르게 식별하는 표시이며, 오버레이와 함께 구조 확인을 돕습니다.",
    details: [
      "Grid, Subgrid, Flex, Scroll, Container 등 주요 상태를 배지로 확인할 수 있습니다.",
      "배지를 클릭하면 해당 오버레이가 켜지고 화면 경계를 시각적으로 확인할 수 있습니다.",
      "복수 오버레이를 동시에 켜서 상위, 하위 컨테이너 관계를 비교할 수 있습니다.",
      "필요 없는 배지를 숨겨 트리 가독성을 유지할 수 있습니다.",
    ],
    usage: [
      "DOM 트리에서 배지가 붙은 노드를 찾습니다.",
      "배지를 클릭해 오버레이를 켜고 구조를 확인합니다.",
      "비교가 끝나면 오버레이를 꺼서 화면을 정리합니다.",
      "중첩 레이아웃은 색상 또는 오버레이를 분리해 비교합니다.",
    ],
    example:
      "예시: 컨테이너가 grid인지 flex인지 불명확하면 배지로 먼저 식별합니다.",
  },
  {
    id: "css-view-edit",
    label: "CSS 보기 및 변경",
    category: "CSS",
    concept:
      "Styles 화면은 선택 노드에 영향을 주는 CSS 규칙을 보여주고, 선언을 직접 수정해 적용 결과를 확인하는 핵심 뷰입니다.",
    details: [
      "규칙 적용 여부는 취소선 또는 활성 상태로 확인할 수 있습니다.",
      "가상 상태(:hov)와 클래스 토글(.cls)을 통해 상태별 규칙을 검증할 수 있습니다.",
      "선언 추가, 비활성화, 값 변경을 즉시 수행할 수 있습니다.",
      "규칙 소스 링크로 원본 파일 위치를 빠르게 찾을 수 있습니다.",
    ],
    usage: [
      "문제 속성을 먼저 찾고 적용 상태를 확인합니다.",
      "필요 시 :hov, .cls를 사용해 상태를 강제합니다.",
      "값을 수정해 유효 범위를 좁힙니다.",
      "확정된 값은 소스 파일에 반영합니다.",
    ],
    example:
      "예시: hover 색상이 안 바뀌면 :hov에서 hover를 강제해 규칙 연결 여부를 먼저 확인합니다.",
  },
  {
    id: "css-issues",
    label: "잘못된 CSS, 재정의된 CSS, 비활성 CSS 및 기타 CSS 찾기",
    category: "CSS",
    concept:
      "적용되지 않는 CSS는 무효 선언, 재정의, 비활성 맥락으로 분류해 확인해야 원인을 정확히 찾을 수 있습니다.",
    details: [
      "무효 선언은 문법 또는 값 오류로 비적용되며 경고 표시가 함께 나타납니다.",
      "재정의 선언은 특이성, 순서, 상속에 의해 취소선으로 표시됩니다.",
      "비활성 선언은 문법이 맞아도 레이아웃 맥락이 맞지 않아 동작하지 않습니다.",
      "문제 확인 후 Computed에서 최종값을 반드시 재확인하는 흐름이 필요합니다.",
    ],
    usage: [
      "문제 속성의 상태 표시(경고, 취소선, 비활성)를 먼저 확인합니다.",
      "재정의면 우선순위 규칙을, 비활성이면 컨텍스트(display 등)를 점검합니다.",
      "무효 선언이면 값 또는 단위를 수정합니다.",
      "Computed에서 최종 적용값을 확인합니다.",
    ],
    example:
      "예시: justify-content가 안 먹으면 해당 요소가 실제 flex 또는 grid 컨테이너인지 먼저 확인합니다.",
  },
  {
    id: "css-color",
    label: "색상 선택 도구로 CSS 색상 검사 및 디버그",
    category: "CSS",
    concept:
      "Color Picker는 색상 포맷 전환, 샘플링, 대비 점검을 한 번에 처리해 색상 관련 이슈를 빠르게 조정할 수 있게 합니다.",
    details: [
      "HEX, RGB(A), HSL(A) 전환으로 팀 포맷 규칙에 맞춰 값을 확정할 수 있습니다.",
      "스포이트로 화면의 실제 색상을 샘플링해 바로 적용할 수 있습니다.",
      "대비 정보로 텍스트와 배경의 가독성을 점검할 수 있습니다.",
      "불투명도(Alpha) 조정으로 오버레이 또는 레이어 표현을 확인할 수 있습니다.",
    ],
    usage: [
      "색상 선언을 클릭해 Color Picker를 엽니다.",
      "포맷을 전환하고 색상, 명도, 투명도를 조정합니다.",
      "스포이트가 필요하면 샘플링 후 값을 적용합니다.",
      "대비 상태를 확인하고 최종 값을 확정합니다.",
    ],
    example:
      "예시: 텍스트가 흐리면 color와 background-color를 함께 조정해 대비를 맞춥니다.",
  },
  {
    id: "css-grid",
    label: "그리드 검사",
    category: "CSS",
    concept:
      "Grid 오버레이는 트랙, 라인, 영역, 간격을 시각화해 배치 문제를 구조 기준으로 분석하도록 돕습니다.",
    details: [
      "Grid 또는 Subgrid 배지로 컨테이너를 식별하고 오버레이를 즉시 켤 수 있습니다.",
      "라인 번호와 트랙 크기 표시를 통해 아이템 위치 계산 기준을 확인할 수 있습니다.",
      "여러 그리드를 동시에 켜서 중첩 구조를 비교할 수 있습니다.",
      "gap과 grid-template 규칙을 함께 보면 간격 원인 분리가 쉬워집니다.",
    ],
    usage: [
      "Grid 컨테이너를 선택하고 오버레이를 켭니다.",
      "라인, 트랙 표시 옵션을 필요한 수준만 켭니다.",
      "아이템의 grid-column 또는 grid-row 값을 확인합니다.",
      "간격 문제는 gap과 트랙 정의를 같이 점검합니다.",
    ],
    example:
      "예시: 카드가 한 칸 밀리면 grid-column 시작, 종료 라인을 먼저 확인합니다.",
  },
  {
    id: "css-flexbox",
    label: "Flexbox 검사 및 디버그",
    category: "CSS",
    concept:
      "Flexbox 디버깅은 축 방향과 공간 분배 규칙을 분리해서 확인하는 과정이며, 오버레이로 결과를 바로 검증할 수 있습니다.",
    details: [
      "Flex 배지와 오버레이로 컨테이너, 아이템 분배를 시각적으로 확인할 수 있습니다.",
      "justify-content, align-items, align-content는 축 기준을 먼저 확정한 뒤 확인해야 합니다.",
      "아이템별 flex-grow, flex-shrink, flex-basis 영향은 개별 확인이 필요합니다.",
      "order, align-self 같은 아이템 단위 속성도 함께 점검해야 합니다.",
    ],
    usage: [
      "Flex 컨테이너를 선택하고 축 방향을 확인합니다.",
      "컨테이너 정렬 속성과 아이템 분배 속성을 분리해서 점검합니다.",
      "필요 시 값 변경으로 영향 범위를 확인합니다.",
      "오버레이와 Styles를 함께 보며 최종 정렬을 검증합니다.",
    ],
    example:
      "예시: 끝 정렬이 안 되면 flex-direction 기준 축과 justify-content 대상을 먼저 확인합니다.",
  },
  {
    id: "css-container-queries",
    label: "컨테이너 쿼리 검사 및 디버그",
    category: "CSS",
    concept:
      "Container Query는 뷰포트가 아니라 컨테이너 크기를 기준으로 규칙이 활성화되므로, 컨테이너 정의와 임계값을 함께 확인해야 합니다.",
    details: [
      "container-type 지정이 없으면 @container 조건은 평가되지 않습니다.",
      "컨테이너 배지 또는 오버레이로 쿼리 대상 컨테이너를 식별할 수 있습니다.",
      "조건 활성 또는 비활성은 컨테이너 실제 크기 기준으로 전환됩니다.",
      "Styles에서 조건 블록 적용 여부를 우선순위와 함께 점검해야 합니다.",
    ],
    usage: [
      "대상 요소와 상위 컨테이너를 순서대로 선택합니다.",
      "container-type과 조건식을 먼저 확인합니다.",
      "크기 변화를 주며 조건 전환 지점을 확인합니다.",
      "미적용이면 컨테이너 지정, 조건식, 우선순위를 재점검합니다.",
    ],
    example:
      "예시: 컴포넌트 레이아웃이 안 바뀌면 뷰포트가 아니라 컨테이너 폭을 기준으로 확인합니다.",
  },
  {
    id: "css-reference",
    label: "CSS 기능 참조",
    category: "CSS",
    concept:
      "CSS 관련 DevTools 기능은 Styles, Computed, Layout, 오버레이 도구를 문제 유형에 맞게 조합해 사용하는 것이 핵심입니다.",
    details: [
      "규칙 적용 여부는 Styles, 최종 결과는 Computed, 구조 시각화는 Layout 또는 오버레이에서 확인합니다.",
      "상태 기반 확인은 :hov와 .cls를 기본 절차로 사용합니다.",
      "규칙 소스 링크로 스타일시트, 상속, 변수 출처를 빠르게 추적할 수 있습니다.",
      "한 화면에서 결론내지 않고 화면 간 교차 확인이 필요합니다.",
    ],
    usage: [
      "문제를 규칙 충돌, 최종값 불일치, 구조 문제로 먼저 분류합니다.",
      "분류에 맞는 시작 화면(Styles, Computed, Layout)을 선택합니다.",
      "오버레이가 필요하면 동시에 켜서 시각적으로 확인합니다.",
      "확정된 결론만 코드에 반영합니다.",
    ],
    example:
      "예시: 위치 문제는 Layout 오버레이로 구조를 먼저 확인하고 Styles로 세부 규칙을 좁힙니다.",
  },
];

const OFFICIAL_DOCS_BASE_URL = "https://developer.chrome.com";
const ELEMENTS_OVERVIEW_OFFICIAL_DOC_PATH = "/docs/devtools/elements?hl=ko";
const DOM_VIEW_EDIT_OFFICIAL_DOC_PATH = "/docs/devtools/dom?hl=ko";
const DOM_PROPERTIES_OFFICIAL_DOC_PATH = "/docs/devtools/dom/properties?hl=ko";
const BADGES_REFERENCE_OFFICIAL_DOC_PATH = "/docs/devtools/elements/badges?hl=ko";
const CSS_VIEW_EDIT_OFFICIAL_DOC_PATH = "/docs/devtools/css?hl=ko";
const CSS_ISSUES_OFFICIAL_DOC_PATH = "/docs/devtools/css/issues?hl=ko";
const CSS_COLOR_OFFICIAL_DOC_PATH = "/docs/devtools/css/color?hl=ko";
const CSS_GRID_OFFICIAL_DOC_PATH = "/docs/devtools/css/grid?hl=ko";
const CSS_FLEXBOX_OFFICIAL_DOC_PATH = "/docs/devtools/css/flexbox?hl=ko";
const CSS_CONTAINER_QUERIES_OFFICIAL_DOC_PATH = "/docs/devtools/css/container-queries?hl=ko";
const CSS_REFERENCE_OFFICIAL_DOC_PATH = "/docs/devtools/css/reference?hl=ko";
const TOPIC_ROUTE_MAP: Partial<Record<TopicId, string>> = {
  "elements-overview": "/elements",
  "dom-view-edit": "/dom",
  "dom-properties": "/dom/properties",
  "badges-reference": "/dom/badges",
  "css-view-edit": "/css",
  "css-issues": "/css/issues",
  "css-color": "/css/color",
  "css-grid": "/css/grid",
  "css-flexbox": "/css/flexbox",
  "css-container-queries": "/css/container-queries",
  "css-reference": "/css/reference",
};

interface OfficialTopicSource {
  officialPath: string;
  localDocPath: string;
}

interface OfficialTopicContent {
  html: string;
  sections: ReadonlyArray<PageContentsSection>;
  imageUrls: ReadonlyArray<string>;
}

const OFFICIAL_TOPIC_SOURCES: Partial<Record<TopicId, OfficialTopicSource>> = {
  "dom-view-edit": {
    officialPath: DOM_VIEW_EDIT_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/dom-ko-content.html",
  },
  "dom-properties": {
    officialPath: DOM_PROPERTIES_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/dom-properties-ko-content.html",
  },
  "badges-reference": {
    officialPath: BADGES_REFERENCE_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/dom-badges-ko-content.html",
  },
  "css-view-edit": {
    officialPath: CSS_VIEW_EDIT_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-view-edit-ko-content.html",
  },
  "css-issues": {
    officialPath: CSS_ISSUES_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-issues-ko-content.html",
  },
  "css-color": {
    officialPath: CSS_COLOR_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-color-ko-content.html",
  },
  "css-grid": {
    officialPath: CSS_GRID_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-grid-ko-content.html",
  },
  "css-flexbox": {
    officialPath: CSS_FLEXBOX_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-flexbox-ko-content.html",
  },
  "css-container-queries": {
    officialPath: CSS_CONTAINER_QUERIES_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-container-queries-ko-content.html",
  },
  "css-reference": {
    officialPath: CSS_REFERENCE_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/css-reference-ko-content.html",
  },
};

const OFFICIAL_TOPIC_HTML_CACHE: Partial<Record<TopicId, string>> = {};
const OFFICIAL_TOPIC_SECTIONS_CACHE: Partial<Record<TopicId, ReadonlyArray<PageContentsSection>>> = {};
const OFFICIAL_TOPIC_IMAGE_URLS_CACHE: Partial<Record<TopicId, ReadonlyArray<string>>> = {};
const OFFICIAL_TOPIC_PROMISES: Partial<Record<TopicId, Promise<OfficialTopicContent | null>>> = {};
const WARMED_OFFICIAL_IMAGE_URLS = new Set<string>();

function toAbsoluteDocsUrl(url: string) {
  try {
    return new URL(url, OFFICIAL_DOCS_BASE_URL).toString();
  } catch {
    return url;
  }
}

function normalizeSrcSet(srcSetValue: string) {
  return srcSetValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [src, descriptor] = item.split(/\s+/, 2);
      const absoluteSrc = toAbsoluteDocsUrl(src);

      if (!descriptor) {
        return absoluteSrc;
      }

      return `${absoluteSrc} ${descriptor}`;
    })
    .join(", ");
}

function normalizeOfficialDocHtml(rawHtml: string, topicId?: TopicId) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(rawHtml, "text/html");
  const root = parsed.createElement("article");
  const officialBody = parsed.querySelector(".devsite-article-body");

  if (officialBody instanceof HTMLElement) {
    root.innerHTML = officialBody.innerHTML;
  } else {
    root.innerHTML = rawHtml;
  }

  parsed.body.innerHTML = "";
  parsed.body.appendChild(root);

  root.querySelectorAll("script, style, template, noscript").forEach((node) => {
    node.remove();
  });

  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");

    if (!href) {
      return;
    }

    if (href.startsWith("#")) {
      return;
    }

    anchor.href = toAbsoluteDocsUrl(href);
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  });

  let blockImageCount = 0;

  root.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const srcCandidate = image.getAttribute("src") ?? image.getAttribute("data-src");

    if (srcCandidate) {
      image.src = toAbsoluteDocsUrl(srcCandidate);
    }

    const srcSetCandidate = image.getAttribute("srcset");

    if (srcSetCandidate) {
      image.srcset = normalizeSrcSet(srcSetCandidate);
    }

    const className = image.getAttribute("class") ?? "";
    const isScreenshot = /\bscreenshot\b/.test(className);
    const srcValue = image.getAttribute("src") ?? "";
    const isSvgAsset = /\.svg(\?|$)/i.test(srcValue);
    const widthAttr = Number.parseInt(image.getAttribute("width") ?? "", 10);
    const heightAttr = Number.parseInt(image.getAttribute("height") ?? "", 10);
    const hasSmallDimension =
      (Number.isFinite(widthAttr) && widthAttr > 0 && widthAttr <= 40) ||
      (Number.isFinite(heightAttr) && heightAttr > 0 && heightAttr <= 40);
    const parentElement = image.parentElement;
    const parentTag = parentElement?.tagName.toLowerCase();
    const insideTextContainer =
      parentTag === "p" ||
      parentTag === "li" ||
      parentTag === "aside" ||
      parentTag === "strong" ||
      parentTag === "span";
    const hasSiblingTextOrElements = parentElement
      ? Array.from(parentElement.childNodes).some((node) => {
          if (node === image) {
            return false;
          }

          if (node.nodeType === Node.TEXT_NODE) {
            return Boolean(node.textContent?.trim());
          }

          if (node instanceof HTMLElement) {
            return true;
          }

          return false;
        })
      : false;
    const shouldInlineIcon =
      !isScreenshot && insideTextContainer && hasSiblingTextOrElements && (hasSmallDimension || isSvgAsset);

    if (shouldInlineIcon) {
      image.classList.add("inline-icon");
      image.removeAttribute("sizes");
      image.removeAttribute("srcset");
    } else {
      image.classList.remove("inline-icon");
    }

    if (!image.getAttribute("loading")) {
      image.loading = shouldInlineIcon || blockImageCount < 2 ? "eager" : "lazy";
    }

    if (!image.getAttribute("decoding")) {
      image.decoding = "async";
    }

    if (!image.getAttribute("fetchpriority")) {
      if (shouldInlineIcon) {
        image.setAttribute("fetchpriority", "auto");
      } else {
        image.setAttribute("fetchpriority", blockImageCount === 0 ? "high" : blockImageCount < 2 ? "auto" : "low");
      }
    }

    if (!shouldInlineIcon) {
      blockImageCount += 1;
    }
  });

  root.querySelectorAll("devsite-video[video-id]").forEach((videoElement) => {
    const videoId = videoElement.getAttribute("video-id");

    if (!videoId) {
      videoElement.remove();
      return;
    }

    const videoWrapper = parsed.createElement("figure");
    videoWrapper.className = "dom-video";

    const iframe = parsed.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
    iframe.title = "DOM 보기 및 변경 튜토리얼 영상";
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;

    videoWrapper.appendChild(iframe);
    videoElement.replaceWith(videoWrapper);
  });

  root.querySelectorAll("devsite-code").forEach((codeElement) => {
    const preElement = codeElement.querySelector("pre");

    if (!preElement) {
      codeElement.remove();
      return;
    }

    const wrapper = parsed.createElement("div");
    wrapper.className = "dom-code-block";
    wrapper.innerHTML = preElement.outerHTML;
    codeElement.replaceWith(wrapper);
  });

  root.querySelectorAll("span.material-symbols-outlined").forEach((iconElement) => {
    iconElement.remove();
  });

  root.querySelectorAll("div").forEach((divElement) => {
    const hasAttributes = divElement.attributes.length > 0;
    const hasChildren = divElement.children.length > 0;
    const hasText = Boolean(divElement.textContent?.trim());

    if (!hasAttributes && !hasChildren && !hasText) {
      divElement.remove();
    }
  });

  const topicLabScenarios = topicId ? TOPIC_LAB_SCENARIOS[topicId] : undefined;

  if (topicLabScenarios) {
    root.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((headingElement) => {
      const sectionId = headingElement.id;
      const scenarioId = topicLabScenarios[sectionId];

      if (!scenarioId) {
        return;
      }

      const triggerButton = createLabTriggerButton({
        parsed,
        dataset: {
          runDomPractice: "true",
          labSection: sectionId,
          labScenario: scenarioId,
          labTitle: headingElement.textContent?.trim() ?? sectionId,
        },
      });
      headingElement.appendChild(triggerButton);
    });
  }

  const contentNodes = Array.from(root.childNodes);
  root.textContent = "";

  let currentSection: HTMLElement | null = null;
  let hasStarted = false;

  contentNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      return;
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : null;

    if (!hasStarted && element?.tagName !== "H2") {
      return;
    }

    if (element?.tagName === "H2") {
      hasStarted = true;
      currentSection = parsed.createElement("section");
      currentSection.className = "dom-doc-section";
      root.appendChild(currentSection);
      currentSection.appendChild(node);
      return;
    }

    if (!hasStarted) {
      return;
    }

    if (!currentSection) {
      currentSection = parsed.createElement("section");
      currentSection.className = "dom-doc-section";
      root.appendChild(currentSection);
    }

    currentSection.appendChild(node);
  });

  return root.innerHTML;
}

function extractSectionsFromNormalizedHtml(normalizedHtml: string): ReadonlyArray<PageContentsSection> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<article>${normalizedHtml}</article>`, "text/html");
  const headings = parsed.querySelectorAll<HTMLElement>("h2[id], h3[id]");

  return Array.from(headings)
    .map((heading) => {
      const labelElement = heading.cloneNode(true) as HTMLElement;
      labelElement
        .querySelectorAll(`.${LAB_TRIGGER_DOC_BUTTON_CLASS_NAME}`)
        .forEach((button) => button.remove());

      return {
        id: heading.id.trim(),
        label: (labelElement.textContent ?? "").trim(),
      };
    })
    .filter((section) => section.id.length > 0 && section.label.length > 0);
}

function extractImageUrlsFromNormalizedHtml(
  normalizedHtml: string,
  maxCount = 8,
): ReadonlyArray<string> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<article>${normalizedHtml}</article>`, "text/html");
  const urls: string[] = [];
  const seen = new Set<string>();

  parsed.querySelectorAll<HTMLImageElement>("img[src]").forEach((image) => {
    if (urls.length >= maxCount) {
      return;
    }

    const src = image.getAttribute("src");

    if (!src) {
      return;
    }

    const absoluteSrc = toAbsoluteDocsUrl(src);

    if (seen.has(absoluteSrc)) {
      return;
    }

    seen.add(absoluteSrc);
    urls.push(absoluteSrc);
  });

  return urls;
}

function warmOfficialImage(url: string, fetchPriority: "high" | "auto" | "low" = "auto") {
  if (typeof window === "undefined" || WARMED_OFFICIAL_IMAGE_URLS.has(url)) {
    return;
  }

  WARMED_OFFICIAL_IMAGE_URLS.add(url);

  const image = new Image();
  image.decoding = "async";

  const priorityCapable = image as HTMLImageElement & { fetchPriority?: string };
  if (priorityCapable.fetchPriority !== undefined) {
    priorityCapable.fetchPriority = fetchPriority;
  }

  image.src = url;
}

function primeOfficialTopicContent(
  topicId: TopicId,
): Promise<OfficialTopicContent | null> {
  const source = OFFICIAL_TOPIC_SOURCES[topicId];

  if (!source) {
    return Promise.resolve(null);
  }

  const cachedHtml = OFFICIAL_TOPIC_HTML_CACHE[topicId];
  const cachedSections = OFFICIAL_TOPIC_SECTIONS_CACHE[topicId];
  const cachedImageUrls = OFFICIAL_TOPIC_IMAGE_URLS_CACHE[topicId];

  if (cachedHtml && cachedSections && cachedImageUrls) {
    return Promise.resolve({
      html: cachedHtml,
      sections: cachedSections,
      imageUrls: cachedImageUrls,
    });
  }

  const pending = OFFICIAL_TOPIC_PROMISES[topicId];

  if (pending) {
    return pending;
  }

  const loadingPromise = fetch(source.localDocPath)
    .then((response) => (response.ok ? response.text() : ""))
    .then((html) => {
      if (!html) {
        return null;
      }

      const normalized = normalizeOfficialDocHtml(html, topicId);
      const sections = extractSectionsFromNormalizedHtml(normalized);
      const imageUrls = extractImageUrlsFromNormalizedHtml(normalized);

      OFFICIAL_TOPIC_HTML_CACHE[topicId] = normalized;
      OFFICIAL_TOPIC_SECTIONS_CACHE[topicId] = sections;
      OFFICIAL_TOPIC_IMAGE_URLS_CACHE[topicId] = imageUrls;

      return {
        html: normalized,
        sections,
        imageUrls,
      };
    })
    .catch(() => null)
    .finally(() => {
      delete OFFICIAL_TOPIC_PROMISES[topicId];
    });

  OFFICIAL_TOPIC_PROMISES[topicId] = loadingPromise;
  return loadingPromise;
}

function getHeaderHeight() {
  if (typeof window === "undefined") {
    return 56;
  }

  const headerElement = document.querySelector("header");

  if (!(headerElement instanceof HTMLElement)) {
    return 56;
  }

  return Math.max(0, Math.round(headerElement.offsetHeight));
}

function getVisibleHeaderOffset(headerHeight: number) {
  if (typeof window === "undefined") {
    return headerHeight;
  }

  const scrollTop = window.scrollY || window.pageYOffset || 0;
  return Math.max(0, Math.round(headerHeight - scrollTop));
}

const OVERVIEW_PAGE_SECTIONS = [
  { id: "overview", label: "개요" },
  { id: "open_the_elements_panel", label: "요소 패널 열기" },
] as const;

const ELEMENTS_OVERVIEW_LAB_SCENARIOS: Partial<Record<string, string>> = {
  overview: "elements-overview:overview",
};

const DOM_VIEW_EDIT_LAB_SCENARIOS: Partial<Record<string, string>> = {
  inspect: "inspect",
  keynav: "keynav",
  scroll1: "scroll1",
  rulers: "rulers",
  search: "search",
  edit: "edit",
  content: "content",
  attributes: "attributes",
  type: "type",
  "as-html": "as-html",
  duplicate: "duplicate",
  screenshot: "screenshot",
  reorder: "reorder",
  state: "state",
  hide: "hide",
  delete: "delete",
  console: "console",
  current: "current",
  global: "global",
  path: "path",
  breakpoints: "breakpoints",
  scroll2: "scroll2",
  options: "options",
};

const DOM_PROPERTIES_LAB_SCENARIOS: Partial<Record<string, string>> = {
  "view-properties": "dom-properties:view-properties",
  "own-and-inherited": "dom-properties:own-and-inherited",
  "filter-properties": "dom-properties:filter-properties",
  "show-all": "dom-properties:show-all",
  methods: "dom-properties:methods",
};

const BADGES_REFERENCE_LAB_SCENARIOS: Partial<Record<string, string>> = {
  grid: "badges:grid",
  flex: "badges:flex",
  container: "badges:container",
  scroll: "badges:scroll",
  media: "badges:media",
  "show-or-hide": "badges:show-or-hide",
};

const CSS_VIEW_EDIT_LAB_SCENARIOS: Partial<Record<string, string>> = {
  view: "css-view:view",
  declarations: "css-view:declarations",
  classes: "css-view:classes",
  pseudostates: "css-view:pseudostates",
  "box-model": "css-view:box-model",
};

const CSS_ISSUES_LAB_SCENARIOS: Partial<Record<string, string>> = {
  styles: "css-issues:styles",
  computed: "css-issues:computed",
  invalid: "css-issues:invalid",
  overridden: "css-issues:overridden",
  inactive: "css-issues:inactive",
  coverage: "css-issues:coverage",
};

const CSS_COLOR_LAB_SCENARIOS: Partial<Record<string, string>> = {
  "color-picker-elements": "css-color:color-picker-elements",
  "convert-colors": "css-color:convert-colors",
  "change-colors": "css-color:change-colors",
  eyedropper: "css-color:eyedropper",
  "fix-contrast": "css-color:fix-contrast",
};

const CSS_GRID_LAB_SCENARIOS: Partial<Record<string, string>> = {
  discover: "css-grid:discover",
  overlays: "css-grid:overlays",
  options: "css-grid:options",
  "line-numbers": "css-grid:line-numbers",
  "area-names": "css-grid:area-names",
  "grid-editor": "css-grid:grid-editor",
};

const CSS_FLEXBOX_LAB_SCENARIOS: Partial<Record<string, string>> = {
  discover: "css-flexbox:discover",
  layout: "css-flexbox:layout",
  examine: "css-flexbox:examine",
  modify: "css-flexbox:modify",
};

const CSS_CONTAINER_QUERIES_LAB_SCENARIOS: Partial<Record<string, string>> = {
  "inspect-container-queries": "css-container:inspect-container-queries",
  "find-containers": "css-container:find-containers",
  "discover-descendants": "css-container:discover-descendants",
  modify: "css-container:modify",
};

const CSS_REFERENCE_LAB_SCENARIOS: Partial<Record<string, string>> = {
  view: "css-reference:view",
  change: "css-reference:change",
  "add-declaration": "css-reference:add-declaration",
  "toggle-declaration": "css-reference:toggle-declaration",
  computed: "css-reference:computed",
  "color-picker": "css-reference:color-picker",
  "grid-editor": "css-reference:grid-editor",
  coverage: "css-reference:coverage",
};

const TOPIC_LAB_SCENARIOS: Partial<Record<TopicId, Partial<Record<string, string>>>> = {
  "elements-overview": ELEMENTS_OVERVIEW_LAB_SCENARIOS,
  "dom-view-edit": DOM_VIEW_EDIT_LAB_SCENARIOS,
  "dom-properties": DOM_PROPERTIES_LAB_SCENARIOS,
  "badges-reference": BADGES_REFERENCE_LAB_SCENARIOS,
  "css-view-edit": CSS_VIEW_EDIT_LAB_SCENARIOS,
  "css-issues": CSS_ISSUES_LAB_SCENARIOS,
  "css-color": CSS_COLOR_LAB_SCENARIOS,
  "css-grid": CSS_GRID_LAB_SCENARIOS,
  "css-flexbox": CSS_FLEXBOX_LAB_SCENARIOS,
  "css-container-queries": CSS_CONTAINER_QUERIES_LAB_SCENARIOS,
  "css-reference": CSS_REFERENCE_LAB_SCENARIOS,
};

interface ElementsLabWorkspaceProps {
  initialTopicId?: TopicId;
}

interface PendingLabScenario {
  scenarioId: string;
  sectionId: string;
  sectionLabel: string;
  topicId: TopicId;
}

export function ElementsLabWorkspace({ initialTopicId = "elements-overview" }: ElementsLabWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const offsetLockUntilRef = useRef(0);
  const [labInstanceKey, setLabInstanceKey] = useState(0);
  const [isPreviewDevtoolsOpen, setIsPreviewDevtoolsOpen] = useState(false);
  const [isLabViewerVisible, setIsLabViewerVisible] = useState(true);
  const [topicHtmlById, setTopicHtmlById] = useState<Partial<Record<TopicId, string>>>(() => ({
    ...OFFICIAL_TOPIC_HTML_CACHE,
  }));
  const [topicSectionsById, setTopicSectionsById] =
    useState<Partial<Record<TopicId, ReadonlyArray<PageContentsSection>>>>(() => ({
      ...OFFICIAL_TOPIC_SECTIONS_CACHE,
    }));
  const [topicImageUrlsById, setTopicImageUrlsById] =
    useState<Partial<Record<TopicId, ReadonlyArray<string>>>>(() => ({
      ...OFFICIAL_TOPIC_IMAGE_URLS_CACHE,
    }));
  const [pendingLabScenario, setPendingLabScenario] = useState<PendingLabScenario | null>(null);
  const docsCount = TOPIC_DOCS.length;
  const activeTopicId = initialTopicId;

  const activeTopic = useMemo(
    () => TOPIC_DOCS.find((topic) => topic.id === activeTopicId) ?? TOPIC_DOCS[0],
    [activeTopicId],
  );
  const activeTopicOfficialSource = useMemo(
    () => OFFICIAL_TOPIC_SOURCES[activeTopic.id] ?? null,
    [activeTopic.id],
  );
  const activeTopicOfficialHtml = topicHtmlById[activeTopic.id] ?? "";
  const pageContentsSections = useMemo(
    () => {
      if (activeTopic.id === "elements-overview") {
        return OVERVIEW_PAGE_SECTIONS;
      }

      return topicSectionsById[activeTopic.id] ?? [];
    },
    [activeTopic.id, topicSectionsById],
  );
  const activeTopicLabScenarios = TOPIC_LAB_SCENARIOS[activeTopic.id];
  const defaultLabScenario = useMemo<PendingLabScenario | null>(() => {
    if (!activeTopicLabScenarios) {
      return null;
    }

    const firstMappedSection = pageContentsSections.find((section) => activeTopicLabScenarios[section.id]);
    const fallbackEntry = Object.entries(activeTopicLabScenarios).find(([, scenarioId]) => {
      return typeof scenarioId === "string" && scenarioId.trim().length > 0;
    });
    const sectionId = firstMappedSection?.id ?? fallbackEntry?.[0];
    const scenarioId =
      (sectionId ? activeTopicLabScenarios[sectionId] : undefined) ?? fallbackEntry?.[1];

    if (!sectionId || !scenarioId) {
      return null;
    }

    return {
      scenarioId,
      sectionId,
      sectionLabel: firstMappedSection?.label ?? activeTopic.label,
      topicId: activeTopic.id,
    };
  }, [activeTopic.id, activeTopic.label, activeTopicLabScenarios, pageContentsSections]);
  const labPreviewSrc = useMemo(() => {
    if (!defaultLabScenario) {
      return "/labs/elements/index.html";
    }

    const params = new URLSearchParams({
      scenario: defaultLabScenario.scenarioId,
      topicId: defaultLabScenario.topicId,
      sectionId: defaultLabScenario.sectionId,
      sectionLabel: defaultLabScenario.sectionLabel,
    });

    return `/labs/elements/index.html?${params.toString()}`;
  }, [defaultLabScenario]);
  const showPageContentsSidebar = !isLabViewerVisible && pageContentsSections.length > 0;
  const contentGridClassName = isLabViewerVisible
    ? "xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(400px,560px)]"
    : showPageContentsSidebar
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(240px,360px)]"
      : "grid-cols-1";

  useEffect(() => {
    let isCancelled = false;
    const uniqueRoutes = Array.from(new Set(Object.values(TOPIC_ROUTE_MAP).filter(Boolean))) as string[];
    uniqueRoutes.forEach((route) => {
      router.prefetch(route);
    });

    const timers: number[] = [];
    (Object.keys(OFFICIAL_TOPIC_SOURCES) as TopicId[]).forEach((topicId, index) => {
      const timer = window.setTimeout(() => {
        void primeOfficialTopicContent(topicId).then((content) => {
          if (!content || isCancelled) {
            return;
          }

          setTopicHtmlById((prev) => (prev[topicId] ? prev : { ...prev, [topicId]: content.html }));
          setTopicSectionsById((prev) =>
            prev[topicId] ? prev : { ...prev, [topicId]: content.sections },
          );
          setTopicImageUrlsById((prev) =>
            prev[topicId] ? prev : { ...prev, [topicId]: content.imageUrls },
          );
        });
      }, 40 * index);

      timers.push(timer);
    });

    return () => {
      isCancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [router]);

  const postToPreview = (type: string, payload: Record<string, unknown> = {}) => {
    const frameWindow = iframeRef.current?.contentWindow;

    if (!frameWindow) {
      return false;
    }

    frameWindow.postMessage({ type, ...payload }, window.location.origin);
    return true;
  };

  const sendDevtoolsAction = (action: "open" | "close") => {
    const messageType =
      action === "open" ? "lab:open-preview-devtools" : "lab:close-preview-devtools";

    postToPreview(messageType);
  };

  const togglePreviewDevtools = () => {
    sendDevtoolsAction(isPreviewDevtoolsOpen ? "close" : "open");
  };

  const toggleLabViewerVisibility = () => {
    if (isLabViewerVisible && isPreviewDevtoolsOpen) {
      sendDevtoolsAction("close");
    }

    setIsLabViewerVisible((prev) => !prev);
  };

  const resetPreview = () => {
    setLabInstanceKey((prev) => prev + 1);
    setIsPreviewDevtoolsOpen(false);
  };

  const handleFrameLoad = () => {
    window.setTimeout(() => {
      sendDevtoolsAction("open");
    }, 120);

    const scenarioToApply = pendingLabScenario ?? defaultLabScenario;

    if (scenarioToApply) {
      window.setTimeout(() => {
        const sent = postToPreview("lab:apply-dom-scenario", {
          scenarioId: scenarioToApply.scenarioId,
          sectionId: scenarioToApply.sectionId,
          sectionLabel: scenarioToApply.sectionLabel,
          topicId: scenarioToApply.topicId,
        });

        if (sent && pendingLabScenario) {
          setPendingLabScenario(null);
        }
      }, 280);
    }
  };

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const payload = event.data;

      if (!payload || typeof payload !== "object") {
        return;
      }

      const message = payload as { type?: string; open?: boolean };

      if (message.type === "lab:preview-devtools-state") {
        setIsPreviewDevtoolsOpen(Boolean(message.open));
      }
    };

    window.addEventListener("message", handleWindowMessage);

    return () => {
      window.removeEventListener("message", handleWindowMessage);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let rafId = 0;
    let headerHeight = getHeaderHeight();
    let lastOffset = -1;

    const applyOffset = () => {
      rafId = 0;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();

      if (now < offsetLockUntilRef.current) {
        rafId = window.requestAnimationFrame(applyOffset);
        return;
      }

      const measuredHeaderHeight = getHeaderHeight();
      if (Math.abs(measuredHeaderHeight - headerHeight) >= 1) {
        headerHeight = measuredHeaderHeight;
      }

      const visibleHeaderHeight = getVisibleHeaderOffset(headerHeight);

      if (Math.abs(visibleHeaderHeight - lastOffset) < 1) {
        return;
      }

      lastOffset = visibleHeaderHeight;
      root.style.setProperty("--elements-header-offset", `${visibleHeaderHeight}px`);
      root.style.setProperty("--elements-scroll-margin", "16px");
    };

    const requestOffsetUpdate = () => {
      if (rafId !== 0) {
        return;
      }

      rafId = window.requestAnimationFrame(applyOffset);
    };

    requestOffsetUpdate();
    window.addEventListener("scroll", requestOffsetUpdate, { passive: true });
    window.addEventListener("resize", requestOffsetUpdate);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", requestOffsetUpdate);
      window.removeEventListener("resize", requestOffsetUpdate);
    };
  }, []);

  useEffect(() => {
    if (!activeTopicOfficialSource || activeTopicOfficialHtml) {
      return;
    }

    let isCancelled = false;

    void primeOfficialTopicContent(activeTopic.id).then((content) => {
      if (!content || isCancelled) {
        return;
      }

      setTopicHtmlById((prev) => ({
        ...prev,
        [activeTopic.id]: content.html,
      }));
      setTopicSectionsById((prev) => ({
        ...prev,
        [activeTopic.id]: content.sections,
      }));
      setTopicImageUrlsById((prev) => ({
        ...prev,
        [activeTopic.id]: content.imageUrls,
      }));
    });

    return () => {
      isCancelled = true;
    };
  }, [activeTopic.id, activeTopicOfficialHtml, activeTopicOfficialSource]);

  useEffect(() => {
    if (!activeTopicOfficialSource) {
      return;
    }

    const imageUrls =
      topicImageUrlsById[activeTopic.id] ?? OFFICIAL_TOPIC_IMAGE_URLS_CACHE[activeTopic.id] ?? [];

    if (imageUrls.length === 0) {
      return;
    }

    imageUrls.slice(0, 3).forEach((url, index) => {
      warmOfficialImage(url, index === 0 ? "high" : "auto");
    });

    const warmRemainder = () => {
      imageUrls.slice(3).forEach((url) => {
        warmOfficialImage(url, "low");
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(warmRemainder, { timeout: 900 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(warmRemainder, 120);
    return () => window.clearTimeout(timer);
  }, [activeTopic.id, activeTopicOfficialSource, topicImageUrlsById]);

  const handleOverviewSectionLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();

    const targetSection = document.getElementById(sectionId);

    if (!targetSection) {
      return;
    }

    targetSection.scrollIntoView({ behavior: "auto", block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  const handleTopicChange = (topicId: TopicId, clickTimeStamp: number) => {
    if (topicId === activeTopicId) {
      return;
    }

    const targetRoute = TOPIC_ROUTE_MAP[topicId] ?? "/elements";

    if (pathname !== targetRoute) {
      offsetLockUntilRef.current = clickTimeStamp + 240;
      router.replace(targetRoute, { scroll: true });
    }
  };

  const handleRunDomPractice = (
    sectionId: string,
    sectionLabel?: string,
    explicitScenarioId?: string,
  ) => {
    const topicScenarioMap = TOPIC_LAB_SCENARIOS[activeTopic.id];
    const scenarioId = explicitScenarioId ?? topicScenarioMap?.[sectionId];

    if (!scenarioId || !topicScenarioMap) {
      return;
    }

    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "auto", block: "start" });
      window.history.replaceState(null, "", `#${sectionId}`);
    }

    const scenarioPayload = {
      scenarioId,
      sectionId,
      sectionLabel: sectionLabel ?? sectionId,
      topicId: activeTopic.id,
    };

    const sent = postToPreview("lab:apply-dom-scenario", scenarioPayload);

    if (sent) {
      setPendingLabScenario(null);
      return;
    }

    setPendingLabScenario(scenarioPayload);
    setIsLabViewerVisible(true);
  };

  const handleDomPracticeInlineClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const triggerButton = target.closest<HTMLButtonElement>("button[data-run-dom-practice='true']");

    if (!triggerButton) {
      return;
    }

    event.preventDefault();
    const sectionId = triggerButton.dataset.labSection;
    const sectionLabel = triggerButton.dataset.labTitle;
    const scenarioId = triggerButton.dataset.labScenario;

    if (!sectionId || !scenarioId) {
      return;
    }

    handleRunDomPractice(sectionId, sectionLabel, scenarioId);
  };

  return (
    <section className="bg-white">
      <aside
        className="w-full max-h-[56svh] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 lg:fixed lg:bottom-0 lg:left-0 lg:z-30 lg:max-h-none lg:w-[300px] lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:shadow-none"
        style={{ top: "var(--elements-header-offset,56px)" }}
      >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Elements Docs ({docsCount})
          </p>

          <div className="mt-3 space-y-3">
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                개요
              </p>
              {TOPIC_DOCS.filter((topic) => topic.category === "요소").map((topic) => {
                const active = topic.id === activeTopicId;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={(event) => handleTopicChange(topic.id, event.timeStamp)}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-sm font-semibold">{topic.label}</p>
                  </button>
                );
              })}
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                DOM
              </p>
              {TOPIC_DOCS.filter((topic) => topic.category === "DOM").map((topic) => {
                const active = topic.id === activeTopicId;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={(event) => handleTopicChange(topic.id, event.timeStamp)}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-sm font-semibold">{topic.label}</p>
                  </button>
                );
              })}
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                CSS
              </p>
              {TOPIC_DOCS.filter((topic) => topic.category === "CSS").map((topic) => {
                const active = topic.id === activeTopicId;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={(event) => handleTopicChange(topic.id, event.timeStamp)}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-sm font-semibold">{topic.label}</p>
                  </button>
                );
              })}
            </section>
          </div>
      </aside>

      <section className="min-w-0 lg:pl-[300px]">
          <div
            className={`grid gap-4 ${contentGridClassName}`}
          >
            <article className="min-w-0 p-4 sm:p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {activeTopic.label}
                </h2>
                <button
                  type="button"
                  onClick={toggleLabViewerVisibility}
                  className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isLabViewerVisible
                      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                  aria-pressed={isLabViewerVisible}
                >
                  {isLabViewerVisible ? "ON" : "OFF"}
                </button>
              </div>

          {activeTopic.id === "elements-overview" ? (
            <section
              className="elements-overview-official mt-4 space-y-4 text-sm leading-7 text-slate-700 sm:text-base"
              data-official-doc-path={ELEMENTS_OVERVIEW_OFFICIAL_DOC_PATH}
            >
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <p>요소 패널을 사용하여 DOM 요소를 검사하고 수정합니다.</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <h3
                    id="overview"
                    className="text-xl font-semibold tracking-tight text-slate-900"
                    style={{ scrollMarginTop: "var(--elements-scroll-margin,72px)" }}
                  >
                    개요
                  </h3>
                  <LabTriggerButton
                    onClick={() =>
                      handleRunDomPractice(
                        "overview",
                        "개요",
                        ELEMENTS_OVERVIEW_LAB_SCENARIOS.overview,
                      )
                    }
                  />
                </div>
                <p className="mt-2">
                  요소 패널은 DOM을 검사하고 조작하는 강력한 인터페이스를 제공합니다. HTML
                  문서와 유사한 DOM 트리를 사용하여 특정 DOM 노드를 선택하고 다른 도구로
                  수정할 수 있습니다.
                </p>
                <p className="mt-3">요소 패널에는 관련 도구가 포함된 다음 탭도 있습니다.</p>

                <ul className="mt-2 list-disc space-y-3 pl-5">
                  <li>
                    <span className="font-semibold text-slate-900">스타일</span>:
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>
                        모든 스타일 시트에서 요소에 적용된 CSS 규칙을{" "}
                        <a
                          href="https://developer.chrome.com/docs/devtools/css?hl=ko"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sky-700 underline underline-offset-2"
                        >
                          보고 디버그
                        </a>
                        합니다.
                      </li>
                      <li>
                        의도한 대로 작동하지 않는{" "}
                        <a
                          href="https://developer.chrome.com/docs/devtools/css/issues?hl=ko"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sky-700 underline underline-offset-2"
                        >
                          잘못되거나 재정의되거나 비활성 상태이거나 기타 CSS
                        </a>
                        를 찾습니다.
                      </li>
                      <li>
                        <a
                          href="https://developer.chrome.com/docs/devtools/css?hl=ko#declarations"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sky-700 underline underline-offset-2"
                        >
                          선언을 추가
                        </a>
                        하고,{" "}
                        <a
                          href="https://developer.chrome.com/docs/devtools/css?hl=ko#classes"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sky-700 underline underline-offset-2"
                        >
                          클래스를 적용
                        </a>
                        하고,{" "}
                        <a
                          href="https://developer.chrome.com/docs/devtools/css?hl=ko#box-model"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sky-700 underline underline-offset-2"
                        >
                          상자 모델
                        </a>
                        과 상호작용하여 요소를 수정합니다.
                      </li>
                      <li>
                        DOM 트리에 있는{" "}
                        <a
                          href="https://developer.chrome.com/docs/devtools/elements/badges?hl=ko"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sky-700 underline underline-offset-2"
                        >
                          배지
                        </a>
                        를 사용하여 컨테이너 수정 옵션에 액세스합니다.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">계산됨</span>: Chrome에서
                    렌더링될 때 요소에 적용된{" "}
                    <a
                      href="https://developer.chrome.com/docs/devtools/css/issues?hl=ko#css-in-computed"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      해결된 속성 목록
                    </a>
                    입니다.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">레이아웃</span>:{" "}
                    <a
                      href="https://developer.chrome.com/docs/devtools/css/grid?hl=ko#options"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      그리드
                    </a>{" "}
                    및{" "}
                    <a
                      href="https://developer.chrome.com/docs/devtools/css/flexbox?hl=ko#layout"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      플렉스박스
                    </a>{" "}
                    오버레이를 수정하는 옵션이 포함되어 있습니다.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">이벤트 리스너</span>: 모든
                    이벤트 리스너와 속성을 나열합니다.{" "}
                    <a
                      href="https://developer.chrome.com/blog/easily-jump-to-event-listeners?hl=ko"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      이벤트 리스너의 소스를 찾고
                    </a>{" "}
                    <a
                      href="https://developer.chrome.com/blog/devtools-digest-2016-09?hl=ko#passive_event_listeners"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      패시브 또는 차단 중인 리스너를 필터링
                    </a>
                    할 수 있습니다.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">DOM 중단점</span>:{" "}
                    <a
                      href="https://developer.chrome.com/docs/devtools/javascript/breakpoints?hl=ko#dom"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      요소 패널에서 추가
                    </a>
                    된 DOM 변경 중단점을 나열하고 이를 사용 설정, 사용 중지, 삭제 또는
                    표시할 수 있습니다.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">속성</span>: DOM 노드를
                    선택하여 객체의{" "}
                    <a
                      href={`${OFFICIAL_DOCS_BASE_URL}${DOM_PROPERTIES_OFFICIAL_DOC_PATH}#own-and-inherited`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      자체 속성과 상속된 속성
                    </a>
                    을 검사하고 정렬합니다.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">접근성</span>: ARIA 라벨이
                    있는 요소와 해당 속성을 나열합니다. 접근성 트리를 전환하고 검사할 수
                    있습니다(실험용).
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3
                  id="open_the_elements_panel"
                  className="text-xl font-semibold tracking-tight text-slate-900"
                  style={{ scrollMarginTop: "var(--elements-scroll-margin,72px)" }}
                >
                  요소 패널 열기
                </h3>
                <p className="mt-2">
                  기본적으로{" "}
                  <a
                    href="https://developer.chrome.com/docs/devtools/open?hl=ko"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-700 underline underline-offset-2"
                  >
                    DevTools를 열면
                  </a>{" "}
                  Elements 패널이 열립니다. 페이지의 아무 곳에서나{" "}
                  <a
                    href={`${OFFICIAL_DOCS_BASE_URL}${DOM_VIEW_EDIT_OFFICIAL_DOC_PATH}#inspect`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-700 underline underline-offset-2"
                  >
                    노드를 검사
                  </a>
                  하여 요소 패널을 자동으로 열 수도 있습니다.
                </p>
                <p className="mt-3">
                  요소 패널을 수동으로 열려면 다음 단계를 따르세요.
                </p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                  <li>
                    <a
                      href="https://developer.chrome.com/docs/devtools/open?hl=ko"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-700 underline underline-offset-2"
                    >
                      DevTools를 엽니다.
                    </a>
                  </li>
                  <li>
                    다음을 눌러 명령어 메뉴를 엽니다.
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>macOS: Command + Shift + P</li>
                      <li>Windows, Linux, ChromeOS: Control + Shift + P</li>
                    </ul>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://developer.chrome.com/static/docs/devtools/elements/image/command-menu-elements_1920.png?hl=ko"
                      alt="명령어 메뉴에서 Elements를 입력한 화면"
                      className="mt-1 mb-0.5 w-full max-w-[856px]"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                  </li>
                  <li>
                    Elements를 입력하고 요소 표시를 선택한 다음 Enter 키를 누릅니다.
                    DevTools 창 하단의 서랍에 요소 패널이 표시됩니다.
                  </li>
                </ol>
              </section>

            </section>
          ) : activeTopicOfficialSource ? (
            <section
              className="dom-official-content mt-4 text-sm leading-7 text-slate-700 sm:text-base"
              data-official-doc-path={activeTopicOfficialSource.officialPath}
              onClick={handleDomPracticeInlineClick}
              style={
                {
                  "--docs-scroll-margin": "var(--elements-scroll-margin,72px)",
                } as CSSProperties
              }
            >
              {activeTopicOfficialHtml ? (
                <div className="space-y-4" dangerouslySetInnerHTML={{ __html: activeTopicOfficialHtml }} />
              ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <p>{activeTopic.label} 공식 문서를 불러오는 중입니다.</p>
                </section>
              )}
            </section>
          ) : (
            <>
              <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">개념</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700 sm:text-base">
                  {activeTopic.concept}
                </p>
              </section>

              <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">핵심 항목</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {activeTopic.details.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </section>

              <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">사용 방법</h3>
                <ol className="mt-2 space-y-2 text-sm text-slate-700">
                  {activeTopic.usage.map((item, index) => (
                    <li key={item}>
                      {index + 1}. {item}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">간단 예시</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{activeTopic.example}</p>
              </section>
            </>
          )}
            </article>

            {isLabViewerVisible ? (
              <aside
                className="space-y-3 xl:sticky xl:self-start"
                style={
                  {
                    top: "var(--elements-header-offset,56px)",
                    "--desktop-top-offset": "var(--elements-header-offset,56px)",
                  } as CSSProperties
                }
              >
                <LabViewer
                  ref={iframeRef}
                  title="Elements Preview"
                  showTitle={false}
                  src={labPreviewSrc}
                  instanceKey={labInstanceKey}
                  onReloadRequest={resetPreview}
                  onPreviewDevtoolsRequest={togglePreviewDevtools}
                  isPreviewDevtoolsOpen={isPreviewDevtoolsOpen}
                  containerClassName="h-[calc(100vh-var(--desktop-top-offset,56px))]"
                  frameClassName="min-h-0 flex-1"
                  flatRightCorners
                  onFrameLoad={handleFrameLoad}
                />
              </aside>
            ) : showPageContentsSidebar ? (
              <aside
                className="hidden xl:block xl:sticky xl:self-start"
                style={{ top: "calc(var(--elements-header-offset,56px) + 12px)" }}
              >
                <nav
                  aria-label="이 페이지의 내용"
                  className="rounded-xl bg-white p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    이 페이지의 내용
                  </p>

                  <ul className="mt-3 space-y-2">
                    {pageContentsSections.map((section) => {
                      const practiceScenarioId = activeTopicLabScenarios?.[section.id];

                      return (
                        <li key={section.id} className="flex items-center justify-between gap-2">
                          <a
                            href={`#${section.id}`}
                            onClick={(event) => handleOverviewSectionLinkClick(event, section.id)}
                            className="block cursor-pointer text-sm text-sky-700 underline underline-offset-2 transition hover:text-sky-800"
                          >
                            {section.label}
                          </a>
                        {practiceScenarioId ? (
                          <LabTriggerButton
                            onClick={() => handleRunDomPractice(section.id, section.label)}
                          />
                        ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </aside>
            ) : null}
          </div>
      </section>
    </section>
  );
}

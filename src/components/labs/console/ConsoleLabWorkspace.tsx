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
  | "console-overview"
  | "console-understand-messages"
  | "console-log"
  | "console-javascript"
  | "console-live-expressions"
  | "console-format-style"
  | "console-reference"
  | "console-utilities"
  | "console-api";

interface TopicDoc {
  id: TopicId;
  label: string;
}

interface PageContentsSection {
  id: string;
  label: string;
}

interface OfficialTopicSource {
  officialPath: string;
  localDocPath: string;
}

interface OfficialTopicContent {
  html: string;
  sections: ReadonlyArray<PageContentsSection>;
  imageUrls: ReadonlyArray<string>;
  sectionReferences: Readonly<Record<string, SectionReferenceContent>>;
}

interface SectionReferenceContent {
  title: string;
  html: string;
}

interface PendingLabScenario {
  scenarioId: string;
  sectionId: string;
  sectionLabel: string;
  topicId: TopicId;
  sourceGuide?: SectionReferenceContent | null;
}

const TOPIC_DOCS: TopicDoc[] = [
  {
    id: "console-overview",
    label: "개요",
  },
  {
    id: "console-understand-messages",
    label: "콘솔 통계로 오류 및 경고 이해하기",
  },
  {
    id: "console-log",
    label: "로그 메시지",
  },
  {
    id: "console-javascript",
    label: "자바스크립트 실행",
  },
  {
    id: "console-live-expressions",
    label: "실시간으로 자바스크립트 보기",
  },
  {
    id: "console-format-style",
    label: "메시지 서식 및 스타일 지정",
  },
  {
    id: "console-reference",
    label: "기능 참조",
  },
  {
    id: "console-api",
    label: "API 참조 문서",
  },
  {
    id: "console-utilities",
    label: "Utilities API 참조",
  },
];

const OFFICIAL_DOCS_BASE_URL = "https://developer.chrome.com";
const CONSOLE_OVERVIEW_OFFICIAL_DOC_PATH = "/docs/devtools/console?hl=ko";
const CONSOLE_UNDERSTAND_MESSAGES_OFFICIAL_DOC_PATH =
  "/docs/devtools/console/understand-messages?hl=ko";
const CONSOLE_LOG_OFFICIAL_DOC_PATH = "/docs/devtools/console/log?hl=ko";
const CONSOLE_JAVASCRIPT_OFFICIAL_DOC_PATH = "/docs/devtools/console/javascript?hl=ko";
const CONSOLE_LIVE_EXPRESSIONS_OFFICIAL_DOC_PATH =
  "/docs/devtools/console/live-expressions?hl=ko";
const CONSOLE_FORMAT_STYLE_OFFICIAL_DOC_PATH = "/docs/devtools/console/format-style?hl=ko";
const CONSOLE_REFERENCE_OFFICIAL_DOC_PATH = "/docs/devtools/console/reference?hl=ko";
const CONSOLE_UTILITIES_OFFICIAL_DOC_PATH = "/docs/devtools/console/utilities?hl=ko";
const CONSOLE_API_OFFICIAL_DOC_PATH = "/docs/devtools/console/api?hl=ko";

const TOPIC_ROUTE_MAP: Record<TopicId, string> = {
  "console-overview": "/console",
  "console-understand-messages": "/console/understand-messages",
  "console-log": "/console/log",
  "console-javascript": "/console/javascript",
  "console-live-expressions": "/console/live-expressions",
  "console-format-style": "/console/format-style",
  "console-reference": "/console/reference",
  "console-utilities": "/console/utilities",
  "console-api": "/console/api",
};

const OFFICIAL_TOPIC_SOURCES: Record<TopicId, OfficialTopicSource> = {
  "console-overview": {
    officialPath: CONSOLE_OVERVIEW_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-overview-ko-content.html",
  },
  "console-understand-messages": {
    officialPath: CONSOLE_UNDERSTAND_MESSAGES_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-understand-messages-ko-content.html",
  },
  "console-log": {
    officialPath: CONSOLE_LOG_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-log-ko-content.html",
  },
  "console-javascript": {
    officialPath: CONSOLE_JAVASCRIPT_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-javascript-ko-content.html",
  },
  "console-live-expressions": {
    officialPath: CONSOLE_LIVE_EXPRESSIONS_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-live-expressions-ko-content.html",
  },
  "console-format-style": {
    officialPath: CONSOLE_FORMAT_STYLE_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-format-style-ko-content.html",
  },
  "console-reference": {
    officialPath: CONSOLE_REFERENCE_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-reference-ko-content.html",
  },
  "console-utilities": {
    officialPath: CONSOLE_UTILITIES_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-utilities-ko-content.html",
  },
  "console-api": {
    officialPath: CONSOLE_API_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/console-api-ko-content.html",
  },
};

const CONSOLE_OVERVIEW_LAB_SCENARIOS: Partial<Record<string, string>> = {
  overview: "overview:overview",
  open_the_console: "overview:open-console",
  view: "overview:view-logs",
  javascript: "overview:run-js",
};

const CONSOLE_LOG_LAB_SCENARIOS: Partial<Record<string, string>> = {
  setup: "log:setup",
  javascript: "log:messages",
  browser: "log:browser",
  filter: "log:filters",
  level: "log:filters",
  text: "log:filters",
  regex: "log:filters",
  source: "log:filters",
  user: "log:filters",
  drawer: "log:drawer",
};

const CONSOLE_JAVASCRIPT_LAB_SCENARIOS: Partial<Record<string, string>> = {
  page: "javascript:page",
  playground: "javascript:playground",
};

const CONSOLE_LIVE_EXPRESSIONS_LAB_SCENARIOS: Partial<Record<string, string>> = {
  create: "live:expressions",
  "add-multiple": "live:expressions",
  "remove-expressions": "live:expressions",
};

const CONSOLE_FORMAT_STYLE_LAB_SCENARIOS: Partial<Record<string, string>> = {
  format: "format:format",
  "multiple-specifiers": "format:format",
  conversion: "format:format",
  style_console_messages: "format:style",
  "style-specifier": "format:style",
  "style-ansi": "format:style",
};

const CONSOLE_REFERENCE_LAB_SCENARIOS: Partial<Record<string, string>> = {
  open: "reference:open",
  panel: "reference:open",
  drawer: "reference:open",
  settings: "reference:settings",
  sidebar: "reference:settings",
  view: "reference:view",
  group: "reference:view",
  "view-breakpoints": "reference:view",
  "view-stack-traces": "reference:stack-traces",
  xhr: "reference:xhr",
  persist: "reference:persist",
  network: "reference:network",
  "cors-errors": "reference:network",
  filter: "reference:filter",
  browser: "reference:filter",
  level: "reference:filter",
  url: "reference:filter",
  regex: "reference:filter",
  search: "reference:search",
  js: "reference:js",
  "string-copy-options": "reference:js",
  history: "reference:js",
  "manage-messages": "reference:js",
  live: "reference:live",
  eagereval: "reference:input-settings",
  autocomplete: "reference:input-settings",
  "inspect-object-properties": "reference:inspect",
  "own-properties": "reference:inspect",
  "evaluate-custom-accessors": "reference:inspect",
  "enumerable-properties": "reference:inspect",
  "private-properties": "reference:inspect",
  "inspect-internal-properties": "reference:inspect",
  "inspect-functions": "reference:inspect",
  clear: "reference:clear",
};

const CONSOLE_UTILITIES_LAB_SCENARIOS: Partial<Record<string, string>> = {
  "recent-many": "utilities:recent-selected",
  "querySelector-function": "utilities:query-selector",
  "querySelectorAll-function": "utilities:query-selector-all",
  "xpath-function": "utilities:xpath",
  "clear-function": "utilities:clear",
  "copy-function": "utilities:copy",
  "debug-function": "utilities:debug",
  "dir-function": "utilities:dir",
  "dirxml-function": "utilities:dirxml",
  "inspect-function": "utilities:inspect",
  "getEventListeners-function": "utilities:get-event-listeners",
  "keys-function": "utilities:keys",
  "monitor-function": "utilities:monitor",
  "monitorEvents-function": "utilities:monitor-events",
  "queryObjects-function": "utilities:query-objects",
  "table-function": "utilities:table",
  "values-function": "utilities:values",
};

const CONSOLE_API_LAB_SCENARIOS: Partial<Record<string, string>> = {
  assert: "api:assert",
  clear: "api:clear",
  count: "api:count",
  countreset: "api:count-reset",
  debug: "api:debug",
  dir: "api:dir",
  dirxml: "api:dirxml",
  error: "api:error",
  group: "api:group",
  groupcollapsed: "api:group-collapsed",
  info: "api:info",
  log: "api:log",
  table: "api:table",
  time: "api:time",
  timeend: "api:time",
  trace: "api:trace",
  warn: "api:warn",
};

const TOPIC_LAB_SCENARIOS: Partial<Record<TopicId, Partial<Record<string, string>>>> = {
  "console-overview": CONSOLE_OVERVIEW_LAB_SCENARIOS,
  "console-log": CONSOLE_LOG_LAB_SCENARIOS,
  "console-javascript": CONSOLE_JAVASCRIPT_LAB_SCENARIOS,
  "console-live-expressions": CONSOLE_LIVE_EXPRESSIONS_LAB_SCENARIOS,
  "console-format-style": CONSOLE_FORMAT_STYLE_LAB_SCENARIOS,
  "console-reference": CONSOLE_REFERENCE_LAB_SCENARIOS,
  "console-utilities": CONSOLE_UTILITIES_LAB_SCENARIOS,
  "console-api": CONSOLE_API_LAB_SCENARIOS,
};

const CONSOLE_TOPIC_SUMMARIES: Partial<Record<TopicId, string>> = {
  "console-overview": "콘솔을 사용하여 JavaScript 웹 애플리케이션을 테스트하고 디버그합니다.",
  "console-utilities":
    "Console Utilities API에는 DOM 요소 선택 및 검사, 객체 쿼리, 데이터 출력, 이벤트 및 함수 모니터링을 위한 편의 함수가 포함되어 있습니다.",
  "console-api": "Console API를 사용하여 JavaScript에서 콘솔에 메시지를 기록하고 출력 형식을 제어합니다.",
};

const OFFICIAL_TOPIC_HTML_CACHE: Partial<Record<TopicId, string>> = {};
const OFFICIAL_TOPIC_SECTIONS_CACHE: Partial<Record<TopicId, ReadonlyArray<PageContentsSection>>> = {};
const OFFICIAL_TOPIC_IMAGE_URLS_CACHE: Partial<Record<TopicId, ReadonlyArray<string>>> = {};
const OFFICIAL_TOPIC_SECTION_REFERENCES_CACHE: Partial<
  Record<TopicId, Readonly<Record<string, SectionReferenceContent>>>
> = {};
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

function normalizeOfficialDocHtml(rawHtml: string, topicId: TopicId) {
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

  root.querySelectorAll<HTMLElement>("p, div, section, aside").forEach((element) => {
    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();

    if (!text) {
      return;
    }

    if (
      text.includes("Creative Commons Attribution 4.0 라이선스") ||
      text.startsWith("최종 업데이트:") ||
      (text.includes("이해하기 쉬움") && text.includes("thumb-up"))
    ) {
      element.remove();
    }
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

    const imageAlt = image.getAttribute("alt") ?? "";
    if (imageAlt === "ALT_TEXT_HERE") {
      image.alt = "콘솔 지우기 아이콘";
    }

    if (!shouldInlineIcon) {
      blockImageCount += 1;
    }
  });

  if (topicId === "console-utilities") {
    root.querySelectorAll<HTMLParagraphElement>("p").forEach((paragraph) => {
      const text = (paragraph.textContent ?? "").replace(/\s+/g, " ").trim();

      if (text.includes("to create an array of all") && text.includes("elements in the current document")) {
        paragraph.innerHTML =
          '다음 예에서는 <code dir="ltr" translate="no">$$()</code>를 사용하여 현재 문서의 모든 <code translate="no" dir="ltr">&lt;img&gt;</code> 요소를 배열로 만들고 각 요소의 <code dir="ltr" translate="no">src</code> 속성 값을 표시합니다.';
      }
    });

    root.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      const imageAlt = image.getAttribute("alt") ?? "";

      if (!imageAlt.includes("l10n-placeholder")) {
        return;
      }

      const brokenParagraph = image.closest("p");
      if (!(brokenParagraph instanceof HTMLElement)) {
        image.remove();
        return;
      }

      brokenParagraph.textContent =
        "$$()를 사용하여 선택한 노드 뒤에 현재 문서에 표시되는 모든 <img> 요소를 배열로 만들고 각 요소의 src 속성을 출력할 수 있습니다.";
    });
  }

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
    iframe.title = "Console 튜토리얼 영상";
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

  const topicLabScenarios = TOPIC_LAB_SCENARIOS[topicId];

  root.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((headingElement) => {
    const sectionId = headingElement.id;
    const scenarioId = topicLabScenarios?.[sectionId];

    if (!scenarioId) {
      return;
    }

    const triggerButton = createLabTriggerButton({
      parsed,
      dataset: {
        runConsolePractice: "true",
        labSection: sectionId,
        labScenario: scenarioId,
        labTitle: headingElement.textContent?.trim() ?? sectionId,
      },
    });
    headingElement.appendChild(triggerButton);
  });

  const contentNodes = Array.from(root.childNodes);
  root.textContent = "";

  let currentSection: HTMLElement | null = null;

  contentNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      return;
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : null;

    if (element?.tagName === "H2") {
      currentSection = parsed.createElement("section");
      currentSection.className = "dom-doc-section";
      root.appendChild(currentSection);
      currentSection.appendChild(node);
      return;
    }

    if (!currentSection) {
      return;
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

function extractImageUrlsFromNormalizedHtml(normalizedHtml: string, maxCount = 8): ReadonlyArray<string> {
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

function extractSectionReferencesFromNormalizedHtml(
  normalizedHtml: string,
): Readonly<Record<string, SectionReferenceContent>> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<article>${normalizedHtml}</article>`, "text/html");
  const references: Record<string, SectionReferenceContent> = {};

  parsed.querySelectorAll<HTMLElement>(".dom-doc-section").forEach((section) => {
    const heading = section.querySelector<HTMLElement>("h2[id], h3[id]");

    if (!heading) {
      return;
    }

    const sectionId = heading.id.trim();

    if (!sectionId) {
      return;
    }

    const clone = section.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(`.${LAB_TRIGGER_DOC_BUTTON_CLASS_NAME}, iframe`)
      .forEach((node) => node.remove());
    clone.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    });

    const clonedHeading = clone.querySelector<HTMLElement>("h2[id], h3[id]");
    const title = clonedHeading?.textContent?.trim() ?? heading.textContent?.trim() ?? sectionId;
    const html = clone.innerHTML.trim();

    if (!html) {
      return;
    }

    references[sectionId] = {
      title,
      html,
    };
  });

  return references;
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

function primeOfficialTopicContent(topicId: TopicId): Promise<OfficialTopicContent | null> {
  const source = OFFICIAL_TOPIC_SOURCES[topicId];
  const cachedHtml = OFFICIAL_TOPIC_HTML_CACHE[topicId];
  const cachedSections = OFFICIAL_TOPIC_SECTIONS_CACHE[topicId];
  const cachedImageUrls = OFFICIAL_TOPIC_IMAGE_URLS_CACHE[topicId];
  const cachedSectionReferences = OFFICIAL_TOPIC_SECTION_REFERENCES_CACHE[topicId];

  if (cachedHtml && cachedSections && cachedImageUrls && cachedSectionReferences) {
    return Promise.resolve({
      html: cachedHtml,
      sections: cachedSections,
      imageUrls: cachedImageUrls,
      sectionReferences: cachedSectionReferences,
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
      const sectionReferences = extractSectionReferencesFromNormalizedHtml(normalized);

      OFFICIAL_TOPIC_HTML_CACHE[topicId] = normalized;
      OFFICIAL_TOPIC_SECTIONS_CACHE[topicId] = sections;
      OFFICIAL_TOPIC_IMAGE_URLS_CACHE[topicId] = imageUrls;
      OFFICIAL_TOPIC_SECTION_REFERENCES_CACHE[topicId] = sectionReferences;

      return {
        html: normalized,
        sections,
        imageUrls,
        sectionReferences,
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

interface ConsoleLabWorkspaceProps {
  initialTopicId?: TopicId;
}

export function ConsoleLabWorkspace({ initialTopicId = "console-overview" }: ConsoleLabWorkspaceProps) {
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
  const [topicSectionReferencesById, setTopicSectionReferencesById] =
    useState<Partial<Record<TopicId, Readonly<Record<string, SectionReferenceContent>>>>>(
      () => ({
        ...OFFICIAL_TOPIC_SECTION_REFERENCES_CACHE,
      }),
    );
  const [pendingLabScenario, setPendingLabScenario] = useState<PendingLabScenario | null>(null);
  const docsCount = TOPIC_DOCS.length;
  const activeTopicId = initialTopicId;

  const activeTopic = useMemo(
    () => TOPIC_DOCS.find((topic) => topic.id === activeTopicId) ?? TOPIC_DOCS[0],
    [activeTopicId],
  );
  const activeTopicOfficialSource = useMemo(
    () => OFFICIAL_TOPIC_SOURCES[activeTopic.id],
    [activeTopic.id],
  );
  const activeTopicOfficialHtml = topicHtmlById[activeTopic.id] ?? "";
  const pageContentsSections = useMemo(
    () => topicSectionsById[activeTopic.id] ?? [],
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
      sourceGuide: topicSectionReferencesById[activeTopic.id]?.[sectionId] ?? null,
    };
  }, [
    activeTopic.id,
    activeTopic.label,
    activeTopicLabScenarios,
    pageContentsSections,
    topicSectionReferencesById,
  ]);
  const labPreviewSrc = useMemo(() => {
    if (!defaultLabScenario) {
      return "/labs/console/index.html";
    }

    const params = new URLSearchParams({
      scenario: defaultLabScenario.scenarioId,
      topicId: defaultLabScenario.topicId,
      sectionId: defaultLabScenario.sectionId,
      sectionLabel: defaultLabScenario.sectionLabel,
    });

    return `/labs/console/index.html?${params.toString()}`;
  }, [defaultLabScenario]);
  const showPageContentsSidebar = !isLabViewerVisible && pageContentsSections.length > 0;
  const contentGridClassName = isLabViewerVisible
    ? "xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(400px,560px)]"
    : showPageContentsSidebar
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(240px,360px)]"
      : "grid-cols-1";

  useEffect(() => {
    let isCancelled = false;
    const uniqueRoutes = Array.from(new Set(Object.values(TOPIC_ROUTE_MAP)));
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
          setTopicSectionReferencesById((prev) =>
            prev[topicId] ? prev : { ...prev, [topicId]: content.sectionReferences },
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
    const messageType = action === "open" ? "lab:open-preview-devtools" : "lab:close-preview-devtools";
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
        const sent = postToPreview("lab:apply-console-scenario", {
          scenarioId: scenarioToApply.scenarioId,
          sectionId: scenarioToApply.sectionId,
          sectionLabel: scenarioToApply.sectionLabel,
          topicId: scenarioToApply.topicId,
          sourceGuide: scenarioToApply.sourceGuide ?? null,
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
      root.style.setProperty("--console-header-offset", `${visibleHeaderHeight}px`);
      root.style.setProperty("--console-scroll-margin", "16px");
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
    if (activeTopicOfficialHtml) {
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
      setTopicSectionReferencesById((prev) => ({
        ...prev,
        [activeTopic.id]: content.sectionReferences,
      }));
    });

    return () => {
      isCancelled = true;
    };
  }, [activeTopic.id, activeTopicOfficialHtml]);

  useEffect(() => {
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
  }, [activeTopic.id, topicImageUrlsById]);

  const handleSectionLinkClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
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

    const targetRoute = TOPIC_ROUTE_MAP[topicId];

    if (pathname !== targetRoute) {
      offsetLockUntilRef.current = clickTimeStamp + 240;
      router.replace(targetRoute, { scroll: true });
    }
  };

  const handleRunConsolePractice = (
    sectionId: string,
    sectionLabel?: string,
    explicitScenarioId?: string,
  ) => {
    const topicScenarioMap = TOPIC_LAB_SCENARIOS[activeTopic.id];
    const scenarioId = explicitScenarioId ?? topicScenarioMap?.[sectionId];

    if (!scenarioId) {
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
      sourceGuide: topicSectionReferencesById[activeTopic.id]?.[sectionId] ?? null,
    };

    const sent = postToPreview("lab:apply-console-scenario", scenarioPayload);

    if (sent) {
      setPendingLabScenario(null);
      return;
    }

    setPendingLabScenario(scenarioPayload);
    setIsLabViewerVisible(true);
  };

  const handleInlinePracticeClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const triggerButton = target.closest<HTMLButtonElement>("button[data-run-console-practice='true']");

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

    handleRunConsolePractice(sectionId, sectionLabel, scenarioId);
  };

  return (
    <section className="bg-white">
      <aside
        className="w-full max-h-[56svh] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 lg:fixed lg:bottom-0 lg:left-0 lg:z-30 lg:max-h-none lg:w-[300px] lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:shadow-none"
        style={{ top: "var(--console-header-offset,56px)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Console Docs ({docsCount})
        </p>

        <div className="mt-3 space-y-2">
          {TOPIC_DOCS.map((topic) => {
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
        </div>
      </aside>

      <section className="min-w-0 lg:pl-[300px]">
        <div className={`grid gap-4 ${contentGridClassName}`}>
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

            {activeTopic.id in CONSOLE_TOPIC_SUMMARIES ? (
              <>
                <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 sm:text-base">
                  <p>{CONSOLE_TOPIC_SUMMARIES[activeTopic.id]}</p>
                </section>

                <section
                  className="dom-official-content mt-4 text-sm leading-7 text-slate-700 sm:text-base"
                  data-official-doc-path={activeTopicOfficialSource.officialPath}
                  onClick={handleInlinePracticeClick}
                  style={
                    {
                      "--docs-scroll-margin": "var(--console-scroll-margin,72px)",
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
              </>
            ) : (
              <section
                className="dom-official-content mt-4 text-sm leading-7 text-slate-700 sm:text-base"
                data-official-doc-path={activeTopicOfficialSource.officialPath}
                onClick={handleInlinePracticeClick}
                style={
                  {
                    "--docs-scroll-margin": "var(--console-scroll-margin,72px)",
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
            )}
          </article>

          {isLabViewerVisible ? (
            <aside
              className="space-y-3 xl:sticky xl:self-start"
              style={
                {
                  top: "var(--console-header-offset,56px)",
                  "--desktop-top-offset": "var(--console-header-offset,56px)",
                } as CSSProperties
              }
            >
                <LabViewer
                  ref={iframeRef}
                  title="Console Preview"
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
              style={{ top: "calc(var(--console-header-offset,56px) + 12px)" }}
            >
              <nav aria-label="이 페이지의 내용" className="rounded-xl bg-white p-4">
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
                          onClick={(event) => handleSectionLinkClick(event, section.id)}
                          className="block cursor-pointer text-sm text-sky-700 underline underline-offset-2 transition hover:text-sky-800"
                        >
                          {section.label}
                        </a>
                        {practiceScenarioId ? (
                          <LabTriggerButton
                            onClick={() => handleRunConsolePractice(section.id, section.label)}
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

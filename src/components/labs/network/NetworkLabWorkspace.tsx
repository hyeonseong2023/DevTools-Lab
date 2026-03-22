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
  | "network-overview"
  | "network-reference"
  | "network-resources";

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
}

interface PendingLabScenario {
  scenarioId: string;
  sectionId: string;
  sectionLabel: string;
  topicId: TopicId;
}

const TOPIC_DOCS: TopicDoc[] = [
  {
    id: "network-overview",
    label: "개요",
  },
  {
    id: "network-reference",
    label: "네트워크 기능 참조",
  },
  {
    id: "network-resources",
    label: "페이지 리소스 보기",
  },
];

const OFFICIAL_DOCS_BASE_URL = "https://developer.chrome.com";
const NETWORK_OVERVIEW_OFFICIAL_DOC_PATH = "/docs/devtools/network/overview?hl=ko";
const NETWORK_REFERENCE_OFFICIAL_DOC_PATH = "/docs/devtools/network/reference?hl=ko";
const NETWORK_RESOURCES_OFFICIAL_DOC_PATH = "/docs/devtools/resources?hl=ko";

const TOPIC_ROUTE_MAP: Record<TopicId, string> = {
  "network-overview": "/network",
  "network-reference": "/network/reference",
  "network-resources": "/network/resources",
};

const OFFICIAL_TOPIC_SOURCES: Record<TopicId, OfficialTopicSource> = {
  "network-overview": {
    officialPath: NETWORK_OVERVIEW_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/network-overview-ko-content.html",
  },
  "network-reference": {
    officialPath: NETWORK_REFERENCE_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/network-reference-ko-content.html",
  },
  "network-resources": {
    officialPath: NETWORK_RESOURCES_OFFICIAL_DOC_PATH,
    localDocPath: "/docs/network-resources-ko-content.html",
  },
};

const NETWORK_OVERVIEW_LAB_SCENARIOS: Partial<Record<string, string>> = {
  overview: "overview:requests",
  open_the_network_panel: "overview:open-panel",
  activity: "overview:requests",
  inspect: "overview:inspect",
  filter: "overview:filter",
  search: "overview:search",
  loading: "overview:loading",
  export: "overview:export",

  // Legacy ids for backward compatibility with previously extracted docs.
  open: "overview:open-panel",
  load: "overview:requests",
  information: "overview:inspect",
  throttle: "overview:loading",
  screenshots: "overview:inspect",
  details: "overview:inspect",
  filterbox: "overview:filter",
  type: "overview:inspect",
  block: "overview:loading",
};

const NETWORK_REFERENCE_LAB_SCENARIOS: Partial<Record<string, string>> = {
  record: "reference:timing",
  "stop-recording": "reference:timing",
  clear: "reference:timing",
  "preserve-log": "reference:timing",
  screenshots: "reference:timing",
  "replay-xhr": "reference:timing",
  change_loading_behavior: "reference:timing",
  "disable-cache": "reference:timing",
  "clear-cache": "reference:timing",
  offline: "reference:timing",
  throttling: "reference:timing",
  "clear-cookies": "reference:headers",
  "override-headers": "reference:headers",
  "user-agent": "reference:headers",
  search: "reference:filter",
  filter: "reference:filter",
  "filter-by-property": "reference:filter",
  "filter-by-type": "reference:filter",
  "filter-by-time": "reference:filter",
  hide_data_urls: "reference:filter",
  "hide-extension-urls": "reference:filter",
  "show-blocked-cookies": "reference:filter",
  "show-blocked": "reference:filter",
  "third-party": "reference:filter",
  sort_requests: "reference:timing",
  "sort-by-column": "reference:timing",
  "sort-by-activity": "reference:timing",
  analyze: "reference:timing",
  requests: "reference:timing",
  "group-by-frames": "reference:timing",
  waterfall: "reference:timing",
  frames: "reference:timing",
  "event-stream": "reference:timing",
  preview: "reference:headers",
  response: "reference:headers",
  headers: "reference:headers",
  payload: "reference:payload",
  cookies: "reference:headers",
  timing: "reference:timing",
  "initiators-dependencies": "reference:initiator",
  load: "reference:timing",
  "total-number": "reference:timing",
  "total-size": "reference:timing",
  "initiator-stack-trace": "reference:initiator",
  uncompressed: "reference:timing",
  export: "reference:payload",
  "save-as-har": "reference:payload",
  copy: "reference:payload",
  change_the_layout_of_the_network_panel: "reference:filter",
  "hide-filters": "reference:filter",
  "request-rows": "reference:filter",
  "hide-overview": "reference:filter",
};

const NETWORK_RESOURCES_LAB_SCENARIOS: Partial<Record<string, string>> = {
  open: "resources:open",
  networkopen: "resources:open",
  reveal: "resources:open",
  browse: "resources:browse",
  network: "resources:browse",
  directory: "resources:browse",
  filename: "resources:browse",
  type: "resources:type",
};

const TOPIC_LAB_SCENARIOS: Partial<Record<TopicId, Partial<Record<string, string>>>> = {
  "network-overview": NETWORK_OVERVIEW_LAB_SCENARIOS,
  "network-reference": NETWORK_REFERENCE_LAB_SCENARIOS,
  "network-resources": NETWORK_RESOURCES_LAB_SCENARIOS,
};

const TOPIC_SUMMARIES: Partial<Record<TopicId, string>> = {};

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

function stripIntroBeforeFirstHeading(root: HTMLElement) {
  const firstHeading = root.querySelector("h2[id]");

  if (!(firstHeading instanceof HTMLElement)) {
    return;
  }

  let currentNode = root.firstChild;

  while (currentNode && currentNode !== firstHeading) {
    const nextNode = currentNode.nextSibling;
    currentNode.remove();
    currentNode = nextNode;
  }
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

  root.querySelectorAll("script, style, template, noscript, .dcc-authors, .wd-authors").forEach((node) => {
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

    if (!href || href.startsWith("#")) {
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

          return node instanceof HTMLElement;
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

  root.querySelectorAll("devsite-video, .dom-video").forEach((videoElement) => {
    videoElement.remove();
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

  stripIntroBeforeFirstHeading(root);

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
        runNetworkPractice: "true",
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
      labelElement.querySelectorAll(`.${LAB_TRIGGER_DOC_BUTTON_CLASS_NAME}`).forEach((button) => button.remove());

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

interface NetworkLabWorkspaceProps {
  initialTopicId?: TopicId;
}

export function NetworkLabWorkspace({ initialTopicId = "network-overview" }: NetworkLabWorkspaceProps) {
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
  const [topicSectionsById, setTopicSectionsById] = useState<
    Partial<Record<TopicId, ReadonlyArray<PageContentsSection>>>
  >(() => ({
    ...OFFICIAL_TOPIC_SECTIONS_CACHE,
  }));
  const [topicImageUrlsById, setTopicImageUrlsById] = useState<
    Partial<Record<TopicId, ReadonlyArray<string>>>
  >(() => ({
    ...OFFICIAL_TOPIC_IMAGE_URLS_CACHE,
  }));
  const [pendingLabScenario, setPendingLabScenario] = useState<PendingLabScenario | null>(null);
  const docsCount = TOPIC_DOCS.length;
  const activeTopicId = initialTopicId;

  const activeTopic = useMemo(
    () => TOPIC_DOCS.find((topic) => topic.id === activeTopicId) ?? TOPIC_DOCS[0],
    [activeTopicId],
  );
  const activeTopicOfficialSource = useMemo(() => OFFICIAL_TOPIC_SOURCES[activeTopic.id], [activeTopic.id]);
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
    const scenarioId = (sectionId ? activeTopicLabScenarios[sectionId] : undefined) ?? fallbackEntry?.[1];

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
      return "/labs/network/index.html";
    }

    const params = new URLSearchParams({
      scenario: defaultLabScenario.scenarioId,
      topicId: defaultLabScenario.topicId,
      sectionId: defaultLabScenario.sectionId,
      sectionLabel: defaultLabScenario.sectionLabel,
    });

    return `/labs/network/index.html?${params.toString()}`;
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
          setTopicSectionsById((prev) => (prev[topicId] ? prev : { ...prev, [topicId]: content.sections }));
          setTopicImageUrlsById((prev) => (prev[topicId] ? prev : { ...prev, [topicId]: content.imageUrls }));
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
        const sent = postToPreview("lab:apply-network-scenario", { ...scenarioToApply });

        if (sent && pendingLabScenario) {
          setPendingLabScenario(null);
        }
      }, 260);
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
      root.style.setProperty("--network-header-offset", `${visibleHeaderHeight}px`);
      root.style.setProperty("--network-scroll-margin", "16px");
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
    });

    return () => {
      isCancelled = true;
    };
  }, [activeTopic.id, activeTopicOfficialHtml]);

  useEffect(() => {
    const imageUrls = topicImageUrlsById[activeTopic.id] ?? OFFICIAL_TOPIC_IMAGE_URLS_CACHE[activeTopic.id] ?? [];

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

  const handleRunNetworkPractice = (
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
    };

    const sent = postToPreview("lab:apply-network-scenario", scenarioPayload);

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

    const triggerButton = target.closest<HTMLButtonElement>("button[data-run-network-practice='true']");

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

    handleRunNetworkPractice(sectionId, sectionLabel, scenarioId);
  };

  return (
    <section className="bg-white">
      <aside
        className="w-full max-h-[56svh] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 lg:fixed lg:bottom-0 lg:left-0 lg:z-30 lg:max-h-none lg:w-[300px] lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:shadow-none"
        style={{ top: "var(--network-header-offset,56px)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Network Docs ({docsCount})
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
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{activeTopic.label}</h2>
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

            {TOPIC_SUMMARIES[activeTopic.id] ? (
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <p>{TOPIC_SUMMARIES[activeTopic.id]}</p>
              </section>
            ) : null}

            <section
              className="dom-official-content mt-4 text-sm leading-7 text-slate-700 sm:text-base"
              data-official-doc-path={activeTopicOfficialSource.officialPath}
              onClick={handleInlinePracticeClick}
              style={
                {
                  "--docs-scroll-margin": "var(--network-scroll-margin,72px)",
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
          </article>

          {isLabViewerVisible ? (
            <aside
              className="space-y-3 xl:sticky xl:self-start"
              style={
                {
                  top: "var(--network-header-offset,56px)",
                  "--desktop-top-offset": "var(--network-header-offset,56px)",
                } as CSSProperties
              }
            >
              <LabViewer
                ref={iframeRef}
                title="Network Preview"
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
              style={{ top: "calc(var(--network-header-offset,56px) + 12px)" }}
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
                          <LabTriggerButton onClick={() => handleRunNetworkPractice(section.id, section.label)} />
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

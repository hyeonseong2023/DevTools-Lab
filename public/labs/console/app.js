(() => {
  const CHII_SCRIPT_ID = "lab-chii-target-script";
  const CHII_SCRIPT_URL = "https://chii.liriliri.io/target.js";
  const CHII_PANEL_SELECTOR = ".__chobitsu-hide__";
  const ERUDA_SCRIPT_ID = "lab-eruda-script";
  const ERUDA_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/eruda";
  const LAB_ROOT_SELECTOR = ".lab-shell";
  const LAB_GUIDE_ID = "lab-guide";
  const LAB_STATE_STYLE_ID = "lab-state-style";

  let chiiLoadPromise = null;
  let erudaLoadPromise = null;
  let isDevtoolsOpen = false;
  const devtoolsEngine = isMobileRuntime() ? "eruda" : "chii";
  const initialLabRootHtml = document.querySelector(LAB_ROOT_SELECTOR)?.innerHTML ?? "";
  let delayedScenarioTimer = null;
  let scenarioTransitionTimer = null;
  let runtime = createRuntimeState();

  const topicLabels = {
    "console-overview": "개요",
    "console-understand-messages": "콘솔 통계로 오류 및 경고 이해하기",
    "console-log": "로그 메시지",
    "console-javascript": "자바스크립트 실행",
    "console-live-expressions": "실시간으로 자바스크립트 보기",
    "console-format-style": "메시지 서식 및 스타일 지정",
    "console-reference": "기능 참조",
    "console-utilities": "Utilities API 참조",
    "console-api": "API 참조 문서",
  };

  function createRuntimeState() {
    return {
      selectionBuffer: [],
      lastResult: undefined,
      eventRegistry: new WeakMap(),
      instanceRegistry: new Map(),
      functionBindings: new Map(),
      monitoredFunctions: new Map(),
      debuggedFunctions: new Map(),
      eventMonitors: new WeakMap(),
    };
  }

  function isMobileRuntime() {
    const uaDataMobile = navigator.userAgentData?.mobile;

    if (typeof uaDataMobile === "boolean") {
      return uaDataMobile;
    }

    const ua = navigator.userAgent || "";
    const isIPad =
      /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) || isIPad;
  }

  function notifyParent(type, payload = {}) {
    window.parent.postMessage({ type, ...payload }, window.location.origin);
  }

  function reportState() {
    notifyParent("lab:preview-devtools-state", {
      open: isDevtoolsOpen,
      engine: devtoolsEngine,
    });
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function getLabRoot() {
    return document.querySelector(LAB_ROOT_SELECTOR);
  }

  function clearDelayedScenarioTimer() {
    if (delayedScenarioTimer !== null) {
      window.clearTimeout(delayedScenarioTimer);
      delayedScenarioTimer = null;
    }
  }

  function queueScenarioTransition() {
    const root = getLabRoot();

    if (!root) {
      return;
    }

    root.classList.remove("is-transitioning");
    void root.offsetWidth;
    root.classList.add("is-transitioning");

    if (scenarioTransitionTimer !== null) {
      window.clearTimeout(scenarioTransitionTimer);
    }

    scenarioTransitionTimer = window.setTimeout(() => {
      root.classList.remove("is-transitioning");
      scenarioTransitionTimer = null;
    }, 240);
  }

  function hydrateMotionImages(root = document) {
    root.querySelectorAll("img").forEach((image) => {
      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      image.classList.remove("is-loaded");

      const markLoaded = () => {
        image.classList.add("is-loaded");
      };

      if (image.complete && image.naturalWidth > 0) {
        window.requestAnimationFrame(markLoaded);
        return;
      }

      image.addEventListener("load", markLoaded, { once: true });
      image.addEventListener("error", markLoaded, { once: true });
    });
  }

  function clearGuideCard() {
    const existing = document.getElementById(LAB_GUIDE_ID);

    if (existing) {
      existing.remove();
    }
  }

  function clearStateArtifacts() {
    clearDelayedScenarioTimer();
    clearGuideCard();

    const stateStyle = document.getElementById(LAB_STATE_STYLE_ID);
    if (stateStyle) {
      stateStyle.remove();
    }
  }

  function extractPracticeSnippets(reference) {
    if (!reference || typeof reference.html !== "string" || reference.html.trim().length === 0) {
      return [];
    }

    const template = document.createElement("template");
    template.innerHTML = reference.html;

    const snippets = [];
    const seen = new Set();

    template.content.querySelectorAll("pre").forEach((preElement) => {
      const snippet = preElement.textContent?.replaceAll("\u00a0", " ").trim() ?? "";

      if (!snippet || seen.has(snippet)) {
        return;
      }

      seen.add(snippet);
      snippets.push(snippet);
    });

    if (snippets.length > 0) {
      return snippets.slice(0, 3);
    }

    template.content.querySelectorAll("code").forEach((codeElement) => {
      const snippet = codeElement.textContent?.replace(/\s+/g, " ").trim() ?? "";

      if (
        !snippet ||
        seen.has(snippet) ||
        snippet.length < 2 ||
        snippet.length > 120 ||
        (!snippet.includes("console.") &&
          !snippet.includes("$") &&
          !snippet.includes("document") &&
          !snippet.includes("window") &&
          !snippet.includes("("))
      ) {
        return;
      }

      seen.add(snippet);
      snippets.push(snippet);
    });

    return snippets.slice(0, 4);
  }

  function addPracticeGuide(reference) {
    const root = getLabRoot();
    const header = root?.querySelector(".lab-header");
    const snippets = extractPracticeSnippets(reference);

    if (!header || snippets.length === 0) {
      return false;
    }

    clearGuideCard();

    const isCompactSnippet = (snippet) => !snippet.includes("\n") && snippet.length <= 24;
    const allCompact = snippets.every(isCompactSnippet);

    const guide = document.createElement("section");
    guide.id = LAB_GUIDE_ID;
    guide.className = "lab-guide";
    guide.innerHTML = `
      ${
        allCompact
          ? `<div class="lab-guide__chips">${snippets
              .map(
                (snippet) =>
                  `<code class="lab-guide__chip">${escapeHtml(snippet)}</code>`,
              )
              .join("")}</div>`
          : snippets
              .map((snippet) => {
                if (isCompactSnippet(snippet)) {
                  return `<code class="lab-guide__chip">${escapeHtml(snippet)}</code>`;
                }

                return `<pre class="lab-guide__code"><code>${escapeHtml(snippet)}</code></pre>`;
              })
              .join("")
      }
    `;
    header.insertAdjacentElement("afterend", guide);
    queueScenarioTransition();
    return true;
  }

  function getLabTitleElement() {
    return document.getElementById("lab-title");
  }

  function getLabDescriptionElement() {
    return document.getElementById("lab-description");
  }

  function setLabHeader({ title, description } = {}) {
    const titleElement = getLabTitleElement();
    const descriptionElement = getLabDescriptionElement();
    const defaultTitle = titleElement?.dataset.defaultTitle?.trim() || "Console Preview";
    const defaultDescription = descriptionElement?.dataset.defaultDescription?.trim() || "";
    const nextTitle = typeof title === "string" && title.trim().length > 0 ? title.trim() : defaultTitle;
    const nextDescription =
      typeof description === "string" ? description.trim() : defaultDescription;

    if (titleElement) {
      titleElement.textContent = nextTitle;
    }

    if (descriptionElement) {
      descriptionElement.textContent = nextDescription;
      descriptionElement.hidden = nextDescription.length === 0;
    }

    document.title = nextTitle.length > 0 ? `${nextTitle} | Console Preview` : "Console Preview";
  }

  function resolveLabHeaderTitle(payload = {}) {
    if (!payload || typeof payload !== "object") {
      return "";
    }

    const sourceGuideTitle =
      typeof payload.sourceGuide?.title === "string" ? payload.sourceGuide.title.trim() : "";

    if (sourceGuideTitle.length > 0) {
      return sourceGuideTitle;
    }

    if (typeof payload.sectionLabel === "string" && payload.sectionLabel.trim().length > 0) {
      return payload.sectionLabel.trim();
    }

    if (typeof payload.topicId === "string" && topicLabels[payload.topicId]) {
      return topicLabels[payload.topicId];
    }

    return "";
  }

  function setStatusRibbon(title, description) {
    const ribbon = document.getElementById("status-ribbon");

    if (!ribbon) {
      return;
    }

    ribbon.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span>`;
  }

  function appendActivity(text) {
    const list = document.getElementById("activity-list");

    if (!list) {
      return;
    }

    const item = document.createElement("li");
    item.textContent = text;
    list.prepend(item);

    while (list.children.length > 7) {
      list.removeChild(list.lastElementChild);
    }
  }

  function clearHighlights() {
    const grid = document.getElementById("console-playground");

    document.querySelectorAll(".is-highlighted").forEach((node) => {
      node.classList.remove("is-highlighted");
    });

    document.querySelectorAll(".is-muted").forEach((node) => {
      node.classList.remove("is-muted");
    });

    document.querySelectorAll(".is-hidden-by-scenario").forEach((node) => {
      node.classList.remove("is-hidden-by-scenario");
    });

    document.querySelectorAll(".lab-focus-ring").forEach((node) => {
      node.classList.remove("lab-focus-ring");
    });

    if (grid) {
      grid.classList.remove("is-scenario-focus");
    }
  }

  function highlightTargets(selectors = [], options = {}) {
    const { muteOthers = false, addFocusRing = false, hideOthers = muteOthers } = options;
    clearHighlights();

    const targets = selectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean);
    const targetCards = new Set();

    targets.forEach((target) => {
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const card = target.closest(".lab-card");

      if (card instanceof HTMLElement) {
        targetCards.add(card);
      }
    });

    if (muteOthers) {
      document.querySelectorAll(".lab-card").forEach((card) => {
        card.classList.add("is-muted");
      });
    }

    if (hideOthers) {
      const grid = document.getElementById("console-playground");

      if (grid) {
        grid.classList.add("is-scenario-focus");
      }

      document.querySelectorAll(".lab-card").forEach((card) => {
        if (!targetCards.has(card)) {
          card.classList.add("is-hidden-by-scenario");
        }
      });
    }

    targets.forEach((target) => {
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const card = target.closest(".lab-card") ?? target;
      if (card instanceof HTMLElement) {
        card.classList.remove("is-muted");
        card.classList.add("is-highlighted");
      }

      if (addFocusRing) {
        target.classList.add("lab-focus-ring");
      }
    });
  }

  function trackLastResult(value) {
    runtime.lastResult = value;
    return value;
  }

  function normalizeNodeInput(value) {
    if (typeof value === "string") {
      return document.querySelector(value);
    }

    return value instanceof Element ? value : null;
  }

  function setSelectionBuffer(values) {
    runtime.selectionBuffer = values.map(normalizeNodeInput).filter(Boolean);

    for (let index = 0; index < 5; index += 1) {
      const chip = document.getElementById(`selection-chip-${index}`);
      const node = runtime.selectionBuffer[index];

      if (!chip) {
        continue;
      }

      if (node instanceof HTMLElement) {
        chip.textContent = `$${index}: #${node.id || node.dataset.consoleNode || node.tagName.toLowerCase()}`;
      } else {
        chip.textContent = `$${index}: (empty)`;
      }
    }
  }

  function defineWindowBindingsOnce() {
    if (window.__consoleLabBindingsDefined) {
      return;
    }

    for (let index = 0; index < 5; index += 1) {
      Object.defineProperty(window, `$${index}`, {
        configurable: true,
        get() {
          return runtime.selectionBuffer[index] ?? null;
        },
      });
    }

    Object.defineProperty(window, "$_", {
      configurable: true,
      get() {
        return runtime.lastResult;
      },
    });

    window.__consoleLabBindingsDefined = true;
  }

  function trackInstance(instance) {
    const bucket = runtime.instanceRegistry.get(instance.constructor) ?? [];
    bucket.push(instance);
    runtime.instanceRegistry.set(instance.constructor, bucket);
  }

  function bindFunction(target, key, fn) {
    target[key] = fn;
    const bindings = runtime.functionBindings.get(fn) ?? [];
    bindings.push({ target, key });
    runtime.functionBindings.set(fn, bindings);
    return fn;
  }

  function swapFunctionBindings(sourceFn, nextFn) {
    const bindings = runtime.functionBindings.get(sourceFn);

    if (!bindings) {
      return false;
    }

    bindings.forEach(({ target, key }) => {
      target[key] = nextFn;
    });
    runtime.functionBindings.set(nextFn, bindings);
    return true;
  }

  function resolveWrappedOriginal(store, candidate) {
    for (const [original, state] of store.entries()) {
      if (candidate === original || candidate === state.wrapper) {
        return original;
      }
    }

    return null;
  }

  function registerListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    const snapshot = runtime.eventRegistry.get(target) ?? {};
    snapshot[type] = [...(snapshot[type] ?? []), handler];
    runtime.eventRegistry.set(target, snapshot);
  }

  function getEventListenersSnapshot(target) {
    const snapshot = runtime.eventRegistry.get(target) ?? {};

    return Object.fromEntries(
      Object.entries(snapshot).map(([type, handlers]) => [
        type,
        handlers.map((handler) => ({
          type,
          name: handler.name || "(anonymous)",
        })),
      ]),
    );
  }

  function installConsoleUtilities(consoleLab) {
    defineWindowBindingsOnce();
    window.consoleLab = consoleLab;

    window.$ = (selector, startNode = document) =>
      trackLastResult((startNode || document).querySelector(selector));

    window.$$ = (selector, startNode = document) =>
      trackLastResult(Array.from((startNode || document).querySelectorAll(selector)));

    window.$x = (path, startNode = document) => {
      const rootNode = startNode || document;
      const ownerDocument = rootNode.ownerDocument || document;
      const snapshot = ownerDocument.evaluate(
        path,
        rootNode,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null,
      );
      const matches = [];

      for (let index = 0; index < snapshot.snapshotLength; index += 1) {
        matches.push(snapshot.snapshotItem(index));
      }

      return trackLastResult(matches);
    };

    window.clear = () => {
      console.clear();
      appendActivity("console.clear() called");
      setStatusRibbon("CONSOLE CLEARED", "출력 버퍼를 비운 뒤 다시 로그를 확인할 수 있습니다.");
      return trackLastResult(true);
    };

    window.copy = (value) => {
      let text = "";

      if (typeof value === "string") {
        text = value;
      } else if (value instanceof Element) {
        text = value.outerHTML;
      } else {
        try {
          text = JSON.stringify(value, null, 2);
        } catch {
          text = String(value);
        }
      }

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          appendActivity("clipboard write blocked; copied payload left in return value");
        });
      }

      setStatusRibbon("COPY READY", "반환값과 클립보드에 복사할 문자열이 준비되었습니다.");
      appendActivity("copy() prepared a payload for clipboard use");
      return trackLastResult(text);
    };

    window.dir = (value) => {
      console.dir(value);
      return trackLastResult(value);
    };

    window.dirxml = (value) => {
      if (typeof console.dirxml === "function") {
        console.dirxml(value);
      } else {
        console.log(value);
      }
      return trackLastResult(value);
    };

    window.inspect = (value) => {
      if (value === document.body) {
        highlightTargets(["#document-body"], { muteOthers: true, addFocusRing: true });
      } else if (value instanceof HTMLElement) {
        highlightTargets([`#${value.id}`], { addFocusRing: true });
        value.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      console.log(value);
      return trackLastResult(value);
    };

    window.getEventListeners = (target) => trackLastResult(getEventListenersSnapshot(target));
    window.keys = (object) => trackLastResult(Object.keys(object));
    window.values = (object) => trackLastResult(Object.values(object));
    window.table = (data, columns) => {
      if (typeof console.table === "function") {
        console.table(data, columns);
      } else {
        console.log(data);
      }
      return trackLastResult(data);
    };

    window.queryObjects = (Constructor) =>
      trackLastResult(runtime.instanceRegistry.get(Constructor) ?? []);

    window.profile = (name) => {
      if (typeof console.profile === "function") {
        console.profile(name);
      } else {
        console.info("profile() is not supported in this preview runtime.");
      }
      return trackLastResult(name ?? true);
    };

    window.profileEnd = (name) => {
      if (typeof console.profileEnd === "function") {
        console.profileEnd(name);
      } else {
        console.info("profileEnd() is not supported in this preview runtime.");
      }
      return trackLastResult(name ?? true);
    };

    const monitorEventGroups = {
      mouse: ["mousedown", "mouseup", "click", "dblclick", "mousemove", "mouseover", "mouseout", "wheel"],
      key: ["keydown", "keyup", "keypress", "textInput", "input"],
      touch: ["touchstart", "touchmove", "touchend", "touchcancel"],
      control: ["resize", "scroll", "zoom", "focus", "blur", "select", "change", "submit", "reset"],
    };

    const expandMonitorEvents = (events) => {
      const eventList = Array.isArray(events) ? events : [events];

      return eventList.flatMap((eventName) => {
        if (typeof eventName !== "string") {
          return [];
        }

        return monitorEventGroups[eventName] ?? [eventName];
      });
    };

    window.monitorEvents = (target, events = ["click"]) => {
      const eventList = expandMonitorEvents(events);
      const monitors = runtime.eventMonitors.get(target) ?? new Map();

      eventList.forEach((eventName) => {
        if (monitors.has(eventName)) {
          return;
        }

        const listener = (event) => {
          console.info(`[monitorEvents] ${eventName}`, event.target);
        };

        target.addEventListener(eventName, listener);
        monitors.set(eventName, listener);
      });

      runtime.eventMonitors.set(target, monitors);
      return trackLastResult(target);
    };

    window.unmonitorEvents = (target, events = ["click"]) => {
      const eventList = expandMonitorEvents(events);
      const monitors = runtime.eventMonitors.get(target);

      if (!monitors) {
        return trackLastResult(target);
      }

      eventList.forEach((eventName) => {
        const listener = monitors.get(eventName);
        if (!listener) {
          return;
        }
        target.removeEventListener(eventName, listener);
        monitors.delete(eventName);
      });

      return trackLastResult(target);
    };

    window.monitor = (fn) => {
      const original = resolveWrappedOriginal(runtime.monitoredFunctions, fn) ?? fn;
      if (runtime.monitoredFunctions.has(original)) {
        return trackLastResult(runtime.monitoredFunctions.get(original).wrapper);
      }

      const wrapper = function monitoredFunction(...args) {
        console.info(`[monitor] ${original.name || "anonymous"}`, args);
        return original.apply(this, args);
      };

      swapFunctionBindings(original, wrapper);
      runtime.monitoredFunctions.set(original, { wrapper });
      return trackLastResult(wrapper);
    };

    window.unmonitor = (fn) => {
      const original = resolveWrappedOriginal(runtime.monitoredFunctions, fn);

      if (!original) {
        return trackLastResult(fn);
      }

      const state = runtime.monitoredFunctions.get(original);
      swapFunctionBindings(state.wrapper, original);
      runtime.monitoredFunctions.delete(original);
      return trackLastResult(original);
    };

    window.debug = (fn) => {
      const original = resolveWrappedOriginal(runtime.debuggedFunctions, fn) ?? fn;
      if (runtime.debuggedFunctions.has(original)) {
        return trackLastResult(runtime.debuggedFunctions.get(original).wrapper);
      }

      const wrapper = function debuggedFunction(...args) {
        debugger;
        return original.apply(this, args);
      };

      swapFunctionBindings(original, wrapper);
      runtime.debuggedFunctions.set(original, { wrapper });
      return trackLastResult(wrapper);
    };

    window.undebug = (fn) => {
      const original = resolveWrappedOriginal(runtime.debuggedFunctions, fn);

      if (!original) {
        return trackLastResult(fn);
      }

      const state = runtime.debuggedFunctions.get(original);
      swapFunctionBindings(state.wrapper, original);
      runtime.debuggedFunctions.delete(original);
      return trackLastResult(original);
    };
  }

  function createPreviewImageSource(label, background, accent) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
        <rect width="320" height="200" rx="24" fill="${background}" />
        <circle cx="92" cy="96" r="42" fill="${accent}" />
        <rect x="152" y="56" width="104" height="80" rx="18" fill="#0f172a" />
        <text x="160" y="174" fill="#0f172a" font-size="24" font-family="Arial, sans-serif" text-anchor="middle">
          ${label}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function seedPreviewImages() {
    const images = [
      ["hero-image", "IMG 0", "#dbeafe", "#2563eb"],
      ["gallery-image-0", "IMG 1", "#fef3c7", "#f59e0b"],
      ["gallery-image-1", "IMG 2", "#dcfce7", "#16a34a"],
      ["gallery-image-2", "IMG 3", "#fee2e2", "#dc2626"],
    ];

    images.forEach(([id, label, background, accent]) => {
      const image = document.getElementById(id);

      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      image.src = createPreviewImageSource(label, background, accent);
    });

    hydrateMotionImages(document);
  }

  function refreshPayloadPreview(player, names, artists, state) {
    const payload = document.getElementById("payload-preview");
    const runtimeCodePreview = document.getElementById("runtime-code-preview");

    if (!payload) {
      return;
    }

    payload.textContent = JSON.stringify(
      {
        player,
        names,
        artists,
        state,
      },
      null,
      2,
    );

    if (runtimeCodePreview) {
      runtimeCodePreview.textContent = [
        "player",
        "names",
        "people",
        "artists",
        "foo",
        "x, y, reason",
        "label, timeline1, timeline2",
        "sum(1, 2)",
        "getData()",
        "hideModal()",
        "first()",
      ].join("\n");
    }
  }

  function setupBaseRuntime() {
    runtime = createRuntimeState();
    seedPreviewImages();

    const eventSourceButton = document.getElementById("event-source");
    const inspectSourceButton = document.getElementById("inspect-source");
    const monitoredInput = document.getElementById("monitored-input");
    const modalTarget = document.getElementById("modal-target");
    const labTitle = getLabTitleElement();
    const labDescription = getLabDescriptionElement();
    const demoTitle = document.getElementById("console-demo-title");
    const helloButton = document.getElementById("hello");
    const logStatus = document.getElementById("log-status");

    const artists = [
      { first: "René", last: "Magritte" },
      { first: "Chaim", last: "Soutine" },
      { first: "Henri", last: "Matisse" },
    ];
    const names = [
      { firstName: "John", lastName: "Smith" },
      { firstName: "Jane", lastName: "Doe" },
    ];
    const player = {
      name: "Parzival",
      number: 1,
      state: "ready",
      easterEggs: 3,
    };
    const people = [
      { first: "René", last: "Magritte" },
      { first: "Chaim", last: "Soutine", birthday: "18930113" },
      { first: "Henri", last: "Matisse" },
    ];
    const x = 5;
    const y = 3;
    const reason = "x is expected to be less than y";
    const label = "Adolescent Irradiated Espionage Tortoises";
    const timeline1 = "New York 2012";
    const timeline2 = "Camp Lehigh 1970";
    const demoState = {
      title: demoTitle?.textContent ?? "Hello, World!",
      modalVisible: true,
      lastAction: "boot",
    };

    class foo {
      constructor(label) {
        this.label = label;
      }
    }

    const fooInstances = [new foo("alpha"), new foo("beta"), new foo("gamma")];
    fooInstances.forEach(trackInstance);

    function updateDemoCopy(nextText) {
      if (logStatus) {
        logStatus.textContent = nextText;
      }
    }

    function updateTitle(nextTitle) {
      if (demoTitle) {
        demoTitle.textContent = nextTitle;
      }

      if (helloButton) {
        helloButton.textContent = nextTitle;
      }

      demoState.title = nextTitle;
      demoState.lastAction = "update-title";
      refreshPayloadPreview(player, names, artists, demoState);
      return trackLastResult(nextTitle);
    }

    function emitOverviewLogs() {
      console.log("Loading!");
      console.log(demoTitle?.textContent ?? "Hello, World!");
      console.assert(document.querySelector("h2"), "h2 not found!");
      console.table(artists);
      updateDemoCopy("console.log('Loading!') 와 console.table(artists)가 출력되었습니다.");
      demoState.lastAction = "emit-overview-logs";
      refreshPayloadPreview(player, names, artists, demoState);

      window.setTimeout(() => {
        updateTitle("Hello, Console!");
        console.log(demoTitle?.textContent ?? "Hello, Console!");
        updateDemoCopy("3초 뒤 제목이 Hello, Console!로 변경되었습니다.");
      }, 300);

      return trackLastResult(true);
    }

    function getData() {
      const result = {
        player,
        names,
        artists,
      };
      demoState.lastAction = "get-data";
      refreshPayloadPreview(player, names, artists, demoState);
      return trackLastResult(result);
    }

    function hideModal() {
      if (!(modalTarget instanceof HTMLElement)) {
        return trackLastResult(false);
      }

      modalTarget.classList.toggle("lab-hidden");
      demoState.modalVisible = !modalTarget.classList.contains("lab-hidden");
      demoState.lastAction = "hide-modal";
      refreshPayloadPreview(player, names, artists, demoState);
      return trackLastResult(demoState.modalVisible);
    }

    function sum(x, y) {
      return x + y;
    }

    function first() {
      return second();
    }

    function second() {
      return third();
    }

    function third() {
      return fourth();
    }

    function fourth() {
      console.trace();
      demoState.lastAction = "trace";
      refreshPayloadPreview(player, names, artists, demoState);
      return trackLastResult(true);
    }

    function runTimeSample() {
      console.time();

      for (let index = 0; index < 100000; index += 1) {
        continue;
      }

      console.timeEnd();
      demoState.lastAction = "time";
      refreshPayloadPreview(player, names, artists, demoState);
      return trackLastResult(true);
    }

    const consoleLab = {
      artists,
      names,
      people,
      player,
      foo,
      x,
      y,
      reason,
      label,
      timeline1,
      timeline2,
      updateTitle,
    };

    bindFunction(consoleLab, "emitOverviewLogs", emitOverviewLogs);
    bindFunction(consoleLab, "getData", getData);
    bindFunction(consoleLab, "hideModal", hideModal);
    bindFunction(consoleLab, "sum", sum);
    bindFunction(consoleLab, "runTimeSample", runTimeSample);
    bindFunction(consoleLab, "first", first);
    bindFunction(consoleLab, "second", second);
    bindFunction(consoleLab, "third", third);
    bindFunction(consoleLab, "fourth", fourth);

    bindFunction(window, "getData", getData);
    bindFunction(window, "hideModal", hideModal);
    bindFunction(window, "sum", sum);
    bindFunction(window, "first", first);
    bindFunction(window, "second", second);
    bindFunction(window, "third", third);
    bindFunction(window, "fourth", fourth);
    window.player = player;
    window.names = names;
    window.artists = artists;
    window.people = people;
    window.foo = foo;
    window.x = x;
    window.y = y;
    window.reason = reason;
    window.label = label;
    window.timeline1 = timeline1;
    window.timeline2 = timeline2;

    installConsoleUtilities(consoleLab);
    refreshPayloadPreview(player, names, artists, demoState);
    setStatusRibbon(
      "RUNTIME READY",
      "window.consoleLab, $, $$, $x, $0-$4, keys(), values()를 바로 사용할 수 있습니다.",
    );
    setSelectionBuffer([
      document.getElementById("gallery-image-2"),
      document.getElementById("gallery-image-1"),
      document.getElementById("gallery-image-0"),
      document.getElementById("monitored-input"),
      document.getElementById("hero-image"),
    ]);

    registerListener(document, "click", () => {
      demoState.lastAction = "document-click";
      refreshPayloadPreview(player, names, artists, demoState);
    });

    registerListener(document, "click", () => {
      demoState.lastAction = "document-click-secondary";
      refreshPayloadPreview(player, names, artists, demoState);
    });

    registerListener(document, "keydown", () => {
      demoState.lastAction = "document-keydown";
      refreshPayloadPreview(player, names, artists, demoState);
    });

    registerListener(window, "resize", () => {
      console.info("resize", window.innerWidth, window.innerHeight);
    });

    registerListener(window, "scroll", () => {
      console.info("scroll", Math.round(window.scrollY || 0));
    });

    if (eventSourceButton) {
      registerListener(eventSourceButton, "click", () => {
        demoState.lastAction = "event-source-click";
        refreshPayloadPreview(player, names, artists, demoState);
      });
    }

    if (inspectSourceButton) {
      registerListener(inspectSourceButton, "click", () => {
        inspect(document.body);
      });
    }

    if (helloButton) {
      registerListener(helloButton, "click", () => {
        demoState.lastAction = "hello-click";
        refreshPayloadPreview(player, names, artists, demoState);
      });
    }

    if (monitoredInput) {
      registerListener(monitoredInput, "keydown", () => {
        demoState.lastAction = "input-keydown";
        refreshPayloadPreview(player, names, artists, demoState);
      });
      registerListener(monitoredInput, "input", () => {
        demoState.lastAction = "input-change";
        refreshPayloadPreview(player, names, artists, demoState);
      });
    }

    if (labTitle) {
      labTitle.dataset.consoleTitle = "true";
      labTitle.dataset.defaultTitle = labTitle.textContent?.trim() || "Console Preview";
    }

    if (labDescription) {
      labDescription.dataset.defaultDescription = labDescription.textContent?.trim() || "";
    }

    setLabHeader();
  }

  function resetLabScenario() {
    const root = getLabRoot();

    clearStateArtifacts();

    if (!root || !initialLabRootHtml) {
      return false;
    }

    root.innerHTML = initialLabRootHtml;
    window.scrollTo(0, 0);
    setupBaseRuntime();
    queueScenarioTransition();
    return true;
  }

  function emitScenarioLogs() {
    window.consoleLab.emitOverviewLogs();
  }

  function emitLogShowcase() {
    console.clear();
    emitScenarioLogs();
    console.warn("Abandon Hope All Ye Who Enter");
    console.error("I'm sorry, Dave. I'm afraid I can't do that.");
    console.table(window.people);
    console.group("Adolescent Irradiated Espionage Tortoises");
    console.log("Leonardo");
    console.log("Donatello");
    console.log("Raphael");
    console.log("Michelangelo");
    console.groupEnd();
  }

  function emitMissingScriptRequest() {
    const brokenScript = document.createElement("script");
    brokenScript.src = `/labs/console/missing-${Date.now()}.js`;
    brokenScript.async = true;
    brokenScript.onerror = () => {
      brokenScript.remove();
    };
    document.body.appendChild(brokenScript);
  }

  function emitFetchSamples() {
    fetch("/favicon.ico").catch(() => {});
    fetch(`/labs/console/missing-${Date.now()}.json`).catch(() => {});
  }

  function emitFormatSpecifierLogs() {
    console.clear();
    const tools = "Chrome DevTools";
    console.warn("%s is awesome.", tools);
    console.info(
      "The total weight of %i %s and %d %s is %f grams.",
      3,
      "apples",
      2,
      "oranges",
      432.4,
    );
    console.log("I have %i apples and %d oranges.", 2, 3.5);
    console.log("Jane has %i kiwis.", "two");
  }

  function emitStyledLogs() {
    console.clear();
    const style =
      "background-color: darkblue; color: white; font-style: italic; border: 5px solid hotpink; font-size: 2em;";
    console.log("%cHooray", style);
    console.log("\x1B[41;93;4mHello\x1B[m");
    const hello = "\x1B[41;93;4mHello";
    const space = "\x1B[m ";
    const world = "\x1B[34;102;9mWorld";
    console.log(hello + space + world);
  }

  function scenarioLogSetup() {
    highlightTargets(["#document-body", "#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "현재 Preview 문서를 열어 둔 상태에서 Console 패널을 여는 흐름을 따라갈 수 있습니다.");
  }

  function scenarioLogMessages() {
    emitLogShowcase();
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "문서에 나온 log, warn, error, table, group 예제를 Console에서 직접 확인할 수 있습니다.");
  }

  function scenarioLogBrowser() {
    emitMissingScriptRequest();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "브라우저 오류 메시지를 확인할 수 있도록 실패한 리소스 요청을 만들었습니다.");
  }

  function scenarioLogFilters() {
    emitLogShowcase();
    emitMissingScriptRequest();
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "로그 수준, 텍스트, 정규식, 소스, 사용자 메시지 기준으로 필터링할 메시지를 준비했습니다.");
  }

  function scenarioLogDrawer() {
    highlightTargets(["#document-body", "#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "다른 패널과 함께 Console을 사용하는 흐름을 현재 Preview에서 바로 따라갈 수 있습니다.");
  }

  function scenarioOpenConsole() {
    highlightTargets(["#document-body", "#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "Console 패널을 열고 현재 Preview 문서를 바로 검사할 수 있습니다.");
  }

  function scenarioOverview() {
    highlightTargets(["#document-body", "#image-gallery"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "콘솔을 사용하여 JavaScript 웹 애플리케이션을 테스트하고 디버그합니다.");
  }

  function scenarioViewLogs() {
    emitScenarioLogs();
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "문서 예제와 같은 로그를 Console에서 바로 확인할 수 있습니다.");
  }

  function scenarioRunJavaScript() {
    highlightTargets(["#document-body", "#hello"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "Console에서 제목과 DOM을 직접 변경할 수 있습니다.");
  }

  function scenarioJavaScriptPage() {
    const helloButton = document.getElementById("hello");
    if (helloButton instanceof HTMLElement) {
      helloButton.focus();
    }
    highlightTargets(["#document-body", "#hello"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "document.getElementById('hello').textContent = 'Hello, Console!' 예제를 바로 실행할 수 있습니다.");
  }

  function scenarioJavaScriptPlayground() {
    highlightTargets(["#runtime-objects", "#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "5 + 15, 함수 정의, add(25) 같은 JavaScript 실험을 현재 Console 세션에서 실행할 수 있습니다.");
  }

  function scenarioLiveExpressions() {
    const monitoredInput = document.getElementById("monitored-input");
    if (monitoredInput instanceof HTMLElement) {
      monitoredInput.focus();
    }
    highlightTargets(["#event-panel", "#runtime-objects"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "document.activeElement, player.state, 입력값 같은 표현식을 Live Expression으로 고정해 확인할 수 있습니다.");
  }

  function scenarioFormatLogs() {
    emitFormatSpecifierLogs();
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "문서의 형식 지정자 예제를 Console 출력에서 바로 비교할 수 있습니다.");
  }

  function scenarioFormatStyles() {
    emitStyledLogs();
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "%c 스타일과 ANSI 이스케이프 시퀀스 예제를 Console 출력에서 확인할 수 있습니다.");
  }

  function scenarioReferenceOpen() {
    highlightTargets(["#document-body", "#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "Console을 패널이나 드로어에서 여는 흐름을 현재 Preview 기준으로 따라갈 수 있습니다.");
  }

  function scenarioReferenceSettings() {
    highlightTargets(["#document-body", "#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "Console 설정과 사이드바 관련 조작을 DevTools 안에서 바로 확인할 수 있습니다.");
  }

  function scenarioReferenceView() {
    emitLogShowcase();
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "메시지 그룹, 로그 수준, 출력 형태를 Console에서 직접 확인할 수 있습니다.");
  }

  function scenarioReferenceStackTraces() {
    console.clear();
    window.first();
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.trace()와 함수 호출 흐름을 사용해 스택 트레이스를 확인할 수 있습니다.");
  }

  function scenarioReferenceXhr() {
    console.clear();
    emitFetchSamples();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "Log XMLHttpRequests 설정을 켠 뒤 fetch 요청 로그를 확인할 수 있습니다.");
  }

  function scenarioReferencePersist() {
    emitLogShowcase();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "로그 유지를 켠 다음 Preview 새로고침으로 로그 유지 동작을 확인할 수 있습니다.");
  }

  function scenarioReferenceNetwork() {
    emitMissingScriptRequest();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "네트워크 오류 메시지를 숨기거나 CORS 오류 표시 설정을 비교할 수 있습니다.");
  }

  function scenarioReferenceFilter() {
    emitLogShowcase();
    emitMissingScriptRequest();
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "사이드바, 로그 수준, URL, 정규식 기준 필터링을 실습할 수 있습니다.");
  }

  function scenarioReferenceSearch() {
    emitLogShowcase();
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "출력된 로그를 대상으로 Console 검색을 바로 실습할 수 있습니다.");
  }

  function scenarioReferenceJavaScript() {
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "Console 입력, 기록, 메시지 관리, JavaScript 실행 흐름을 현재 Preview 기준으로 실습할 수 있습니다.");
  }

  function scenarioReferenceLive() {
    const monitoredInput = document.getElementById("monitored-input");
    if (monitoredInput instanceof HTMLElement) {
      monitoredInput.focus();
    }
    highlightTargets(["#event-panel", "#runtime-objects"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "실시간 표현식으로 표현식 값을 계속 관찰하는 흐름을 바로 실습할 수 있습니다.");
  }

  function scenarioReferenceInputSettings() {
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "조기 평가와 자동 완성 관련 Console 입력 동작을 현재 세션에서 확인할 수 있습니다.");
  }

  function scenarioReferenceInspect() {
    setSelectionBuffer([
      "#document-body",
      "#hero-image",
      "#monitored-input",
      "#gallery-image-0",
      "#gallery-image-1",
    ]);
    highlightTargets(["#document-body", "#runtime-objects"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "객체, 함수, 내부 속성, private 필드를 Console에서 직접 펼쳐서 검사할 수 있습니다.");
  }

  function scenarioReferenceClear() {
    emitLogShowcase();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "로그를 만든 뒤 console.clear() 또는 지우기 동작을 바로 비교할 수 있습니다.");
  }

  function scenarioRecentNodes() {
    setSelectionBuffer([
      "#gallery-image-2",
      "#gallery-image-1",
      "#gallery-image-0",
      "#monitored-input",
      "#hero-image",
    ]);
    highlightTargets(["#image-gallery"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "$0 - $4 선택 버퍼가 img 요소와 입력 필드 기준으로 준비되었습니다.");
  }

  function scenarioQuerySelector() {
    highlightTargets(["#image-gallery", "#document-body"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "$('img')와 $('img', startNode) 예제를 실행할 수 있습니다.");
  }

  function scenarioQuerySelectorAll() {
    highlightTargets(["#image-gallery"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "$$('img') 예제를 실행할 수 있습니다.");
  }

  function scenarioXPath() {
    highlightTargets(["#xpath-panel", "#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "$x(\"//p\")와 startNode 예제를 실행할 수 있습니다.");
  }

  function scenarioUtilityClear() {
    emitScenarioLogs();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "로그를 만든 뒤 clear()를 실행할 수 있습니다.");
  }

  function scenarioCopy() {
    setSelectionBuffer([
      "#hero-image",
      "#gallery-image-0",
      "#document-body",
      "#monitored-input",
      "#gallery-image-1",
    ]);
    highlightTargets(["#document-body", "#image-gallery"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "copy($0) 예제를 실행할 수 있습니다.");
  }

  function scenarioUtilityDebug() {
    highlightTargets(["#runtime-objects"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "debug(getData)와 getData() 예제를 실행할 수 있습니다.");
  }

  function scenarioUtilityDir() {
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "document.body와 dir(document.body)를 비교할 수 있습니다.");
  }

  function scenarioUtilityDirxml() {
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "dirxml(document.body) 예제를 실행할 수 있습니다.");
  }

  function scenarioInspect() {
    highlightTargets(["#document-body"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "inspect(document.body) 예제를 실행할 수 있습니다.");
  }

  function scenarioGetEventListeners() {
    highlightTargets(["#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "getEventListeners(document) 예제를 실행할 수 있습니다.");
  }

  function scenarioKeys() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "keys(player)와 values(player) 예제를 실행할 수 있습니다.");
  }

  function scenarioMonitor() {
    highlightTargets(["#runtime-objects"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "monitor(sum)과 sum(1, 2) 예제를 실행할 수 있습니다.");
  }

  function scenarioMonitorEvents() {
    setSelectionBuffer([
      "#monitored-input",
      "#event-source",
      "#gallery-image-0",
      "#hero-image",
      "#document-body",
    ]);
    highlightTargets(["#event-panel"], { muteOthers: true, addFocusRing: true });
    setStatusRibbon("SECTION READY", "monitorEvents(window, 'resize')와 monitorEvents($0, 'key') 예제를 실행할 수 있습니다.");
  }

  function scenarioQueryObjects() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "queryObjects(foo) 예제를 실행할 수 있습니다.");
  }

  function scenarioUtilityTable() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "table(names) 예제를 실행할 수 있습니다.");
  }

  function scenarioValues() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "values(player) 예제를 실행할 수 있습니다.");
  }

  function scenarioApiAssert() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "x, y, reason 값을 기준으로 console.assert(x < y, { x, y, reason })를 실행할 수 있습니다.");
  }

  function scenarioApiClear() {
    emitScenarioLogs();
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.clear() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiCount() {
    highlightTargets(["#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.count()와 console.count('coffee') 호출을 같은 Console 세션에서 확인할 수 있습니다.");
  }

  function scenarioApiCountReset() {
    highlightTargets(["#event-panel"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.count('coffee') 이후 console.countReset('coffee') 흐름을 확인할 수 있습니다.");
  }

  function scenarioApiDebug() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.debug() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiDir() {
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.dir(document.head) 또는 document.body를 대상으로 객체 구조를 확인할 수 있습니다.");
  }

  function scenarioApiDirxml() {
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.dirxml(document)으로 현재 문서 노드 구조를 확인할 수 있습니다.");
  }

  function scenarioApiError() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.error() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiGroup() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "label, timeline1, timeline2 값을 사용해 console.group() 중첩 예제를 실행할 수 있습니다.");
  }

  function scenarioApiGroupCollapsed() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "label 값을 사용해 console.groupCollapsed() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiInfo() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.info() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiLog() {
    highlightTargets(["#document-body"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.log() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiTable() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "people 배열로 console.table(people)와 열 선택 예제를 실행할 수 있습니다.");
  }

  function scenarioApiTime() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.time() / console.timeEnd() 예제를 실행할 수 있습니다.");
  }

  function scenarioApiTrace() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "first(), second(), third(), fourth()를 통한 trace 예제를 실행할 수 있습니다.");
  }

  function scenarioApiWarn() {
    highlightTargets(["#runtime-objects"], { muteOthers: true });
    setStatusRibbon("SECTION READY", "console.warn() 예제를 실행할 수 있습니다.");
  }

  const scenarioHandlers = {
    "overview:overview": scenarioOverview,
    "overview:open-console": scenarioOpenConsole,
    "overview:view-logs": scenarioViewLogs,
    "overview:run-js": scenarioRunJavaScript,
    "log:setup": scenarioLogSetup,
    "log:messages": scenarioLogMessages,
    "log:browser": scenarioLogBrowser,
    "log:filters": scenarioLogFilters,
    "log:drawer": scenarioLogDrawer,
    "javascript:page": scenarioJavaScriptPage,
    "javascript:playground": scenarioJavaScriptPlayground,
    "live:expressions": scenarioLiveExpressions,
    "format:format": scenarioFormatLogs,
    "format:style": scenarioFormatStyles,
    "reference:open": scenarioReferenceOpen,
    "reference:settings": scenarioReferenceSettings,
    "reference:view": scenarioReferenceView,
    "reference:stack-traces": scenarioReferenceStackTraces,
    "reference:xhr": scenarioReferenceXhr,
    "reference:persist": scenarioReferencePersist,
    "reference:network": scenarioReferenceNetwork,
    "reference:filter": scenarioReferenceFilter,
    "reference:search": scenarioReferenceSearch,
    "reference:js": scenarioReferenceJavaScript,
    "reference:live": scenarioReferenceLive,
    "reference:input-settings": scenarioReferenceInputSettings,
    "reference:inspect": scenarioReferenceInspect,
    "reference:clear": scenarioReferenceClear,
    "utilities:recent-selected": scenarioRecentNodes,
    "utilities:query-selector": scenarioQuerySelector,
    "utilities:query-selector-all": scenarioQuerySelectorAll,
    "utilities:xpath": scenarioXPath,
    "utilities:clear": scenarioUtilityClear,
    "utilities:copy": scenarioCopy,
    "utilities:debug": scenarioUtilityDebug,
    "utilities:dir": scenarioUtilityDir,
    "utilities:dirxml": scenarioUtilityDirxml,
    "utilities:inspect": scenarioInspect,
    "utilities:get-event-listeners": scenarioGetEventListeners,
    "utilities:keys": scenarioKeys,
    "utilities:monitor": scenarioMonitor,
    "utilities:monitor-events": scenarioMonitorEvents,
    "utilities:query-objects": scenarioQueryObjects,
    "utilities:table": scenarioUtilityTable,
    "utilities:values": scenarioValues,
    "api:assert": scenarioApiAssert,
    "api:clear": scenarioApiClear,
    "api:count": scenarioApiCount,
    "api:count-reset": scenarioApiCountReset,
    "api:debug": scenarioApiDebug,
    "api:dir": scenarioApiDir,
    "api:dirxml": scenarioApiDirxml,
    "api:error": scenarioApiError,
    "api:group": scenarioApiGroup,
    "api:group-collapsed": scenarioApiGroupCollapsed,
    "api:info": scenarioApiInfo,
    "api:log": scenarioApiLog,
    "api:table": scenarioApiTable,
    "api:time": scenarioApiTime,
    "api:trace": scenarioApiTrace,
    "api:warn": scenarioApiWarn,
  };

  const genericTopicSelectors = {
    "console-overview": ["#document-body", "#event-panel"],
    "console-log": ["#document-body", "#runtime-objects"],
    "console-javascript": ["#document-body", "#runtime-objects"],
    "console-live-expressions": ["#event-panel", "#runtime-objects"],
    "console-format-style": ["#runtime-objects"],
    "console-reference": ["#document-body", "#runtime-objects"],
    "console-utilities": ["#image-gallery", "#runtime-objects"],
    "console-api": ["#runtime-objects", "#document-body"],
  };

  function applyGenericTopicScenario(payload = {}) {
    const topicId = typeof payload.topicId === "string" ? payload.topicId : "";

    if (!topicId) {
      return false;
    }

    const selectors = genericTopicSelectors[topicId] ?? ["#document-body"];
    const label =
      (typeof payload.sourceGuide?.title === "string" && payload.sourceGuide.title.trim()) ||
      (typeof payload.sectionLabel === "string" && payload.sectionLabel.trim()) ||
      topicLabels[topicId] ||
      "문서";

    highlightTargets(selectors, { muteOthers: true });
    setStatusRibbon("SECTION READY", `${label}에 맞는 Preview 대상이 준비되었습니다.`);
    return true;
  }

  function applyConsoleScenario(rawScenarioId, payload = {}) {
    if (typeof rawScenarioId !== "string" || rawScenarioId.length === 0) {
      return false;
    }

    const resetSuccess = resetLabScenario();
    if (!resetSuccess) {
      return false;
    }

    const runScenario = scenarioHandlers[rawScenarioId];
    let applied = false;

    if (typeof runScenario === "function") {
      runScenario();
      applied = true;
    } else {
      applied = applyGenericTopicScenario(payload);
    }

    if (!applied) {
      return false;
    }

    if (payload && typeof payload === "object") {
      setLabHeader({ title: resolveLabHeaderTitle(payload), description: "" });
      addPracticeGuide(payload.sourceGuide);
    }

    queueScenarioTransition();
    notifyParent("lab:console-scenario-applied", { scenarioId: rawScenarioId });
    return true;
  }

  function getChiiPanel() {
    return document.querySelector(CHII_PANEL_SELECTOR);
  }

  function waitForPanelReady() {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      function tick() {
        const panel = getChiiPanel();

        if (panel) {
          resolve(panel);
          return;
        }

        if (Date.now() - start > 8000) {
          reject(new Error("Chii panel initialization timeout"));
          return;
        }

        window.requestAnimationFrame(tick);
      }

      tick();
    });
  }

  function waitForErudaGlobal() {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      function tick() {
        if (window.eruda) {
          resolve();
          return;
        }

        if (Date.now() - start > 8000) {
          reject(new Error("Eruda initialization timeout"));
          return;
        }

        window.requestAnimationFrame(tick);
      }

      tick();
    });
  }

  function ensureErudaLoaded() {
    if (window.__labErudaLoaded && window.eruda) {
      return Promise.resolve();
    }

    if (erudaLoadPromise) {
      return erudaLoadPromise;
    }

    function initialize() {
      if (!window.eruda) {
        throw new Error("Eruda global is unavailable");
      }

      if (!window.__labErudaInitialized) {
        window.eruda.init({
          useShadowDom: false,
          tool: ["console", "elements", "network", "resources", "sources", "info"],
        });
        window.__labErudaInitialized = true;
      }

      window.__labErudaLoaded = true;
    }

    const existing = document.getElementById(ERUDA_SCRIPT_ID);

    if (existing) {
      erudaLoadPromise = waitForErudaGlobal().then(() => initialize());
      return erudaLoadPromise;
    }

    erudaLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = ERUDA_SCRIPT_ID;
      script.src = ERUDA_SCRIPT_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load eruda script"));
      document.head.appendChild(script);
    })
      .then(() => waitForErudaGlobal())
      .then(() => initialize());

    return erudaLoadPromise;
  }

  function ensureChiiLoaded() {
    if (window.__labChiiLoaded && getChiiPanel()) {
      return Promise.resolve();
    }

    if (chiiLoadPromise) {
      return chiiLoadPromise;
    }

    const existing = document.getElementById(CHII_SCRIPT_ID);

    if (existing) {
      chiiLoadPromise = waitForPanelReady().then(() => {
        window.__labChiiLoaded = true;
      });
      return chiiLoadPromise;
    }

    chiiLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = CHII_SCRIPT_ID;
      script.src = CHII_SCRIPT_URL;
      script.async = true;
      script.setAttribute("embedded", "true");
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load chii target script"));
      document.head.appendChild(script);
    })
      .then(() => waitForPanelReady())
      .then(() => {
        window.__labChiiLoaded = true;
      });

    return chiiLoadPromise;
  }

  function setChiiPanelVisibility(visible) {
    const panel = getChiiPanel();

    if (!panel) {
      return false;
    }

    panel.style.display = visible ? "block" : "none";
    panel.style.visibility = visible ? "visible" : "hidden";
    panel.style.zIndex = "2147483647";
    panel.style.top = "auto";
    panel.style.right = "0";
    panel.style.bottom = "0";
    panel.style.left = "0";

    if (visible) {
      if (!panel.dataset.labDefaultHeightSet) {
        panel.style.height = "40vh";
        panel.dataset.labDefaultHeightSet = "true";
      }
      panel.style.minHeight = "180px";
      panel.style.maxHeight = "calc(100vh - 40px)";
      window.dispatchEvent(new Event("resize"));
      return true;
    }

    document.body.style.height = "";
    return true;
  }

  function setErudaVisibility(visible) {
    if (!window.eruda || typeof window.eruda.show !== "function") {
      return false;
    }

    if (visible) {
      window.eruda.show();
      try {
        window.eruda.show("console");
      } catch {
        // Some eruda builds may not support tool-targeted show().
      }
      window.dispatchEvent(new Event("resize"));
      return true;
    }

    if (typeof window.eruda.hide === "function") {
      window.eruda.hide();
    }
    return true;
  }

  function ensureDevtoolsLoaded() {
    if (devtoolsEngine === "eruda") {
      return ensureErudaLoaded();
    }

    return ensureChiiLoaded();
  }

  function setPanelVisibility(visible) {
    if (devtoolsEngine === "eruda") {
      return setErudaVisibility(visible);
    }

    return setChiiPanelVisibility(visible);
  }

  function openPreviewDevtools() {
    ensureDevtoolsLoaded()
      .then(() => {
        const opened = setPanelVisibility(true);

        if (!opened) {
          notifyParent("lab:preview-devtools-error");
          return;
        }

        isDevtoolsOpen = true;
        reportState();
      })
      .catch(() => {
        notifyParent("lab:preview-devtools-error");
      });
  }

  function closePreviewDevtools() {
    const closed = setPanelVisibility(false);

    if (!closed) {
      isDevtoolsOpen = false;
      reportState();
      return;
    }

    isDevtoolsOpen = false;
    reportState();
  }

  function togglePreviewDevtools() {
    if (isDevtoolsOpen) {
      closePreviewDevtools();
      return;
    }

    openPreviewDevtools();
  }

  function handleMessage(event) {
    if (event.origin !== window.location.origin) {
      return;
    }

    const payload = event.data || {};
    const type = payload.type;

    if (type === "lab:open-preview-devtools") {
      openPreviewDevtools();
      return;
    }

    if (type === "lab:close-preview-devtools") {
      closePreviewDevtools();
      return;
    }

    if (type === "lab:toggle-preview-devtools") {
      togglePreviewDevtools();
      return;
    }

    if (type === "lab:query-preview-devtools-state") {
      reportState();
      return;
    }

    if (type === "lab:apply-console-scenario") {
      const applied = applyConsoleScenario(payload.scenarioId, payload);

      if (!isDevtoolsOpen) {
        openPreviewDevtools();
      }

      if (!applied) {
        notifyParent("lab:console-scenario-error", {
          scenarioId: String(payload.scenarioId ?? ""),
        });
      }
      return;
    }

    if (type === "lab:reset-console-scenario") {
      const resetSuccess = resetLabScenario();
      notifyParent("lab:console-scenario-reset", { success: resetSuccess });
    }
  }

  window.addEventListener("message", handleMessage);
  setupBaseRuntime();
  hydrateMotionImages(document);
  queueScenarioTransition();

  const initialParams = new URLSearchParams(window.location.search);
  const initialScenarioId = initialParams.get("scenario");
  if (initialScenarioId) {
    applyConsoleScenario(initialScenarioId, {
      topicId: initialParams.get("topicId") ?? undefined,
      sectionId: initialParams.get("sectionId") ?? undefined,
      sectionLabel: initialParams.get("sectionLabel") ?? undefined,
    });
  }

  openPreviewDevtools();
})();

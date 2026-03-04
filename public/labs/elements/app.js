(() => {
  const CHII_SCRIPT_ID = "lab-chii-target-script";
  const CHII_SCRIPT_URL = "https://chii.liriliri.io/target.js";
  const CHII_PANEL_SELECTOR = ".__chobitsu-hide__";
  const ERUDA_SCRIPT_ID = "lab-eruda-script";
  const ERUDA_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/eruda";

  let chiiLoadPromise = null;
  let erudaLoadPromise = null;
  let isDevtoolsOpen = false;
  const devtoolsEngine = isMobileRuntime() ? "eruda" : "chii";
  const LAB_ROOT_SELECTOR = ".lab-shell";
  const LAB_MISSION_ID = "lab-mission";
  const LAB_STATE_STYLE_ID = "lab-state-style";
  const initialLabRootHtml = document.querySelector(LAB_ROOT_SELECTOR)?.innerHTML ?? "";
  let scenarioMutationTimer = null;

  const domScenarioAliases = {
    edit: "content",
    console: "current",
  };

  const topicLabels = {
    "dom-view-edit": "DOM 보기 및 변경",
    "dom-properties": "DOM 객체의 속성 보기",
    "badges-reference": "배지 참조",
    "css-view-edit": "CSS 보기 및 변경",
    "css-issues": "잘못된 CSS 찾기",
    "css-color": "색상 선택 도구",
    "css-grid": "그리드 검사",
    "css-flexbox": "Flexbox 검사",
    "css-container-queries": "컨테이너 쿼리 검사",
    "css-reference": "CSS 기능 참조",
  };

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
    window.parent.postMessage(
      {
        type,
        ...payload,
      },
      window.location.origin,
    );
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

  function clearScenarioMutationTimer() {
    if (scenarioMutationTimer !== null) {
      window.clearTimeout(scenarioMutationTimer);
      scenarioMutationTimer = null;
    }
  }

  function removeScenarioArtifacts() {
    const stateStyle = document.getElementById(LAB_STATE_STYLE_ID);

    if (stateStyle) {
      stateStyle.remove();
    }
  }

  function getLabRoot() {
    return document.querySelector(LAB_ROOT_SELECTOR);
  }

  function resetLabScenario() {
    const root = getLabRoot();

    clearScenarioMutationTimer();
    removeScenarioArtifacts();

    if (!root || !initialLabRootHtml) {
      return false;
    }

    root.innerHTML = initialLabRootHtml;
    window.scrollTo(0, 0);
    return true;
  }

  function addMissionCard(title, description, codeSnippet) {
    const root = getLabRoot();

    if (!root) {
      return;
    }

    const header = root.querySelector(".lab-header");

    if (!header) {
      return;
    }

    const existing = root.querySelector(`#${LAB_MISSION_ID}`);

    if (existing) {
      existing.remove();
    }

    const mission = document.createElement("section");
    mission.id = LAB_MISSION_ID;
    mission.className = "lab-mission";
    mission.innerHTML = `
      <p class="lab-mission__title">사용법 숙지: ${escapeHtml(title)}</p>
      <p class="lab-mission__description">${escapeHtml(description)}</p>
      ${
        codeSnippet
          ? `<pre class="lab-mission__code"><code>${escapeHtml(codeSnippet)}</code></pre>`
          : ""
      }
    `;

    header.insertAdjacentElement("afterend", mission);
  }

  function scenarioInspect() {
    const button = document.querySelector("#inspect-target .product-action");

    if (button) {
      button.setAttribute("disabled", "");
      button.textContent = "action: inspect (disabled)";
    }

    addMissionCard(
      "노드 검사",
      "#inspect-target 버튼의 비활성 원인을 확인하고 disabled 속성을 제거해보세요.",
      "<button class=\"product-action\" disabled>action: inspect (disabled)</button>",
    );
  }

  function scenarioKeynav() {
    const target = document.getElementById("inspect-target");

    if (target) {
      const list = document.createElement("ul");
      list.className = "lab-keynav-tree";
      list.innerHTML = `
        <li>debug-root
          <ul>
            <li>debug-branch
              <ul>
                <li><span id="keynav-leaf">keyboard-target</span></li>
              </ul>
            </li>
          </ul>
        </li>
      `;
      target.appendChild(list);
    }

    addMissionCard(
      "키보드로 DOM 트리 탐색",
      "DOM 트리에서 #keynav-leaf 노드를 화살표 키만으로 찾아 이동해보세요.",
      "<span id=\"keynav-leaf\">keyboard-target</span>",
    );
  }

  function scenarioScroll1() {
    const grid = document.getElementById("card-grid");

    if (grid) {
      const spacer = document.createElement("div");
      spacer.className = "lab-scroll-spacer";
      spacer.textContent = "Scroll Into View 확인용 간격";
      grid.before(spacer);
    }

    addMissionCard(
      "보기로 스크롤",
      "DOM 트리에서 #inspect-target 노드를 선택하고 Scroll into view를 실행해보세요.",
      "<article id=\"inspect-target\">...</article>",
    );
  }

  function scenarioRulers() {
    const firstCard = document.getElementById("first-card");

    if (firstCard) {
      firstCard.style.width = "78%";
      firstCard.style.maxWidth = "520px";
    }

    addMissionCard(
      "눈금자 표시",
      "#first-card 노드의 너비를 눈금자로 확인해보세요.",
      "#first-card { width: 78%; }",
    );
  }

  function scenarioSearch() {
    const description = document.querySelector("#inspect-target .product-description");

    if (description) {
      const targetText = document.createElement("span");
      targetText.className = "lab-search-target";
      targetText.textContent = " The Moon is a Harsh Mistress";
      description.appendChild(targetText);
    }

    addMissionCard(
      "노드 검색",
      "Elements 검색창에서 The Moon is a Harsh Mistress를 검색해 해당 노드를 선택하세요.",
      "The Moon is a Harsh Mistress",
    );
  }

  function scenarioContent() {
    const title = document.getElementById("store-title");

    if (title) {
      title.textContent = "DOM Strcture Index";
    }

    addMissionCard(
      "콘텐츠 수정",
      "오타가 있는 제목 텍스트를 DOM에서 직접 수정해보세요.",
      "<h1 id=\"store-title\">DOM Strcture Index</h1>",
    );
  }

  function scenarioAttributes() {
    const firstCard = document.getElementById("first-card");
    const action = document.getElementById("first-card-action");

    if (firstCard) {
      firstCard.setAttribute("data-stock", "soldout");
      firstCard.setAttribute("aria-live", "assertive");
    }

    if (action) {
      action.setAttribute("disabled", "");
      action.setAttribute("data-reason", "inventory-check");
    }

    addMissionCard(
      "속성 수정",
      "버튼의 disabled/data-reason 속성을 수정해 상태를 정상화해보세요.",
      "<button id=\"first-card-action\" disabled data-reason=\"inventory-check\">...</button>",
    );
  }

  function scenarioType() {
    const action = document.querySelector("#inspect-target .product-action");

    if (action) {
      const replacement = document.createElement("div");
      replacement.id = "type-target";
      replacement.className = "product-action";
      replacement.textContent = "상세 보기";
      action.replaceWith(replacement);
    }

    addMissionCard(
      "노드 유형 수정",
      "잘못된 div 버튼을 button 노드로 바꿔보세요.",
      "<div id=\"type-target\" class=\"product-action\">상세 보기</div>",
    );
  }

  function scenarioAsHtml() {
    const target = document.getElementById("inspect-target");

    if (target) {
      target.innerHTML = `
        <div class="card-head">
          <span class="product-badge">02</span>
          <h2 class="product-title">inspect-target-node</h2>
        </div>
        <p class="product-description">HTML 편집 확인을 위해 노드 구조가 단순화되었습니다.</p>
        <button class="product-action" disabled>action: restore required</button>
      `;
    }

    addMissionCard(
      "HTML로 수정",
      "Edit as HTML로 inspect-target 노드를 원래 구조로 복구해보세요.",
      "<article id=\"inspect-target\">...</article>",
    );
  }

  function scenarioDuplicate() {
    const cardToRemove = document.querySelector('#card-grid [data-card="c"]');

    if (cardToRemove) {
      cardToRemove.remove();
    }

    addMissionCard(
      "노드 복제",
      "노드 하나가 빠져 있습니다. 기존 노드를 복제해 3개 구성을 다시 만들어보세요.",
      "<article data-card=\"c\">...</article> // missing",
    );
  }

  function scenarioScreenshot() {
    const target = document.getElementById("inspect-target");

    if (target) {
      target.classList.add("lab-capture-target");
    }

    addMissionCard(
      "노드 스크린샷 캡처",
      "강조된 inspect-target 노드를 선택해 노드 스크린샷을 캡처해보세요.",
      "#inspect-target // screenshot target",
    );
  }

  function scenarioReorder() {
    const grid = document.getElementById("card-grid");

    if (grid) {
      const cards = Array.from(grid.querySelectorAll(".product-card"));

      if (cards.length >= 3) {
        grid.append(cards[2], cards[0], cards[1]);
      }
    }

    addMissionCard(
      "DOM 노드 재정렬",
      "노드 순서가 뒤섞였습니다. DOM 순서를 01, 02, 03 순서로 재정렬해보세요.",
      "[data-card=\"a\"], [data-card=\"b\"], [data-card=\"c\"]",
    );
  }

  function scenarioState() {
    const style = document.createElement("style");
    style.id = LAB_STATE_STYLE_ID;
    style.textContent = `
      .index-banner:hover {
        border-color: #ef4444;
        background: #fee2e2;
        color: #7f1d1d;
      }
      .product-action:focus {
        outline: 3px solid #22c55e;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    addMissionCard(
      "강제 상태",
      "index-banner에 :hover, 버튼에 :focus 상태를 강제로 적용해보세요.",
      ".index-banner:hover { ... }",
    );
  }

  function scenarioHide() {
    const target = document.getElementById("inspect-target");

    if (target) {
      target.classList.add("lab-hide-target");
    }

    addMissionCard(
      "노드 숨기기",
      "중앙 노드를 숨겼다가 다시 표시해보며 레이아웃 변화를 확인하세요.",
      "#inspect-target",
    );
  }

  function scenarioDelete() {
    const grid = document.getElementById("card-grid");

    if (grid) {
      const obsoleteCard = document.createElement("article");
      obsoleteCard.className = "product-card";
      obsoleteCard.id = "delete-target";
      obsoleteCard.innerHTML = `
        <div class="card-head">
          <span class="product-badge">99</span>
          <h2 class="product-title">legacy-node</h2>
        </div>
        <p class="product-description">삭제 동작 확인용 임시 노드입니다.</p>
        <button class="product-action">action: remove</button>
      `;
      grid.appendChild(obsoleteCard);
    }

    addMissionCard(
      "노드 삭제",
      "마지막 legacy-node(#delete-target) 노드를 삭제해보세요.",
      "<article id=\"delete-target\">...</article>",
    );
  }

  function scenarioCurrent() {
    const target = document.getElementById("inspect-target");

    if (target) {
      target.classList.add("lab-console-target");
    }

    addMissionCard(
      "$0으로 현재 선택된 노드 참조",
      "inspect-target를 선택한 뒤 콘솔에서 $0을 실행해 현재 노드를 확인하세요.",
      "$0",
    );
  }

  function scenarioGlobal() {
    addMissionCard(
      "전역 변수로 저장",
      "inspect-target 노드를 전역 변수(temp1)로 저장한 뒤 콘솔에서 재사용해보세요.",
      "temp1",
    );
  }

  function scenarioPath() {
    addMissionCard(
      "JS 경로 복사",
      "inspect-target 노드의 Copy JS path를 복사해 콘솔에서 실행해보세요.",
      "document.querySelector(\"#inspect-target\")",
    );
  }

  function scenarioBreakpoints() {
    const description = document.querySelector("#inspect-target .product-description");

    scenarioMutationTimer = window.setTimeout(() => {
      if (description) {
        description.textContent = "자동 스크립트가 이 텍스트를 변경했습니다. DOM breakpoint 확인용.";
      }
    }, 3500);

    addMissionCard(
      "DOM 변경 시 중단",
      "inspect-target 설명 노드에 DOM 중단점을 걸고 3.5초 뒤 자동 변경 시점을 잡아보세요.",
      "setTimeout(() => node.textContent = \"...\", 3500)",
    );
  }

  function scenarioScroll2() {
    const grid = document.getElementById("card-grid");

    if (grid) {
      const spacer = document.createElement("div");
      spacer.className = "lab-scroll-spacer";
      spacer.textContent = "부록 Scroll 확인용 간격";
      grid.after(spacer);
    }

    addMissionCard(
      "보기로 스크롤 (부록)",
      "하단으로 내려간 뒤 첫 카드 노드에서 Scroll into view를 실행해보세요.",
      "#first-card",
    );
  }

  function scenarioOptions() {
    addMissionCard(
      "누락된 옵션",
      "노드를 오른쪽 클릭할 때 텍스트가 아닌 노드 영역 바깥쪽을 클릭해 메뉴 차이를 확인해보세요.",
      "contextmenu on node container",
    );
  }

  function applyGenericTopicMutation(topicId) {
    const targetCard = document.getElementById("first-card");
    const inspectTarget = document.getElementById("inspect-target");
    const action = document.getElementById("first-card-action");
    const banner = document.getElementById("index-banner");

    let styleText = "";

    if (topicId === "dom-properties") {
      if (targetCard) {
        targetCard.setAttribute("data-runtime-owner", "preview-lab");
        targetCard.setAttribute("data-runtime-state", "staged");
      }

      if (action) {
        action.setAttribute("data-inspect-flag", "true");
      }

      return;
    }

    if (topicId === "badges-reference") {
      if (targetCard) {
        targetCard.setAttribute("data-badge-grid", "true");
      }

      if (inspectTarget) {
        inspectTarget.setAttribute("data-badge-container", "true");
      }

      styleText = `
        #card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        #inspect-target { display: flex; flex-direction: column; gap: 8px; }
      `;
    } else if (topicId === "css-view-edit") {
      styleText = `
        .product-title { color: #1d4ed8; }
        .product-card { border-color: #94a3b8; }
        .product-action { border: 2px solid #0f172a; }
      `;
    } else if (topicId === "css-issues") {
      styleText = `
        #first-card .product-description {
          display: block;
          justify-content: center;
          color: #ef4444;
        }
        #inspect-target .product-title { color: #0f172a; color: #0ea5e9; }
      `;
    } else if (topicId === "css-color") {
      styleText = `
        .lab-header { background: #fef3c7; }
        .index-banner { border-color: #ea580c; color: #7c2d12; }
        .product-title { color: #7c3aed; }
      `;
    } else if (topicId === "css-grid") {
      styleText = `
        #card-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }
        #first-card { grid-column: span 3; }
        #inspect-target { grid-column: span 2; }
      `;
    } else if (topicId === "css-flexbox") {
      styleText = `
        #card-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
          gap: 10px;
        }
        #card-grid .product-card { flex: 1 1 220px; }
      `;
    } else if (topicId === "css-container-queries") {
      styleText = `
        #inspect-target {
          container-type: inline-size;
          container-name: card;
        }
        @container card (max-width: 260px) {
          #inspect-target .product-title { font-size: 14px; }
        }
      `;
    } else if (topicId === "css-reference") {
      styleText = `
        .product-card { box-shadow: inset 0 0 0 1px #cbd5e1; }
        .product-action { background: #0f172a; }
        .product-action:focus { outline: 3px solid #22c55e; outline-offset: 2px; }
      `;
    }

    if (!styleText) {
      return;
    }

    const style = document.createElement("style");
    style.id = LAB_STATE_STYLE_ID;
    style.textContent = styleText;
    document.head.appendChild(style);

    if (banner && topicId.startsWith("css")) {
      banner.setAttribute("data-style-check", "true");
    }
  }

  function applyGenericTopicScenario(rawScenarioId, payload = {}) {
    const topicId =
      typeof payload.topicId === "string" && payload.topicId.length > 0 ? payload.topicId : "";

    if (!topicId || topicId === "dom-view-edit") {
      return false;
    }

    const sectionId =
      typeof payload.sectionId === "string" && payload.sectionId.length > 0
        ? payload.sectionId
        : String(rawScenarioId ?? "");
    const sectionLabel =
      typeof payload.sectionLabel === "string" && payload.sectionLabel.length > 0
        ? payload.sectionLabel
        : sectionId;
    const topicLabel = topicLabels[topicId] ?? "문서";

    applyGenericTopicMutation(topicId);

    addMissionCard(
      sectionLabel,
      `${topicLabel}의 ${sectionLabel} 항목을 기준으로 노드/스타일 상태를 확인하고 관련 기능을 실행해보세요.`,
      `<section id="${sectionId}">...</section>`,
    );

    return true;
  }

  const domScenarioHandlers = {
    inspect: scenarioInspect,
    keynav: scenarioKeynav,
    scroll1: scenarioScroll1,
    rulers: scenarioRulers,
    search: scenarioSearch,
    content: scenarioContent,
    attributes: scenarioAttributes,
    type: scenarioType,
    "as-html": scenarioAsHtml,
    duplicate: scenarioDuplicate,
    screenshot: scenarioScreenshot,
    reorder: scenarioReorder,
    state: scenarioState,
    hide: scenarioHide,
    delete: scenarioDelete,
    current: scenarioCurrent,
    global: scenarioGlobal,
    path: scenarioPath,
    breakpoints: scenarioBreakpoints,
    scroll2: scenarioScroll2,
    options: scenarioOptions,
  };

  function applyDomScenario(rawScenarioId, payload = {}) {
    if (typeof rawScenarioId !== "string") {
      return false;
    }

    const scenarioId = domScenarioAliases[rawScenarioId] ?? rawScenarioId;
    const runScenario = domScenarioHandlers[scenarioId];

    const resetSuccess = resetLabScenario();

    if (!resetSuccess) {
      return false;
    }

    if (typeof runScenario === "function") {
      runScenario();
      notifyParent("lab:dom-scenario-applied", { scenarioId });
      return true;
    }

    const genericApplied = applyGenericTopicScenario(rawScenarioId, payload);

    if (!genericApplied) {
      return false;
    }

    notifyParent("lab:dom-scenario-applied", { scenarioId: rawScenarioId });
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
          tool: ["elements", "console", "network", "resources", "sources", "info"],
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
        panel.style.height = "50vh";
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
        window.eruda.show("elements");
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

    if (type === "lab:apply-dom-scenario") {
      const applied = applyDomScenario(payload.scenarioId, payload);

      if (!isDevtoolsOpen) {
        openPreviewDevtools();
      }

      if (!applied) {
        notifyParent("lab:dom-scenario-error", {
          scenarioId: String(payload.scenarioId ?? ""),
        });
      }
      return;
    }

    if (type === "lab:reset-dom-scenario") {
      const resetSuccess = resetLabScenario();
      notifyParent("lab:dom-scenario-reset", { success: resetSuccess });
    }
  }

  window.addEventListener("message", handleMessage);
  const initialScenarioId = new URLSearchParams(window.location.search).get("scenario");

  if (initialScenarioId) {
    applyDomScenario(initialScenarioId);
  }

  openPreviewDevtools();
})();

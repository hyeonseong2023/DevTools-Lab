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
  let scenarioTransitionTimer = null;
  let scenarioCleanupFns = [];

  const domScenarioAliases = {
    edit: "content",
    console: "current",
  };

  const topicLabels = {
    "elements-overview": "개요",
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

  function registerScenarioCleanup(cleanup) {
    if (typeof cleanup === "function") {
      scenarioCleanupFns.push(cleanup);
    }
  }

  function clearScenarioCleanupFns() {
    const cleanupFns = scenarioCleanupFns;
    scenarioCleanupFns = [];

    for (const cleanup of cleanupFns) {
      try {
        cleanup();
      } catch {
        // Ignore scenario cleanup failures so the preview can always reset.
      }
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

  function getCardGrid() {
    return document.getElementById("card-grid");
  }

  function getLabTitleElement() {
    return document.getElementById("store-title");
  }

  function getLabDescriptionElement() {
    return document.getElementById("lab-description");
  }

  function setLabHeader({ title, description } = {}) {
    const titleElement = getLabTitleElement();
    const descriptionElement = getLabDescriptionElement();
    const defaultTitle = titleElement?.dataset.defaultTitle?.trim() || "DOM Structure Index";
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

    document.title = nextTitle.length > 0 ? `${nextTitle} | Elements Preview` : "Elements Preview";
  }

  function initializeLabHeader() {
    const titleElement = getLabTitleElement();
    const descriptionElement = getLabDescriptionElement();

    if (titleElement) {
      titleElement.dataset.defaultTitle = titleElement.textContent?.trim() || "DOM Structure Index";
    }

    if (descriptionElement) {
      descriptionElement.dataset.defaultDescription = descriptionElement.textContent?.trim() || "";
    }

    setLabHeader();
  }

  function resetLabScenario() {
    const root = getLabRoot();

    clearScenarioMutationTimer();
    clearScenarioCleanupFns();
    removeScenarioArtifacts();

    if (!root || !initialLabRootHtml) {
      return false;
    }

    root.innerHTML = initialLabRootHtml;
    window.scrollTo(0, 0);
    initializeLabHeader();
    hydrateMotionImages(root);
    queueScenarioTransition();
    return true;
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  function setLabScene(markup, className = "lab-scene") {
    const grid = getCardGrid();

    if (!grid) {
      return null;
    }

    grid.className = className;
    grid.innerHTML = markup;
    hydrateMotionImages(grid);
    queueScenarioTransition();
    return grid;
  }

  function setSceneSelection(nodeId, options = {}) {
    const {
      sourceSelector = "[data-scene-node]",
      treeSelector = "[data-tree-node]",
      sceneStatus = "",
    } = options;

    document.querySelectorAll(sourceSelector).forEach((element) => {
      element.classList.toggle("is-selected", element.dataset.sceneNode === nodeId);
    });

    document.querySelectorAll(treeSelector).forEach((element) => {
      element.classList.toggle("is-selected", element.dataset.treeNode === nodeId);
    });

    if (sceneStatus.trim().length > 0) {
      const statusElement = document.querySelector("[data-scene-status]");

      if (statusElement) {
        statusElement.textContent = sceneStatus;
      }
    }
  }

  function renderReferenceListScene({
    eyebrow = "원문 예제",
    title,
    description,
    items,
    codeSnippet = "",
    note = "",
    listId = "",
    listClassName = "",
  }) {
    const itemMarkup = items
      .map((item) => {
        if (typeof item === "string") {
          return `<li class="practice-list__item">${escapeHtml(item)}</li>`;
        }

        const classes = ["practice-list__item", item.className ?? ""].filter(Boolean).join(" ");
        const attributes = Object.entries(item.attrs ?? {})
          .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
          .join("");

        return `<li class="${classes}"${attributes}>${escapeHtml(item.text)}</li>`;
      })
      .join("");
    const idAttribute = listId ? ` id="${escapeAttribute(listId)}"` : "";
    const extraListClass = listClassName ? ` ${listClassName}` : "";

    setLabScene(
      `
        <section class="practice-layout">
          <article class="practice-panel">
            <p class="practice-label">${escapeHtml(eyebrow)}</p>
            <h2 class="practice-title">${escapeHtml(title)}</h2>
            <p class="practice-copy">${escapeHtml(description)}</p>
            <ul class="practice-list${extraListClass}"${idAttribute}>
              ${itemMarkup}
            </ul>
            ${
              note
                ? `<p class="practice-note">${escapeHtml(note)}</p>`
                : ""
            }
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">DOM 트리 대상</p>
            <pre class="practice-code"><code>${escapeHtml(codeSnippet)}</code></pre>
            ${
              note
                ? `<p class="practice-note">${escapeHtml(note)}</p>`
                : ""
            }
          </aside>
        </section>
      `,
      "lab-scene",
    );
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
      <p class="lab-mission__description">${escapeHtml(description)}</p>
      ${
        codeSnippet
          ? `<pre class="lab-mission__code"><code>${escapeHtml(codeSnippet)}</code></pre>`
          : ""
      }
    `;

    header.insertAdjacentElement("afterend", mission);
    queueScenarioTransition();
  }

  function scenarioInspect() {
    setLabScene(
      `
        <section class="practice-layout practice-layout--inspect">
          <article class="practice-panel">
            <p class="practice-label">원문 예제 1</p>
            <h2 class="practice-title">Michelangelo 검사</h2>
            <p class="practice-copy">
              Michelangelo를 마우스 오른쪽 버튼으로 클릭하고 <strong>검사</strong>를 선택하면
              DevTools의 요소 패널에서 해당 <code>&lt;li&gt;</code> 노드가 강조됩니다.
            </p>
            <div class="practice-browser" id="inspect-browser">
              <div class="practice-browser__bar">
                <span class="practice-browser__dot"></span>
                <span class="practice-browser__dot"></span>
                <span class="practice-browser__dot"></span>
                <span class="practice-browser__title">artists.html</span>
              </div>
              <ul class="practice-list practice-list--compact" id="artists-list">
                <li class="practice-list__item" data-scene-node="artist-michelangelo">Michelangelo</li>
                <li class="practice-list__item" data-scene-node="artist-raphael">Raphael</li>
              </ul>
              <div class="practice-context-menu" id="inspect-context-menu" hidden>
                <button class="practice-context-menu__item" type="button" data-context-action="inspect">
                  검사
                </button>
              </div>
            </div>
          </article>
          <article class="practice-panel">
            <div class="practice-panel__head">
              <div>
                <p class="practice-label">원문 예제 2</p>
                <h2 class="practice-title">요소 선택으로 Tokyo 선택</h2>
              </div>
              <button
                class="practice-tool-button"
                id="inspect-mode-toggle"
                type="button"
                aria-pressed="false"
              >
                요소 선택
              </button>
            </div>
            <p class="practice-copy">
              <strong>요소 선택</strong>을 켠 뒤 Tokyo를 클릭하면 <code>&lt;li&gt;Tokyo&lt;/li&gt;</code>가
              DOM 트리에서 강조됩니다.
            </p>
            <ul class="practice-list practice-list--compact" id="cities-list">
              <li class="practice-list__item" data-scene-node="city-tokyo">Tokyo</li>
              <li class="practice-list__item" data-scene-node="city-beirut">Beirut</li>
            </ul>
            <p class="practice-note" data-scene-flow>
              Michelangelo를 먼저 검사하거나 요소 선택을 켠 뒤 Tokyo를 클릭해보세요.
            </p>
          </article>
          <aside class="practice-panel practice-panel--tree">
            <div class="practice-panel__head">
              <div>
                <p class="practice-label">DOM 트리</p>
                <h2 class="practice-title">Elements 패널 미리보기</h2>
              </div>
              <span class="practice-status" data-scene-status>아직 노드가 선택되지 않았습니다.</span>
            </div>
            <div class="practice-tree">
              <div class="practice-tree__line" data-tree-node="artist-list">&lt;ul class="artists"&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="artist-michelangelo">&lt;li&gt;Michelangelo&lt;/li&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="artist-raphael">&lt;li&gt;Raphael&lt;/li&gt;</div>
              <div class="practice-tree__line" data-tree-node="city-list">&lt;ul class="cities"&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="city-tokyo">&lt;li&gt;Tokyo&lt;/li&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="city-beirut">&lt;li&gt;Beirut&lt;/li&gt;</div>
            </div>
          </aside>
        </section>
      `,
      "lab-scene lab-scene--inspect",
    );

    addMissionCard(
      "노드 검사",
      "1) Michelangelo를 마우스 오른쪽 버튼으로 클릭해 검사합니다. 2) 요소 선택을 켠 뒤 Tokyo를 클릭해 DOM 트리에서 노드 강조를 확인합니다.",
      "<li>Michelangelo</li>\n<li>Tokyo</li>",
    );

    const inspectBrowser = document.getElementById("inspect-browser");
    const contextMenu = document.getElementById("inspect-context-menu");
    const inspectModeToggle = document.getElementById("inspect-mode-toggle");
    const sceneFlow = document.querySelector("[data-scene-flow]");
    const artistsList = document.getElementById("artists-list");
    const citiesList = document.getElementById("cities-list");
    const nodeLabels = {
      "artist-michelangelo": "<li>Michelangelo</li>",
      "artist-raphael": "<li>Raphael</li>",
      "city-tokyo": "<li>Tokyo</li>",
      "city-beirut": "<li>Beirut</li>",
    };
    let contextTargetId = "";
    let inspectMode = false;

    function closeContextMenu() {
      if (contextMenu) {
        contextMenu.hidden = true;
        contextMenu.dataset.nodeId = "";
      }
    }

    function setInspectMode(nextValue) {
      inspectMode = nextValue;

      if (inspectModeToggle) {
        inspectModeToggle.setAttribute("aria-pressed", String(nextValue));
        inspectModeToggle.classList.toggle("is-active", nextValue);
      }

      const citiesItems = citiesList?.querySelectorAll("[data-scene-node]") ?? [];

      citiesItems.forEach((item) => {
        item.classList.toggle("is-pickable", inspectMode);
      });
    }

    function selectNode(nodeId, flowMessage) {
      const label = nodeLabels[nodeId];

      if (!label) {
        return;
      }

      setSceneSelection(nodeId, {
        sceneStatus: `${label}이 DOM 트리에서 강조 표시됩니다.`,
      });

      if (sceneFlow) {
        sceneFlow.textContent = flowMessage;
      }
    }

    if (artistsList && inspectBrowser && contextMenu) {
      const onContextMenu = (event) => {
        const target = event.target.closest("[data-scene-node]");

        if (!target) {
          return;
        }

        event.preventDefault();
        contextTargetId = target.dataset.sceneNode ?? "";
        const browserRect = inspectBrowser.getBoundingClientRect();
        contextMenu.hidden = false;
        contextMenu.style.left = `${event.clientX - browserRect.left}px`;
        contextMenu.style.top = `${event.clientY - browserRect.top}px`;
        contextMenu.dataset.nodeId = contextTargetId;
      };

      const onMenuClick = (event) => {
        const action = event.target.closest("[data-context-action='inspect']");

        if (!action) {
          return;
        }

        selectNode(contextTargetId, "DevTools의 요소 패널이 열리고 선택한 목록 항목이 강조 표시됩니다.");
        closeContextMenu();
      };

      const onDocumentClick = (event) => {
        if (!contextMenu.contains(event.target)) {
          closeContextMenu();
        }
      };

      artistsList.addEventListener("contextmenu", onContextMenu);
      contextMenu.addEventListener("click", onMenuClick);
      document.addEventListener("click", onDocumentClick);

      registerScenarioCleanup(() => {
        artistsList.removeEventListener("contextmenu", onContextMenu);
        contextMenu.removeEventListener("click", onMenuClick);
        document.removeEventListener("click", onDocumentClick);
      });
    }

    if (inspectModeToggle) {
      inspectModeToggle.addEventListener("click", () => {
        setInspectMode(!inspectMode);

        if (sceneFlow) {
          sceneFlow.textContent = inspectMode
            ? "요소 선택이 켜졌습니다. 이제 Tokyo를 클릭해 노드를 강조해보세요."
            : "요소 선택이 꺼졌습니다.";
        }
      });
    }

    if (citiesList) {
      const onCityClick = (event) => {
        const target = event.target.closest("[data-scene-node]");

        if (!target) {
          return;
        }

        if (!inspectMode) {
          if (sceneFlow) {
            sceneFlow.textContent = "먼저 요소 선택 버튼을 눌러 선택 모드를 켜세요.";
          }
          return;
        }

        selectNode(target.dataset.sceneNode ?? "", "요소 선택 모드에서 선택한 도시 노드가 DOM 트리에서 강조 표시됩니다.");
        setInspectMode(false);
      };

      citiesList.addEventListener("click", onCityClick);
      registerScenarioCleanup(() => {
        citiesList.removeEventListener("click", onCityClick);
      });
    }
  }

  function scenarioKeynav() {
    setLabScene(
      `
        <section class="practice-layout practice-layout--keynav">
          <article class="practice-panel">
            <p class="practice-label">원문 예제</p>
            <h2 class="practice-title">Ringo에서 시작해 DOM 트리 탐색</h2>
            <p class="practice-copy">
              Ringo가 선택된 상태에서 시작합니다. 오른쪽 패널을 클릭한 뒤 화살표 키로
              <code>&lt;ul&gt;</code> 선택, 접기, 다시 펼치기를 확인해보세요.
            </p>
            <ul class="practice-list practice-list--compact" id="beatles-list">
              <li class="practice-list__item" data-scene-node="beatles-george">George</li>
              <li class="practice-list__item" data-scene-node="beatles-ringo">Ringo</li>
              <li class="practice-list__item" data-scene-node="beatles-paul">Paul</li>
              <li class="practice-list__item" data-scene-node="beatles-john">John</li>
            </ul>
            <p class="practice-note">원문 순서처럼 Ringo에서 시작해 위쪽 화살표 두 번으로 <code>&lt;ul&gt;</code>을 고를 수 있습니다.</p>
          </article>
          <aside class="practice-panel practice-panel--tree">
            <div class="practice-panel__head">
              <div>
                <p class="practice-label">DOM 트리</p>
                <h2 class="practice-title">키보드 탐색 패널</h2>
              </div>
              <span class="practice-status" data-scene-status>Ringo 노드가 선택된 상태입니다.</span>
            </div>
            <div class="practice-tree practice-tree--interactive" id="keynav-tree" tabindex="0" role="tree" aria-label="DOM keyboard navigation preview"></div>
          </aside>
        </section>
      `,
      "lab-scene lab-scene--keynav",
    );

    addMissionCard(
      "키보드로 DOM 트리 탐색",
      "Ringo에서 시작해 위쪽 화살표로 <ul>을 선택하고, 왼쪽으로 접고, 오른쪽으로 다시 펼쳐보세요.",
      "<li>Ringo</li>\n<ul>...</ul>",
    );

    const tree = document.getElementById("keynav-tree");
    const state = {
      selected: "beatles-ringo",
      collapsed: false,
    };
    const statusLabels = {
      "guide-li": "<li>튜토리얼 단계 노드</li>",
      "beatles-ul": "<ul>",
      "beatles-george": "<li>George</li>",
      "beatles-ringo": "<li>Ringo</li>",
      "beatles-paul": "<li>Paul</li>",
      "beatles-john": "<li>John</li>",
    };

    function getVisibleNodes() {
      return state.collapsed
        ? ["guide-li", "beatles-ul"]
        : ["guide-li", "beatles-ul", "beatles-george", "beatles-ringo", "beatles-paul", "beatles-john"];
    }

    function renderTree() {
      if (!tree) {
        return;
      }

      tree.innerHTML = `
        <div class="practice-tree__line" data-tree-node="guide-li" role="treeitem" aria-selected="${state.selected === "guide-li"}">
          &lt;li&gt;Inspect Ringo and navigate with the keyboard&lt;/li&gt;
        </div>
        <div
          class="practice-tree__line"
          data-tree-node="beatles-ul"
          role="treeitem"
          aria-expanded="${String(!state.collapsed)}"
          aria-selected="${state.selected === "beatles-ul"}"
        >
          <button class="practice-tree__toggle" type="button" data-tree-toggle aria-label="Toggle list">
            ${state.collapsed ? "+" : "−"}
          </button>
          ${state.collapsed ? "&lt;ul&gt;...&lt;/ul&gt;" : "&lt;ul&gt;"}
        </div>
        ${
          state.collapsed
            ? ""
            : `
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="beatles-george" role="treeitem" aria-selected="${state.selected === "beatles-george"}">&lt;li&gt;George&lt;/li&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="beatles-ringo" role="treeitem" aria-selected="${state.selected === "beatles-ringo"}">&lt;li&gt;Ringo&lt;/li&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="beatles-paul" role="treeitem" aria-selected="${state.selected === "beatles-paul"}">&lt;li&gt;Paul&lt;/li&gt;</div>
              <div class="practice-tree__line practice-tree__line--child" data-tree-node="beatles-john" role="treeitem" aria-selected="${state.selected === "beatles-john"}">&lt;li&gt;John&lt;/li&gt;</div>
            `
        }
      `;

      setSceneSelection(state.selected, {
        sourceSelector: "#beatles-list [data-scene-node]",
        treeSelector: "#keynav-tree [data-tree-node]",
        sceneStatus: `${statusLabels[state.selected]} 이(가) 선택되었습니다.`,
      });
    }

    function moveSelection(direction) {
      const visibleNodes = getVisibleNodes();
      const currentIndex = visibleNodes.indexOf(state.selected);

      if (currentIndex === -1) {
        return;
      }

      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= visibleNodes.length) {
        return;
      }

      state.selected = visibleNodes[nextIndex];
      renderTree();
    }

    if (tree) {
      const onKeyDown = (event) => {
        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          return;
        }

        event.preventDefault();

        if (event.key === "ArrowUp") {
          moveSelection(-1);
          return;
        }

        if (event.key === "ArrowDown") {
          moveSelection(1);
          return;
        }

        if (event.key === "ArrowLeft") {
          if (state.selected === "beatles-ul" && !state.collapsed) {
            state.collapsed = true;
          } else if (state.selected === "beatles-ul" && state.collapsed) {
            state.selected = "guide-li";
          } else if (state.selected.startsWith("beatles-")) {
            state.selected = "beatles-ul";
          }

          renderTree();
          return;
        }

        if (event.key === "ArrowRight") {
          if (state.selected === "beatles-ul" && state.collapsed) {
            state.collapsed = false;
          } else if (state.selected === "beatles-ul" && !state.collapsed) {
            state.selected = "beatles-george";
          }

          renderTree();
        }
      };

      const onClick = (event) => {
        const toggle = event.target.closest("[data-tree-toggle]");
        const line = event.target.closest("[data-tree-node]");

        if (toggle) {
          state.collapsed = !state.collapsed;
          renderTree();
          tree.focus();
          return;
        }

        if (line) {
          state.selected = line.dataset.treeNode ?? state.selected;
          renderTree();
          tree.focus();
        }
      };

      tree.addEventListener("keydown", onKeyDown);
      tree.addEventListener("click", onClick);
      registerScenarioCleanup(() => {
        tree.removeEventListener("keydown", onKeyDown);
        tree.removeEventListener("click", onClick);
      });
      renderTree();
      window.setTimeout(() => tree.focus(), 0);
    }
  }

  function scenarioScroll1() {
    setLabScene(
      `
        <section class="practice-layout practice-layout--stack">
          <article class="practice-panel">
            <p class="practice-label">원문 예제</p>
            <h2 class="practice-title">Magritte 목록으로 스크롤</h2>
            <p class="practice-copy">페이지 하단으로 내려온 상태에서 DOM 트리의 Magritte 노드에 <strong>보기로 스크롤</strong>을 실행하는 상황을 재현한 화면입니다.</p>
            <div class="practice-scroll-frame">
              <div class="practice-scroll-frame__target" id="scroll-target-magritte">
                <ul class="practice-list practice-list--compact">
                  <li class="practice-list__item">Magritte</li>
                  <li class="practice-list__item">Soutine</li>
                </ul>
              </div>
              <div class="practice-scroll-frame__spacer">하단에서 위쪽 노드를 다시 찾아야 하는 상황을 만들기 위한 여백</div>
            </div>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">DOM 트리 대상</p>
            <pre class="practice-code"><code>&lt;li&gt;Magritte&lt;/li&gt;</code></pre>
            <p class="practice-note">하단에서 시작한 뒤 Elements의 Scroll into view로 상단 목록을 다시 노출하는 흐름입니다.</p>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    addMissionCard(
      "보기로 스크롤",
      "Magritte 노드를 선택한 뒤 Elements의 Scroll into view로 목록이 다시 보이게 만들어보세요.",
      "<li>Magritte</li>",
    );
  }

  function scenarioRulers() {
    setLabScene(
      `
        <section class="practice-layout">
          <article class="practice-panel">
            <p class="practice-label">원문 예제</p>
            <h2 class="practice-title">눈금자로 상자 크기 재기</h2>
            <p class="practice-copy">아래 상자는 눈금자 표시 기능으로 너비와 높이를 재기 위한 측정 대상입니다.</p>
            <div class="practice-ruler-target" id="ruler-target">
              width: 356px
            </div>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">측정 대상</p>
            <pre class="practice-code"><code>#ruler-target { width: 356px; height: 96px; }</code></pre>
            <p class="practice-note">눈금자를 켜고 요소 위로 마우스를 올리면 치수를 빠르게 읽을 수 있습니다.</p>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    addMissionCard("눈금자 표시", "눈금자를 켠 뒤 #ruler-target 위로 마우스를 올려 너비와 높이를 확인해보세요.", "#ruler-target");
  }

  function scenarioSearch() {
    setLabScene(
      `
        <section class="practice-layout">
          <article class="practice-panel">
            <p class="practice-label">원문 예제</p>
            <h2 class="practice-title">문자열로 노드 검색</h2>
            <p class="practice-copy">Elements 검색창은 문자열, CSS 선택자, XPath 선택자로 DOM 트리를 검색할 수 있습니다.</p>
            <p class="practice-paragraph">
              Science fiction shelf:
              <span class="lab-search-target">The Moon is a Harsh Mistress</span>
            </p>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">검색 대상</p>
            <pre class="practice-code"><code>The Moon is a Harsh Mistress</code></pre>
            <p class="practice-note">원문과 동일하게 문자열을 그대로 검색해 마지막 문장을 찾아보는 예제입니다.</p>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    addMissionCard("노드 검색", "Elements 검색창에서 The Moon is a Harsh Mistress를 검색해 해당 텍스트 노드를 선택하세요.", "The Moon is a Harsh Mistress");
  }

  function scenarioContent() {
    renderReferenceListScene({
      title: "Michelle 텍스트 수정",
      description: "Michelle 텍스트 노드를 더블클릭해 Leela로 바꾸는 원문 예제를 그대로 반영했습니다.",
      items: ["튀김", "Michelle"],
      codeSnippet: "<li>Michelle</li>",
      note: "DOM 트리에서 Michelle 텍스트만 더블클릭해 값을 Leela로 바꾸는 흐름입니다.",
    });

    addMissionCard("콘텐츠 수정", "Michelle 텍스트를 더블클릭한 뒤 Leela로 바꾸고 Enter로 적용해보세요.", "<li>Michelle</li>");
  }

  function scenarioAttributes() {
    renderReferenceListScene({
      title: "Howard 노드에 style 속성 추가",
      description: "선택한 <li> 노드에 style=\"background-color:gold\"를 추가하는 공식 예제를 사용합니다.",
      items: [
        { text: "Howard", attrs: { id: "howard-node" } },
        "빈스",
      ],
      codeSnippet: "<li id=\"howard-node\">Howard</li>",
      note: "속성 이름이나 값을 더블클릭해 style 속성을 추가하고 Enter로 적용합니다.",
    });

    addMissionCard("속성 수정", "Howard 노드에 style=\"background-color:gold\" 속성을 추가해보세요.", "<li id=\"howard-node\">Howard</li>");
  }

  function scenarioType() {
    renderReferenceListScene({
      title: "Hank 노드 유형 변경",
      description: "선택한 <li> 노드의 태그명을 button으로 바꾸는 원문 흐름에 맞춘 예제입니다.",
      items: [
        "Dean",
        { text: "Hank", attrs: { id: "type-target" } },
        "Thaddeus",
        "Brock",
      ],
      codeSnippet: "<li id=\"type-target\">Hank</li>",
      note: "태그명 li를 button으로 바꾸고 Enter로 확정하면 노드 유형이 변경됩니다.",
    });

    addMissionCard("노드 유형 수정", "Hank 노드의 태그명을 li에서 button으로 바꿔보세요.", "<li id=\"type-target\">Hank</li>");
  }

  function scenarioAsHtml() {
    renderReferenceListScene({
      title: "Leonard 노드를 HTML로 수정",
      description: "드롭다운 메뉴의 HTML로 수정을 열고 새 <li>Sheldon</li>를 추가하는 공식 예제를 반영했습니다.",
      items: ["페니", "Howard", "Rajesh", "Leonard"],
      codeSnippet: "<li>Leonard</li>\n<li>Sheldon</li>",
      note: "Edit as HTML에서 새 줄을 만들고 li 태그를 자동완성으로 추가한 뒤 Sheldon을 입력합니다.",
    });

    addMissionCard("HTML로 수정", "Leonard 노드에서 Edit as HTML을 열고 Sheldon 항목을 추가해보세요.", "<li>Leonard</li>");
  }

  function scenarioDuplicate() {
    renderReferenceListScene({
      title: "Nana 노드 복제",
      description: "Elements 패널의 요소 복제 메뉴로 Nana 항목을 복제하는 예제를 그대로 사용합니다.",
      items: ["허영의 모닥불", "Nana", "올란도", "백색 소음"],
      codeSnippet: "<li>Nana</li>",
      note: "복제 후에는 페이지 목록에 Nana 항목이 하나 더 추가되어야 합니다.",
    });

    addMissionCard("노드 복제", "Nana 노드를 우클릭해 요소 복제로 같은 항목을 하나 더 만들어보세요.", "<li>Nana</li>");
  }

  function scenarioScreenshot() {
    setLabScene(
      `
        <section class="practice-layout">
          <article class="practice-panel">
            <p class="practice-label">원문 예제</p>
            <h2 class="practice-title">이미지 노드 스크린샷</h2>
            <p class="practice-copy">페이지 이미지 노드를 선택한 뒤 <strong>노드 스크린샷 캡처</strong>를 실행하는 흐름입니다.</p>
            <figure class="practice-figure">
              <img
                id="screenshot-target"
                class="practice-figure__image lab-capture-target"
                src="https://developer.chrome.com/static/docs/devtools/dom/image/highlight-node_480.png?hl=ko"
                alt="DOM inspection sample"
              />
              <figcaption class="practice-note">이 이미지 노드를 대상으로 스크린샷을 캡처합니다.</figcaption>
            </figure>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">스크린샷 대상</p>
            <pre class="practice-code"><code>&lt;img id="screenshot-target" ... /&gt;</code></pre>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    addMissionCard("노드 스크린샷 캡처", "이미지 노드를 선택한 뒤 노드 스크린샷 캡처를 실행해보세요.", "#screenshot-target");
  }

  function scenarioReorder() {
    renderReferenceListScene({
      title: "Elvis Presley 노드 재정렬",
      description: "목록의 마지막 항목 Elvis Presley를 DOM 트리에서 맨 위로 드래그하는 예제입니다.",
      items: ["스티비 원더", "톰 웨이츠", "Chris Thile", "엘비스 프레슬리"],
      codeSnippet: "<li>Elvis Presley</li>",
      note: "DOM 트리에서 마지막 <li>를 잡아 맨 위로 드래그해 순서를 바꿉니다.",
    });

    addMissionCard("DOM 노드 재정렬", "Elvis Presley 노드를 DOM 트리에서 맨 위로 드래그해보세요.", "<li>Elvis Presley</li>");
  }

  function scenarioState() {
    const style = document.createElement("style");
    style.id = LAB_STATE_STYLE_ID;
    style.textContent = `
      .demo--hover:hover,
      .demo--hover.is-forced-hover {
        background-color: #f59e0b;
        color: #4c1d95;
      }
    `;
    document.head.appendChild(style);

    renderReferenceListScene({
      title: "The Lord of the Flies에 :hover 강제",
      description: "원문과 같은 demo--hover 항목을 두고 :hover 강제 상태를 확인하는 예제입니다.",
      items: [
        { text: "The Lord of the Flies", className: "demo--hover", attrs: { id: "forced-state-target" } },
        "죄와 벌",
        "모비딕",
      ],
      codeSnippet: "<li class=\"demo--hover\">The Lord of the Flies</li>",
      note: "강제 상태 > :hover를 적용하면 마우스를 올리지 않아도 배경색이 유지됩니다.",
    });

    addMissionCard("강제 상태", "The Lord of the Flies 노드에 Force state > :hover를 적용해보세요.", ".demo--hover:hover");
  }

  function scenarioHide() {
    renderReferenceListScene({
      title: "The Stars My Destination 숨기기",
      description: "선택한 노드에서 H 키를 눌러 숨기고 다시 표시하는 원문 예제입니다.",
      items: ["몬테크리스토 백작", { text: "The Stars My Destination", attrs: { id: "hide-target" } }],
      codeSnippet: "<li id=\"hide-target\">The Stars My Destination</li>",
      note: "H 키를 누르면 노드가 숨겨지고, 다시 누르면 복구됩니다.",
    });

    addMissionCard("노드 숨기기", "The Stars My Destination 노드를 선택하고 H 키로 숨김/복구를 확인해보세요.", "#hide-target");
  }

  function scenarioDelete() {
    renderReferenceListScene({
      title: "Foundation 노드 삭제",
      description: "Delete 키로 Foundation 항목을 지우고, 실행취소로 복구하는 원문 흐름입니다.",
      items: ["The Illustrated Man", "거울 나라의 앨리스", { text: "Foundation", attrs: { id: "delete-target" } }],
      codeSnippet: "<li id=\"delete-target\">Foundation</li>",
      note: "Delete로 제거한 뒤 Command/Ctrl + Z로 복구할 수 있습니다.",
    });

    addMissionCard("노드 삭제", "Foundation 노드를 선택한 뒤 Delete로 지우고 실행취소로 복구해보세요.", "#delete-target");
  }

  function scenarioCurrent() {
    renderReferenceListScene({
      title: "$0으로 현재 선택된 노드 참조",
      description: "원문처럼 먼저 The Left Hand of Darkness를 선택하고 $0을 확인한 뒤, Dune으로 대상을 바꿔 다시 $0을 실행하는 흐름입니다.",
      items: [{ text: "Dune", attrs: { id: "current-second-target" } }, { text: "The Left Hand of Darkness", attrs: { id: "current-target" } }],
      codeSnippet: "<li id=\"current-target\">The Left Hand of Darkness</li>\n<li id=\"current-second-target\">Dune</li>",
      note: "현재 선택 노드는 $0으로, 직전 선택 노드는 $1로 확인할 수 있습니다.",
    });

    addMissionCard("$0으로 현재 선택된 노드 참조", "The Left Hand of Darkness를 선택해 $0을 확인한 뒤, Dune을 선택하고 다시 $0을 실행해보세요.", "$0");
  }

  function scenarioGlobal() {
    renderReferenceListScene({
      title: "전역 변수로 노드 저장",
      description: "원문과 같이 The Big Sleep 노드를 전역 변수로 저장한 뒤 temp1로 다시 참조하는 예제입니다.",
      items: [{ text: "The Big Sleep", attrs: { id: "global-target" } }, "The Long Goodbye"],
      codeSnippet: "<li id=\"global-target\">The Big Sleep</li>",
      note: "Store as global variable을 실행하면 temp1으로 저장되어 콘솔에서 다시 사용할 수 있습니다.",
    });

    addMissionCard("전역 변수로 저장", "The Big Sleep 노드를 전역 변수로 저장한 뒤 temp1을 콘솔에서 실행해보세요.", "temp1");
  }

  function scenarioPath() {
    renderReferenceListScene({
      title: "JS 경로 복사",
      description: "원문과 같이 The Brothers Karamazov 노드의 Copy JS path를 복사해 콘솔에서 그대로 실행하는 예제입니다.",
      items: [{ text: "The Brothers Karamazov", attrs: { id: "js-path-target" } }, "Crime and Punishment"],
      codeSnippet: "document.querySelector(\"#js-path-target\")",
      note: "Copy JS path로 받은 선택자를 콘솔에서 실행하면 같은 노드를 다시 얻을 수 있습니다.",
    });

    addMissionCard("JS 경로 복사", "The Brothers Karamazov 노드의 Copy JS path를 복사해 콘솔에서 실행해보세요.", "document.querySelector(\"#js-path-target\")");
  }

  function scenarioBreakpoints() {
    setLabScene(
      `
        <section class="practice-layout">
          <article class="practice-panel">
            <p class="practice-label">원문 예제</p>
            <h2 class="practice-title">DOM 변경 시 중단</h2>
            <p class="practice-copy">아래 설명 노드에 DOM 중단점을 건 뒤, 3.5초 후 자동 변경 시점에 중단되는지 확인합니다.</p>
            <div class="practice-breakpoint-box">
              <h3 class="practice-breakpoint-box__title">Mutation target</h3>
              <p class="practice-breakpoint-box__body" id="breakpoint-target">
                이 문장은 3.5초 후 스크립트에 의해 변경됩니다.
              </p>
            </div>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">변경 코드</p>
            <pre class="practice-code"><code>setTimeout(() =&gt; node.textContent = "...", 3500)</code></pre>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    const target = document.getElementById("breakpoint-target");

    scenarioMutationTimer = window.setTimeout(() => {
      if (target) {
        target.textContent = "자동 스크립트가 이 텍스트를 변경했습니다. DOM breakpoint 확인용.";
      }
    }, 3500);

    addMissionCard("DOM 변경 시 중단", "설명 문단에 DOM 중단점을 걸고 3.5초 뒤 자동 변경 시점을 잡아보세요.", "setTimeout(() => node.textContent = \"...\", 3500)");
  }

  function scenarioScroll2() {
    setLabScene(
      `
        <section class="practice-layout practice-layout--stack">
          <article class="practice-panel">
            <p class="practice-label">부록 예제</p>
            <h2 class="practice-title">화면으로 스크롤</h2>
            <p class="practice-copy">화면 맨 아래로 이동한 뒤 상단 노드에서 Scroll into view를 실행하는 부록 예제입니다.</p>
            <div class="practice-scroll-frame">
              <div class="practice-scroll-frame__spacer">하단까지 내려온 상태를 재현하기 위한 여백</div>
              <div class="practice-scroll-frame__target" id="appendix-scroll-target">
                <ul class="practice-list practice-list--compact">
                  <li class="practice-list__item">Top target</li>
                </ul>
              </div>
            </div>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">대상 노드</p>
            <pre class="practice-code"><code>&lt;li&gt;Top target&lt;/li&gt;</code></pre>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    addMissionCard("보기로 스크롤 (부록)", "하단 상태에서 Top target 노드에 Scroll into view를 실행해보세요.", "<li>Top target</li>");
  }

  function scenarioOptions() {
    setLabScene(
      `
        <section class="practice-layout">
          <article class="practice-panel">
            <p class="practice-label">부록 예제</p>
            <h2 class="practice-title">누락된 옵션</h2>
            <p class="practice-copy">텍스트 위를 우클릭할 때와 노드 행 전체를 우클릭할 때 나오는 메뉴 항목 차이를 확인하기 위한 예제입니다.</p>
            <div class="practice-option-row" id="options-target">
              <span class="practice-option-row__tag">&lt;li&gt;</span>
              <span class="practice-option-row__text">Inspect this node row</span>
            </div>
          </article>
          <aside class="practice-panel practice-panel--code">
            <p class="practice-label">대상 행</p>
            <pre class="practice-code"><code>&lt;li&gt;Inspect this node row&lt;/li&gt;</code></pre>
            <p class="practice-note">노드 행의 빈 공간을 우클릭하면 메뉴 옵션이 더 풍부하게 보이는 상황을 확인합니다.</p>
          </aside>
        </section>
      `,
      "lab-scene",
    );

    addMissionCard("누락된 옵션", "노드 행의 텍스트와 빈 영역을 각각 우클릭해 메뉴 차이를 비교해보세요.", "contextmenu on node row");
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

    if (topicId === "elements-overview" && sectionId === "overview") {
      addMissionCard(
        "개요",
        "요소 패널은 DOM을 검사하고 조작하는 강력한 인터페이스를 제공합니다. HTML 문서와 유사한 DOM 트리를 사용하여 특정 DOM 노드를 선택하고 다른 도구로 수정할 수 있습니다.",
        "<article id=\"inspect-target\" data-node-index=\"02\">...</article>",
      );

      return true;
    }

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
      if (payload && typeof payload === "object") {
        setLabHeader({
          title:
            typeof payload.sectionLabel === "string" && payload.sectionLabel.trim().length > 0
              ? payload.sectionLabel.trim()
              : "",
          description: "",
        });
      }

      runScenario();
      notifyParent("lab:dom-scenario-applied", { scenarioId });
      return true;
    }

    const genericApplied = applyGenericTopicScenario(rawScenarioId, payload);

    if (!genericApplied) {
      return false;
    }

    if (payload && typeof payload === "object") {
      setLabHeader({
        title:
          typeof payload.sectionLabel === "string" && payload.sectionLabel.trim().length > 0
            ? payload.sectionLabel.trim()
            : "",
        description: "",
      });
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
  initializeLabHeader();
  hydrateMotionImages(document);
  queueScenarioTransition();
  const initialParams = new URLSearchParams(window.location.search);
  const initialScenarioId = initialParams.get("scenario");

  if (initialScenarioId) {
    applyDomScenario(initialScenarioId, {
      topicId: initialParams.get("topicId") ?? undefined,
      sectionId: initialParams.get("sectionId") ?? undefined,
      sectionLabel: initialParams.get("sectionLabel") ?? undefined,
    });
  }

  openPreviewDevtools();
})();

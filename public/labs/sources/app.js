(() => {
  const CHII_SCRIPT_ID = "lab-chii-target-script";
  const CHII_SCRIPT_URL = "https://chii.liriliri.io/target.js";
  const CHII_PANEL_SELECTOR = ".__chobitsu-hide__";
  const ERUDA_SCRIPT_ID = "lab-eruda-script";
  const ERUDA_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/eruda";
  const LAB_ROOT_SELECTOR = ".lab-root";

  let chiiLoadPromise = null;
  let erudaLoadPromise = null;
  let isDevtoolsOpen = false;
  let scenarioTransitionTimer = null;
  let scenarioCleanupFns = [];
  const devtoolsEngine = isMobileRuntime() ? "eruda" : "chii";
  const initialLabRootHtml = document.querySelector(LAB_ROOT_SELECTOR)?.innerHTML ?? "";

  const topicLabels = {
    "sources-overview": "개요",
    "sources-javascript": "자바스크립트 디버깅 시작하기",
    "sources-breakpoints": "중단점을 사용하여 코드 일시중지",
    "sources-workspaces": "작업공간에서 파일 수정 및 저장하기",
    "sources-snippets": "자바스크립트 스니펫 실행",
    "sources-reference": "자바스크립트 디버깅 참조",
    "sources-overrides": "로컬에서 웹 콘텐츠 및 HTTP 응답 헤더 재정의",
  };

  const sourceTree = [
    { label: "top", active: false },
    { label: "debug-js", indent: 1 },
    { label: "index.html", indent: 2 },
    { label: "get-started.js", indent: 2, active: true },
    { label: "styles.css", indent: 2 },
    { label: "snippets", indent: 1 },
    { label: "overrides", indent: 1 },
  ];

  const baseDebugLines = [
    { no: 24, code: "function onClick() {" },
    { no: 25, code: "  updateLabel();" },
    { no: 26, code: "}" },
    { no: 28, code: "function updateLabel() {" },
    { no: 29, code: "  var addend1 = getNumber1();", annotation: '"5"' },
    { no: 30, code: "  var addend2 = getNumber2();", annotation: '"1"' },
    { no: 31, code: "  var sum = addend1 + addend2;", annotation: '"51"' },
    { no: 32, code: "  label.textContent = addend1 + ' + ' + addend2 + ' = ' + sum;" },
    { no: 33, code: "}" },
  ];

  const fixedDebugLines = baseDebugLines.map((line) => {
    if (line.no !== 31) {
      return line;
    }

    return {
      ...line,
      code: "  var sum = parseInt(addend1) + parseInt(addend2);",
      annotation: "6",
    };
  });

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
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function getLabRoot() {
    return document.querySelector(LAB_ROOT_SELECTOR);
  }

  function getNoteHost() {
    return document.getElementById("lab-note");
  }

  function getSceneHost() {
    return document.getElementById("lab-scene");
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
    }, 180);
  }

  function registerScenarioCleanup(cleanup) {
    if (typeof cleanup === "function") {
      scenarioCleanupFns.push(cleanup);
    }
  }

  function clearScenarioCleanupFns() {
    const cleanupFns = scenarioCleanupFns;
    scenarioCleanupFns = [];

    cleanupFns.forEach((cleanup) => {
      try {
        cleanup();
      } catch {
        // Ignore cleanup failures.
      }
    });
  }

  function resetLabScene() {
    clearScenarioCleanupFns();

    const root = getLabRoot();
    if (root) {
      root.innerHTML = initialLabRootHtml;
    }
  }

  function setLabNote(copy, code) {
    const noteHost = getNoteHost();

    if (!noteHost) {
      return;
    }

    noteHost.innerHTML = `
      <section class="lab-note">
        <p class="lab-note__copy">${copy}</p>
        ${code ? `<pre class="lab-note__code"><code>${escapeHtml(code)}</code></pre>` : ""}
      </section>
    `;
  }

  function setScene(html) {
    const sceneHost = getSceneHost();

    if (!sceneHost) {
      return;
    }

    sceneHost.innerHTML = html;
  }

  function renderTree(items) {
    return `
      <ul class="tree-list">
        ${items
          .map((item) => {
            const classes = ["tree-item"];
            if (item.active) {
              classes.push("is-active");
            }

            return `
              <li class="${classes.join(" ")}${item.indent ? ` tree-indent tree-indent--${item.indent}` : ""}" style="margin-left:${(item.indent || 0) * 14}px">
                <span>${escapeHtml(item.label)}</span>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function renderList(items, activeLabel) {
    return `
      <ul class="panel-list">
        ${items
          .map((item) => {
            const label = typeof item === "string" ? item : item.label;
            const active = (typeof item === "string" ? item : item.active) || label === activeLabel;
            return `<li class="panel-item${active ? " is-active" : ""}">${escapeHtml(label)}</li>`;
          })
          .join("")}
      </ul>
    `;
  }

  function renderMetaList(items) {
    return `
      <ul class="meta-list">
        ${items.map((item) => `<li class="meta-item${item.active ? " is-active" : ""}">${item.label}</li>`).join("")}
      </ul>
    `;
  }

  function renderEditor(lines) {
    return `
      <div class="editor-surface">
        <div class="editor-lines">
          ${lines
            .map((line) => {
              const classes = ["editor-line"];
              if (line.active) {
                classes.push("is-active");
              }
              if (line.paused) {
                classes.push("is-paused");
              }
              if (line.breakpoint) {
                classes.push("has-breakpoint");
              }
              return `
                <div class="${classes.join(" ")}" data-line="${line.no}">
                  <button type="button" class="editor-gutter${line.breakpoint ? " is-on" : ""}" data-gutter-line="${line.no}" aria-label="${line.no}번 줄 중단점"></button>
                  <span class="editor-line-number">${line.no}</span>
                  <span class="editor-code">${escapeHtml(line.code)}${line.annotation ? ` <span class="inline-eval">// ${escapeHtml(line.annotation)}</span>` : ""}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderPanelBlock(title, bodyHtml) {
    return `
      <section class="panel-block">
        <p class="panel-title">${escapeHtml(title)}</p>
        ${bodyHtml}
      </section>
    `;
  }

  function renderWorkbench({
    title,
    subtitle,
    fileLabel,
    statusLabel,
    treeItems = sourceTree,
    lines = baseDebugLines,
    appHtml = "",
    metaPills = [],
    debuggerBlocks = [],
    extraHtml = "",
  }) {
    return `
      <section class="source-stack">
        ${appHtml ? `<section class="lab-card demo-surface">${appHtml}</section>` : ""}
        <section class="lab-card sources-workbench">
          <div class="workbench-topbar">
            <div>
              <p class="workbench-title">${escapeHtml(title)}</p>
              <p class="workbench-subtitle">${escapeHtml(subtitle)}</p>
            </div>
            ${metaPills.length > 0 ? `<div class="pill-row">${metaPills.map((pill) => `<span class="pill${pill.accent ? " is-accent" : ""}">${escapeHtml(pill.label)}</span>`).join("")}</div>` : ""}
          </div>
          <div class="workbench-grid">
            <aside class="file-pane">
              ${renderPanelBlock("페이지", renderTree(treeItems))}
              ${extraHtml ? renderPanelBlock("보조 작업", extraHtml) : ""}
            </aside>
            <section class="editor-pane">
              <div class="editor-header">
                <span class="editor-filename">${escapeHtml(fileLabel)}</span>
                <span class="editor-status">${escapeHtml(statusLabel)}</span>
              </div>
              ${renderEditor(lines)}
            </section>
            <aside class="debugger-pane">
              ${debuggerBlocks.join("")}
            </aside>
          </div>
        </section>
      </section>
    `;
  }

  function renderBugDemo({ fixed = false, paused = false, bannerText = "현재 결과를 재현해보세요." } = {}) {
    return `
      <div class="demo-surface">
        <div class="demo-fields">
          <label class="demo-field">
            <span class="demo-label">숫자 1</span>
            <input id="bug-input-1" class="demo-input" value="5" />
          </label>
          <label class="demo-field">
            <span class="demo-label">숫자 2</span>
            <input id="bug-input-2" class="demo-input" value="1" />
          </label>
        </div>
        <div class="demo-controls">
          <button type="button" id="bug-run" class="scene-button is-dark">Add Number 1 and Number 2</button>
          ${fixed ? '<span class="pill is-accent">parseInt 적용됨</span>' : '<span class="pill">문자열 결합 버그 상태</span>'}
        </div>
        <div id="bug-banner" class="pause-banner${paused ? " is-paused" : ""}">${bannerText}</div>
        <div id="bug-result" class="demo-result">5 + 1 = ${fixed ? "6" : "51"}</div>
      </div>
    `;
  }

  function attachBugDemo({ fixed = false, beforeRun } = {}) {
    const button = document.getElementById("bug-run");
    const input1 = document.getElementById("bug-input-1");
    const input2 = document.getElementById("bug-input-2");
    const result = document.getElementById("bug-result");

    if (!(button instanceof HTMLButtonElement) || !(input1 instanceof HTMLInputElement) || !(input2 instanceof HTMLInputElement) || !(result instanceof HTMLElement)) {
      return;
    }

    const handler = () => {
      if (typeof beforeRun === "function") {
        const shouldContinue = beforeRun({ input1, input2, result });
        if (shouldContinue === false) {
          return;
        }
      }

      const value1 = input1.value;
      const value2 = input2.value;
      const output = fixed ? Number.parseInt(value1, 10) + Number.parseInt(value2, 10) : `${value1}${value2}`;
      result.textContent = `${value1} + ${value2} = ${Number.isNaN(output) ? "NaN" : output}`;
    };

    button.addEventListener("click", handler);
    registerScenarioCleanup(() => button.removeEventListener("click", handler));
  }

  function attachBreakpointGutters(onToggle) {
    const gutters = document.querySelectorAll("[data-gutter-line]");

    gutters.forEach((gutter) => {
      const handler = () => {
        gutter.classList.toggle("is-on");
        const line = Number.parseInt(gutter.getAttribute("data-gutter-line") || "", 10);
        if (typeof onToggle === "function") {
          onToggle(line, gutter.classList.contains("is-on"));
        }
      };

      gutter.addEventListener("click", handler);
      registerScenarioCleanup(() => gutter.removeEventListener("click", handler));
    });
  }

  function updatePausedLine(lineNumber) {
    document.querySelectorAll(".editor-line").forEach((line) => {
      const target = line instanceof HTMLElement ? line : null;
      if (!target) {
        return;
      }
      const isTarget = Number.parseInt(target.dataset.line || "", 10) === lineNumber;
      target.classList.toggle("is-paused", isTarget);
      target.classList.toggle("is-active", isTarget);
    });
  }

  function scenarioOverviewOverview(payload) {
    setLabNote("소스 패널의 기본 작업 공간을 확인하세요. 파일 트리, 코드 편집기, 디버거 섹션이 한 화면에서 연결됩니다.", "Pages · Editor · Debugger");
    setScene(
      renderWorkbench({
        title: "Sources Panel Overview",
        subtitle: "파일 보기, 수정, 스니펫 실행, 디버그, 워크스페이스 연결을 한 화면에서 수행합니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "개요",
        metaPills: [
          { label: "Pages" },
          { label: "Editor", accent: true },
          { label: "Debugger" },
        ],
        debuggerBlocks: [
          renderPanelBlock("중단점", renderList(["Event Listener: click", "Line 31: updateLabel()"], "Line 31: updateLabel()")),
          renderPanelBlock("호출 스택", renderList(["onClick", "updateLabel", "(anonymous)"], "updateLabel")),
          renderPanelBlock("범위", renderMetaList([{ label: "addend1: \"5\"" }, { label: "addend2: \"1\"" }, { label: "sum: \"51\"", active: true }])),
        ],
      }),
    );
  }

  function scenarioOverviewOpenPanel(payload) {
    setLabNote("명령 메뉴에서 sources 를 입력하거나 More tools > Sources로 이동하는 흐름을 기준으로 정리했습니다.", "Command+Shift+P → Show Sources");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <p class="scene-heading">열기 경로</p>
          <div class="scene-grid">
            <article class="scene-tile">
              <h3 class="scene-tile__title">명령 메뉴</h3>
              <p class="scene-tile__copy">Command/Ctrl + Shift + P를 누른 뒤 <strong>sources</strong>를 입력하고 <strong>소스 패널 표시</strong>를 선택합니다.</p>
              <div class="console-preview"><strong>&gt;</strong> Show Sources</div>
            </article>
            <article class="scene-tile">
              <h3 class="scene-tile__title">옵션 더보기 경로</h3>
              <p class="scene-tile__copy">오른쪽 상단 More tools 메뉴에서 <strong>Sources</strong>를 선택하는 공식 대체 경로입니다.</p>
              <div class="pill-row"><span class="pill">More tools</span><span class="pill is-accent">Sources</span></div>
            </article>
          </div>
        </section>
        ${renderWorkbench({
          title: "Command Menu → Sources",
          subtitle: "패널을 연 직후 파일 트리와 편집기, 디버거가 나타나는 상태입니다.",
          fileLabel: "Pages",
          statusLabel: payload.sectionLabel || "소스 패널 열기",
          metaPills: [{ label: "Command Menu", accent: true }, { label: "Sources" }],
          debuggerBlocks: [renderPanelBlock("도착한 패널", renderList(["Pages", "Editor", "Debugger"], "Pages"))],
        })}
      </section>
    `);
  }

  function scenarioOverviewFiles(payload) {
    setLabNote("Pages 탭에서 top 프레임 아래의 리소스를 읽고, 선택한 파일 내용을 편집기에 여는 흐름만 남겼습니다.", "top → debug-js → get-started.js");
    setScene(
      renderWorkbench({
        title: "파일 보기",
        subtitle: "top 프레임 아래에서 HTML, JS, CSS 리소스를 찾아 편집기에 엽니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "파일 보기",
        debuggerBlocks: [
          renderPanelBlock("선택한 파일", renderList(["index.html", "get-started.js", "styles.css"], "get-started.js")),
          renderPanelBlock("참조", renderMetaList([{ label: "top frame" }, { label: "debug-js" }, { label: "브라우저가 요청한 리소스", active: true }])),
        ],
      }),
    );
  }

  function scenarioOverviewEdit(payload) {
    setLabNote("Styles 또는 JavaScript 파일을 편집기에서 직접 수정하고 저장하는 상태를 기준으로 LAB을 구성했습니다.", "Command/Ctrl + S");
    setScene(
      renderWorkbench({
        title: "CSS 및 JavaScript 수정",
        subtitle: "코드 편집기에서 값을 바꾸고 저장해 브라우저에 즉시 반영합니다.",
        fileLabel: "styles.css",
        statusLabel: payload.sectionLabel || "수정",
        lines: [
          { no: 4, code: ".result-label {" },
          { no: 5, code: "  color: #1d4ed8;", annotation: "수정됨", active: true },
          { no: 6, code: "  font-weight: 700;" },
          { no: 7, code: "}" },
        ],
        metaPills: [{ label: "dirty" }, { label: "저장 가능", accent: true }],
        debuggerBlocks: [
          renderPanelBlock("편집 흐름", renderList(["값 수정", "저장", "즉시 새로고침"], "저장")),
          renderPanelBlock("상태", renderMetaList([{ label: "변경 전: #334155" }, { label: "변경 후: #1d4ed8", active: true }])),
        ],
      }),
    );
  }

  function scenarioOverviewSnippets(payload) {
    setLabNote("Sources 패널 안에서 Snippets 컬렉션을 만들고 저장된 스니펫을 실행하는 기본 흐름입니다.", "Snippets → New snippet → Run");
    setScene(
      renderWorkbench({
        title: "스니펫 만들기, 저장, 실행",
        subtitle: "재사용할 코드를 Sources 안의 Snippets에 보관합니다.",
        fileLabel: "Snippet: highlight-heading.js",
        statusLabel: payload.sectionLabel || "스니펫",
        treeItems: sourceTree.map((item) =>
          item.label === "snippets" ? { ...item, active: true } : item,
        ),
        lines: [
          { no: 1, code: "const heading = document.querySelector('h1');" },
          { no: 2, code: "heading.style.outline = '2px solid #2563eb';" },
        ],
        debuggerBlocks: [
          renderPanelBlock("스니펫 작업", renderList(["새 스니펫", "이름 지정", "실행"], "실행")),
          renderPanelBlock("최근 실행", renderMetaList([{ label: "highlight-heading.js", active: true }])),
        ],
      }),
    );
  }

  function scenarioOverviewDebug(payload) {
    setLabNote("브레이크포인트, 호출 스택, 범위, watch를 동시에 보며 JavaScript를 디버그하는 상태입니다.", "Paused on breakpoint");
    setScene(
      renderWorkbench({
        title: "JavaScript 디버그",
        subtitle: "브레이크포인트에서 일시중지하고 오른쪽 디버거 섹션에서 값을 검사합니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "디버그",
        lines: baseDebugLines.map((line) => ({
          ...line,
          breakpoint: line.no === 31,
          paused: line.no === 31,
          active: line.no === 31,
        })),
        metaPills: [{ label: "Paused", accent: true }, { label: "Line 31" }],
        debuggerBlocks: [
          renderPanelBlock("호출 스택", renderList(["onClick", "updateLabel", "global"], "updateLabel")),
          renderPanelBlock("범위", renderMetaList([{ label: "addend1: \"5\"" }, { label: "addend2: \"1\"" }, { label: "sum: \"51\"", active: true }])),
          renderPanelBlock("Watch", renderMetaList([{ label: "typeof sum: \"string\"", active: true }])),
        ],
      }),
    );
  }

  function scenarioOverviewWorkspace(payload) {
    setLabNote("DevTools의 변경사항을 로컬 파일 시스템 폴더에 다시 저장하는 Workspaces 연결 상태를 반영했습니다.", "Connect folder → Save to file system");
    setScene(
      renderWorkbench({
        title: "Workspace 설정",
        subtitle: "로컬 폴더를 연결해 브라우저 수정사항을 실제 파일에 다시 저장합니다.",
        fileLabel: "devtools-lab/.well-known/appspecific/com.chrome.devtools.json",
        statusLabel: payload.sectionLabel || "Workspace 설정",
        lines: [
          { no: 1, code: '{"workspace": "devtools-lab"}', active: true },
        ],
        metaPills: [{ label: "Connected", accent: true }, { label: "Local folder" }],
        debuggerBlocks: [
          renderPanelBlock("연결 상태", renderMetaList([{ label: "Folder: /Users/hoya/Projects/DevTools-Lab", active: true }, { label: "자동 저장 준비됨" }])),
          renderPanelBlock("다음 작업", renderList(["메타데이터 생성", "폴더 연결", "저장 확인"], "폴더 연결")),
        ],
      }),
    );
  }

  function scenarioJavaScriptReproduce(payload) {
    setLabNote("공식 튜토리얼과 동일하게 5와 1을 넣고 Add Number 1 and Number 2를 눌러 51 버그를 재현합니다.", "5 + 1 = 51");
    setScene(
      renderWorkbench({
        title: "버그 재현",
        subtitle: "버그를 안정적으로 다시 만드는 단계입니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "버그 재현",
        appHtml: renderBugDemo({ bannerText: "공식 튜토리얼과 동일한 입력값으로 결과를 재현해보세요." }),
        debuggerBlocks: [renderPanelBlock("현재 상태", renderMetaList([{ label: "입력: 5, 1" }, { label: "결과: 51", active: true }]))],
      }),
    );
    attachBugDemo();
  }

  function scenarioJavaScriptUi(payload) {
    setLabNote("Sources 패널의 세 구역을 기준으로 파일 트리, 코드 편집기, Debugger 섹션을 구분했습니다.", "Pages / Editor / Debugger");
    setScene(
      renderWorkbench({
        title: "소스 패널 UI 익히기",
        subtitle: "왼쪽은 파일 트리, 가운데는 코드 편집기, 오른쪽은 디버거 섹션입니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "소스 패널 UI 익히기",
        metaPills: [{ label: "Pages" }, { label: "Editor", accent: true }, { label: "Debugger" }],
        debuggerBlocks: [
          renderPanelBlock("구성 요소", renderList(["이벤트 리스너 브레이크포인트", "범위", "Watch"], "범위")),
          renderPanelBlock("위치", renderMetaList([{ label: "좁은 화면에서는 아래로 이동" }, { label: "넓은 화면에서는 오른쪽 배치", active: true }])),
        ],
      }),
    );
  }

  function scenarioJavaScriptEventBreakpoint(payload) {
    setLabNote("Mouse > click 이벤트 리스너 브레이크포인트를 켠 뒤 Add Number 1 and Number 2를 눌러 onClick()에서 일시중지합니다.", "Event Listener Breakpoints → Mouse → click");
    setScene(
      renderWorkbench({
        title: "이벤트 리스너 중단점",
        subtitle: "click 리스너가 실행되기 직전에 onClick()에서 멈추도록 구성했습니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "중단점으로 코드 일시중지",
        appHtml: `
          ${renderBugDemo({ bannerText: "click 브레이크포인트를 켠 뒤 버튼을 누르세요." })}
          <div class="toggle-row">
            <label class="toggle-chip"><input id="toggle-click-breakpoint" type="checkbox" checked /> Mouse &gt; click</label>
          </div>
        `,
        lines: baseDebugLines.map((line) => ({
          ...line,
          active: line.no === 24,
          paused: line.no === 24,
        })),
        metaPills: [{ label: "Paused on click", accent: true }],
        debuggerBlocks: [
          renderPanelBlock("이벤트 리스너 브레이크포인트", renderList(["Mouse → click"], "Mouse → click")),
          renderPanelBlock("호출 스택", renderList(["onClick", "Event: click"], "onClick")),
        ],
      }),
    );

    attachBugDemo({
      beforeRun: ({ result }) => {
        const toggle = document.getElementById("toggle-click-breakpoint");
        const banner = document.getElementById("bug-banner");
        if (toggle instanceof HTMLInputElement && toggle.checked) {
          if (banner) {
            banner.textContent = "Paused on event listener breakpoint → onClick()";
            banner.classList.add("is-paused");
          }
          result.textContent = "5 + 1 = 51";
          updatePausedLine(24);
          return false;
        }
        return true;
      },
    });
  }

  function scenarioJavaScriptStepping(payload) {
    setLabNote("공식 튜토리얼의 code stepping 흐름처럼 현재 줄을 옮기며 updateLabel() 내부를 단계별로 살펴봅니다.", "Step over → Step into → Resume");
    setScene(
      renderWorkbench({
        title: "코드 단계별 처리",
        subtitle: "재개와 step 버튼으로 updateLabel() 내부를 따라갑니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "코드 단계별 처리",
        appHtml: `
          <div class="demo-controls">
            <button type="button" id="step-over" class="scene-button">Step over</button>
            <button type="button" id="step-into" class="scene-button">Step into</button>
            <button type="button" id="step-out" class="scene-button">Step out</button>
            <button type="button" id="resume-run" class="scene-button is-dark">Resume</button>
          </div>
          <div id="bug-banner" class="pause-banner is-paused">현재 줄: 24 onClick()</div>
        `,
        lines: baseDebugLines.map((line) => ({
          ...line,
          paused: line.no === 24,
          active: line.no === 24,
        })),
        metaPills: [{ label: "Stepping", accent: true }],
        debuggerBlocks: [
          renderPanelBlock("호출 스택", renderList(["onClick", "updateLabel"], "onClick")),
          renderPanelBlock("범위", renderMetaList([{ label: "addend1: \"5\"" }, { label: "addend2: \"1\"" }, { label: "sum: \"51\"" }])),
        ],
      }),
    );

    const sequence = [24, 25, 29, 30, 31, 32];
    let index = 0;
    const banner = document.getElementById("bug-banner");
    const updateBanner = () => {
      const current = sequence[index];
      updatePausedLine(current);
      if (banner) {
        banner.textContent = `현재 줄: ${current}`;
      }
    };

    const stepButtons = ["step-over", "step-into", "step-out"].map((id) => document.getElementById(id));
    stepButtons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      const handler = () => {
        index = Math.min(index + 1, sequence.length - 1);
        updateBanner();
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    });

    const resume = document.getElementById("resume-run");
    if (resume instanceof HTMLButtonElement) {
      const handler = () => {
        index = sequence.length - 1;
        updateBanner();
        if (banner) {
          banner.textContent = "스크립트가 마지막 줄까지 재개되었습니다.";
        }
      };
      resume.addEventListener("click", handler);
      registerScenarioCleanup(() => resume.removeEventListener("click", handler));
    }
  }

  function scenarioJavaScriptLineBreakpoint(payload) {
    setLabNote("31번 줄 var sum = addend1 + addend2; 에 라인 브레이크포인트를 두고 버튼을 눌러 멈추게 합니다.", "Line 31 breakpoint");
    setScene(
      renderWorkbench({
        title: "코드 줄 중단점 설정",
        subtitle: "줄 번호 옆 거터를 눌러 중단점을 만들고, 다시 눌러 해제할 수 있습니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "코드 줄 중단점 설정",
        appHtml: `${renderBugDemo({ bannerText: "31번 줄 중단점을 켠 뒤 Add 버튼을 눌러보세요." })}`,
        lines: baseDebugLines,
        metaPills: [{ label: "Line breakpoint" }],
        debuggerBlocks: [renderPanelBlock("중단점", renderList(["Line 31: updateLabel()"])), renderPanelBlock("호출 스택", renderList(["onClick", "updateLabel"], "updateLabel"))],
      }),
    );

    let isBreakpointOn = false;
    const banner = document.getElementById("bug-banner");
    attachBreakpointGutters((line, active) => {
      if (line === 31) {
        isBreakpointOn = active;
      }
    });
    attachBugDemo({
      beforeRun: ({ result }) => {
        if (isBreakpointOn) {
          updatePausedLine(31);
          if (banner) {
            banner.textContent = "Paused on line breakpoint → 31";
            banner.classList.add("is-paused");
          }
          result.textContent = "5 + 1 = 51";
          return false;
        }
        return true;
      },
    });
  }

  function scenarioJavaScriptCheckValues(payload) {
    setLabNote("범위, Watch, Console 세 가지 방식으로 sum이 문자열이라는 점을 확인하는 상태입니다.", "typeof sum // \"string\"");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls">
            <button type="button" class="scene-button is-dark" data-view-tab="scope">Scope</button>
            <button type="button" class="scene-button" data-view-tab="watch">Watch</button>
            <button type="button" class="scene-button" data-view-tab="console">Console</button>
          </div>
          <div id="values-view-scope" class="split-grid" style="margin-top:12px;">
            <section class="scene-tile"><h3 class="scene-tile__title">Scope</h3><p class="scene-copy">addend1: "5"<br />addend2: "1"<br />sum: "51"</p></section>
            <section class="scene-tile"><h3 class="scene-tile__title">해석</h3><p class="scene-copy">따옴표가 붙어 있으므로 문자열입니다. 숫자로 변환되지 않았습니다.</p></section>
          </div>
          <div id="values-view-watch" class="is-hidden" style="margin-top:12px;">
            <section class="scene-tile"><h3 class="scene-tile__title">Watch</h3><p class="scene-copy">typeof sum: "string"</p></section>
          </div>
          <div id="values-view-console" class="is-hidden" style="margin-top:12px;">
            <div class="console-preview">&gt; parseInt(addend1) + parseInt(addend2)<br /><strong>6</strong></div>
          </div>
        </section>
        ${renderWorkbench({
          title: "변수 값 확인",
          subtitle: "같은 시점의 값을 Scope, Watch, Console로 교차 확인합니다.",
          fileLabel: "get-started.js",
          statusLabel: payload.sectionLabel || "변수 값 확인",
          lines: baseDebugLines.map((line) => ({
            ...line,
            paused: line.no === 31,
            active: line.no === 31,
          })),
          metaPills: [{ label: "Paused", accent: true }],
          debuggerBlocks: [
            renderPanelBlock("Scope", renderMetaList([{ label: 'addend1: "5"' }, { label: 'addend2: "1"' }, { label: 'sum: "51"', active: true }])),
            renderPanelBlock("Watch", renderMetaList([{ label: 'typeof sum: "string"', active: true }])),
            renderPanelBlock("Console", '<div class="console-preview">&gt; parseInt(addend1) + parseInt(addend2)<br /><strong>6</strong></div>'),
          ],
        })}
      </section>
    `);

    document.querySelectorAll("[data-view-tab]").forEach((button) => {
      const handler = () => {
        const tab = button.getAttribute("data-view-tab");
        ["scope", "watch", "console"].forEach((id) => {
          document.getElementById(`values-view-${id}`)?.classList.toggle("is-hidden", id !== tab);
        });
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    });
  }

  function scenarioJavaScriptScope(payload) {
    scenarioJavaScriptCheckValues(payload);
    setLabNote("일시중지된 줄에서 Scope 패널을 열고 addend1, addend2, sum 값을 확인하는 공식 흐름입니다.", 'sum: "51"');
    document.getElementById("values-view-watch")?.classList.add("is-hidden");
    document.getElementById("values-view-console")?.classList.add("is-hidden");
    document.getElementById("values-view-scope")?.classList.remove("is-hidden");
  }

  function scenarioJavaScriptWatch(payload) {
    scenarioJavaScriptCheckValues(payload);
    setLabNote("Watch에 typeof sum 표현식을 추가해 문자열 여부를 확인하는 흐름입니다.", "typeof sum");
    document.getElementById("values-view-scope")?.classList.add("is-hidden");
    document.getElementById("values-view-console")?.classList.add("is-hidden");
    document.getElementById("values-view-watch")?.classList.remove("is-hidden");
  }

  function scenarioJavaScriptConsole(payload) {
    scenarioJavaScriptCheckValues(payload);
    setLabNote("Console에서 parseInt(addend1) + parseInt(addend2)를 평가해 올바른 합 6을 확인하는 흐름입니다.", "parseInt(addend1) + parseInt(addend2)");
    document.getElementById("values-view-scope")?.classList.add("is-hidden");
    document.getElementById("values-view-watch")?.classList.add("is-hidden");
    document.getElementById("values-view-console")?.classList.remove("is-hidden");
  }

  function scenarioJavaScriptApplyFix(payload) {
    setLabNote("31번 줄을 parseInt(addend1) + parseInt(addend2)로 바꾸고 저장한 뒤 다시 실행해 6이 나오는지 확인합니다.", "var sum = parseInt(addend1) + parseInt(addend2)");
    setScene(`
      <section class="source-stack">
        ${renderWorkbench({
          title: "수정사항 적용",
          subtitle: "코드 편집기에서 31번 줄을 수정하고 저장합니다.",
          fileLabel: "get-started.js",
          statusLabel: payload.sectionLabel || "수정사항 적용",
          appHtml: `
            ${renderBugDemo({ fixed: false, bannerText: "코드를 고친 뒤 다시 실행해 결과를 비교하세요." })}
            <div class="demo-controls">
              <button type="button" id="apply-fix-button" class="scene-button">31번 줄 수정</button>
              <button type="button" id="save-fix-button" class="scene-button is-dark">저장</button>
            </div>
          `,
          lines: baseDebugLines.map((line) => ({ ...line, breakpoint: line.no === 31, active: line.no === 31 })),
          debuggerBlocks: [
            renderPanelBlock("작업 순서", renderList(["31번 줄 수정", "저장", "중단점 비활성화", "재실행"], "저장")),
            renderPanelBlock("기대 결과", renderMetaList([{ label: "5 + 1 = 6", active: true }])),
          ],
        })}
      </section>
    `);

    let fixed = false;
    const applyButton = document.getElementById("apply-fix-button");
    const saveButton = document.getElementById("save-fix-button");
    const banner = document.getElementById("bug-banner");
    const result = document.getElementById("bug-result");
    const input1 = document.getElementById("bug-input-1");
    const input2 = document.getElementById("bug-input-2");

    const rerenderLines = () => {
      const editorSurface = document.querySelector(".editor-pane");
      if (!(editorSurface instanceof HTMLElement)) {
        return;
      }
      const header = editorSurface.querySelector(".editor-header");
      const existing = editorSurface.querySelector(".editor-surface");
      if (existing) {
        existing.remove();
      }
      header?.insertAdjacentHTML(
        "afterend",
        renderEditor((fixed ? fixedDebugLines : baseDebugLines).map((line) => ({
          ...line,
          breakpoint: line.no === 31,
          active: line.no === 31,
        }))),
      );
      attachBreakpointGutters();
    };

    if (applyButton instanceof HTMLButtonElement) {
      const handler = () => {
        fixed = true;
        rerenderLines();
        if (banner) {
          banner.textContent = "31번 줄에 parseInt가 적용되었습니다. 저장 후 다시 실행해보세요.";
        }
      };
      applyButton.addEventListener("click", handler);
      registerScenarioCleanup(() => applyButton.removeEventListener("click", handler));
    }

    if (saveButton instanceof HTMLButtonElement) {
      const handler = () => {
        if (!fixed) {
          return;
        }
        if (banner) {
          banner.textContent = "저장 완료. 이제 Add 버튼을 다시 눌러 결과를 확인하세요.";
        }
      };
      saveButton.addEventListener("click", handler);
      registerScenarioCleanup(() => saveButton.removeEventListener("click", handler));
    }

    if (result instanceof HTMLElement && input1 instanceof HTMLInputElement && input2 instanceof HTMLInputElement) {
      const runButton = document.getElementById("bug-run");
      if (runButton instanceof HTMLButtonElement) {
        const handler = () => {
          const value1 = input1.value;
          const value2 = input2.value;
          const output = fixed ? Number.parseInt(value1, 10) + Number.parseInt(value2, 10) : `${value1}${value2}`;
          result.textContent = `${value1} + ${value2} = ${output}`;
        };
        runButton.addEventListener("click", handler);
        registerScenarioCleanup(() => runButton.removeEventListener("click", handler));
      }
    }
  }

  function scenarioBreakpointsOverview() {
    setLabNote("코드 줄, 조건부, 로그포인트, DOM, XHR/Fetch, 이벤트 리스너, 예외, 함수 중단점을 한 화면에서 비교하는 개요입니다.", "line · conditional · logpoint · DOM · XHR/fetch · event listener · exceptions · function");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="scene-grid">
            ${[
              ["코드 줄", "정확한 줄에서 항상 멈출 때"],
              ["조건부", "조건이 true일 때만 멈출 때"],
              ["Logpoint", "멈추지 않고 값을 기록할 때"],
              ["DOM", "특정 노드 변경을 잡고 싶을 때"],
              ["XHR/Fetch", "URL 패턴으로 요청을 멈출 때"],
              ["이벤트 리스너", "click 같은 이벤트에서 멈출 때"],
              ["예외", "caught/uncaught 예외를 바로 잡을 때"],
              ["함수", "특정 함수 호출마다 멈출 때"],
            ].map(([title, copy]) => `<article class="scene-tile"><h3 class="scene-tile__title">${title}</h3><p class="scene-tile__copy">${copy}</p></article>`).join("")}
          </div>
        </section>
      </section>
    `);
  }

  function scenarioBreakpointsLine(payload) {
    setLabNote("줄 번호 거터를 눌러 브레이크포인트를 놓는 공식 흐름을 그대로 반영했습니다.", "Click gutter on line 31");
    scenarioJavaScriptLineBreakpoint(payload);
  }

  function scenarioBreakpointsDebuggerStatement(payload) {
    setLabNote("코드 안에 debugger; 문을 넣어 UI가 아니라 소스 자체에서 멈추는 흐름입니다.", "debugger;");
    setScene(
      renderWorkbench({
        title: "debugger 문",
        subtitle: "UI 중단점과 같은 효과를 코드에 직접 심습니다.",
        fileLabel: "demo.js",
        statusLabel: payload.sectionLabel || "debugger",
        lines: [
          { no: 1, code: "console.log('a');" },
          { no: 2, code: "console.log('b');" },
          { no: 3, code: "debugger;", active: true, paused: true, breakpoint: true },
          { no: 4, code: "console.log('c');" },
        ],
        metaPills: [{ label: "debugger;", accent: true }],
        debuggerBlocks: [renderPanelBlock("현재 상태", renderMetaList([{ label: "Paused on debugger statement", active: true }]))],
      }),
    );
  }

  function scenarioBreakpointsConditional(payload) {
    setLabNote("조건부 중단점은 반복이나 노이즈가 많은 코드에서 필요한 케이스만 남길 때 사용합니다.", "x > 10 && i === 6");
    setScene(
      renderWorkbench({
        title: "조건부 코드 줄 중단점",
        subtitle: "31번 줄이 아니라 조건이 true일 때만 멈춥니다.",
        fileLabel: "loop.js",
        statusLabel: payload.sectionLabel || "조건부 코드 줄 중단점",
        lines: [
          { no: 10, code: "for (let i = 0; i < 12; i += 1) {" },
          { no: 11, code: "  const x = i * 2;", annotation: "i=6 → x=12", active: true, paused: true, breakpoint: true },
          { no: 12, code: "}" },
        ],
        debuggerBlocks: [
          renderPanelBlock("조건", '<div class="console-preview">x &gt; 10 &amp;&amp; i === 6</div>'),
          renderPanelBlock("현재 값", renderMetaList([{ label: "i: 6" }, { label: "x: 12", active: true }])),
        ],
      }),
    );
  }

  function scenarioBreakpointsLogpoint(payload) {
    setLabNote("실행을 멈추지 않고 값만 기록하는 Logpoint 상태입니다.", "'sum:', sum");
    setScene(
      renderWorkbench({
        title: "코드 줄 중단점 로깅",
        subtitle: "멈춤 없이 콘솔에 값만 남겨 흐름을 추적합니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "코드 줄 중단점 로깅",
        debuggerBlocks: [
          renderPanelBlock("Logpoint", '<div class="console-preview">Line 31 → <strong>sum: "51"</strong></div>'),
          renderPanelBlock("의도", renderMetaList([{ label: "실행은 계속 유지" }, { label: "로그만 기록", active: true }])),
        ],
      }),
    );
  }

  function scenarioBreakpointsDom(payload) {
    setLabNote("특정 DOM 노드 또는 하위 노드 변경 시점을 잡는 DOM 변경 중단점입니다.", "Subtree modifications");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="pause-banner">Mutation target: <strong id="mutation-target">이 문장은 3초 후 바뀝니다.</strong></div>
        </section>
        ${renderWorkbench({
          title: "DOM 변경 중단점",
          subtitle: "노드 변경 시점에 스크립트가 멈추는 상태입니다.",
          fileLabel: "dom-updater.js",
          statusLabel: payload.sectionLabel || "DOM 변경 중단점",
          debuggerBlocks: [
            renderPanelBlock("DOM 중단점", renderList(["Subtree modifications", "Attribute modifications", "Node removal"], "Subtree modifications")),
            renderPanelBlock("대상", renderMetaList([{ label: "#mutation-target", active: true }])),
          ],
        })}
      </section>
    `);
    const target = document.getElementById("mutation-target");
    const timer = window.setTimeout(() => {
      if (target) {
        target.textContent = "변경 감지됨: DOM breakpoint로 잡힌 상태";
      }
    }, 3000);
    registerScenarioCleanup(() => window.clearTimeout(timer));
  }

  function scenarioBreakpointsXhr(payload) {
    setLabNote("URL 패턴이 일치할 때 요청 직전에 멈추는 XHR/Fetch 중단점입니다.", "/api/quotes");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls">
            <button type="button" id="mock-fetch" class="scene-button is-dark">/api/quotes 호출</button>
          </div>
          <div id="fetch-status" class="pause-banner">패턴이 /api/quotes 인 요청을 기다리는 중입니다.</div>
        </section>
        ${renderWorkbench({
          title: "XHR/가져오기 중단점",
          subtitle: "지정한 URL 부분 문자열과 일치하는 요청에서 멈춥니다.",
          fileLabel: "network.js",
          statusLabel: payload.sectionLabel || "XHR/가져오기 중단점",
          debuggerBlocks: [renderPanelBlock("XHR/Fetch", renderList(["/api/quotes"], "/api/quotes"))],
        })}
      </section>
    `);
    const button = document.getElementById("mock-fetch");
    const status = document.getElementById("fetch-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "Paused on XHR/fetch breakpoint → /api/quotes";
        status.classList.add("is-paused");
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioBreakpointsEventListeners(payload) {
    setLabNote("이벤트 카테고리에서 click, keydown 같은 항목을 체크해 해당 리스너 실행 시점에 멈춥니다.", "Mouse → click");
    scenarioJavaScriptEventBreakpoint(payload);
  }

  function scenarioBreakpointsExceptions(payload) {
    setLabNote("caught/uncaught 예외를 각각 멈출지 선택하는 예외 중단점 상태입니다.", "Pause on uncaught exceptions");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="toggle-row">
            <label class="toggle-chip"><input type="checkbox" checked /> Uncaught</label>
            <label class="toggle-chip"><input type="checkbox" /> Caught</label>
          </div>
          <div class="console-preview" style="margin-top:12px;">TypeError: Cannot read properties of undefined (reading 'value')</div>
        </section>
        ${renderWorkbench({
          title: "예외 중단점",
          subtitle: "포착되지 않은 예외에서 먼저 멈추고, 필요하면 caught 예외까지 넓힙니다.",
          fileLabel: "exception.js",
          statusLabel: payload.sectionLabel || "예외 중단점",
          debuggerBlocks: [renderPanelBlock("예외 상태", renderMetaList([{ label: "Uncaught enabled", active: true }, { label: "Caught disabled" }]))],
        })}
      </section>
    `);
  }

  function scenarioBreakpointsFunction(payload) {
    setLabNote("특정 함수가 호출될 때마다 멈추도록 함수 이름을 지정하는 상태입니다.", "updateLabel");
    setScene(
      renderWorkbench({
        title: "함수 중단점",
        subtitle: "대상 함수가 호출되기 전에 멈추도록 등록합니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "함수 중단점",
        debuggerBlocks: [
          renderPanelBlock("함수 중단점", renderMetaList([{ label: "updateLabel", active: true }])),
          renderPanelBlock("호출 스택", renderList(["updateLabel", "onClick"], "updateLabel")),
        ],
      }),
    );
  }

  function scenarioBreakpointsTrustedType() {
    setLabNote("Trusted Types 위반을 포착하는 전용 중단점입니다. 보안 관련 삽입 지점을 추적할 때 사용합니다.", "Trusted Types");
    setScene(`
      <section class="source-stack">
        <section class="lab-card scene-grid">
          <article class="scene-tile"><h3 class="scene-tile__title">적용 시점</h3><p class="scene-tile__copy">신뢰할 수 없는 HTML 또는 스크립트 삽입이 발생할 때 멈춥니다.</p></article>
          <article class="scene-tile"><h3 class="scene-tile__title">활용 목적</h3><p class="scene-tile__copy">DOM XSS 대응 흐름에서 어느 코드가 위반을 만들었는지 빠르게 찾습니다.</p></article>
        </section>
      </section>
    `);
  }

  function scenarioWorkspacesOverview(payload) {
    setLabNote("Workspaces는 브라우저에서 수정한 파일을 실제 로컬 파일 시스템에 다시 저장하는 연결 계층입니다.", "Connected folder");
    setScene(
      renderWorkbench({
        title: "Workspaces Overview",
        subtitle: "로컬 폴더 연결, 메타데이터, 저장, 연결 해제를 한 흐름으로 다룹니다.",
        fileLabel: "devtools.json",
        statusLabel: payload.sectionLabel || "개요",
        lines: [{ no: 1, code: '{"workspace": "devtools-lab", "root": "/Users/hoya/Projects/DevTools-Lab"}', active: true }],
        metaPills: [{ label: "Connected", accent: true }],
        debuggerBlocks: [
          renderPanelBlock("현재 폴더", renderMetaList([{ label: "/Users/hoya/Projects/DevTools-Lab", active: true }])),
          renderPanelBlock("저장 흐름", renderList(["Connect folder", "Edit in DevTools", "Save to file system"], "Save to file system")),
        ],
      }),
    );
  }

  function scenarioWorkspacesMetadata(payload) {
    setLabNote("워크스페이스 메타데이터 파일을 생성해 연결 루트를 선언하는 단계입니다.", "com.chrome.devtools.json");
    scenarioWorkspacesOverview(payload);
  }

  function scenarioWorkspacesConnect(payload) {
    setLabNote("폴더 연결 버튼을 누르면 로컬 프로젝트 폴더가 Sources에 매핑됩니다.", "Connect folder");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls">
            <button type="button" id="connect-folder" class="scene-button is-dark">폴더 연결</button>
          </div>
          <div id="connect-status" class="pause-banner">아직 폴더가 연결되지 않았습니다.</div>
        </section>
        ${renderWorkbench({
          title: "워크스페이스 폴더 연결",
          subtitle: "로컬 폴더를 선택하면 Pages와 파일 시스템이 매핑됩니다.",
          fileLabel: "devtools-lab",
          statusLabel: payload.sectionLabel || "워크스페이스 폴더 연결",
          debuggerBlocks: [renderPanelBlock("매핑 상태", renderMetaList([{ label: "Not connected", active: true }]))],
        })}
      </section>
    `);
    const button = document.getElementById("connect-folder");
    const status = document.getElementById("connect-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "연결됨 → /Users/hoya/Projects/DevTools-Lab";
        status.classList.add("is-paused");
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioWorkspacesSave(payload) {
    setLabNote("DevTools에서 CSS/HTML/JavaScript를 수정한 뒤 Command/Ctrl + S로 소스 폴더에 다시 저장하는 단계입니다.", "Command/Ctrl + S");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls">
            <button type="button" id="save-to-folder" class="scene-button is-dark">저장</button>
          </div>
          <div id="save-status" class="pause-banner">styles.css 변경사항이 아직 브라우저 메모리에만 있습니다.</div>
        </section>
        ${renderWorkbench({
          title: "소스 폴더에 변경사항 다시 저장",
          subtitle: "브라우저 수정사항을 실제 프로젝트 파일로 반영합니다.",
          fileLabel: "styles.css",
          statusLabel: payload.sectionLabel || "소스 폴더에 변경사항 다시 저장",
          lines: [
            { no: 8, code: ".result-label {" },
            { no: 9, code: "  color: #1d4ed8;", active: true },
            { no: 10, code: "}" },
          ],
          metaPills: [{ label: "dirty" }, { label: "save pending", accent: true }],
          debuggerBlocks: [renderPanelBlock("저장 대상", renderMetaList([{ label: "styles.css", active: true }, { label: "index.html" }, { label: "get-started.js" }]))],
        })}
      </section>
    `);
    const button = document.getElementById("save-to-folder");
    const status = document.getElementById("save-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "저장 완료 → 로컬 파일 시스템에 반영되었습니다.";
        status.classList.add("is-paused");
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioWorkspacesDisconnect() {
    setLabNote("연결된 폴더를 해제해 Pages와 로컬 파일 매핑을 제거합니다.", "Remove folder connection");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls"><button type="button" id="disconnect-folder" class="scene-button">연결 삭제</button></div>
          <div id="disconnect-status" class="pause-banner">/Users/hoya/Projects/DevTools-Lab 이 연결되어 있습니다.</div>
        </section>
      </section>
    `);
    const button = document.getElementById("disconnect-folder");
    const status = document.getElementById("disconnect-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "연결이 삭제되었습니다. 더 이상 로컬 저장이 동기화되지 않습니다.";
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioWorkspacesManual() {
    setLabNote("자동 연결이 어려운 경우 경로와 매핑 규칙을 수동으로 지정하는 흐름입니다.", "Manual connection");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <table class="meta-table">
            <tr><th>네트워크 파일</th><td>/assets/app.js</td></tr>
            <tr><th>로컬 파일</th><td>/Users/hoya/Projects/DevTools-Lab/public/assets/app.js</td></tr>
            <tr><th>매핑 상태</th><td>수동 연결</td></tr>
          </table>
        </section>
      </section>
    `);
  }

  function scenarioSnippetsOpen(payload) {
    setLabNote("Sources 안의 Snippets 컬렉션을 여는 초기 상태입니다.", "Open Snippets");
    setScene(
      renderWorkbench({
        title: "스니펫 창 열기",
        subtitle: "왼쪽 파일 트리에서 Snippets를 선택합니다.",
        fileLabel: "snippets",
        statusLabel: payload.sectionLabel || "스니펫 창 열기",
        treeItems: sourceTree.map((item) => (item.label === "snippets" ? { ...item, active: true } : item)),
        lines: [{ no: 1, code: "// 저장된 스니펫이 아직 없습니다.", active: true }],
        debuggerBlocks: [renderPanelBlock("컬렉션", renderMetaList([{ label: "Snippets", active: true }]))],
      }),
    );
  }

  function scenarioSnippetsCreate(payload) {
    setLabNote("새 스니펫을 만들고 이름을 붙이는 흐름을 반영했습니다.", "New snippet");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls">
            <button type="button" id="new-snippet" class="scene-button is-dark">새 스니펫</button>
          </div>
          <div id="snippet-create-status" class="pause-banner">snippet-1.js 를 만들 준비가 되었습니다.</div>
        </section>
        ${renderWorkbench({
          title: "스니펫 만들기",
          subtitle: "Sources 패널 또는 Command Menu에서 새 스니펫을 만들 수 있습니다.",
          fileLabel: "snippet-1.js",
          statusLabel: payload.sectionLabel || "스니펫 만들기",
          treeItems: sourceTree.map((item) => (item.label === "snippets" ? { ...item, active: true } : item)),
          lines: [{ no: 1, code: "console.log('snippet ready');" }],
          debuggerBlocks: [renderPanelBlock("생성 경로", renderList(["Sources 패널", "Command Menu"], "Sources 패널"))],
        })}
      </section>
    `);
    const button = document.getElementById("new-snippet");
    const status = document.getElementById("snippet-create-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "새 스니펫이 생성되었습니다: snippet-1.js";
        status.classList.add("is-paused");
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioSnippetsEdit(payload) {
    setLabNote("스니펫 편집기에서 코드를 바꾸고 저장해 재사용하는 상태입니다.", "console.log('snippet ready')");
    setScene(
      renderWorkbench({
        title: "스니펫 수정",
        subtitle: "스크립트처럼 편집하고 저장할 수 있습니다.",
        fileLabel: "highlight-heading.js",
        statusLabel: payload.sectionLabel || "스니펫 수정",
        treeItems: sourceTree.map((item) => (item.label === "snippets" ? { ...item, active: true } : item)),
        lines: [
          { no: 1, code: "const heading = document.querySelector('h1');" },
          { no: 2, code: "heading.style.outline = '2px solid #2563eb';", active: true },
        ],
        debuggerBlocks: [renderPanelBlock("편집 상태", renderMetaList([{ label: "dirty", active: true }, { label: "저장 가능" }]))],
      }),
    );
  }

  function scenarioSnippetsRun(payload) {
    setLabNote("선택한 스니펫을 Sources 또는 Command Menu에서 실행하는 흐름입니다.", "Run snippet");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls">
            <button type="button" id="run-snippet" class="scene-button is-dark">스니펫 실행</button>
          </div>
          <div id="run-snippet-status" class="pause-banner">실행 전입니다.</div>
        </section>
        ${renderWorkbench({
          title: "스니펫 실행",
          subtitle: "highlight-heading.js를 실행해 현재 페이지 요소를 조작합니다.",
          fileLabel: "highlight-heading.js",
          statusLabel: payload.sectionLabel || "스니펫 실행",
          treeItems: sourceTree.map((item) => (item.label === "snippets" ? { ...item, active: true } : item)),
          lines: [
            { no: 1, code: "const heading = document.querySelector('h1');" },
            { no: 2, code: "heading.style.outline = '2px solid #2563eb';" },
          ],
          debuggerBlocks: [renderPanelBlock("실행 경로", renderList(["Sources 패널", "Command Menu"], "Sources 패널"))],
        })}
      </section>
    `);
    const button = document.getElementById("run-snippet");
    const status = document.getElementById("run-snippet-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "실행 완료 → heading.outline 이 적용되었습니다.";
        status.classList.add("is-paused");
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioSnippetsRename() {
    setLabNote("스니펫 이름을 바꿔 목적이 드러나도록 정리하는 단계입니다.", "highlight-heading.js");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <label class="demo-field"><span class="demo-label">새 이름</span><input id="snippet-name" class="scene-input" value="highlight-heading.js" /></label>
          <div class="demo-controls"><button type="button" id="rename-snippet" class="scene-button is-dark">이름 바꾸기</button></div>
          <div id="rename-snippet-status" class="pause-banner">현재 이름: highlight-heading.js</div>
        </section>
      </section>
    `);
    const button = document.getElementById("rename-snippet");
    const input = document.getElementById("snippet-name");
    const status = document.getElementById("rename-snippet-status");
    if (button instanceof HTMLButtonElement && input instanceof HTMLInputElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = `이름 변경됨: ${input.value}`;
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioSnippetsDelete() {
    setLabNote("불필요한 스니펫을 컬렉션에서 삭제해 정리하는 상태입니다.", "Delete snippet");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls"><button type="button" id="delete-snippet" class="scene-button">삭제</button></div>
          <div id="delete-snippet-status" class="pause-banner">highlight-heading.js 가 Snippets에 있습니다.</div>
        </section>
      </section>
    `);
    const button = document.getElementById("delete-snippet");
    const status = document.getElementById("delete-snippet-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "highlight-heading.js 가 삭제되었습니다.";
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioReferenceBreakpoints(payload) {
    setLabNote("Debugger 섹션의 Breakpoints 창에서 모든 중단점을 관리하는 참조 상태입니다.", "Breakpoints pane");
    scenarioOverviewDebug(payload);
  }

  function scenarioReferenceInlineEval(payload) {
    setLabNote("일시중지된 줄 옆 인라인 평가값으로 addend1, addend2, sum 을 바로 읽는 상태입니다.", "sum // \"51\"");
    setScene(
      renderWorkbench({
        title: "일시중지 시 값 확인",
        subtitle: "코드 줄 옆에 인라인으로 값이 붙어 더 빠르게 읽을 수 있습니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "일시중지 시 값 확인",
        lines: baseDebugLines.map((line) => ({
          ...line,
          paused: line.no >= 29 && line.no <= 31,
          active: line.no === 31,
        })),
        debuggerBlocks: [renderPanelBlock("인라인 평가", renderMetaList([{ label: 'addend1 → "5"' }, { label: 'addend2 → "1"' }, { label: 'sum → "51"', active: true }]))],
      }),
    );
  }

  function scenarioReferenceHoverPreview() {
    setLabNote("코드 위로 마우스를 올리면 클래스와 함수 속성을 빠르게 미리볼 수 있습니다.", "Hover preview");
    setScene(`
      <section class="source-stack">
        <section class="lab-card scene-grid">
          <article class="scene-tile"><h3 class="scene-tile__title">클래스 인스턴스</h3><p class="scene-copy">hover 시 name, version 같은 속성이 툴팁으로 열립니다.</p></article>
          <article class="scene-tile"><h3 class="scene-tile__title">함수 미리보기</h3><p class="scene-copy">함수 선언 위 hover 로 시그니처와 일부 속성을 바로 봅니다.</p></article>
        </section>
      </section>
    `);
  }

  function scenarioReferenceStepping(payload) {
    setLabNote("step over, step into, step out, continue to here, resume, thread context 전환을 묶어 참조합니다.", "Step over / into / out / resume");
    scenarioJavaScriptStepping(payload);
  }

  function scenarioReferenceScope(payload) {
    setLabNote("로컬, 클로저, 전역 속성을 Scope 탭에서 보고 필요한 경우 값을 수정합니다.", "Scope");
    scenarioJavaScriptScope(payload);
  }

  function scenarioReferenceCallStack(payload) {
    setLabNote("현재 호출 스택, restart frame, ignore-listed frames, async frames, copy stack trace까지 한 묶음으로 봅니다.", "Call Stack");
    setScene(
      renderWorkbench({
        title: "현재 호출 스택 보기",
        subtitle: "현재 프레임, 상위 프레임, async 프레임을 순서대로 읽습니다.",
        fileLabel: "get-started.js",
        statusLabel: payload.sectionLabel || "현재 호출 스택 보기",
        lines: baseDebugLines.map((line) => ({ ...line, paused: line.no === 31, active: line.no === 31 })),
        debuggerBlocks: [
          renderPanelBlock("Call Stack", renderList(["updateLabel", "onClick", "dispatchEvent", "async task"], "updateLabel")),
          renderPanelBlock("보조 작업", renderList(["Restart frame", "Show ignore-listed frames", "Copy stack trace"], "Restart frame")),
        ],
      }),
    );
  }

  function scenarioReferenceFileTree(payload) {
    setLabNote("파일 트리에서 authored/deployed 그룹화, ignore-listed 숨기기 같은 정리 기능을 쓰는 상태입니다.", "File tree");
    setScene(
      renderWorkbench({
        title: "파일 트리 탐색",
        subtitle: "작성 파일과 배포 파일을 그룹화하고 무시 목록 소스를 정리합니다.",
        fileLabel: "app.bundle.js",
        statusLabel: payload.sectionLabel || "파일 트리 탐색",
        treeItems: [
          { label: "top" },
          { label: "Authored", indent: 1, active: true },
          { label: "src/app.ts", indent: 2 },
          { label: "Deployed", indent: 1 },
          { label: "dist/app.bundle.js", indent: 2 },
          { label: "vendor", indent: 1 },
        ],
        debuggerBlocks: [renderPanelBlock("정리 옵션", renderList(["Group authored and deployed", "Hide ignore-listed sources"], "Group authored and deployed"))],
      }),
    );
  }

  function scenarioReferenceIgnoreList(payload) {
    setLabNote("라이브러리나 번들 파일을 Ignore List에 넣어 스텝핑과 호출 스택에서 제외하는 상태입니다.", "Ignore list");
    setScene(
      renderWorkbench({
        title: "스크립트 또는 스크립트 패턴 무시",
        subtitle: "vendor, framework bundle 등을 디버깅 대상에서 제외합니다.",
        fileLabel: "ignore-list.json",
        statusLabel: payload.sectionLabel || "스크립트 또는 스크립트 패턴 무시",
        lines: [
          { no: 1, code: "vendor/**/*.js" },
          { no: 2, code: "**/framework.bundle.js", active: true },
        ],
        debuggerBlocks: [renderPanelBlock("Ignore List", renderMetaList([{ label: "vendor/**/*.js" }, { label: "**/framework.bundle.js", active: true }]))],
      }),
    );
  }

  function scenarioReferenceSnippets(payload) {
    setLabNote("모든 페이지에서 재사용할 디버그 코드 조각을 Snippets에 저장하고 실행합니다.", "Debug snippet");
    scenarioSnippetsRun(payload);
  }

  function scenarioReferenceWatch(payload) {
    setLabNote("맞춤 JavaScript 표현식을 Watch 창에 넣어 값 변화를 계속 추적합니다.", "typeof sum");
    scenarioJavaScriptWatch(payload);
  }

  function scenarioReferenceEditor(payload) {
    setLabNote("포맷, 접기, 검색/치환, live edit 등 편집기 중심 기능을 묶어 참조합니다.", "Pretty print / Live edit");
    setScene(
      renderWorkbench({
        title: "스크립트 검사 및 수정",
        subtitle: "축소 파일 포맷, 코드 접기, 텍스트 검색, live edit를 한 편집기에서 처리합니다.",
        fileLabel: "app.min.js",
        statusLabel: payload.sectionLabel || "스크립트 검사 및 수정",
        lines: [
          { no: 1, code: "function app(){const items=[1,2,3];return items.map(x=>x*2)}" },
          { no: 2, code: "// Pretty print 후 코드 블록 접기 가능", active: true },
        ],
        debuggerBlocks: [renderPanelBlock("편집기 기능", renderList(["Format", "Fold code blocks", "Search", "Live edit"], "Format"))],
      }),
    );
  }

  function scenarioReferenceDisable() {
    setLabNote("JavaScript 실행 자체를 끄고 화면 변화가 어떻게 달라지는지 확인하는 상태입니다.", "Disable JavaScript");
    setScene(`
      <section class="source-stack">
        <section class="lab-card scene-grid">
          <article class="scene-tile"><h3 class="scene-tile__title">비활성화 상태</h3><p class="scene-tile__copy">스크립트가 실행되지 않아 이벤트, 데이터 로드, 렌더 후처리가 멈춥니다.</p></article>
          <article class="scene-tile"><h3 class="scene-tile__title">검증 목적</h3><p class="scene-tile__copy">JS 없는 기본 렌더링과 progressive enhancement 흐름을 확인할 수 있습니다.</p></article>
        </section>
      </section>
    `);
  }

  function scenarioOverridesOverview() {
    setLabNote("로컬 재정의는 네트워크 응답 대신 로컬 파일을 제공해 UI, API, 헤더를 빠르게 모의하는 흐름입니다.", "Local Overrides");
    setScene(`
      <section class="source-stack">
        <section class="lab-card scene-grid">
          <article class="scene-tile"><h3 class="scene-tile__title">웹 콘텐츠 재정의</h3><p class="scene-tile__copy">HTML, CSS, JS 파일을 로컬 사본으로 교체합니다.</p></article>
          <article class="scene-tile"><h3 class="scene-tile__title">XHR/Fetch 모의</h3><p class="scene-tile__copy">응답 JSON을 로컬 파일로 바꿔 API를 모의합니다.</p></article>
          <article class="scene-tile"><h3 class="scene-tile__title">응답 헤더 재정의</h3><p class="scene-tile__copy">CSP, cache-control 같은 헤더를 로컬에서 덮어씁니다.</p></article>
        </section>
      </section>
    `);
  }

  function scenarioOverridesSetup() {
    setLabNote("Overrides 전용 폴더를 선택해 로컬 재정의를 켜는 초기 설정 단계입니다.", "Select overrides folder");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <div class="demo-controls"><button type="button" id="setup-overrides" class="scene-button is-dark">Overrides 폴더 선택</button></div>
          <div id="overrides-setup-status" class="pause-banner">아직 로컬 재정의 폴더가 설정되지 않았습니다.</div>
        </section>
      </section>
    `);
    const button = document.getElementById("setup-overrides");
    const status = document.getElementById("overrides-setup-status");
    if (button instanceof HTMLButtonElement && status instanceof HTMLElement) {
      const handler = () => {
        status.textContent = "설정 완료 → /Users/hoya/Projects/DevTools-Lab/.overrides";
        status.classList.add("is-paused");
      };
      button.addEventListener("click", handler);
      registerScenarioCleanup(() => button.removeEventListener("click", handler));
    }
  }

  function scenarioOverridesContent(payload) {
    setLabNote("네트워크 리소스 대신 로컬 파일 사본을 제공해 웹 콘텐츠를 덮어씁니다.", "Override content");
    setScene(
      renderWorkbench({
        title: "웹 콘텐츠 재정의",
        subtitle: "원격 파일 대신 로컬 사본이 제공되는 상태입니다.",
        fileLabel: "overrides/styles.css",
        statusLabel: payload.sectionLabel || "웹 콘텐츠 재정의",
        lines: [
          { no: 1, code: ".hero-title {" },
          { no: 2, code: "  color: #ef4444;", active: true },
          { no: 3, code: "}" },
        ],
        metaPills: [{ label: "Local override", accent: true }],
        debuggerBlocks: [renderPanelBlock("상태", renderMetaList([{ label: "원격 응답 대신 로컬 파일 사용", active: true }]))],
      }),
    );
  }

  function scenarioOverridesXhr() {
    setLabNote("XHR 또는 fetch 응답을 로컬 JSON으로 바꿔 원격 리소스를 모의하는 공식 흐름입니다.", "/api/products → products.mock.json");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <table class="meta-table">
            <tr><th>요청 URL</th><td>/api/products</td></tr>
            <tr><th>재정의 파일</th><td>products.mock.json</td></tr>
            <tr><th>결과</th><td>원격 API 대신 로컬 응답 제공</td></tr>
          </table>
        </section>
      </section>
    `);
  }

  function scenarioOverridesTrack() {
    setLabNote("Overrides 폴더 안에서 바뀐 파일을 추적해 현재 어떤 변경이 유지되고 있는지 확인합니다.", "Track changes");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          ${renderPanelBlock("로컬 변경사항", renderMetaList([{ label: "styles.css", active: true }, { label: "products.mock.json" }, { label: "headers.json" }]))}
        </section>
      </section>
    `);
  }

  function scenarioOverridesHeaders() {
    setLabNote("HTTP 응답 헤더를 로컬 JSON으로 덮어써 CSP, cache-control, CORS 관련 실험을 수행합니다.", "headers.json");
    setScene(`
      <section class="source-stack">
        <section class="lab-card">
          <table class="meta-table">
            <tr><th>Header</th><td>cache-control: no-store</td></tr>
            <tr><th>Header</th><td>content-security-policy: default-src 'self'</td></tr>
            <tr><th>Header</th><td>access-control-allow-origin: *</td></tr>
          </table>
        </section>
      </section>
    `);
  }

  const scenarioHandlers = {
    "overview:overview": scenarioOverviewOverview,
    "overview:open-panel": scenarioOverviewOpenPanel,
    "overview:files": scenarioOverviewFiles,
    "overview:edit": scenarioOverviewEdit,
    "overview:snippets": scenarioOverviewSnippets,
    "overview:debug": scenarioOverviewDebug,
    "overview:workspace": scenarioOverviewWorkspace,
    "javascript:reproduce": scenarioJavaScriptReproduce,
    "javascript:ui": scenarioJavaScriptUi,
    "javascript:event-breakpoint": scenarioJavaScriptEventBreakpoint,
    "javascript:stepping": scenarioJavaScriptStepping,
    "javascript:line-breakpoint": scenarioJavaScriptLineBreakpoint,
    "javascript:check-values": scenarioJavaScriptCheckValues,
    "javascript:scope": scenarioJavaScriptScope,
    "javascript:watch": scenarioJavaScriptWatch,
    "javascript:console": scenarioJavaScriptConsole,
    "javascript:apply-fix": scenarioJavaScriptApplyFix,
    "breakpoints:overview": scenarioBreakpointsOverview,
    "breakpoints:line": scenarioBreakpointsLine,
    "breakpoints:debugger-statement": scenarioBreakpointsDebuggerStatement,
    "breakpoints:conditional": scenarioBreakpointsConditional,
    "breakpoints:logpoint": scenarioBreakpointsLogpoint,
    "breakpoints:dom": scenarioBreakpointsDom,
    "breakpoints:xhr": scenarioBreakpointsXhr,
    "breakpoints:event-listeners": scenarioBreakpointsEventListeners,
    "breakpoints:exceptions": scenarioBreakpointsExceptions,
    "breakpoints:function": scenarioBreakpointsFunction,
    "breakpoints:trusted-type": scenarioBreakpointsTrustedType,
    "workspaces:overview": scenarioWorkspacesOverview,
    "workspaces:metadata": scenarioWorkspacesMetadata,
    "workspaces:connect": scenarioWorkspacesConnect,
    "workspaces:save": scenarioWorkspacesSave,
    "workspaces:disconnect": scenarioWorkspacesDisconnect,
    "workspaces:manual": scenarioWorkspacesManual,
    "snippets:open": scenarioSnippetsOpen,
    "snippets:create": scenarioSnippetsCreate,
    "snippets:edit": scenarioSnippetsEdit,
    "snippets:run": scenarioSnippetsRun,
    "snippets:rename": scenarioSnippetsRename,
    "snippets:delete": scenarioSnippetsDelete,
    "reference:breakpoints": scenarioReferenceBreakpoints,
    "reference:inline-eval": scenarioReferenceInlineEval,
    "reference:hover-preview": scenarioReferenceHoverPreview,
    "reference:stepping": scenarioReferenceStepping,
    "reference:scope": scenarioReferenceScope,
    "reference:call-stack": scenarioReferenceCallStack,
    "reference:file-tree": scenarioReferenceFileTree,
    "reference:ignore-list": scenarioReferenceIgnoreList,
    "reference:snippets": scenarioReferenceSnippets,
    "reference:watch": scenarioReferenceWatch,
    "reference:editor": scenarioReferenceEditor,
    "reference:disable": scenarioReferenceDisable,
    "overrides:overview": scenarioOverridesOverview,
    "overrides:setup": scenarioOverridesSetup,
    "overrides:content": scenarioOverridesContent,
    "overrides:xhr": scenarioOverridesXhr,
    "overrides:track": scenarioOverridesTrack,
    "overrides:headers": scenarioOverridesHeaders,
  };

  function applyGenericTopicScenario(payload = {}) {
    const title =
      (typeof payload.sectionLabel === "string" && payload.sectionLabel.trim()) ||
      topicLabels[payload.topicId] ||
      "문서";

    setLabNote(`${title} 섹션에 맞는 Sources 작업 공간을 준비했습니다.`, title);
    setScene(
      renderWorkbench({
        title,
        subtitle: "관련 파일, 편집기, 디버거 구성이 오른쪽에 준비되어 있습니다.",
        fileLabel: "get-started.js",
        statusLabel: title,
        debuggerBlocks: [renderPanelBlock("현재 섹션", renderMetaList([{ label: title, active: true }]))],
      }),
    );
    return true;
  }

  function applySourcesScenario(rawScenarioId, payload = {}) {
    resetLabScene();

    if (typeof rawScenarioId !== "string" || rawScenarioId.length === 0) {
      return false;
    }

    const handler = scenarioHandlers[rawScenarioId];
    let applied = false;

    if (typeof handler === "function") {
      handler(payload);
      applied = true;
    } else {
      applied = applyGenericTopicScenario(payload);
    }

    if (!applied) {
      return false;
    }

    queueScenarioTransition();
    notifyParent("lab:sources-scenario-applied", { scenarioId: rawScenarioId });
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
        panel.style.height = "42vh";
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

    if (type === "lab:apply-sources-scenario") {
      const applied = applySourcesScenario(payload.scenarioId, payload);

      if (!isDevtoolsOpen) {
        openPreviewDevtools();
      }

      if (!applied) {
        notifyParent("lab:sources-scenario-error", {
          scenarioId: String(payload.scenarioId ?? ""),
        });
      }
    }
  }

  window.addEventListener("message", handleMessage);
  reportState();

  const initialParams = new URLSearchParams(window.location.search);
  const initialScenarioId = initialParams.get("scenario");
  const initialTopicId = initialParams.get("topicId") || "sources-overview";
  const initialSectionId = initialParams.get("sectionId") || "overview";
  const initialSectionLabel = initialParams.get("sectionLabel") || topicLabels[initialTopicId] || "개요";

  if (initialScenarioId) {
    window.setTimeout(() => {
      applySourcesScenario(initialScenarioId, {
        scenarioId: initialScenarioId,
        topicId: initialTopicId,
        sectionId: initialSectionId,
        sectionLabel: initialSectionLabel,
      });
    }, 40);
  } else {
    applyGenericTopicScenario({ topicId: initialTopicId, sectionLabel: initialSectionLabel });
  }
})();

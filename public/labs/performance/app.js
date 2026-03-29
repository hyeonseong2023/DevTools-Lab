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
  const devtoolsEngine = isMobileRuntime() ? "eruda" : "chii";
  const initialLabRootHtml = document.querySelector(LAB_ROOT_SELECTOR)?.innerHTML ?? "";

  const topicLabels = {
    "performance-panel-overview": "개요",
    "performance-overview": "런타임 성능 분석",
    "performance-annotations": "실적 발견사항에 주석을 달고 공유하기",
    "performance-reference": "성능 기능 참조",
    "performance-timeline-reference": "타임라인 이벤트 참조",
    "performance-selector-stats": "스타일 재계산 이벤트 중에 CSS 선택자 성능 분석",
    "performance-nodejs": "성능 패널로 Node.js 성능 프로파일링",
    "performance-extension": "확장성 API를 통한 실적 데이터 맞춤설정",
    "performance-save-trace": "성능 트레이스 저장 및 공유",
    "performance-monitor": "성능 모니터 패널",
  };

  const overviewRows = [
    {
      method: "Main",
      name: "Evaluate Script (bundle.js)",
      domain: "Main thread",
      status: "Long task",
      type: "Scripting",
      size: "N/A",
      time: "92 ms",
      waterfall: { queue: 3, connect: 12, ttfb: 52, download: 25 },
    },
    {
      method: "Main",
      name: "Function Call (event handler)",
      domain: "Main thread",
      status: "Long task",
      type: "Scripting",
      size: "N/A",
      time: "68 ms",
      waterfall: { queue: 2, connect: 8, ttfb: 37, download: 21 },
    },
    {
      method: "Render",
      name: "Recalculate Style",
      domain: "Rendering",
      status: "Normal",
      type: "Rendering",
      size: "N/A",
      time: "24 ms",
      waterfall: { queue: 2, connect: 5, ttfb: 10, download: 7 },
    },
    {
      method: "Render",
      name: "Layout",
      domain: "Rendering",
      status: "Warning",
      type: "Rendering",
      size: "N/A",
      time: "39 ms",
      waterfall: { queue: 3, connect: 6, ttfb: 18, download: 12 },
    },
    {
      method: "GPU",
      name: "Composite Layers",
      domain: "Compositor",
      status: "Normal",
      type: "GPU",
      size: "N/A",
      time: "14 ms",
      waterfall: { queue: 1, connect: 3, ttfb: 6, download: 4 },
    },
  ];

  const statusRows = [
    ...overviewRows.slice(0, 3),
    {
      method: "Main",
      name: "Forced Reflow (layout thrash)",
      domain: "Main thread",
      status: "Bottleneck",
      type: "Rendering",
      size: "N/A",
      time: "121 ms",
      waterfall: { queue: 4, connect: 14, ttfb: 71, download: 32 },
    },
    {
      method: "Main",
      name: "Long Animation Frame",
      domain: "Main thread",
      status: "Dropped frame",
      type: "Frames",
      size: "N/A",
      time: "83 ms",
      waterfall: { queue: 3, connect: 8, ttfb: 48, download: 24 },
    },
    {
      method: "Net",
      name: "XHR /api/recommendations",
      domain: "Network track",
      status: "Late response",
      type: "Network",
      size: "4.1 kB",
      time: "77 ms",
      waterfall: { queue: 2, connect: 9, ttfb: 42, download: 18 },
    },
  ];

  const throttledRows = overviewRows.map((row) => ({
    ...row,
    time: `${Math.max(130, Number.parseInt(row.time, 10) * 2)} ms`,
    waterfall: {
      queue: row.waterfall.queue + 6,
      connect: row.waterfall.connect * 2,
      ttfb: row.waterfall.ttfb * 2,
      download: row.waterfall.download * 2,
    },
  }));

  const cacheRows = [
    {
      method: "Main",
      name: "Evaluate Script (bundle.js)",
      domain: "Main thread",
      status: "Improved",
      type: "Scripting",
      size: "N/A",
      time: "44 ms",
      waterfall: { queue: 2, connect: 7, ttfb: 20, download: 15 },
    },
    {
      method: "Render",
      name: "Layout",
      domain: "Rendering",
      status: "Improved",
      type: "Rendering",
      size: "N/A",
      time: "21 ms",
      waterfall: { queue: 1, connect: 4, ttfb: 9, download: 7 },
    },
    {
      method: "GPU",
      name: "Composite Layers",
      domain: "Compositor",
      status: "Stable",
      type: "GPU",
      size: "N/A",
      time: "9 ms",
      waterfall: { queue: 1, connect: 2, ttfb: 3, download: 3 },
    },
    {
      method: "Net",
      name: "image hero.avif",
      domain: "Network track",
      status: "Compressed",
      type: "Network",
      size: "38.2 kB",
      time: "41 ms",
      waterfall: { queue: 2, connect: 6, ttfb: 17, download: 16 },
    },
  ];

  const referenceRows = [
    {
      method: "Live",
      name: "LCP marker update",
      domain: "Live metrics",
      status: "Visible",
      type: "LCP",
      size: "N/A",
      time: "2510 ms",
      waterfall: { queue: 1, connect: 12, ttfb: 61, download: 26 },
    },
    {
      method: "Main",
      name: "Click handler",
      domain: "Flame chart",
      status: "Initiator",
      type: "Interaction",
      size: "N/A",
      time: "74 ms",
      waterfall: { queue: 2, connect: 9, ttfb: 42, download: 21 },
    },
    {
      method: "Render",
      name: "Layout shift cluster",
      domain: "Tracks",
      status: "CLS",
      type: "Layout Shift",
      size: "N/A",
      time: "46 ms",
      waterfall: { queue: 1, connect: 6, ttfb: 24, download: 15 },
    },
  ];

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

  function resetLabScene() {
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

  function getStatusTone(status) {
    const numeric = Number.parseInt(String(status), 10);

    if (!Number.isFinite(numeric)) {
      return "";
    }

    if (numeric >= 500) {
      return "is-5xx";
    }

    if (numeric >= 400) {
      return "is-4xx";
    }

    if (numeric >= 300) {
      return "is-3xx";
    }

    if (numeric >= 200) {
      return "is-2xx";
    }

    return "";
  }

  function renderChipRow(chips = []) {
    if (!Array.isArray(chips) || chips.length === 0) {
      return "";
    }

    return `
      <div class="chip-row">
        ${chips
          .map(
            (chip) =>
              `<span class="chip${chip.accent ? " is-accent" : ""}">${escapeHtml(chip.label)}</span>`,
          )
          .join("")}
      </div>
    `;
  }

  function renderWaterfall(waterfall = {}) {
    const queue = Number(waterfall.queue || 0);
    const connect = Number(waterfall.connect || 0);
    const ttfb = Number(waterfall.ttfb || 0);
    const download = Number(waterfall.download || 0);
    const total = Math.max(queue + connect + ttfb + download, 1);

    function width(value) {
      return `${Math.max(0.8, (value / total) * 100).toFixed(2)}%`;
    }

    return `
      <div class="waterfall-track" title="Queue ${queue}ms / Connect ${connect}ms / TTFB ${ttfb}ms / Download ${download}ms">
        <span class="waterfall-segment is-queue" style="width:${width(queue)}"></span>
        <span class="waterfall-segment is-connect" style="width:${width(connect)}"></span>
        <span class="waterfall-segment is-ttfb" style="width:${width(ttfb)}"></span>
        <span class="waterfall-segment is-download" style="width:${width(download)}"></span>
      </div>
    `;
  }

  function renderRequestsTable(rows, activeName = "") {
    return `
      <div class="request-table-wrap">
        <table class="request-table" aria-label="Performance entries">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Size</th>
              <th>Time</th>
              <th>Waterfall</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => {
                const statusTone = getStatusTone(row.status);
                const activeClass = row.name === activeName ? " is-active" : "";

                return `
                  <tr class="${activeClass.trim()}">
                    <td>
                      <div class="request-name">
                        <span class="method-badge">${escapeHtml(row.method)}</span>
                        <span>${escapeHtml(row.name)}</span>
                      </div>
                      <div class="request-domain">${escapeHtml(row.domain)}</div>
                    </td>
                    <td><span class="status-badge ${statusTone}">${escapeHtml(row.status)}</span></td>
                    <td>${escapeHtml(row.type)}</td>
                    <td>${escapeHtml(row.size)}</td>
                    <td>${escapeHtml(row.time)}</td>
                    <td>${renderWaterfall(row.waterfall)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDetailTabs(tabs = [], activeTab = "") {
    if (!Array.isArray(tabs) || tabs.length === 0) {
      return "";
    }

    return `
      <div class="detail-tabs">
        ${tabs
          .map((tab) => `<span class="detail-tab${tab === activeTab ? " is-active" : ""}">${escapeHtml(tab)}</span>`)
          .join("")}
      </div>
    `;
  }

  function renderKvList(rows = []) {
    return `
      <dl class="kv-list">
        ${rows
          .map(
            (row) =>
              `<dt>${escapeHtml(row.key)}</dt><dd>${escapeHtml(row.value)}</dd>`,
          )
          .join("")}
      </dl>
    `;
  }

  function renderDetailCard(title, rows) {
    return `
      <section class="detail-card">
        <p class="detail-card__title">${escapeHtml(title)}</p>
        ${renderKvList(rows)}
      </section>
    `;
  }

  function renderTextCard(title, lines) {
    return `
      <section class="detail-card">
        <p class="detail-card__title">${escapeHtml(title)}</p>
        ${lines.map((line) => `<p class="resource-note">${escapeHtml(line)}</p>`).join("")}
      </section>
    `;
  }

  function renderNetworkWorkbench({
    title,
    subtitle,
    chips = [],
    rows = [],
    activeRequest = "",
    tabs = [],
    activeTab = "",
    detailCards = [],
  }) {
    return `
      <section class="lab-card network-shell">
        <header class="network-toolbar">
          <div class="network-toolbar__top">
            <div>
              <p class="network-title">${escapeHtml(title)}</p>
              <p class="network-subtitle">${escapeHtml(subtitle)}</p>
            </div>
            ${renderChipRow(chips)}
          </div>
        </header>

        <div class="network-layout">
          <section class="request-pane">
            ${renderRequestsTable(rows, activeRequest)}
          </section>
          <aside class="details-pane">
            ${renderDetailTabs(tabs, activeTab)}
            <div class="details-grid">
              ${detailCards.join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderResourceWorkbench({
    title,
    subtitle,
    chips = [],
    resources = [],
    notes = [],
    activeResource = "",
  }) {
    return `
      <section class="lab-card network-shell">
        <header class="network-toolbar">
          <div class="network-toolbar__top">
            <div>
              <p class="network-title">${escapeHtml(title)}</p>
              <p class="network-subtitle">${escapeHtml(subtitle)}</p>
            </div>
            ${renderChipRow(chips)}
          </div>
        </header>

        <div class="resource-layout">
          <aside class="resource-tree-pane">
            <p class="scene-heading">Resource Navigator</p>
            <ul class="resource-list">
              ${resources
                .map(
                  (resource) => `
                    <li class="resource-item${resource.label === activeResource ? " is-active" : ""}">
                      <span>${escapeHtml(resource.label)}</span>
                      <span class="resource-badge">${escapeHtml(resource.type)}</span>
                    </li>
                  `,
                )
                .join("")}
            </ul>
          </aside>

          <section class="resource-preview-pane">
            <p class="scene-heading">진단 메모</p>
            ${notes.map((line) => `<p class="resource-note">${escapeHtml(line)}</p>`).join("")}
          </section>
        </div>
      </section>
    `;
  }

  function scenarioPanelOverview(payload) {
    setLabNote(
      "개요 문서의 흐름대로 Performance 패널의 핵심 기능(열기, 실시간 측정, 캡처/분석)을 한 번에 훑는 시작 화면입니다.",
      "Open panel → Live metrics → Capture report → Improve",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Panel Overview",
        subtitle: payload.sectionLabel || "개요",
        chips: [{ label: "Overview", accent: true }, { label: "Core Web Vitals" }, { label: "Capture report" }],
        rows: overviewRows,
        activeRequest: "Evaluate Script (bundle.js)",
        tabs: ["Overview", "Live Metrics", "Capture", "Improve"],
        activeTab: "Overview",
        detailCards: [
          renderDetailCard("핵심 흐름", [
            { key: "1", value: "성능 패널 열기" },
            { key: "2", value: "실시간 측정으로 상태 확인" },
            { key: "3", value: "보고서 캡처 후 분석" },
          ]),
          renderTextCard("목적", [
            "문제 감지부터 원인 분석까지 이어지는 기본 워크플로를 빠르게 시작합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioPanelOpen(payload) {
    setLabNote(
      "성능 패널 열기 섹션입니다. 기록 버튼과 캡처 옵션을 먼저 확인한 뒤 동일 시나리오를 반복 측정합니다.",
      "Performance 탭 선택 → Record 버튼 준비",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Open the Performance Panel",
        subtitle: payload.sectionLabel || "성능 패널 열기",
        chips: [{ label: "Performance", accent: true }, { label: "Record" }, { label: "Capture settings" }],
        rows: overviewRows,
        activeRequest: "Function Call (event handler)",
        tabs: ["Record", "Capture Settings", "Summary"],
        activeTab: "Record",
        detailCards: [
          renderDetailCard("확인 항목", [
            { key: "Record control", value: "측정 시작/종료" },
            { key: "Capture settings", value: "측정 옵션 조정" },
            { key: "스크롤/입력 재현", value: "문제 구간 포함" },
          ]),
          renderTextCard("팁", [
            "짧고 명확한 재현 구간을 기록하면 분석 속도가 크게 빨라집니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioPanelLiveMetrics(payload) {
    setLabNote(
      "Core Web Vitals 실시간 관찰 섹션입니다. 사용자 조작 중 LCP/CLS/INP 변화를 즉시 확인합니다.",
      "Live Metrics: LCP · CLS · INP",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Live Metrics",
        subtitle: payload.sectionLabel || "Core Web Vitals 실시간 관찰",
        chips: [{ label: "Live Metrics", accent: true }, { label: "Compare" }, { label: "Env config" }],
        rows: referenceRows,
        activeRequest: "LCP marker update",
        tabs: ["Metrics", "Compare", "Environment"],
        activeTab: "Metrics",
        detailCards: [
          renderDetailCard("실시간 값", [
            { key: "LCP", value: "2.51 s" },
            { key: "INP", value: "186 ms" },
            { key: "CLS", value: "0.08" },
          ]),
          renderTextCard("활용", [
            "내 환경 측정값과 실제 사용자 경험 간 차이를 확인해 우선순위를 정합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioPanelCapture(payload) {
    setLabNote(
      "성능 보고서 캡처 및 분석 섹션입니다. 기록, 캡처 설정, 보고서 분석 단계를 순서대로 연결합니다.",
      "Record profile → Change capture settings → Analyze report",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Capture and Analyze",
        subtitle: payload.sectionLabel || "성능 보고서 캡처 및 분석",
        chips: [{ label: "Capture", accent: true }, { label: "Record profile" }, { label: "Analyze report" }],
        rows: statusRows,
        activeRequest: "Forced Reflow (layout thrash)",
        tabs: ["Capture", "Record", "Analyze"],
        activeTab: "Analyze",
        detailCards: [
          renderDetailCard("단계", [
            { key: "성능 프로필 기록", value: "재현 구간 수집" },
            { key: "캡처 설정 변경", value: "환경/옵션 조정" },
            { key: "실적 보고서 분석", value: "병목 원인 확정" },
          ]),
          renderTextCard("핵심", [
            "같은 시나리오를 같은 조건에서 반복 기록해야 전후 비교가 유효합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioPanelImprove(payload) {
    setLabNote(
      "이 패널로 실적 개선 섹션입니다. 측정 결과를 개선 작업으로 연결하고 재측정으로 검증합니다.",
      "Measure → Fix → Re-measure",
    );
    setScene(
      renderResourceWorkbench({
        title: "Improve with These Panels",
        subtitle: payload.sectionLabel || "이 패널로 실적 개선",
        chips: [{ label: "Improve", accent: true }],
        resources: [
          { label: "병목 구간 식별", type: "analyze" },
          { label: "코드/렌더링 최적화", type: "fix" },
          { label: "동일 조건 재측정", type: "verify" },
          { label: "회귀 감시", type: "monitoring" },
        ],
        activeResource: "동일 조건 재측정",
        notes: [
          "측정-개선-검증 루프를 고정하면 성능 개선이 일회성 작업이 아니라 운영 가능한 프로세스가 됩니다.",
        ],
      }),
    );
  }

  function scenarioOverviewGetStarted(payload) {
    setLabNote(
      "공식 Overview 흐름대로 Performance 패널에서 기록을 시작하고, Main thread와 Frames 트랙을 먼저 확인합니다.",
      "Performance 패널 열기 → Record → 동작 재현 → Stop",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Overview",
        subtitle: payload.sectionLabel || "시작하기",
        chips: [{ label: "Performance", accent: true }, { label: "Record" }, { label: "Main thread" }],
        rows: overviewRows,
        activeRequest: "Evaluate Script (bundle.js)",
        tabs: ["Summary", "Bottom-up", "Call Tree", "Event Log"],
        activeTab: "Summary",
        detailCards: [
          renderDetailCard("기본 순서", [
            { key: "1", value: "패널 열기 및 새 기록 시작" },
            { key: "2", value: "성능 저하 동작 재현" },
            { key: "3", value: "기록 중지 후 병목 탐색" },
          ]),
          renderTextCard("분석 포인트", [
            "긴 작업(Long task)과 프레임 드롭 구간을 먼저 찾으면 이후 원인 추적이 빨라집니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewCpu(payload) {
    setLabNote(
      "공식 가이드의 모바일 CPU 시뮬레이션 단계처럼 CPU 제한을 켜고 동일 동작을 다시 기록해 차이를 비교합니다.",
      "CPU Throttling: 4x slowdown",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Simulate Mobile CPU",
        subtitle: payload.sectionLabel || "모바일 CPU 시뮬레이션",
        chips: [{ label: "CPU x4", accent: true }, { label: "Record" }],
        rows: throttledRows,
        activeRequest: "Evaluate Script (bundle.js)",
        tabs: ["Summary", "Bottom-up", "Frames"],
        activeTab: "Frames",
        detailCards: [
          renderDetailCard("비교 지표", [
            { key: "Baseline long task", value: "92 ms" },
            { key: "CPU x4 long task", value: "184 ms" },
            { key: "영향", value: "입력 지연 증가" },
          ]),
          renderTextCard("해석", [
            "실기기에서 체감되는 지연을 재현하려면 CPU 제한 상태에서 같은 사용자 흐름을 반복 측정해야 합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewSetup(payload) {
    setLabNote(
      "데모 설정 단계에서는 측정 시나리오를 고정하고, 확장 프로그램/백그라운드 노이즈를 최소화해 비교 가능성을 확보합니다.",
      "같은 URL · 같은 동작 · 같은 조건으로 반복 기록",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Set Up the Demo",
        subtitle: payload.sectionLabel || "데모 설정",
        chips: [{ label: "Incognito" }, { label: "Extensions OFF", accent: true }, { label: "Consistent Flow" }],
        rows: overviewRows,
        activeRequest: "Function Call (event handler)",
        tabs: ["Checklist", "Summary"],
        activeTab: "Checklist",
        detailCards: [
          renderDetailCard("환경 체크", [
            { key: "브라우저 상태", value: "측정 전 새로 시작" },
            { key: "조건 통일", value: "동일 CPU/네트워크 설정" },
            { key: "반복 횟수", value: "최소 3회" },
          ]),
          renderTextCard("목적", [
            "설정 편차를 줄여야 최적화 전후 차이를 신뢰할 수 있습니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewRecord(payload) {
    setLabNote(
      "공식 문서의 기록 단계처럼 문제 구간만 짧게 재현하면 분석 신호가 선명해지고 잡음이 줄어듭니다.",
      "Record 시작 → 사용자 동작 재현 → Stop",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Record Runtime Performance",
        subtitle: payload.sectionLabel || "런타임 성능 기록",
        chips: [{ label: "Record", accent: true }, { label: "Screenshots" }, { label: "Web Vitals" }],
        rows: overviewRows,
        activeRequest: "Layout",
        tabs: ["Summary", "Event Log", "Timings"],
        activeTab: "Event Log",
        detailCards: [
          renderDetailCard("기록 옵션", [
            { key: "Screenshots", value: "시각적 순간 포착" },
            { key: "Web Vitals", value: "LCP/CLS 참고" },
            { key: "Sampling", value: "기본값 유지" },
          ]),
          renderTextCard("팁", [
            "재현 시점의 사용자 입력 이벤트를 포함하면 INP/입력 지연 분석에 유리합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewAnalyze(payload) {
    setLabNote(
      "분석 단계에서는 Summary로 큰 병목을 확인하고, Bottom-up/Call Tree로 시간이 큰 함수부터 좁혀갑니다.",
      "Summary → Bottom-up → Call Tree",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Analyze the Recording",
        subtitle: payload.sectionLabel || "결과를 분석합니다",
        chips: [{ label: "Analyze", accent: true }, { label: "Bottom-up" }, { label: "Call Tree" }],
        rows: statusRows,
        activeRequest: "Forced Reflow (layout thrash)",
        tabs: ["Summary", "Bottom-up", "Call Tree", "Insights"],
        activeTab: "Bottom-up",
        detailCards: [
          renderDetailCard("우선순위", [
            { key: "Top self time", value: "Forced Reflow" },
            { key: "Top total time", value: "Evaluate Script" },
            { key: "영향", value: "Frame budget 초과" },
          ]),
          renderTextCard("판단 기준", [
            "메인 스레드 점유 시간이 큰 항목부터 처리하면 체감 성능 개선 효과가 큽니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewFps(payload) {
    setLabNote(
      "FPS 분석은 프레임 예산(16.7ms) 초과 구간을 찾는 과정입니다. 드롭 프레임과 긴 작업 구간을 함께 봅니다.",
      "Frames track + Main thread long task",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Analyze FPS",
        subtitle: payload.sectionLabel || "초당 프레임 수 분석",
        chips: [{ label: "FPS", accent: true }, { label: "Frames track" }],
        rows: statusRows,
        activeRequest: "Long Animation Frame",
        tabs: ["Frames", "Summary", "Timings"],
        activeTab: "Frames",
        detailCards: [
          renderDetailCard("프레임 점검", [
            { key: "Target", value: "60 FPS" },
            { key: "문제 구간", value: "30~42 FPS" },
            { key: "원인 후보", value: "Long task / Layout 비용" },
          ]),
          renderTextCard("실무 적용", [
            "애니메이션/스크롤 구간에서 프레임이 무너지는 지점을 먼저 확정한 뒤 원인을 추적합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewBottleneck(payload) {
    setLabNote(
      "병목 찾기 단계에서는 긴 스크립트 실행, 강제 리플로우, 레이아웃 시프트를 축으로 원인을 분리합니다.",
      "Long Task · Forced Reflow · Layout Shift",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Find the Bottleneck",
        subtitle: payload.sectionLabel || "병목 현상 찾기",
        chips: [{ label: "Bottleneck", accent: true }, { label: "Main thread" }],
        rows: statusRows,
        activeRequest: "Forced Reflow (layout thrash)",
        tabs: ["Bottom-up", "Call Tree", "Insights"],
        activeTab: "Insights",
        detailCards: [
          renderDetailCard("병목 후보", [
            { key: "스크립트", value: "Evaluate Script 92 ms" },
            { key: "레이아웃", value: "Forced Reflow 121 ms" },
            { key: "상호작용", value: "Input handler 68 ms" },
          ]),
          renderTextCard("조치 방향", [
            "DOM 읽기/쓰기 순서 정리, 불필요한 동기 레이아웃 제거, 긴 핸들러 분할을 우선 검토합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewOptimized(payload) {
    setLabNote(
      "보너스 단계는 최적화 버전과 원본 버전을 같은 조건으로 재측정해 개선량을 확인하는 절차입니다.",
      "동일 시나리오 재측정 → 전/후 비교",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Analyze Optimized Version",
        subtitle: payload.sectionLabel || "최적화된 버전 분석",
        chips: [{ label: "Before / After", accent: true }, { label: "Same setup" }],
        rows: cacheRows,
        activeRequest: "Evaluate Script (bundle.js)",
        tabs: ["Summary", "Comparison"],
        activeTab: "Comparison",
        detailCards: [
          renderDetailCard("개선 결과", [
            { key: "Evaluate Script", value: "92ms → 44ms" },
            { key: "Layout", value: "39ms → 21ms" },
            { key: "Frame 안정성", value: "개선" },
          ]),
          renderTextCard("검증", [
            "측정 환경이 다르면 수치가 왜곡될 수 있으므로 동일 환경 재측정을 고정합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewNext(payload) {
    setLabNote(
      "다음 단계에서는 반복 측정 루틴을 고정하고, 문제를 성격별로 분류해 개선 우선순위를 운영합니다.",
      "측정 자동화 + 회귀 감시 + 핵심 지표 추적",
    );
    setScene(
      renderResourceWorkbench({
        title: "Next Steps",
        subtitle: payload.sectionLabel || "다음 단계",
        chips: [{ label: "Action Plan", accent: true }],
        resources: [
          { label: "핵심 사용자 흐름 3개 고정", type: "plan" },
          { label: "주간 성능 회귀 체크", type: "process" },
          { label: "Long task 예산 운영", type: "budget" },
          { label: "프레임 드롭 구간 모니터링", type: "monitoring" },
        ],
        activeResource: "핵심 사용자 흐름 3개 고정",
        notes: [
          "문제 재현 시나리오를 팀 공통 기준으로 만들면 디버깅과 리뷰 비용이 줄어듭니다.",
          "배포 전후 비교 기록을 남겨 회귀를 빠르게 탐지합니다.",
        ],
      }),
    );
  }

  function scenarioReferenceMetrics(payload) {
    setLabNote(
      "실시간 측정항목 화면에서는 사용자 동작 중 LCP/CLS/INP 변화를 바로 확인해 문제 구간을 빠르게 포착합니다.",
      "Live Metrics: LCP · CLS · INP",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Reference: Live Metrics",
        subtitle: payload.sectionLabel || "실시간 측정항목 화면",
        chips: [{ label: "Live Metrics", accent: true }, { label: "Web Vitals" }],
        rows: referenceRows,
        activeRequest: "LCP marker update",
        tabs: ["Metrics", "Timeline", "Summary"],
        activeTab: "Metrics",
        detailCards: [
          renderDetailCard("실시간 지표", [
            { key: "LCP", value: "2.51 s" },
            { key: "INP", value: "186 ms" },
            { key: "CLS", value: "0.08" },
          ]),
          renderTextCard("활용", [
            "사용자 조작 직후 지표가 급변하는 지점을 찾으면 개선 대상을 빠르게 좁힐 수 있습니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceRecord(payload) {
    setLabNote(
      "기능 참조의 Record 섹션처럼 기록 옵션을 상황별로 조정해 런타임/로드 성능을 분리 분석합니다.",
      "Runtime record / Load record / Screenshots / Throttling",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Reference: Record",
        subtitle: payload.sectionLabel || "실적 기록",
        chips: [{ label: "Record", accent: true }, { label: "Screenshots" }, { label: "CPU/Network throttle" }],
        rows: throttledRows,
        activeRequest: "Function Call (event handler)",
        tabs: ["Record Settings", "Summary"],
        activeTab: "Record Settings",
        detailCards: [
          renderDetailCard("기록 옵션", [
            { key: "Runtime vs Load", value: "문제 성격에 맞게 선택" },
            { key: "Disable JS Samples", value: "필요 시 사용" },
            { key: "Show custom tracks", value: "필요 시 추가" },
          ]),
          renderTextCard("목적", [
            "문제 재현에 필요한 최소 옵션만 켜면 기록 해석이 단순해집니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceAnalyze(payload) {
    setLabNote(
      "Analyze 섹션은 주석, 검색, 탐색 기능을 조합해 기록 파일에서 원인을 단계적으로 좁히는 흐름입니다.",
      "Annotate · Insights · Navigate · Search",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Reference: Analyze",
        subtitle: payload.sectionLabel || "성능 녹화 분석",
        chips: [{ label: "Analyze", accent: true }, { label: "Insights" }, { label: "Search" }],
        rows: statusRows,
        activeRequest: "Forced Reflow (layout thrash)",
        tabs: ["Insights", "Search", "Annotations"],
        activeTab: "Insights",
        detailCards: [
          renderDetailCard("분석 순서", [
            { key: "1", value: "긴 작업 구간 찾기" },
            { key: "2", value: "Call Tree로 원인 함수 찾기" },
            { key: "3", value: "주석/공유로 협업" },
          ]),
          renderTextCard("공유", [
            "주석을 남긴 기록 파일은 코드 리뷰나 성능 회고에서 재현 문서 역할을 합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceFlame(payload) {
    setLabNote(
      "Flame Chart 읽기, 시작자 추적, 불필요한 스크립트 무시는 함수 단위 병목 추적의 핵심 단계입니다.",
      "Flame Chart → Event Initiator → Ignore noise",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Reference: Flame Chart",
        subtitle: payload.sectionLabel || "Flame 차트 읽기",
        chips: [{ label: "Flame Chart", accent: true }, { label: "Initiator" }, { label: "Ignore list" }],
        rows: statusRows,
        activeRequest: "Long Animation Frame",
        tabs: ["Flame Chart", "Initiator", "Call Tree"],
        activeTab: "Flame Chart",
        detailCards: [
          renderDetailCard("Flame 분석", [
            { key: "최상단 긴 블록", value: "주요 병목 후보" },
            { key: "시작자 체인", value: "실행 트리거 추적" },
            { key: "3rd-party 구분", value: "내 코드/외부 코드 분리" },
          ]),
          renderTextCard("실무 팁", [
            "관련 없는 외부 스크립트를 숨기면 핵심 비즈니스 로직 병목이 더 뚜렷해집니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceTracks(payload) {
    setLabNote(
      "트랙 보기 섹션에서는 성능 마커, 상호작용, 네트워크, 메모리, 레이어 트랙을 교차 확인합니다.",
      "Markers · Interactions · Network · Memory · Layers",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Reference: Tracks",
        subtitle: payload.sectionLabel || "트랙 분석",
        chips: [{ label: "Tracks", accent: true }, { label: "Markers" }, { label: "Memory" }],
        rows: referenceRows,
        activeRequest: "Layout shift cluster",
        tabs: ["Tracks", "Timings", "Layers"],
        activeTab: "Tracks",
        detailCards: [
          renderDetailCard("트랙 체크포인트", [
            { key: "Interactions", value: "입력 지연 지점" },
            { key: "Layout Shifts", value: "시각 안정성 저하 지점" },
            { key: "Memory", value: "증가/회수 패턴" },
          ]),
          renderTextCard("판단", [
            "단일 트랙만 보면 놓치는 경우가 많아, 문제 순간을 여러 트랙에서 동시에 확인하는 방식이 안정적입니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceRendering(payload) {
    setLabNote(
      "Rendering 탭의 FPS meter, paint flashing, layer borders를 사용해 렌더링 비용을 실시간으로 점검합니다.",
      "Rendering 탭: FPS meter / Paint flashing / Layer borders",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Performance Reference: Rendering",
        subtitle: payload.sectionLabel || "렌더링 탭으로 렌더링 성능 분석",
        chips: [{ label: "Rendering", accent: true }, { label: "FPS meter" }, { label: "Paint flashing" }],
        rows: statusRows,
        activeRequest: "Forced Reflow (layout thrash)",
        tabs: ["Rendering", "FPS", "Layers"],
        activeTab: "Rendering",
        detailCards: [
          renderDetailCard("실시간 확인", [
            { key: "FPS Meter", value: "프레임 유지 여부" },
            { key: "Paint Flashing", value: "과도 페인트 구간" },
            { key: "Layer Borders", value: "레이어 분할 상태" },
          ]),
          renderTextCard("적용", [
            "스크롤/애니메이션 문제는 Rendering 도구로 즉시 재현 후 원인 후보를 줄이는 접근이 효과적입니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOptimizationOverview(payload) {
    setLabNote(
      "Lighthouse 개요는 성능 개선 우선순위를 리포트 형태로 빠르게 정리하는 시작점입니다.",
      "Lighthouse 실행 → 카테고리 점수 확인 → 기회 항목 점검",
    );
    setScene(
      renderResourceWorkbench({
        title: "Lighthouse Overview",
        subtitle: payload.sectionLabel || "개요",
        chips: [{ label: "Lighthouse", accent: true }, { label: "Performance" }],
        resources: [
          { label: "Performance 점수", type: "score" },
          { label: "Core Web Vitals", type: "vitals" },
          { label: "Opportunities", type: "opportunity" },
          { label: "Diagnostics", type: "diagnostic" },
        ],
        activeResource: "Performance 점수",
        notes: [
          "점수 자체보다 어떤 진단 항목이 시간을 소모하는지 확인하는 것이 중요합니다.",
          "변경 전후 동일 조건 측정으로 개선 여부를 판단합니다.",
        ],
      }),
    );
  }

  function scenarioOptimizationCompare(payload) {
    setLabNote(
      "Lighthouse와 Performance 패널은 용도가 다릅니다. Lighthouse는 감지, Performance는 원인 추적에 강합니다.",
      "Lighthouse: Audit / Performance panel: Trace",
    );
    setScene(
      renderResourceWorkbench({
        title: "Lighthouse vs Performance Panel",
        subtitle: payload.sectionLabel || "Lighthouse와 성능 패널 비교",
        chips: [{ label: "Compare", accent: true }],
        resources: [
          { label: "Lighthouse: 문제 탐지/우선순위", type: "audit" },
          { label: "Performance: 함수·트랙 단위 원인 분석", type: "trace" },
          { label: "권장 흐름: Lighthouse → Performance", type: "workflow" },
        ],
        activeResource: "권장 흐름: Lighthouse → Performance",
        notes: [
          "Lighthouse에서 후보를 찾고 Performance 패널에서 정확한 병목 코드를 확정합니다.",
        ],
      }),
    );
  }

  function scenarioOptimizationTooling(payload) {
    setLabNote(
      "DevTools Lighthouse와 다른 Lighthouse 도구(PageSpeed Insights, CLI 등)의 차이를 이해하고 상황별로 선택합니다.",
      "DevTools / PSI / CLI 결과를 같은 빌드 기준으로 비교",
    );
    setScene(
      renderResourceWorkbench({
        title: "Lighthouse Tooling",
        subtitle: payload.sectionLabel || "DevTools의 Lighthouse와 기타 Lighthouse 도구 비교",
        chips: [{ label: "Tooling", accent: true }],
        resources: [
          { label: "DevTools: 로컬 디버깅", type: "local" },
          { label: "PageSpeed Insights: 실제 필드 데이터 참고", type: "field" },
          { label: "Lighthouse CLI: CI 자동화", type: "automation" },
        ],
        activeResource: "Lighthouse CLI: CI 자동화",
        notes: [
          "같은 URL/빌드/조건으로 측정해야 도구 간 결과를 공정하게 해석할 수 있습니다.",
        ],
      }),
    );
  }

  function scenarioOptimizationSettings(payload) {
    setLabNote(
      "설정 섹션에서는 기기/카테고리/고급 옵션을 고정해 측정 기준을 팀 공통으로 맞춥니다.",
      "Device · Category · Advanced settings",
    );
    setScene(
      renderResourceWorkbench({
        title: "Lighthouse Settings",
        subtitle: payload.sectionLabel || "설정",
        chips: [{ label: "Settings", accent: true }, { label: "Mobile" }, { label: "Performance category" }],
        resources: [
          { label: "더 쉬워진 모드 설정", type: "mode" },
          { label: "기기 및 카테고리 선택", type: "device/category" },
          { label: "고급 설정", type: "advanced" },
          { label: "측정 환경 영향 요소", type: "stability" },
        ],
        activeResource: "기기 및 카테고리 선택",
        notes: [
          "측정 환경이 달라지면 점수가 크게 흔들릴 수 있으므로 설정을 고정하고 반복 측정합니다.",
        ],
      }),
    );
  }

  function scenarioOptimizationPostRun(payload) {
    setLabNote(
      "실행 후 옵션에서는 리포트 공유, 재실행 비교, 개선 항목 추적을 통해 실제 수정 작업으로 연결합니다.",
      "Report 공유 · 재실행 비교 · 개선 백로그 업데이트",
    );
    setScene(
      renderResourceWorkbench({
        title: "Lighthouse Post-run Options",
        subtitle: payload.sectionLabel || "실행 후 옵션",
        chips: [{ label: "Post-run", accent: true }],
        resources: [
          { label: "리포트 저장/공유", type: "share" },
          { label: "재실행 후 비교", type: "compare" },
          { label: "개선 항목 추적", type: "tracking" },
        ],
        activeResource: "재실행 후 비교",
        notes: [
          "한 번의 점수보다 반복 실행 추세가 개선 확인에 더 유효합니다.",
        ],
      }),
    );
  }

  function scenarioOptimizationConclusion(payload) {
    setLabNote(
      "결론 단계에서는 측정-수정-검증 루프를 고정해 성능 개선을 반복 가능한 작업으로 운영합니다.",
      "문제 탐지 → 원인 분석 → 수정 → 재측정",
    );
    setScene(
      renderResourceWorkbench({
        title: "Optimization Conclusion",
        subtitle: payload.sectionLabel || "결론",
        chips: [{ label: "Conclusion", accent: true }],
        resources: [
          { label: "Lighthouse로 개선 후보 수집", type: "step-1" },
          { label: "Performance 패널로 병목 원인 확정", type: "step-2" },
          { label: "코드 수정 후 동일 조건 재측정", type: "step-3" },
        ],
        activeResource: "코드 수정 후 동일 조건 재측정",
        notes: [
          "같은 시나리오를 반복 가능한 체크리스트로 만들면 회귀 대응 속도가 빨라집니다.",
        ],
      }),
    );
  }

  const scenarioHandlers = {
    "panel:overview": scenarioPanelOverview,
    "panel:open": scenarioPanelOpen,
    "panel:live-metrics": scenarioPanelLiveMetrics,
    "panel:compare": scenarioPanelLiveMetrics,
    "panel:env-config": scenarioPanelLiveMetrics,
    "panel:capture": scenarioPanelCapture,
    "panel:record-profile": scenarioPanelCapture,
    "panel:capture-settings": scenarioPanelCapture,
    "panel:analyze-report": scenarioPanelCapture,
    "panel:improve": scenarioPanelImprove,
    "overview:get-started": scenarioOverviewGetStarted,
    "overview:cpu": scenarioOverviewCpu,
    "overview:setup": scenarioOverviewSetup,
    "overview:record": scenarioOverviewRecord,
    "overview:analyze": scenarioOverviewAnalyze,
    "overview:fps": scenarioOverviewFps,
    "overview:bottleneck": scenarioOverviewBottleneck,
    "overview:optimized": scenarioOverviewOptimized,
    "overview:next": scenarioOverviewNext,
    "reference:metrics": scenarioReferenceMetrics,
    "reference:record": scenarioReferenceRecord,
    "reference:analyze": scenarioReferenceAnalyze,
    "reference:flame": scenarioReferenceFlame,
    "reference:tracks": scenarioReferenceTracks,
    "reference:rendering": scenarioReferenceRendering,
    "optimization:overview": scenarioOptimizationOverview,
    "optimization:compare": scenarioOptimizationCompare,
    "optimization:tooling": scenarioOptimizationTooling,
    "optimization:settings": scenarioOptimizationSettings,
    "optimization:postrun": scenarioOptimizationPostRun,
    "optimization:conclusion": scenarioOptimizationConclusion,
  };

  function applyGenericTopicScenario(payload = {}) {
    if (payload.topicId === "performance-panel-overview") {
      scenarioPanelOverview(payload);
      return true;
    }

    if (payload.topicId === "performance-monitor") {
      scenarioPanelLiveMetrics(payload);
      return true;
    }

    if (payload.topicId === "performance-annotations") {
      scenarioReferenceAnalyze(payload);
      return true;
    }

    if (payload.topicId === "performance-reference") {
      scenarioReferenceMetrics(payload);
      return true;
    }

    if (
      payload.topicId === "performance-timeline-reference" ||
      payload.topicId === "performance-selector-stats"
    ) {
      scenarioReferenceTracks(payload);
      return true;
    }

    if (
      payload.topicId === "performance-nodejs" ||
      payload.topicId === "performance-extension" ||
      payload.topicId === "performance-save-trace"
    ) {
      scenarioOverviewRecord(payload);
      return true;
    }

    scenarioOverviewGetStarted(payload);
    return true;
  }

  function applyPerformanceScenario(rawScenarioId, payload = {}) {
    resetLabScene();

    if (typeof rawScenarioId !== "string" || rawScenarioId.length === 0) {
      return applyGenericTopicScenario(payload);
    }

    const handler = scenarioHandlers[rawScenarioId];

    if (typeof handler === "function") {
      handler(payload);
      queueScenarioTransition();
      notifyParent("lab:performance-scenario-applied", { scenarioId: rawScenarioId });
      return true;
    }

    const applied = applyGenericTopicScenario(payload);
    if (applied) {
      queueScenarioTransition();
    }
    return applied;
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

    if (type === "lab:query-preview-devtools-state") {
      reportState();
      return;
    }

    if (type === "lab:apply-performance-scenario") {
      const applied = applyPerformanceScenario(payload.scenarioId, payload);

      if (!isDevtoolsOpen) {
        openPreviewDevtools();
      }

      if (!applied) {
        notifyParent("lab:performance-scenario-error", {
          scenarioId: String(payload.scenarioId ?? ""),
        });
      }
    }
  }

  window.addEventListener("message", handleMessage);
  reportState();

  const initialParams = new URLSearchParams(window.location.search);
  const initialScenarioId = initialParams.get("scenario");
  const initialTopicId = initialParams.get("topicId") || "performance-overview";
  const initialSectionId = initialParams.get("sectionId") || "overview";
  const initialSectionLabel = initialParams.get("sectionLabel") || topicLabels[initialTopicId] || "개요";

  if (initialScenarioId) {
    window.setTimeout(() => {
      applyPerformanceScenario(initialScenarioId, {
        scenarioId: initialScenarioId,
        topicId: initialTopicId,
        sectionId: initialSectionId,
        sectionLabel: initialSectionLabel,
      });
    }, 40);
  } else {
    applyGenericTopicScenario({
      topicId: initialTopicId,
      sectionId: initialSectionId,
      sectionLabel: initialSectionLabel,
    });
  }
})();

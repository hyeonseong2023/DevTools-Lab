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
    "network-overview": "개요",
    "network-reference": "네트워크 기능 참조",
    "network-resources": "페이지 리소스 보기",
  };

  const overviewRows = [
    {
      method: "GET",
      name: "index.html",
      domain: "devtools-lab.local",
      status: "200",
      type: "document",
      size: "15.2 kB",
      time: "42 ms",
      waterfall: { queue: 2, connect: 6, ttfb: 18, download: 16 },
    },
    {
      method: "GET",
      name: "styles.css",
      domain: "devtools-lab.local",
      status: "200",
      type: "stylesheet",
      size: "18.7 kB",
      time: "36 ms",
      waterfall: { queue: 2, connect: 4, ttfb: 14, download: 16 },
    },
    {
      method: "GET",
      name: "app.js",
      domain: "devtools-lab.local",
      status: "200",
      type: "script",
      size: "44.1 kB",
      time: "58 ms",
      waterfall: { queue: 3, connect: 5, ttfb: 19, download: 31 },
    },
    {
      method: "GET",
      name: "api/profile?view=summary",
      domain: "api.devtools-lab.local",
      status: "200",
      type: "fetch",
      size: "3.1 kB",
      time: "128 ms",
      waterfall: { queue: 4, connect: 12, ttfb: 72, download: 40 },
    },
    {
      method: "GET",
      name: "hero.webp",
      domain: "cdn.devtools-lab.local",
      status: "200",
      type: "image",
      size: "92.5 kB",
      time: "90 ms",
      waterfall: { queue: 5, connect: 8, ttfb: 25, download: 52 },
    },
  ];

  const statusRows = [
    ...overviewRows.slice(0, 3),
    {
      method: "GET",
      name: "api/feature-flags",
      domain: "api.devtools-lab.local",
      status: "304",
      type: "fetch",
      size: "0 B",
      time: "18 ms",
      waterfall: { queue: 2, connect: 3, ttfb: 8, download: 5 },
    },
    {
      method: "GET",
      name: "api/recommendations",
      domain: "api.devtools-lab.local",
      status: "404",
      type: "fetch",
      size: "1.2 kB",
      time: "64 ms",
      waterfall: { queue: 4, connect: 8, ttfb: 30, download: 22 },
    },
    {
      method: "GET",
      name: "api/checkout",
      domain: "api.devtools-lab.local",
      status: "500",
      type: "fetch",
      size: "2.3 kB",
      time: "82 ms",
      waterfall: { queue: 5, connect: 8, ttfb: 41, download: 28 },
    },
  ];

  const throttledRows = overviewRows.map((row) => ({
    ...row,
    time: `${Math.max(220, Number.parseInt(row.time, 10) * 5)} ms`,
    waterfall: {
      queue: row.waterfall.queue + 8,
      connect: row.waterfall.connect * 4,
      ttfb: row.waterfall.ttfb * 5,
      download: row.waterfall.download * 4,
    },
  }));

  const cacheRows = [
    {
      method: "GET",
      name: "index.html",
      domain: "devtools-lab.local",
      status: "200",
      type: "document",
      size: "15.2 kB",
      time: "45 ms",
      waterfall: { queue: 3, connect: 6, ttfb: 20, download: 16 },
    },
    {
      method: "GET",
      name: "styles.css",
      domain: "devtools-lab.local",
      status: "200 (memory cache)",
      type: "stylesheet",
      size: "0 B",
      time: "2 ms",
      waterfall: { queue: 1, connect: 0, ttfb: 1, download: 0 },
    },
    {
      method: "GET",
      name: "app.js",
      domain: "devtools-lab.local",
      status: "304",
      type: "script",
      size: "0 B",
      time: "12 ms",
      waterfall: { queue: 2, connect: 2, ttfb: 6, download: 2 },
    },
    {
      method: "GET",
      name: "api/profile?view=summary",
      domain: "api.devtools-lab.local",
      status: "200",
      type: "fetch",
      size: "3.1 kB",
      time: "131 ms",
      waterfall: { queue: 5, connect: 12, ttfb: 73, download: 41 },
    },
  ];

  const referenceRows = [
    {
      method: "OPTIONS",
      name: "api/orders (preflight)",
      domain: "api.devtools-lab.local",
      status: "204",
      type: "preflight",
      size: "0 B",
      time: "22 ms",
      waterfall: { queue: 2, connect: 3, ttfb: 10, download: 7 },
    },
    {
      method: "POST",
      name: "api/orders",
      domain: "api.devtools-lab.local",
      status: "201",
      type: "fetch",
      size: "2.8 kB",
      time: "148 ms",
      waterfall: { queue: 5, connect: 12, ttfb: 84, download: 47 },
    },
    {
      method: "GET",
      name: "api/orders/summary",
      domain: "api.devtools-lab.local",
      status: "200",
      type: "fetch",
      size: "3.4 kB",
      time: "92 ms",
      waterfall: { queue: 4, connect: 9, ttfb: 49, download: 30 },
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
        <table class="request-table" aria-label="Network requests">
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

  function scenarioOverviewRequests(payload) {
    setLabNote(
      "요청 목록과 워터폴 컬럼을 함께 보면서, 어떤 리소스가 전체 로딩 지연을 만들고 있는지 먼저 식별합니다.",
      "Name · Status · Type · Time · Waterfall",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Network Overview",
        subtitle: payload.sectionLabel || "요청 목록 확인",
        chips: [{ label: "All", accent: true }, { label: "Fetch/XHR" }, { label: "JS" }, { label: "CSS" }],
        rows: overviewRows,
        activeRequest: "api/profile?view=summary",
        tabs: ["Headers", "Preview", "Response", "Timing"],
        activeTab: "Timing",
        detailCards: [
          renderDetailCard("요청 타이밍", [
            { key: "Queueing", value: "4 ms" },
            { key: "Initial connection", value: "12 ms" },
            { key: "Waiting (TTFB)", value: "72 ms" },
            { key: "Content Download", value: "40 ms" },
          ]),
          renderTextCard("핵심 포인트", [
            "TTFB 구간이 가장 길면 백엔드 응답 지연 또는 캐시 미적용 여부를 먼저 의심합니다.",
            "같은 도메인 요청을 정렬해 비교하면 병목 API를 더 빠르게 찾을 수 있습니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewOpenPanel(payload) {
    setLabNote(
      "공식 문서의 흐름대로 먼저 Network 패널을 열고, 패널이 비어 있는 상태에서 페이지를 새로고침해 요청 기록을 시작합니다.",
      "DevTools 열기 → Network 탭 선택 → 새로고침",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Open Network Panel",
        subtitle: payload.sectionLabel || "Network 패널 열기",
        chips: [{ label: "Network", accent: true }, { label: "Record log" }],
        rows: overviewRows,
        activeRequest: "index.html",
        tabs: ["Headers", "Preview", "Timing"],
        activeTab: "Headers",
        detailCards: [
          renderTextCard("시작 순서", [
            "1) DevTools를 열고 Network 탭으로 이동합니다.",
            "2) 페이지를 새로고침해 초기 요청 로그를 채웁니다.",
            "3) 첫 문서 요청(index.html)부터 세부 탭을 확인합니다.",
          ]),
          renderDetailCard("초기 확인", [
            { key: "Record", value: "On" },
            { key: "Preserve log", value: "필요 시 활성화" },
            { key: "Disable cache", value: "최초 방문 재현 시 활성화" },
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewFilter(payload) {
    const filtered = overviewRows.filter((row) => row.type === "fetch" || row.type === "script");
    setLabNote(
      "Filter 입력창과 타입 토글을 조합해 요청 범위를 빠르게 줄이면, 노이즈 없이 실패 요청만 추적할 수 있습니다.",
      "domain:api.devtools-lab.local status-code:200",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Request Filtering",
        subtitle: payload.sectionLabel || "리소스 필터링",
        chips: [
          { label: "Filter: domain:api.devtools-lab.local", accent: true },
          { label: "Fetch/XHR", accent: true },
          { label: "3 / 42 requests" },
        ],
        rows: filtered,
        activeRequest: "api/profile?view=summary",
        tabs: ["Headers", "Timing", "Filter Rules"],
        activeTab: "Filter Rules",
        detailCards: [
          renderDetailCard("적용된 필터", [
            { key: "Domain", value: "api.devtools-lab.local" },
            { key: "Type", value: "fetch,xhr" },
            { key: "Status", value: "200-299" },
          ]),
          renderTextCard("필터링 팁", [
            "이슈 조사 시에는 먼저 도메인과 상태 코드로 범위를 줄이고, 이후 Initiator로 원인을 좁히는 순서가 안정적입니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewInspect(payload) {
    setLabNote(
      "요청 행을 선택하고 Headers/Preview/Response/Timing 탭을 순서대로 보면 네트워크 이슈를 빠르게 분류할 수 있습니다.",
      "Headers → Preview/Response → Timing",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Inspect Requests",
        subtitle: payload.sectionLabel || "네트워크 요청 검사",
        chips: [{ label: "All", accent: true }, { label: "Error focus: 4xx,5xx", accent: true }],
        rows: statusRows,
        activeRequest: "api/checkout",
        tabs: ["Headers", "Response", "Timing"],
        activeTab: "Response",
        detailCards: [
          renderDetailCard("검사 포인트", [
            { key: "Status", value: "성공/실패 코드 확인" },
            { key: "Headers", value: "요청/응답 헤더 값 확인" },
            { key: "Preview/Response", value: "응답 본문 확인" },
            { key: "Timing", value: "대기/다운로드 지연 확인" },
          ]),
          renderTextCard("진단 순서", [
            "5xx는 서버 로그와 함께 확인하고, 4xx는 요청 URL/파라미터/권한 헤더를 우선 점검합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewStatus(payload) {
    scenarioOverviewInspect(payload);
  }

  function scenarioOverviewSearch(payload) {
    setLabNote(
      "문서 흐름대로 Search 탭에서 헤더/응답 본문을 검색해, 특정 키워드나 캐시 헤더 존재 여부를 확인합니다.",
      "Search: Cache-Control / content-type / api endpoint",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Search Headers & Responses",
        subtitle: payload.sectionLabel || "네트워크 헤더 및 응답 검색",
        chips: [{ label: "Search", accent: true }, { label: "Query: Cache-Control" }],
        rows: overviewRows,
        activeRequest: "app.js",
        tabs: ["Search", "Headers", "Response"],
        activeTab: "Search",
        detailCards: [
          renderDetailCard("검색 결과 예시", [
            { key: "index.html", value: "cache-control: no-cache" },
            { key: "styles.css", value: "cache-control: public, max-age=31536000" },
            { key: "app.js", value: "content-type: application/javascript" },
          ]),
          renderTextCard("사용 포인트", [
            "캐시 정책 누락 여부, 특정 헤더 노출 여부, 에러 응답 메시지 키워드 검색에 유용합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewWaterfall(payload) {
    const rows = overviewRows.map((row) => ({
      ...row,
      waterfall: {
        queue: row.waterfall.queue + 2,
        connect: row.waterfall.connect + 5,
        ttfb: row.waterfall.ttfb + (row.type === "fetch" ? 40 : 10),
        download: row.waterfall.download + (row.type === "image" ? 30 : 5),
      },
      time: `${Number.parseInt(row.time, 10) + (row.type === "fetch" ? 60 : 24)} ms`,
    }));

    setLabNote(
      "워터폴은 단일 요청보다 요청 간 상대 비교가 중요합니다. 기다림(TTFB)과 다운로드 구간을 분리해 병목 유형을 판단하세요.",
      "Queueing → Connection → Waiting(TTFB) → Download",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Waterfall Comparison",
        subtitle: payload.sectionLabel || "워터폴 비교",
        chips: [{ label: "Waterfall", accent: true }, { label: "Sort by: Total Time" }],
        rows,
        activeRequest: "api/profile?view=summary",
        tabs: ["Timing", "Waterfall Legend"],
        activeTab: "Waterfall Legend",
        detailCards: [
          renderDetailCard("구간 해석", [
            { key: "Queueing", value: "브라우저 요청 대기열 지연" },
            { key: "Connect", value: "DNS/TCP/TLS 연결 시간" },
            { key: "TTFB", value: "서버 첫 바이트 응답 대기" },
            { key: "Download", value: "응답 본문 수신 시간" },
          ]),
          renderTextCard("해석 팁", [
            "TTFB 비중이 크면 API/DB/서버 캐시를, Download 비중이 크면 압축과 리소스 크기를 우선 점검합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewLoading(payload) {
    setLabNote(
      "로드 동작 변경 섹션 기준으로 throttling, disable cache, hard reload를 조합해 재현 조건을 맞춥니다.",
      "Throttling + Disable cache + Hard reload",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Change Loading Behavior",
        subtitle: payload.sectionLabel || "로드 동작 변경",
        chips: [
          { label: "Slow 3G", accent: true },
          { label: "Disable cache", accent: true },
          { label: "Hard reload" },
        ],
        rows: throttledRows,
        activeRequest: "api/profile?view=summary",
        tabs: ["Timing", "Load", "Cache"],
        activeTab: "Load",
        detailCards: [
          renderDetailCard("변경 항목", [
            { key: "Throttling", value: "Slow 3G" },
            { key: "Disable cache", value: "On" },
            { key: "Preserve log", value: "필요 시 On" },
          ]),
          renderTextCard("실무 사용", [
            "최초 방문 성능, 저속 네트워크 체감, 캐시 의존 동작을 각각 분리해 재현할 수 있습니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewThrottle(payload) {
    setLabNote(
      "느린 네트워크를 시뮬레이션하면 실제 사용자 환경에서 가장 먼저 체감되는 병목을 재현할 수 있습니다.",
      "Throttling: Slow 3G / Disable cache",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Throttling Simulation",
        subtitle: payload.sectionLabel || "느린 네트워크 연결 시뮬레이션",
        chips: [
          { label: "Slow 3G", accent: true },
          { label: "Disable cache", accent: true },
          { label: "CPU: no throttle" },
        ],
        rows: throttledRows,
        activeRequest: "api/profile?view=summary",
        tabs: ["Timing", "Load"],
        activeTab: "Load",
        detailCards: [
          renderDetailCard("성능 비교", [
            { key: "Fast profile", value: "128 ms" },
            { key: "Slow 3G profile", value: "640 ms" },
            { key: "증가 배율", value: "5.0x" },
          ]),
          renderTextCard("권장 점검", [
            "TTFB와 다운로드가 동시에 길어지면 API 최적화와 응답 크기 축소를 함께 진행해야 합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewExport(payload) {
    setLabNote(
      "요청 데이터 저장/내보내기 섹션 기준으로 HAR 저장과 요청 복사 기능을 사용해 분석 결과를 공유합니다.",
      "Export HAR (with content) / Copy request headers",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Save & Export Requests",
        subtitle: payload.sectionLabel || "네트워크 요청 데이터 저장 및 내보내기",
        chips: [{ label: "Export", accent: true }, { label: "HAR" }, { label: "Copy" }],
        rows: cacheRows,
        activeRequest: "api/profile?view=summary",
        tabs: ["Export", "Headers", "Timing"],
        activeTab: "Export",
        detailCards: [
          renderDetailCard("내보내기 옵션", [
            { key: "Save all as HAR", value: "요청/응답 타임라인 공유" },
            { key: "Copy request headers", value: "재현 환경 전달" },
            { key: "Copy as cURL", value: "CLI 재현" },
          ]),
          renderTextCard("공유 기준", [
            "문제 재현 시점의 HAR와 핵심 요청 헤더를 함께 전달하면 분석 속도가 크게 빨라집니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioOverviewCache(payload) {
    setLabNote(
      "캐시 실험에서는 Disable cache 옵션의 On/Off를 반복하면서 200, 304, memory cache 요청이 어떻게 달라지는지 비교합니다.",
      "Disable cache OFF → memory cache / 304 확인",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Cache Behavior",
        subtitle: payload.sectionLabel || "캐시 동작 분석",
        chips: [{ label: "Disable cache: OFF", accent: true }, { label: "Hard reload" }],
        rows: cacheRows,
        activeRequest: "styles.css",
        tabs: ["Headers", "Timing", "Cache"],
        activeTab: "Cache",
        detailCards: [
          renderDetailCard("캐시 결과", [
            { key: "Memory cache", value: "styles.css" },
            { key: "Revalidation (304)", value: "app.js" },
            { key: "Network fetch (200)", value: "api/profile" },
          ]),
          renderTextCard("해석 포인트", [
            "정적 자산은 memory cache 또는 304로 내려와야 하고, API 응답은 캐시 정책 의도와 일치하는지 확인해야 합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceHeaders(payload) {
    setLabNote(
      "Headers 탭에서 Request/Response 헤더를 나눠 확인하면 CORS, 인증, 캐시 정책 문제를 빠르게 분류할 수 있습니다.",
      "General · Request Headers · Response Headers",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Network Reference: Headers",
        subtitle: payload.sectionLabel || "헤더 확인",
        chips: [{ label: "POST /api/orders", accent: true }, { label: "Fetch/XHR" }],
        rows: referenceRows,
        activeRequest: "api/orders",
        tabs: ["Headers", "Payload", "Initiator", "Timing"],
        activeTab: "Headers",
        detailCards: [
          renderDetailCard("Request Headers", [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer ***" },
            { key: "x-client-version", value: "web-1.32.0" },
          ]),
          renderDetailCard("Response Headers", [
            { key: "Status", value: "201 Created" },
            { key: "cache-control", value: "no-store" },
            { key: "access-control-allow-origin", value: "https://devtools-lab.local" },
          ]),
        ],
      }),
    );
  }

  function scenarioReferencePayload(payload) {
    setLabNote(
      "Payload 탭은 API 요청 스키마 검증의 기준점입니다. 실제 전송 본문과 서버가 기대하는 필드를 바로 비교합니다.",
      "Payload tab → Request payload / Form data",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Network Reference: Payload",
        subtitle: payload.sectionLabel || "요청 페이로드 확인",
        chips: [{ label: "POST /api/orders", accent: true }, { label: "JSON body" }],
        rows: referenceRows,
        activeRequest: "api/orders",
        tabs: ["Headers", "Payload", "Response"],
        activeTab: "Payload",
        detailCards: [
          renderDetailCard("Request Payload", [
            { key: "userId", value: "u_1024" },
            { key: "items[0].id", value: "lab-pro" },
            { key: "items[0].quantity", value: "1" },
            { key: "currency", value: "KRW" },
          ]),
          renderDetailCard("Response Snapshot", [
            { key: "orderId", value: "ord_245901" },
            { key: "status", value: "created" },
            { key: "total", value: "39000" },
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceInitiator(payload) {
    setLabNote(
      "Initiator와 Stack Trace는 '어떤 코드가 이 요청을 발생시켰는가'를 추적할 때 핵심입니다.",
      "Initiator: checkout.tsx:84 → ordersApi.createOrder",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Network Reference: Initiator",
        subtitle: payload.sectionLabel || "시작자 및 종속 항목",
        chips: [{ label: "Group by frame" }, { label: "Initiator", accent: true }],
        rows: referenceRows,
        activeRequest: "api/orders",
        tabs: ["Headers", "Payload", "Initiator", "Timing"],
        activeTab: "Initiator",
        detailCards: [
          renderDetailCard("Call Chain", [
            { key: "UI Event", value: "CheckoutButton.onClick" },
            { key: "Service", value: "ordersApi.createOrder" },
            { key: "HTTP Client", value: "fetchWithAuth('/api/orders')" },
          ]),
          renderDetailCard("Related Requests", [
            { key: "Preflight", value: "OPTIONS /api/orders" },
            { key: "Main", value: "POST /api/orders" },
            { key: "Follow-up", value: "GET /api/orders/summary" },
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceTiming(payload) {
    setLabNote(
      "Timing 탭은 각 단계별 지연 시간을 수치로 보여줍니다. 네트워크 지연과 서버 지연을 분리해 판단하세요.",
      "Queueing / Stalled / Request sent / Waiting(TTFB) / Content Download",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Network Reference: Timing",
        subtitle: payload.sectionLabel || "타이밍 분석",
        chips: [{ label: "Record", accent: true }, { label: "Preserve log" }],
        rows: referenceRows,
        activeRequest: "api/orders",
        tabs: ["Headers", "Payload", "Initiator", "Timing"],
        activeTab: "Timing",
        detailCards: [
          renderDetailCard("Timing Breakdown", [
            { key: "Queueing", value: "5 ms" },
            { key: "Initial connection", value: "12 ms" },
            { key: "Request sent", value: "3 ms" },
            { key: "Waiting (TTFB)", value: "84 ms" },
            { key: "Content Download", value: "44 ms" },
          ]),
          renderTextCard("해석 포인트", [
            "TTFB가 길면 서버 처리 지연 가능성이 높고, Connect가 길면 네트워크 경로 또는 TLS 핸드셰이크를 점검해야 합니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioReferenceFilter(payload) {
    const filtered = referenceRows.filter((row) => row.type === "fetch" || row.type === "preflight");
    setLabNote(
      "기능 참조 문서의 필터 옵션을 기준으로 요청 집합을 도메인, 상태, 유형별로 좁혀서 분석합니다.",
      "method:POST domain:api.devtools-lab.local has-response-header:cache-control",
    );
    setScene(
      renderNetworkWorkbench({
        title: "Network Reference: Filter",
        subtitle: payload.sectionLabel || "요청 필터링",
        chips: [{ label: "Filter active", accent: true }, { label: "Type: fetch|preflight" }],
        rows: filtered,
        activeRequest: "api/orders",
        tabs: ["Filter Rules", "Headers", "Timing"],
        activeTab: "Filter Rules",
        detailCards: [
          renderDetailCard("필터 세트", [
            { key: "method", value: "POST" },
            { key: "domain", value: "api.devtools-lab.local" },
            { key: "has-response-header", value: "cache-control" },
          ]),
          renderTextCard("적용 이유", [
            "문제가 되는 API 요청만 남겨두면 로그 저장(Preserve log) 상태에서도 노이즈 없이 흐름을 추적할 수 있습니다.",
          ]),
        ],
      }),
    );
  }

  function scenarioResourcesOpen(payload) {
    setLabNote(
      "Network 패널의 요청 행에서 리소스를 열어 Sources/Response 탭과 연결하면, 실제 내려온 파일 기준으로 진단할 수 있습니다.",
      "Network row click → Open in Sources panel",
    );
    setScene(
      renderResourceWorkbench({
        title: "Resources: Open",
        subtitle: payload.sectionLabel || "공개 리소스",
        chips: [{ label: "Open in Sources", accent: true }, { label: "Reveal in Network" }],
        resources: [
          { label: "index.html", type: "document" },
          { label: "app.js", type: "script" },
          { label: "styles.css", type: "stylesheet" },
          { label: "hero.webp", type: "image" },
        ],
        activeResource: "app.js",
        notes: [
          "요청 목록에서 선택한 리소스를 Sources 패널에서 바로 열어 원본 파일과 응답을 함께 비교합니다.",
          "응답 헤더와 파일 내용을 같은 흐름에서 확인하면 캐시/압축/버전 문제를 빠르게 찾을 수 있습니다.",
        ],
      }),
    );
  }

  function scenarioResourcesBrowse(payload) {
    setLabNote(
      "리소스 찾아보기는 네트워크 흐름을 파일 구조와 연결하는 단계입니다. 도메인, 디렉터리, 파일명 기준을 상황별로 바꿔 사용합니다.",
      "Browse by network frame / directory / filename",
    );
    setScene(
      renderResourceWorkbench({
        title: "Resources: Browse",
        subtitle: payload.sectionLabel || "리소스 찾아보기",
        chips: [{ label: "By Directory", accent: true }, { label: "By Filename" }, { label: "By Frame" }],
        resources: [
          { label: "/src/components/home/Hero.tsx", type: "script" },
          { label: "/src/styles/home.css", type: "stylesheet" },
          { label: "/public/images/hero.webp", type: "image" },
          { label: "/api/profile", type: "fetch" },
        ],
        activeResource: "/src/components/home/Hero.tsx",
        notes: [
          "디렉터리 기준 탐색은 빌드 결과물과 소스 매핑을 검증할 때 유용합니다.",
          "파일명 탐색은 동일한 자산이 여러 번 요청되는 중복 로딩 이슈를 추적할 때 효과적입니다.",
        ],
      }),
    );
  }

  function scenarioResourcesType(payload) {
    setLabNote(
      "파일 형식별 분류는 네트워크 비용을 빠르게 파악하는 기본 축입니다. image/script/fetch 비중을 먼저 확인하세요.",
      "Type filter: document · script · stylesheet · image · fetch",
    );
    setScene(
      renderResourceWorkbench({
        title: "Resources: Type",
        subtitle: payload.sectionLabel || "파일 형식별로 둘러보기",
        chips: [{ label: "Type view", accent: true }, { label: "Largest first" }],
        resources: [
          { label: "document (3)", type: "doc" },
          { label: "script (12)", type: "js" },
          { label: "stylesheet (6)", type: "css" },
          { label: "image (18)", type: "img" },
          { label: "fetch/xhr (14)", type: "api" },
        ],
        activeResource: "image (18)",
        notes: [
          "이미지 리소스 수와 용량이 높으면 우선순위는 포맷 최적화(webp/avif), 크기 축소, 지연 로딩입니다.",
          "fetch/xhr 비중이 높으면 API 캐시 정책과 병렬 요청 수를 함께 확인해야 합니다.",
        ],
      }),
    );
  }

  const scenarioHandlers = {
    "overview:requests": scenarioOverviewRequests,
    "overview:open-panel": scenarioOverviewOpenPanel,
    "overview:filter": scenarioOverviewFilter,
    "overview:inspect": scenarioOverviewInspect,
    "overview:search": scenarioOverviewSearch,
    "overview:loading": scenarioOverviewLoading,
    "overview:export": scenarioOverviewExport,
    "overview:status": scenarioOverviewStatus,
    "overview:waterfall": scenarioOverviewWaterfall,
    "overview:throttle": scenarioOverviewThrottle,
    "overview:cache": scenarioOverviewCache,
    "reference:headers": scenarioReferenceHeaders,
    "reference:payload": scenarioReferencePayload,
    "reference:initiator": scenarioReferenceInitiator,
    "reference:timing": scenarioReferenceTiming,
    "reference:filter": scenarioReferenceFilter,
    "resources:open": scenarioResourcesOpen,
    "resources:browse": scenarioResourcesBrowse,
    "resources:type": scenarioResourcesType,
  };

  function applyGenericTopicScenario(payload = {}) {
    if (payload.topicId === "network-reference") {
      scenarioReferenceTiming(payload);
      return true;
    }

    if (payload.topicId === "network-resources") {
      scenarioResourcesOpen(payload);
      return true;
    }

    scenarioOverviewRequests(payload);
    return true;
  }

  function applyNetworkScenario(rawScenarioId, payload = {}) {
    resetLabScene();

    if (typeof rawScenarioId !== "string" || rawScenarioId.length === 0) {
      return applyGenericTopicScenario(payload);
    }

    const handler = scenarioHandlers[rawScenarioId];

    if (typeof handler === "function") {
      handler(payload);
      queueScenarioTransition();
      notifyParent("lab:network-scenario-applied", { scenarioId: rawScenarioId });
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

    if (type === "lab:apply-network-scenario") {
      const applied = applyNetworkScenario(payload.scenarioId, payload);

      if (!isDevtoolsOpen) {
        openPreviewDevtools();
      }

      if (!applied) {
        notifyParent("lab:network-scenario-error", {
          scenarioId: String(payload.scenarioId ?? ""),
        });
      }
    }
  }

  window.addEventListener("message", handleMessage);
  reportState();

  const initialParams = new URLSearchParams(window.location.search);
  const initialScenarioId = initialParams.get("scenario");
  const initialTopicId = initialParams.get("topicId") || "network-overview";
  const initialSectionId = initialParams.get("sectionId") || "overview";
  const initialSectionLabel = initialParams.get("sectionLabel") || topicLabels[initialTopicId] || "개요";

  if (initialScenarioId) {
    window.setTimeout(() => {
      applyNetworkScenario(initialScenarioId, {
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

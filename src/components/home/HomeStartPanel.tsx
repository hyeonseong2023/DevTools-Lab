"use client";

import { useEffect, useState } from "react";

type ReadinessLevel = "확인 중" | "권장" | "주의" | "제한";
type ScriptAccess = "확인 중" | "가능" | "일부 제한" | "불가";

interface EnvironmentState {
  device: string;
  os: string;
  browser: string;
  previewMode: string;
  online: boolean;
  scriptAccess: ScriptAccess;
  readiness: ReadinessLevel;
  notes: string[];
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: {
    mobile?: boolean;
  };
}

const SCRIPT_URLS = [
  "https://chii.liriliri.io/target.js",
  "https://cdn.jsdelivr.net/npm/eruda",
] as const;

function isLabMobileRuntime(nav: NavigatorWithUAData) {
  const uaDataMobile = nav.userAgentData?.mobile;

  if (typeof uaDataMobile === "boolean") {
    return uaDataMobile;
  }

  const ua = nav.userAgent || "";
  const isIPad =
    /iPad/i.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);

  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) || isIPad;
}

function getDeviceLabel(nav: NavigatorWithUAData) {
  const ua = nav.userAgent || "";
  const mobileRuntime = isLabMobileRuntime(nav);
  const isTablet = /iPad|Tablet|SM-T|Tab/i.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);

  if (!mobileRuntime) {
    return "데스크톱";
  }

  return isTablet ? "태블릿" : "모바일";
}

function getOsLabel(nav: NavigatorWithUAData) {
  const ua = nav.userAgent || "";
  const platform = nav.platform || "";

  if (/Windows NT/i.test(ua)) {
    return "Windows";
  }

  if (/Android/i.test(ua)) {
    return "Android";
  }

  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "iOS/iPadOS";
  }

  if (/Mac OS X/i.test(ua) || /Mac/i.test(platform)) {
    return "macOS";
  }

  if (/Linux/i.test(ua) || /Linux/i.test(platform)) {
    return "Linux";
  }

  return "알 수 없음";
}

function getBrowserLabel(nav: NavigatorWithUAData) {
  const ua = nav.userAgent || "";

  if (/Edg\//i.test(ua)) {
    return "Microsoft Edge";
  }

  if (/OPR\//i.test(ua)) {
    return "Opera";
  }

  if (/SamsungBrowser\//i.test(ua)) {
    return "Samsung Internet";
  }

  if (/CriOS\//i.test(ua)) {
    return "Chrome (iOS)";
  }

  if (/Chrome\//i.test(ua)) {
    return "Google Chrome";
  }

  if (/Firefox\//i.test(ua)) {
    return "Mozilla Firefox";
  }

  if (/Safari\//i.test(ua)) {
    return "Safari";
  }

  return "알 수 없음";
}

function isChromiumBrowser(browser: string) {
  return (
    browser === "Google Chrome" ||
    browser === "Microsoft Edge" ||
    browser === "Opera" ||
    browser === "Samsung Internet"
  );
}

function isInAppBrowser(nav: NavigatorWithUAData) {
  const ua = nav.userAgent || "";
  return /KAKAOTALK|FBAN|FBAV|Instagram|Line|NAVER|DaumApps|; wv\)/i.test(ua);
}

async function probeScript(url: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3000);

  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getReadinessClass(readiness: ReadinessLevel) {
  if (readiness === "권장") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (readiness === "주의") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (readiness === "제한") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

const INITIAL_STATE: EnvironmentState = {
  device: "확인 중",
  os: "확인 중",
  browser: "확인 중",
  previewMode: "확인 중",
  online: true,
  scriptAccess: "확인 중",
  readiness: "확인 중",
  notes: ["현재 환경을 확인하고 있습니다."],
};

export function HomeStartPanel() {
  const [envState, setEnvState] = useState<EnvironmentState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    const nav = navigator as NavigatorWithUAData;
    const device = getDeviceLabel(nav);
    const os = getOsLabel(nav);
    const browser = getBrowserLabel(nav);
    const mobileRuntime = isLabMobileRuntime(nav);
    const previewMode = mobileRuntime
      ? "모바일 Preview DevTools (Eruda)"
      : "데스크톱 Preview DevTools (Chii)";
    const online = navigator.onLine;
    const inApp = isInAppBrowser(nav);
    const notes: string[] = [];

    if (!online) {
      notes.push("오프라인 상태에서는 Preview DevTools 스크립트를 불러올 수 없습니다.");
    }

    if (inApp) {
      notes.push("인앱 브라우저는 iframe/외부 스크립트 제약으로 Preview 동작이 제한될 수 있습니다.");
    }

    if (!mobileRuntime && !isChromiumBrowser(browser)) {
      notes.push("데스크톱에서는 Chrome 또는 Edge 사용을 권장합니다.");
    }

    async function runChecks() {
      const results = await Promise.all(SCRIPT_URLS.map((url) => probeScript(url)));

      if (cancelled) {
        return;
      }

      const okCount = results.filter(Boolean).length;
      const scriptAccess: ScriptAccess = okCount === 2 ? "가능" : okCount === 1 ? "일부 제한" : "불가";

      const finalNotes = [...notes];
      let readiness: ReadinessLevel = "권장";

      if (!online || inApp || scriptAccess === "불가") {
        readiness = "제한";
      } else if (scriptAccess === "일부 제한" || (!mobileRuntime && !isChromiumBrowser(browser))) {
        readiness = "주의";
      }

      if (readiness === "권장") {
        finalNotes.push("현재 환경은 Preview DevTools 사용에 적합합니다.");
      } else if (readiness === "주의") {
        finalNotes.push("기본 사용은 가능하지만 일부 Preview 기능이 불안정할 수 있습니다.");
      } else {
        finalNotes.push("안정적인 사용을 위해 네트워크 또는 브라우저 환경을 변경해 주세요.");
      }

      setEnvState({
        device,
        os,
        browser,
        previewMode,
        online,
        scriptAccess,
        readiness,
        notes: finalNotes,
      });
    }

    void runChecks();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex min-h-[calc(100dvh-112px)] items-start justify-center overflow-hidden px-3 py-5 sm:h-[calc(100dvh-112px)] sm:items-center sm:px-0 sm:py-0">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-center justify-end">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getReadinessClass(
              envState.readiness,
            )}`}
          >
            Preview 환경: {envState.readiness}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">기기</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{envState.device}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">운영체제</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{envState.os}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">브라우저</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{envState.browser}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
            <p className="text-xs text-slate-500">Preview 모드</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{envState.previewMode}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">외부 스크립트 접근성</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{envState.scriptAccess}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1 text-xs leading-5 text-slate-600 sm:text-sm">
          {envState.notes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

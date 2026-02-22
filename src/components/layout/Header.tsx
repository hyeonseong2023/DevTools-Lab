"use client";

import { getPanelBySlug } from "@/lib/panels";
import { useUiStore } from "@/store/uiStore";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const currentPanel = getPanelBySlug(pathname.split("/")[1] ?? "");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-900">
            DevTools-Lab
          </p>
          <p className="text-xs text-slate-500">
            {currentPanel
              ? `${currentPanel.name} 패널 실습 준비 화면`
              : "Chrome DevTools 인터랙티브 학습 플랫폼"}
          </p>
        </div>

        <button
          type="button"
          onClick={openMobileMenu}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 md:hidden"
        >
          메뉴
        </button>
      </div>
    </header>
  );
}

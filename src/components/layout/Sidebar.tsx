"use client";

import { PANEL_DEFINITIONS } from "@/lib/panels";
import { useUiStore } from "@/store/uiStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function classNames(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}

function PanelLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {PANEL_DEFINITIONS.map((panel) => {
        const href = `/${panel.slug}`;
        const isActive = pathname === href;

        return (
          <Link
            key={panel.slug}
            href={href}
            onClick={onNavigate}
            className={classNames(
              "block rounded-lg border px-3 py-2 text-sm transition",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100",
            )}
          >
            <p className="font-medium">{panel.name}</p>
            <p
              className={classNames(
                "mt-0.5 text-xs",
                isActive ? "text-slate-200" : "text-slate-500",
              )}
            >
              {panel.description}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isMobileMenuOpen = useUiStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUiStore((state) => state.closeMobileMenu);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <>
      <aside className="hidden w-72 shrink-0 md:block">
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            DevTools Panels
          </p>
          <PanelLinks />
        </div>
      </aside>

      {isMobileMenuOpen ? (
        <button
          aria-label="메뉴 닫기"
          type="button"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      ) : null}

      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 w-80 border-r border-slate-200 bg-white p-4 transition-transform md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">패널 목록</p>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
          >
            닫기
          </button>
        </div>
        <PanelLinks onNavigate={closeMobileMenu} />
      </aside>
    </>
  );
}

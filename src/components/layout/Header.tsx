"use client";

import { DEVTOOLS_DOCS_MENU, type DevtoolsDocsGroup } from "@/lib/devtoolsDocsMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isGroupActive(pathname: string, group: DevtoolsDocsGroup) {
  if (!group.matchPaths || group.matchPaths.length === 0) {
    return false;
  }

  return group.matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isExternalHref(href: string, external?: boolean) {
  if (typeof external === "boolean") {
    return external;
  }

  return href.startsWith("http://") || href.startsWith("https://");
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAboutActive = pathname === "/about/environment";

  if (isHome) {
    return null;
  }

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white">
      <div className="flex w-full items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0">
          <Link
            href="/"
            className="text-sm font-semibold tracking-wide text-slate-900 transition hover:text-slate-700"
            aria-label="Chrome DevTools Guide 홈으로 이동"
          >
            Chrome DevTools Guide
          </Link>
        </div>

        <nav className="min-w-0 flex flex-1 items-center gap-4 overflow-x-auto">
          {DEVTOOLS_DOCS_MENU.map((group) => {
            const active = isGroupActive(pathname, group);

            return (
              <div key={group.id} className="group relative shrink-0">
                {group.href ? (
                  <Link
                    href={group.href}
                    className={`relative inline-flex items-center px-0.5 py-1 text-sm font-semibold transition ${
                      active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {group.label}
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 w-full transition ${
                        active ? "bg-slate-900" : "bg-transparent group-hover:bg-slate-300"
                      }`}
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="relative inline-flex items-center px-0.5 py-1 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                  >
                    {group.label}
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-transparent transition group-hover:bg-slate-300" />
                  </button>
                )}

                <div className="pointer-events-none invisible absolute left-0 top-[calc(100%+8px)] z-[130] w-[360px] max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-2xl transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
                  {group.sections.map((section, sectionIndex) => (
                    <div
                      key={`${group.id}-section-${sectionIndex}`}
                      className={sectionIndex > 0 ? "mt-3 border-t border-slate-100 pt-3" : ""}
                    >
                      {section.title ? (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {section.title}
                        </p>
                      ) : null}

                      <ul className={section.title ? "mt-1 space-y-1" : "space-y-1"}>
                        {section.items.map((item, itemIndex) => {
                          const external = isExternalHref(item.href, item.external);
                          const baseClass =
                            "block rounded-md px-2.5 py-1.5 text-xs leading-5 transition";
                          const colorClass = item.deprecated
                            ? "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900";

                          return (
                            <li key={`${group.id}-item-${sectionIndex}-${itemIndex}`}>
                              {external ? (
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${baseClass} ${colorClass}`}
                                >
                                  {item.label}
                                  {item.deprecated ? " (지원 중단)" : ""}
                                </a>
                              ) : (
                                <Link href={item.href} className={`${baseClass} ${colorClass}`}>
                                  {item.label}
                                  {item.deprecated ? " (지원 중단)" : ""}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="group relative shrink-0">
          <button
            type="button"
            className={`inline-flex items-center text-base font-medium transition ${
              isAboutActive ? "text-slate-950" : "text-slate-800 hover:text-slate-950"
            }`}
          >
            ABOUT
          </button>

          <div className="pointer-events-none invisible absolute right-0 top-[calc(100%+8px)] z-[130] w-56 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-2xl transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
            <Link
              href="/about/environment"
              className={`block rounded-md px-2.5 py-1.5 text-xs leading-5 transition ${
                isAboutActive
                  ? "bg-slate-100 font-semibold text-slate-900"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              현재 환경 확인
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

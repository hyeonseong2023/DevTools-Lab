"use client";

import { usePathname } from "next/navigation";

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isElementsWorkspacePage =
    pathname === "/elements" ||
    pathname.startsWith("/elements/") ||
    pathname === "/dom" ||
    pathname.startsWith("/dom/") ||
    pathname === "/css" ||
    pathname.startsWith("/css/");

  if (isHome) {
    return <main className="min-w-0">{children}</main>;
  }

  const shellClassName = isElementsWorkspacePage
    ? "w-full p-0"
    : "w-full px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6";

  const mainClassName = isElementsWorkspacePage
    ? "w-full min-w-0"
    : "mx-auto w-full min-w-0 max-w-[1200px]";

  return (
    <div className={shellClassName}>
      <main className={mainClassName}>{children}</main>
    </div>
  );
}

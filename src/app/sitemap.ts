import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

const APP_ROUTES = [
  "/",
  "/about/environment",
  "/elements",
  "/dom",
  "/dom/properties",
  "/dom/badges",
  "/css",
  "/css/issues",
  "/css/color",
  "/css/grid",
  "/css/flexbox",
  "/css/container-queries",
  "/css/reference",
  "/console",
  "/console/understand-messages",
  "/console/log",
  "/console/javascript",
  "/console/live-expressions",
  "/console/format-style",
  "/console/reference",
  "/console/utilities",
  "/console/api",
  "/sources",
  "/sources/javascript",
  "/sources/breakpoints",
  "/sources/workspaces",
  "/sources/snippets",
  "/sources/reference",
  "/sources/overrides",
  "/network",
  "/performance",
  "/memory",
  "/application",
  "/security",
  "/lighthouse",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return APP_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency:
      route === "/"
        ? "weekly"
        : route.startsWith("/elements") ||
            route.startsWith("/dom") ||
            route.startsWith("/css") ||
            route.startsWith("/console") ||
            route.startsWith("/sources")
          ? "weekly"
          : "monthly",
    priority:
      route === "/"
        ? 1
        : route.startsWith("/elements") ||
            route.startsWith("/dom") ||
            route.startsWith("/css") ||
            route.startsWith("/console") ||
            route.startsWith("/sources")
          ? 0.9
          : 0.8,
  }));
}

import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";

const siteUrl = (() => {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!envSiteUrl) return DEFAULT_SITE_URL;
  if (envSiteUrl.startsWith("http://") || envSiteUrl.startsWith("https://")) return envSiteUrl;
  return `https://${envSiteUrl}`;
})();

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
  "/sources",
  "/network",
  "/recorder",
  "/performance",
  "/memory",
  "/application",
  "/security",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return APP_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency:
      route === "/"
        ? "weekly"
        : route.startsWith("/elements") || route.startsWith("/dom") || route.startsWith("/css")
          ? "weekly"
          : "monthly",
    priority:
      route === "/"
        ? 1
        : route.startsWith("/elements") || route.startsWith("/dom") || route.startsWith("/css")
          ? 0.9
          : 0.8,
  }));
}

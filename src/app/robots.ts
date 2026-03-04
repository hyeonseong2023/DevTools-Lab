import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";

const siteUrl = (() => {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!envSiteUrl) return DEFAULT_SITE_URL;
  if (envSiteUrl.startsWith("http://") || envSiteUrl.startsWith("https://")) return envSiteUrl;
  return `https://${envSiteUrl}`;
})();

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: isProduction ? ["/api/"] : ["/api/", "/_next/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

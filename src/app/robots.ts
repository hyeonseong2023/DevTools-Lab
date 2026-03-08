import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

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

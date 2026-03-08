const LOCAL_SITE_URL = "http://localhost:3000";
const FALLBACK_PRODUCTION_SITE_URL = "https://devtools-lab.vercel.app";

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed.replace(/\/$/, "")}`;
}

export function getSiteUrl() {
  const explicitUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (explicitUrl) return explicitUrl;

  const productionUrl = normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "");
  if (productionUrl) return productionUrl;

  const previewUrl = normalizeSiteUrl(process.env.VERCEL_URL ?? "");
  if (previewUrl && process.env.NODE_ENV === "production") return previewUrl;

  if (process.env.NODE_ENV === "production") {
    return FALLBACK_PRODUCTION_SITE_URL;
  }

  return LOCAL_SITE_URL;
}

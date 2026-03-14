import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import { getSiteUrl } from "@/lib/siteUrl";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Chrome DevTools Guide",
    template: "%s | Chrome DevTools Guide",
  },
  description:
    "Chrome DevTools 사용법을 단계별로 익히는 인터랙티브 가이드와 Preview Lab 실습 플랫폼",
  applicationName: "Chrome DevTools Guide",
  keywords: [
    "Chrome DevTools",
    "DevTools 학습",
    "DOM 디버깅",
    "CSS 디버깅",
    "Frontend Tools",
    "Preview Lab",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "Chrome DevTools Guide",
    title: "Chrome DevTools Guide",
    description:
      "Chrome DevTools 사용법을 단계별로 익히는 인터랙티브 가이드와 Preview Lab 실습 플랫폼",
    images: [
      {
        url: "/branding/options/logo-option-a-v6.svg",
        width: 512,
        height: 512,
        alt: "Chrome DevTools Guide Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chrome DevTools Guide",
    description:
      "Chrome DevTools 사용법을 단계별로 익히는 인터랙티브 가이드와 Preview Lab 실습 플랫폼",
    images: ["/branding/options/logo-option-a-v6.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/branding/options/favicon-option-a-v6.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/branding/options/favicon-option-a-v6.svg", type: "image/svg+xml" }],
    apple: [{ url: "/branding/options/favicon-option-a-v6.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/branding/options/favicon-option-a-v6.svg" type="image/svg+xml" sizes="any" />
        <link rel="preconnect" href="https://developer.chrome.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//developer.chrome.com" />
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//www.gstatic.com" />
      </head>
      <body className={`${notoSansKr.variable} bg-white text-slate-900 antialiased`}>
        <QueryProvider>
          <div className="min-h-screen">
            <Header />
            <PageShell>{children}</PageShell>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}

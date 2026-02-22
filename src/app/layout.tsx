import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "DevTools-Lab",
  description: "Chrome DevTools 학습을 위한 인터랙티브 실습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} bg-slate-50 text-slate-900 antialiased`}>
        <QueryProvider>
          <div className="min-h-screen">
            <Header />
            <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
              <Sidebar />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}

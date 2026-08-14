import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "보따리 (BOTTARI) — 초간단 모바일 웹 놀이터",
  description: "친구에게 링크 하나 보내서 30초 동안 노는 초간단 소셜 퀴즈 놀이터!",
  openGraph: {
    title: "보따리 (BOTTARI) — 나를 얼마나 알아?",
    description: "친구에게 링크 하나 보내서 30초 동안 노는 초간단 소셜 퀴즈 놀이터!",
    type: "website",
    siteName: "보따리 BOTTARI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f1016",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased min-h-screen bg-[#0f1016] text-[#f8fafc] flex flex-col justify-between">
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-[#14151f] shadow-2xl relative border-x border-[#232435]">
          <Header />
          <main className="flex-1 flex flex-col px-5 py-4 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

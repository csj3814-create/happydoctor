import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "행복한 의사 | Happy Doctor",
  description: "제비처럼, 필요할 때 가까이 손 닿는 의료. 의료 취약계층을 위한 무료 온라인 의료상담 서비스.",
  keywords: "무료 의료상담, 행복한의사, 해피닥터, 응급의학과, 의료봉사",
  openGraph: {
    title: "행복한 의사 | Happy Doctor",
    description: "제비처럼, 필요할 때 가까이 손 닿는 의료",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKR.className} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}

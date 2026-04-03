import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const portalUrl = process.env.NEXT_PUBLIC_PORTAL_SITE_URL || "https://happydoctor.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(portalUrl),
  title: {
    default: "해피닥터 의사 포털",
    template: "%s | 해피닥터 의사 포털",
  },
  description: "해피닥터 행복한 의사 — 의료진 전용 포털",
  applicationName: "해피닥터 의사 포털",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}<Analytics /></body>
    </html>
  );
}

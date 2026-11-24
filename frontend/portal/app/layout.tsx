import type { Metadata } from "next";
// Geist from npm rather than downloaded from Google at build time - that
// download failed a CI build once. The family names are set in globals.css.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const portalUrl = process.env.NEXT_PUBLIC_PORTAL_SITE_URL || "https://portal.happydoctor.kr";

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
  icons: {
    icon: [{ url: '/portal-favicon.png?v=20260406', type: 'image/png' }],
    shortcut: ['/portal-favicon.png?v=20260406'],
    apple: [{ url: '/portal-favicon.png?v=20260406' }],
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">{children}<Analytics /></body>
    </html>
  );
}

import type { NextConfig } from "next";

const backendBase =
  process.env.PORTAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://happydoctor.onrender.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/portal/:path*",
        destination: `${backendBase}/api/portal/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Disable image optimization for PWA (self-hosted, no CDN)
  images: {
    unoptimized: true,
  },
  // Turbopack is enabled via the dev script (--turbopack flag)
  // App Router is the default in Next.js 13+
  experimental: {
    // Nothing needed here yet; PWA service worker handled separately
  },
};

export default withNextIntl(nextConfig);

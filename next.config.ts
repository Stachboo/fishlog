import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

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

export default withSerwist(withNextIntl(nextConfig));

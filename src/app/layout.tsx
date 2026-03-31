import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// ── Fonts ──────────────────────────────────────────────────────────────────
// DM Sans: body text, UI labels — legible on dark backgrounds, French diacritics
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Geist Mono: gauge values, data tables — tabular-nums, instrument feel
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Noto Sans Arabic: RTL support for Arabic locale (FR/MA/DZ/TN market)
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-arabic",
  display: "swap",
});

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "FishLog — Tableau de bord pêche",
    template: "%s | FishLog",
  },
  description:
    "Application de suivi de sessions de pêche avec données météo en temps réel. Spots, conditions, techniques — tout en un coup d'œil.",
  keywords: ["pêche", "fishing", "météo", "spots", "sessions", "journal de pêche"],
  authors: [{ name: "FishLog" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FishLog",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ── Root Layout ────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      // data-theme attribute allows manual dark/light override (stored in localStorage)
      suppressHydrationWarning
    >
      <body
        className={[
          dmSans.variable,
          geistMono.variable,
          notoArabic.variable,
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { SessionProvider } from "next-auth/react";
import { SWRegister } from "@/components/sw-register";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ThemeProvider } from "@/components/theme-provider";
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

// ── Supported locales ──────────────────────────────────────────────────────
const SUPPORTED_LOCALES = ["fr", "en", "ar"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function resolveLocale(value: string | undefined): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : "fr";
}

// ── Root Layout ────────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const isRTL = locale === "ar";

  // Load messages for the current locale
  const messages = (await import(`../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
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
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <SWRegister />
            <OfflineIndicator />
            <ThemeProvider />
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

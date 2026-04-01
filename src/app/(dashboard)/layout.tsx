import { ReactNode } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { PageLayout } from "@/components/ui/page-layout";
import { DashboardNav } from "@/components/dashboard-nav";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("common");
  const locale = await getLocale();

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        gap: "var(--spacing-sm)",
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-h3)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.02em",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {t("appName")}
      </span>

      {/* Nav + Lang — scrollable on mobile */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", overflow: "auto", flexShrink: 1, minWidth: 0 }}>
        <DashboardNav />
        <LanguageSwitcher currentLocale={locale as "fr" | "en" | "ar"} />
      </div>
    </div>
  );

  return <PageLayout header={header}>{children}</PageLayout>;
}

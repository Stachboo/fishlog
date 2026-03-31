import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/ui/page-layout";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("common");

  const header = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
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
        }}
      >
        {t("appName")}
      </span>

      {/* Nav */}
      <DashboardNav />
    </div>
  );

  return <PageLayout header={header}>{children}</PageLayout>;
}

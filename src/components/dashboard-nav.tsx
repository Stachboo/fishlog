"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export function DashboardNav() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("alerts");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const allTabs = [
    { href: "/", label: t("dashboard"), public: true },
    { href: "/spots", label: t("spots"), public: false },
    { href: "/journal", label: t("journal"), public: false },
    { href: "/compare", label: t("compare"), public: false },
    { href: "/alerts", label: ta("title"), public: false },
  ];

  const tabs = allTabs.filter((tab) => tab.public || isLoggedIn);

  return (
    <nav style={{ display: "flex", gap: "var(--spacing-xs)", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0 }} aria-label="Navigation principale">
      {tabs.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              fontWeight: active ? 600 : 400,
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              background: active ? "var(--color-surface-hover)" : "transparent",
              textDecoration: "none",
              transition: "color var(--duration-short), background var(--duration-short)",
            }}
          >
            {label}
          </Link>
        );
      })}
      {!isLoggedIn && (
        <Link
          href="/login"
          style={{
            padding: "var(--spacing-xs) var(--spacing-sm)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-water-temp)",
            background: "transparent",
            textDecoration: "none",
            border: "1px solid var(--color-water-temp)",
            transition: "color var(--duration-short), background var(--duration-short)",
          }}
        >
          {tc("login")}
        </Link>
      )}
    </nav>
  );
}

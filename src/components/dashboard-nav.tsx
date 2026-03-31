"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function DashboardNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: t("dashboard") },
    { href: "/spots", label: t("spots") },
    { href: "/journal", label: t("journal") },
  ];

  return (
    <nav style={{ display: "flex", gap: "var(--spacing-xs)" }} aria-label="Navigation principale">
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
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
    </nav>
  );
}

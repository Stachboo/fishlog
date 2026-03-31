"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

const LOCALES = [
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
  { code: "ar", label: "AR", name: "العربية" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

interface LanguageSwitcherProps {
  currentLocale: LocaleCode;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(locale: LocaleCode) {
    // Persist choice in cookie (1 year) — same cookie name next-intl reads
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Choisir la langue"
      style={{
        display: "inline-flex",
        gap: "2px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "2px",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity var(--duration-short) var(--ease-move)",
      }}
    >
      {LOCALES.map(({ code, label, name }) => {
        const isActive = code === currentLocale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={isActive}
            title={name}
            onClick={() => switchLocale(code)}
            disabled={isPending}
            style={{
              padding: "4px 10px",
              borderRadius: "calc(var(--radius-md) - 2px)",
              border: "none",
              cursor: isPending ? "default" : "pointer",
              fontFamily: "var(--font-data)",
              fontSize: "var(--text-small)",
              fontWeight: isActive ? 600 : 400,
              letterSpacing: "0.04em",
              background: isActive ? "var(--color-surface-border)" : "transparent",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              transition: [
                "background var(--duration-short) var(--ease-move)",
                "color var(--duration-short) var(--ease-move)",
              ].join(", "),
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

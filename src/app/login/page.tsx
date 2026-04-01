"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

// ── Google Icon ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.04v2.52h3.23c1.89-1.74 2.97-4.3 2.97-7.35z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.97-.9 6.62-2.42l-3.23-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.09v2.6A10 10 0 0 0 10 20z"
        fill="#34A853"
      />
      <path
        d="M4.41 11.9A6.03 6.03 0 0 1 4.1 10c0-.66.11-1.3.31-1.9V5.5H1.09A10 10 0 0 0 0 10c0 1.61.39 3.14 1.09 4.5l3.32-2.6z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.98c1.47 0 2.79.51 3.82 1.5l2.87-2.87C14.96.99 12.7 0 10 0A10 10 0 0 0 1.09 5.5l3.32 2.6C5.2 5.74 7.4 3.98 10 3.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── FishLog Logo ───────────────────────────────────────────────────────────

function FishLogLogo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="var(--color-water-temp)"
        strokeWidth="2"
        opacity="0.4"
      />
      {/* Fish body */}
      <path
        d="M14 24c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z"
        fill="var(--color-surface)"
        stroke="var(--color-water-temp)"
        strokeWidth="1.5"
      />
      {/* Fish tail */}
      <path
        d="M10 20l-4-4 2 8-2 4 6-4"
        fill="var(--color-water-temp)"
        opacity="0.8"
      />
      {/* Fishing line indicator */}
      <line
        x1="24"
        y1="2"
        x2="24"
        y2="14"
        stroke="var(--color-air-temp)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      {/* Eye */}
      <circle cx="29" cy="22" r="2" fill="var(--color-water-temp)" />
      <circle cx="29.5" cy="21.5" r="0.7" fill="var(--color-bg)" />
    </svg>
  );
}

// ── Login Page ─────────────────────────────────────────────────────────────

function getLocaleFromCookie(): "fr" | "en" | "ar" {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
  return (match?.[1] as "fr" | "en" | "ar") ?? "fr";
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-dvh flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* Card */}
      <div
        className="w-full rounded-[var(--radius-lg)] border p-8 flex flex-col items-center gap-6"
        style={{
          maxWidth: "24rem",
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-surface-border)",
        }}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3">
          <FishLogLogo />
          <div className="text-center">
            <h1
              className="font-semibold tracking-tight"
              style={{
                fontSize: "var(--text-h2)",
                color: "var(--color-text-primary)",
              }}
            >
              FishLog
            </h1>
            <p
              className="mt-1"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--color-text-secondary)",
              }}
            >
              Journal de pêche intelligent
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full h-px"
          style={{ backgroundColor: "var(--color-surface-border)" }}
        />

        {/* Sign in section */}
        <div className="w-full flex flex-col gap-4">
          <p
            className="text-center"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-secondary)",
            }}
          >
            Connectez-vous pour accéder à vos sessions et spots de pêche
          </p>

          <Button
            variant="secondary"
            size="lg"
            loading={loading}
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            {!loading && <GoogleIcon />}
            Continuer avec Google
          </Button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              textDecoration: "underline",
              padding: "var(--spacing-xs) 0",
            }}
          >
            Continuer sans compte
          </button>
        </div>

        {/* Language switcher */}
        <LanguageSwitcher currentLocale={getLocaleFromCookie()} />

        {/* Footer note */}
        <p
          className="text-center"
          style={{
            fontSize: "var(--text-micro)",
            color: "var(--color-text-muted)",
          }}
        >
          En vous connectant, vous acceptez nos conditions d&apos;utilisation.
          <br />
          Vos données restent privées et sécurisées.
        </p>
      </div>
    </main>
  );
}

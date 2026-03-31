"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { GeocodedLocation } from "@/app/api/geocode/route";

// ── Types ──────────────────────────────────────────────────────────────────

interface LocationSearchProps {
  onSelect: (location: GeocodedLocation) => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function LocationSearch({ onSelect, className }: LocationSearchProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error("Geocode failed");
        const data: GeocodedLocation[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setError(tc("error"));
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tc]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(loc: GeocodedLocation) {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(loc);
  }

  return (
    <div className={`relative ${className ?? ""}`} style={{ minWidth: 240 }}>
      {/* Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xs)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-xs) var(--spacing-sm)",
          transition: "border-color var(--duration-short)",
        }}
      >
        {/* Search icon */}
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ flexShrink: 0, color: "var(--color-text-muted)" }}
        >
          <circle cx={7} cy={7} r={5} stroke="currentColor" strokeWidth={1.5} />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchLocation")}
          autoComplete="off"
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            width: "100%",
          }}
          aria-label={t("searchLocation")}
          aria-expanded={open}
          aria-autocomplete="list"
        />

        {loading && (
          <div
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              border: "2px solid var(--color-surface-border)",
              borderTopColor: "var(--color-air-temp)",
              borderRadius: "var(--radius-full)",
              animation: "spin 0.6s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={t("searchLocation")}
          style={{
            position: "absolute",
            top: "calc(100% + var(--spacing-xs))",
            left: 0,
            right: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-xs) 0",
            margin: 0,
            listStyle: "none",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {results.map((loc, i) => (
            <li
              key={i}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(loc)}
              style={{
                padding: "var(--spacing-sm) var(--spacing-md)",
                cursor: "pointer",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                transition: "background var(--duration-micro)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLIElement).style.background =
                  "var(--color-surface-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = "transparent";
              }}
            >
              {loc.name}
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {error && (
        <p
          style={{
            position: "absolute",
            top: "calc(100% + var(--spacing-xs))",
            left: 0,
            right: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            color: "var(--color-error)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
          }}
        >
          {error}
        </p>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

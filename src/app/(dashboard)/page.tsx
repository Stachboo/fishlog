"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { GaugeSVG } from "@/components/ui/gauge-svg";
import { CompassSVG } from "@/components/ui/compass-svg";
import { MoonIcon } from "@/components/ui/moon-icon";
import { LocationSearch } from "@/components/location-search";
import type { WeatherData } from "@/lib/services/weather";
import type { GeocodedLocation } from "@/app/api/geocode/route";

// ── Score color helper ────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return "var(--color-score-good)";
  if (score >= 40) return "var(--color-score-mid)";
  return "var(--color-score-bad)";
}

function scoreLabel(score: number, t: ReturnType<typeof useTranslations>): string {
  if (score >= 70) return t("excellent");
  if (score >= 40) return t("good");
  if (score >= 20) return t("moderate");
  return t("poor");
}

// ── Skeleton gauge ────────────────────────────────────────────────────────

function GaugeSkeleton({ large = false }: { large?: boolean }) {
  const size = large ? 200 : 160;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-full)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        animation: "pulse 1.5s ease-in-out infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--spacing-md)",
        padding: "var(--spacing-3xl) var(--spacing-lg)",
        textAlign: "center",
      }}
    >
      {/* Fishing icon placeholder */}
      <svg
        width={64}
        height={64}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ opacity: 0.3 }}
      >
        <circle cx={32} cy={32} r={28} stroke="var(--color-text-muted)" strokeWidth={2} />
        <path
          d="M20 32 C24 24, 36 24, 40 32 C36 40, 24 40, 20 32Z"
          stroke="var(--color-text-muted)"
          strokeWidth={1.5}
          fill="none"
        />
        <line x1={40} y1={32} x2={50} y2={28} stroke="var(--color-text-muted)" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={50} cy={27} r={2.5} fill="var(--color-text-muted)" />
      </svg>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body)",
          color: "var(--color-text-secondary)",
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ── Weather gauges section ────────────────────────────────────────────────

interface GaugesProps {
  data: WeatherData;
  t: ReturnType<typeof useTranslations>;
}

function WeatherGauges({ data, t }: GaugesProps) {
  const updatedTime = new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>

      {/* Hero gauge — Session Score */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-sm)" }}>
        <h2
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          {t("conditions")}
        </h2>

        <div style={{ transform: "scale(1.25)", transformOrigin: "center" }}>
          <GaugeSVG
            value={data.score}
            min={0}
            max={100}
            unit="/100"
            label={t("sessionScore")}
            colorScale={scoreColor(data.score)}
          />
        </div>

        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-h3)",
            fontWeight: 700,
            color: scoreColor(data.score),
            marginTop: "var(--spacing-md)",
          }}
        >
          {scoreLabel(data.score, t)}
        </span>

        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-micro)",
            color: "var(--color-text-muted)",
          }}
        >
          {t("updatedAt", { time: updatedTime })}
        </span>
      </section>

      {/* Gauge grid — 6 gauges */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--spacing-lg)",
          justifyItems: "center",
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-xl) var(--spacing-lg)",
        }}
      >
        {/* Air Temperature */}
        <GaugeSVG
          value={data.airTemp}
          min={-10}
          max={45}
          unit="°C"
          label={t("airTemp")}
          colorScale="var(--color-air-temp)"
          icon={
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx={10} cy={14} r={3} fill="currentColor" />
              <rect x={8.5} y={3} width={3} height={9} rx={1.5} fill="currentColor" opacity={0.7} />
            </svg>
          }
        />

        {/* Water Temperature */}
        <GaugeSVG
          value={data.waterTemp ?? 0}
          min={0}
          max={35}
          unit="°C"
          label={t("waterTemp")}
          colorScale="var(--color-water-temp)"
          icon={
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 3 C10 3, 4 10, 4 13.5 C4 16.5 6.7 19 10 19 C13.3 19 16 16.5 16 13.5 C16 10 10 3 10 3Z"
                fill="currentColor"
                opacity={0.8}
              />
            </svg>
          }
        />

        {/* Wind Speed */}
        <GaugeSVG
          value={data.windSpeed}
          min={0}
          max={60}
          unit="km/h"
          label={t("windSpeed")}
          colorScale="var(--color-wind-speed)"
          icon={
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 8 Q8 8 12 6 Q16 4 17 6 Q18 8 14 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" />
              <path d="M2 12 Q9 12 13 10 Q17 8 18 11 Q19 13 15 13" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none" />
            </svg>
          }
        />

        {/* Pressure */}
        <GaugeSVG
          value={data.pressure}
          min={960}
          max={1050}
          unit="hPa"
          label={t("pressure")}
          colorScale="var(--color-pressure)"
          icon={
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx={10} cy={10} r={7} stroke="currentColor" strokeWidth={1.5} />
              <path d="M10 6 L10 10 L13 12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />

        {/* Wind Direction — Compass */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-xs)" }}>
          <CompassSVG
            direction={data.windDirection}
            label={t("windDirection")}
            size={120}
          />
        </div>

        {/* Moon Phase */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-sm)" }}>
          <MoonIcon phase={data.moonPhase} size={80} />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-secondary)",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            {t("moonPhase")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "var(--text-data-sm)",
              color: "var(--color-moon)",
            }}
          >
            {Math.round(data.moonPhase * 100)}%
          </span>
        </div>
      </section>

      {/* Sunrise / Sunset */}
      <section
        style={{
          display: "flex",
          gap: "var(--spacing-xl)",
          justifyContent: "center",
          flexWrap: "wrap",
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-md) var(--spacing-lg)",
        }}
      >
        {/* Sunrise */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 L12 7" stroke="var(--color-sunrise)" strokeWidth={2} strokeLinecap="round" />
            <path d="M5.5 6.5 L8 9" stroke="var(--color-sunrise)" strokeWidth={2} strokeLinecap="round" />
            <path d="M18.5 6.5 L16 9" stroke="var(--color-sunrise)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={12} cy={13} r={4} fill="var(--color-sunrise)" />
            <path d="M2 17 L22 17" stroke="var(--color-sunrise)" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
            <path d="M5 20 L19 20" stroke="var(--color-sunrise)" strokeWidth={1.5} strokeLinecap="round" opacity={0.3} />
          </svg>
          <div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-micro)",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("sunrise")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-data-gauge)",
                fontWeight: 600,
                color: "var(--color-sunrise)",
              }}
            >
              {data.sunrise}
            </div>
          </div>
        </div>

        {/* Sunset */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx={12} cy={11} r={4} fill="var(--color-sunrise)" opacity={0.8} />
            <path d="M2 15 L22 15" stroke="var(--color-sunrise)" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
            <path d="M5 18 L19 18" stroke="var(--color-sunrise)" strokeWidth={1.5} strokeLinecap="round" opacity={0.3} />
            <path d="M12 3 L12 7" stroke="var(--color-sunrise)" strokeWidth={2} strokeLinecap="round" opacity={0.5} />
          </svg>
          <div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-micro)",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("sunset")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-data-gauge)",
                fontWeight: 600,
                color: "var(--color-sunrise)",
                opacity: 0.85,
              }}
            >
              {data.sunset}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 4 C12 4, 6 11, 6 15 C6 18.3 8.7 21 12 21 C15.3 21 18 18.3 18 15 C18 11 12 4 12 4Z"
              stroke="var(--color-water-temp)"
              strokeWidth={1.5}
              fill="none"
            />
          </svg>
          <div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-micro)",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("humidity")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-data-gauge)",
                fontWeight: 600,
                color: "var(--color-water-temp)",
              }}
            >
              {data.humidity}%
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tc = useTranslations("common");

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  function handleLocationSelect(loc: GeocodedLocation) {
    setLocationName(loc.name);
    fetchWeather(loc.lat, loc.lon);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>

      {/* Header bar: location name + search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
          flexWrap: "wrap",
        }}
      >
        {/* Location name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {locationName ? (
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-h2)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {locationName}
            </h1>
          ) : (
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-h2)",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                margin: 0,
              }}
            >
              {t("title")}
            </h1>
          )}
        </div>

        {/* Location search */}
        <LocationSearch onSelect={handleLocationSelect} />
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--spacing-md)",
          }}
          role="alert"
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-error)",
            }}
          >
            {tc("error")}: {error}
          </span>
          {locationName && (
            <button
              onClick={() => {
                // Re-fetch using last coordinates via re-selecting — show retry message
                setError(null);
              }}
              style={{
                background: "transparent",
                border: "1px solid var(--color-error)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--spacing-xs) var(--spacing-sm)",
                color: "var(--color-error)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                cursor: "pointer",
                transition: "background var(--duration-short)",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {tc("retry")}
            </button>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--spacing-xl)",
            paddingTop: "var(--spacing-xl)",
          }}
          aria-label={tc("loading")}
          aria-live="polite"
        >
          <GaugeSkeleton large />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "var(--spacing-lg)",
              width: "100%",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                <GaugeSkeleton />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no location yet */}
      {!loading && !weather && !error && (
        <EmptyState message={t("addLocation")} />
      )}

      {/* Weather gauges */}
      {!loading && weather && !error && (
        <WeatherGauges data={weather} t={t} />
      )}
    </div>
  );
}

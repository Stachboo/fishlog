"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GaugeSVG } from "@/components/ui/gauge-svg";
import type { WeatherData } from "@/lib/services/weather";

// ── Types ─────────────────────────────────────────────────────────────────

interface Spot {
  id: string;
  name: string;
}

interface SpotResult {
  spot: { id: string; name: string; latitude: number; longitude: number };
  weather: WeatherData | null;
  stats: {
    sessionCount: number;
    avgScore: number | null;
    bestTechnique: string | null;
  };
}

interface CompareData {
  results: SpotResult[];
  recommendation: string | null;
}

// ── Score color helper ────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return "var(--color-score-good)";
  if (score >= 40) return "var(--color-score-mid)";
  return "var(--color-score-bad)";
}

// ── Spot Column ───────────────────────────────────────────────────────────

function SpotColumn({
  result,
  isRecommended,
  t,
  tc,
}: {
  result: SpotResult;
  isRecommended: boolean;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const { spot, weather, stats } = result;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
        background: "var(--color-surface)",
        border: isRecommended
          ? "2px solid var(--color-score-good)"
          : "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-lg)",
        position: "relative",
      }}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Badge variant="success">{t("recommendedSpot")}</Badge>
        </div>
      )}

      {/* Spot name */}
      <h3
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-h3)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: 0,
          textAlign: "center",
        }}
      >
        {spot.name}
      </h3>

      {/* Current conditions */}
      <div>
        <h4
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 var(--spacing-sm)",
          }}
        >
          {t("currentConditions")}
        </h4>

        {weather ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", alignItems: "center" }}>
            {/* Score gauge */}
            <GaugeSVG
              value={weather.score}
              min={0}
              max={100}
              unit="/100"
              label="Score"
              colorScale={scoreColor(weather.score)}
            />

            {/* Mini stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--spacing-xs)",
                width: "100%",
              }}
            >
              {[
                { label: "Air", value: `${weather.airTemp}°C`, color: "var(--color-air-temp)" },
                { label: "Vent", value: `${weather.windSpeed}km/h`, color: "var(--color-wind-speed)" },
                { label: "Pression", value: `${weather.pressure}hPa`, color: "var(--color-pressure)" },
                { label: "Lune", value: `${Math.round(weather.moonPhase * 100)}%`, color: "var(--color-moon)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: "var(--spacing-xs)",
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-micro)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-data)",
                      fontSize: "var(--text-small)",
                      fontWeight: 600,
                      color,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              textAlign: "center",
              padding: "var(--spacing-md)",
            }}
          >
            {t("noData")}
          </div>
        )}
      </div>

      {/* Historical stats */}
      <div>
        <h4
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 var(--spacing-sm)",
          }}
        >
          {t("historicalStats")}
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("sessions")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-small)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {stats.sessionCount}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("avgScore")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-small)",
                fontWeight: 600,
                color: stats.avgScore !== null ? scoreColor(stats.avgScore) : "var(--color-text-muted)",
              }}
            >
              {stats.avgScore !== null ? `${stats.avgScore}/100` : t("noData")}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--spacing-xs)" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                color: "var(--color-text-secondary)",
                flexShrink: 0,
              }}
            >
              {t("bestTechnique")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                color: "var(--color-text-primary)",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {stats.bestTechnique ?? t("noData")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compare Page ──────────────────────────────────────────────────────────

export default function ComparePage() {
  const t = useTranslations("compare");
  const tc = useTranslations("common");

  const [availableSpots, setAvailableSpots] = useState<Spot[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(["", ""]);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((data) => setAvailableSpots(data.spots ?? data ?? []));
  }, []);

  function addSpot() {
    if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, ""]);
    }
  }

  function removeSpot(index: number) {
    if (selectedIds.length <= 2) return;
    setSelectedIds(selectedIds.filter((_, i) => i !== index));
  }

  function setSpot(index: number, value: string) {
    const next = [...selectedIds];
    next[index] = value;
    setSelectedIds(next);
  }

  async function handleCompare() {
    const ids = selectedIds.filter(Boolean);
    if (ids.length < 2) {
      setError(t("minSpots"));
      return;
    }

    setLoading(true);
    setError(null);
    setCompareData(null);

    try {
      const res = await fetch(`/api/spots/compare?ids=${ids.join(",")}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tc("error"));
        return;
      }
      setCompareData(data);
    } catch {
      setError(tc("error"));
    } finally {
      setLoading(false);
    }
  }

  // Filter out already-selected spots in other dropdowns
  function availableForIndex(index: number): Spot[] {
    const otherSelected = selectedIds.filter((_id, i) => i !== index).filter(Boolean);
    return availableSpots.filter((s) => !otherSelected.includes(s.id) || s.id === selectedIds[index]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
      {/* Title */}
      <h1
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-h2)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        {t("title")}
      </h1>

      {/* Spot selectors */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-md)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          {t("selectSpots")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
          {selectedIds.map((id, i) => (
            <div key={i} style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center" }}>
              <select
                value={id}
                onChange={(e) => setSpot(i, e.target.value)}
                style={{
                  flex: 1,
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-surface-border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-body)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                }}
              >
                <option value="">— {t("selectSpots")} —</option>
                {availableForIndex(i).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Remove button (only if more than 2 spots) */}
              {selectedIds.length > 2 && (
                <button
                  onClick={() => removeSpot(i)}
                  aria-label={t("removeSpot")}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-surface-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--spacing-xs)",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-small)",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          {selectedIds.length < 3 && (
            <Button variant="ghost" size="sm" onClick={addSpot}>
              + {t("addSpot")}
            </Button>
          )}
          <Button onClick={handleCompare} loading={loading} disabled={selectedIds.filter(Boolean).length < 2}>
            {t("compare")}
          </Button>
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-error)",
              margin: 0,
            }}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {compareData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
          {/* Recommendation banner */}
          {compareData.recommendation && (
            <div
              style={{
                background: "color-mix(in srgb, var(--color-score-good) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-score-good) 30%, transparent)",
                borderRadius: "var(--radius-md)",
                padding: "var(--spacing-md)",
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
              }}
            >
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-small)",
                    fontWeight: 600,
                    color: "var(--color-score-good)",
                    margin: 0,
                  }}
                >
                  {t("recommendation")}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-body)",
                    color: "var(--color-text-primary)",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {compareData.results.find((r) => r.spot.id === compareData.recommendation)?.spot.name}
                </p>
              </div>
            </div>
          )}

          {/* Columns */}
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-lg)",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {compareData.results.map((result) => (
              <SpotColumn
                key={result.spot.id}
                result={result}
                isRecommended={result.spot.id === compareData.recommendation}
                t={t}
                tc={tc}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

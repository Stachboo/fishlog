"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────

interface StatsData {
  totalSessions: number;
  bestSpot: { name: string; avgScore: number; sessionCount: number } | null;
  bestHour: string | null;
  bestTechnique: { name: string; count: number; avgScore: number } | null;
  bestBait: { name: string; count: number; avgScore: number } | null;
  avgScore: number | null;
  monthlyTrend: Array<{ month: string; avgScore: number; count: number }>;
}

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-xs)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-small)",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-data)",
          fontSize: "var(--text-h2)",
          fontWeight: 700,
          color: accent ?? "var(--color-text-primary)",
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-secondary)",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Bar Chart (SVG) ───────────────────────────────────────────────────────

function BarChart({ data }: { data: Array<{ month: string; avgScore: number; count: number }> }) {
  if (data.length === 0) return null;

  const maxScore = Math.max(...data.map((d) => d.avgScore), 1);
  const chartHeight = 120;
  const barWidth = Math.min(48, Math.floor(400 / data.length) - 8);

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--spacing-md)",
        alignItems: "flex-end",
        padding: "var(--spacing-md) 0",
        overflowX: "auto",
      }}
    >
      {data.map(({ month, avgScore, count }) => {
        const barHeight = Math.max(4, Math.round((avgScore / maxScore) * chartHeight));
        const color =
          avgScore >= 70
            ? "var(--color-score-good)"
            : avgScore >= 40
            ? "var(--color-score-mid)"
            : "var(--color-score-bad)";

        return (
          <div
            key={month}
            title={`${month}: ${avgScore}/100 (${count} sessions)`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--spacing-xs)",
              minWidth: barWidth,
            }}
          >
            {/* Score label */}
            <span
              style={{
                fontFamily: "var(--font-data)",
                fontSize: "var(--text-micro)",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
              }}
            >
              {avgScore}
            </span>

            {/* Bar */}
            <div
              style={{
                width: barWidth,
                height: barHeight,
                background: color,
                borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                opacity: 0.85,
                transition: "height 0.3s ease",
              }}
            />

            {/* Month label */}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-micro)",
                color: "var(--color-text-muted)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {month.slice(5)} {/* MM from YYYY-MM */}
            </span>

            {/* Session count */}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-micro)",
                color: "var(--color-text-muted)",
              }}
            >
              ×{count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stats Page ────────────────────────────────────────────────────────────

export default function StatsPage() {
  const t = useTranslations("journal");
  const tc = useTranslations("common");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sessions/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setError(tc("error")))
      .finally(() => setLoading(false));
  }, [tc]);

  function scoreColor(score: number): string {
    if (score >= 70) return "var(--color-score-good)";
    if (score >= 40) return "var(--color-score-mid)";
    return "var(--color-score-bad)";
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
        {t("stats")}
      </h1>

      {loading && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-muted)",
            textAlign: "center",
            padding: "var(--spacing-xl)",
          }}
        >
          {tc("loading")}
        </div>
      )}

      {error && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-error)",
            textAlign: "center",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {stats && !loading && (
        <>
          {stats.totalSessions === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "var(--spacing-3xl)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-sm)",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-body)",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {t("noStats")}
              </p>
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "var(--spacing-md)",
                }}
              >
                <StatCard
                  label={t("totalSessions")}
                  value={stats.totalSessions}
                  accent="var(--color-text-primary)"
                />

                {stats.avgScore !== null && (
                  <StatCard
                    label={t("avgScore")}
                    value={`${stats.avgScore}/100`}
                    accent={scoreColor(stats.avgScore)}
                  />
                )}

                {stats.bestSpot && (
                  <StatCard
                    label={t("bestSpot")}
                    value={stats.bestSpot.name}
                    sub={`${stats.bestSpot.avgScore}/100 · ${stats.bestSpot.sessionCount} ${t("sessions")}`}
                    accent="var(--color-air-temp)"
                  />
                )}

                {stats.bestTechnique && (
                  <StatCard
                    label={t("bestTechnique")}
                    value={stats.bestTechnique.name}
                    sub={`${stats.bestTechnique.count} ${t("sessions")} · ${stats.bestTechnique.avgScore}/100`}
                    accent="var(--color-water-temp)"
                  />
                )}

                {stats.bestBait && (
                  <StatCard
                    label={t("bestBait")}
                    value={stats.bestBait.name}
                    sub={`${stats.bestBait.count} ${t("sessions")} · ${stats.bestBait.avgScore}/100`}
                    accent="var(--color-wind-speed)"
                  />
                )}

                {stats.bestHour && (
                  <StatCard
                    label={t("bestHour")}
                    value={stats.bestHour}
                    accent="var(--color-moon)"
                  />
                )}
              </div>

              {/* Monthly trend */}
              {stats.monthlyTrend.length > 0 && (
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-surface-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--spacing-xl)",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-h3)",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      margin: "0 0 var(--spacing-md)",
                    }}
                  >
                    {t("monthlyTrend")}
                  </h2>
                  <BarChart data={stats.monthlyTrend} />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

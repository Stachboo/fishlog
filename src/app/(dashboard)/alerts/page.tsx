"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ReportForm } from "@/components/alerts/report-form";
import { PushToggle } from "@/components/alerts/push-toggle";
import type { ReportMarker } from "@/components/alerts/alerts-map";

// Lazy-load the map (Leaflet requires window)
const AlertsMap = dynamic(
  () => import("@/components/alerts/alerts-map").then((m) => m.AlertsMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: 380,
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-lg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
        Chargement de la carte...
      </span>
    </div>
  );
}

// ── Type label / color helpers ────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  biting: "Ça mord !",
  not_biting: "Ça ne mord pas",
  good_conditions: "Bonnes conditions",
  bad_conditions: "Mauvaises conditions",
  crowded: "Spot bondé",
};

const TYPE_ICONS: Record<string, string> = {
  biting: "🎣",
  not_biting: "😔",
  good_conditions: "✅",
  bad_conditions: "⛈️",
  crowded: "👥",
};

function typeColor(type: string): string {
  if (type === "biting" || type === "good_conditions") return "var(--color-score-good, #22c55e)";
  if (type === "not_biting" || type === "bad_conditions") return "var(--color-error, #ef4444)";
  return "var(--color-primary, #3b82f6)";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Il y a ${hours}h`;
}

function CountdownBadge({ expiresAt }: { expiresAt: string | null | undefined }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    function update() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setLabel("Expiré"); return; }
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) { setLabel(`${minutes} min restantes`); return; }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      setLabel(mins > 0 ? `${hours}h${mins} restantes` : `${hours}h restantes`);
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!label) return null;

  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-micro)",
        color: "var(--color-text-muted)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-sm)",
        padding: "1px 6px",
      }}
    >
      {label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const t = useTranslations("alerts");
  const tc = useTranslations("common");

  const [reports, setReports] = useState<ReportMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use a broad bounding box centered on France if no specific location
      const res = await fetch("/api/reports?lat=46.6034&lon=1.8883&radius=500");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
        <h1
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-h2)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {t("title")}
        </h1>

        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xs)",
            padding: "var(--spacing-sm) var(--spacing-lg)",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity var(--duration-short)",
          }}
        >
          <span>🎣</span>
          <span>{t("report")}</span>
        </button>
      </div>

      {/* Push notification toggle */}
      <PushToggle />

      {/* Report form (inline) */}
      {showForm && (
        <ReportForm
          onSuccess={() => {
            setShowForm(false);
            fetchReports();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Map */}
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--color-surface-border)",
          minHeight: 380,
        }}
      >
        <AlertsMap reports={reports} />
      </div>

      {/* Report list */}
      <section>
        <h2
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-h3)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          {t("recentReports")}
        </h2>

        {loading && (
          <div
            style={{
              padding: "var(--spacing-xl)",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
            }}
            aria-live="polite"
          >
            {tc("loading")}
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: "var(--spacing-md)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-error)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-error)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
            }}
            role="alert"
          >
            {tc("error")}: {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div
            style={{
              padding: "var(--spacing-3xl) var(--spacing-lg)",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
            }}
          >
            Aucun signalement récent dans la zone.
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--spacing-md)",
                  padding: "var(--spacing-md)",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-surface-border)",
                  borderLeft: `4px solid ${typeColor(report.reportType)}`,
                  borderRadius: "var(--radius-md)",
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 24, flexShrink: 0 }}>
                  {TYPE_ICONS[report.reportType] ?? "📍"}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", flexWrap: "wrap", marginBottom: "var(--spacing-xs)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-body)",
                        fontWeight: 700,
                        color: typeColor(report.reportType),
                      }}
                    >
                      {TYPE_LABELS[report.reportType] ?? report.reportType}
                    </span>
                    {report.spot && (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-small)",
                          color: "var(--color-text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        @ {report.spot.name}
                      </span>
                    )}
                  </div>

                  {report.message && (
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-small)",
                        color: "var(--color-text-secondary)",
                        margin: "0 0 var(--spacing-xs) 0",
                      }}
                    >
                      {report.message}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-micro)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {formatTimeAgo(report.createdAt)}
                    </span>
                    <CountdownBadge expiresAt={report.expiresAt} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

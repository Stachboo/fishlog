"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────

interface Spot {
  id: string;
  name: string;
}

interface Session {
  id: string;
  spotId: string | null;
  date: string;
  technique: string | null;
  bait: string | null;
  notes: string | null;
  score: number | null;
  spotName: string | null;
}

// ── Score badge ───────────────────────────────────────────────────────────

function scoreBadgeVariant(score: number | null): "success" | "warning" | "error" | "default" {
  if (score === null) return "default";
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "error";
}

// ── Session Card ──────────────────────────────────────────────────────────

function SessionCard({ session, t }: { session: Session; t: ReturnType<typeof useTranslations> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
          padding: "var(--spacing-md)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          flexWrap: "wrap",
        }}
      >
        {/* Date */}
        <span
          style={{
            fontFamily: "var(--font-data)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            minWidth: 80,
            flexShrink: 0,
          }}
        >
          {new Date(session.date + "T12:00:00").toLocaleDateString("fr-FR")}
        </span>

        {/* Spot */}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-primary)",
            flex: 1,
            minWidth: 120,
          }}
        >
          {session.spotName ?? "—"}
        </span>

        {/* Score */}
        <Badge variant={scoreBadgeVariant(session.score)}>
          {session.score !== null ? `${session.score}/100` : "—"}
        </Badge>

        {/* Technique */}
        {session.technique && (
          <Badge variant="info">{session.technique}</Badge>
        )}

        {/* Bait */}
        {session.bait && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-secondary)",
            }}
          >
            {session.bait}
          </span>
        )}

        {/* Expand arrow */}
        <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded notes */}
      {expanded && session.notes && (
        <div
          style={{
            padding: "var(--spacing-sm) var(--spacing-md) var(--spacing-md)",
            borderTop: "1px solid var(--color-surface-border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-secondary)",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {t("notes")}: {session.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ── History Page ──────────────────────────────────────────────────────────

export default function HistoryPage() {
  const t = useTranslations("journal");
  const tc = useTranslations("common");

  const [spots, setSpots] = useState<Spot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [filterSpotId, setFilterSpotId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  const loadSessions = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (filterSpotId) params.set("spotId", filterSpotId);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const res = await fetch(`/api/sessions?${params}`);
        const data = await res.json();
        const rows: Session[] = data.sessions ?? [];

        setHasMore(rows.length === 20);

        if (p === 1) {
          setSessions(rows);
        } else {
          setSessions((prev) => [...prev, ...rows]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [filterSpotId, dateFrom, dateTo]
  );

  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((data) => setSpots(data.spots ?? data ?? []));
  }, []);

  useEffect(() => {
    setPage(1);
    loadSessions(1);
  }, [loadSessions]);

  // Client-side sort
  const sorted = [...sessions].sort((a, b) => {
    if (sortBy === "score") {
      return (b.score ?? -1) - (a.score ?? -1);
    }
    return b.date.localeCompare(a.date);
  });

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadSessions(next);
  }

  function handleFilter() {
    setPage(1);
    loadSessions(1);
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
        {t("history")}
      </h1>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-md)",
          flexWrap: "wrap",
          alignItems: "flex-end",
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-md)",
        }}
      >
        {/* Spot filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
            {t("filterBySpot")}
          </label>
          <select
            value={filterSpotId}
            onChange={(e) => setFilterSpotId(e.target.value)}
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="">{t("allSpots")}</option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
            Du
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Date to */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
            Au
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Sort */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
            {t("sortBy")}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "score")}
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="date">{t("sortDate")}</option>
            <option value="score">{t("sortScore")}</option>
          </select>
        </div>

        <Button onClick={handleFilter} style={{ alignSelf: "flex-end" }}>
          {tc("search")}
        </Button>
      </div>

      {/* Session list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
        {loading && page === 1 ? (
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
        ) : sorted.length === 0 ? (
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
              {t("noSessions")}
            </p>
          </div>
        ) : (
          sorted.map((session) => (
            <SessionCard key={session.id} session={session} t={t} />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={handleLoadMore} variant="secondary">
            {t("next")}
          </Button>
        </div>
      )}

      {loading && page > 1 && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            textAlign: "center",
          }}
        >
          {tc("loading")}
        </div>
      )}
    </div>
  );
}

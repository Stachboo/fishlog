"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WeatherData } from "@/lib/services/weather";

// ── Types ─────────────────────────────────────────────────────────────────

interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
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

// ── Score badge helper ────────────────────────────────────────────────────

function scoreBadgeVariant(score: number | null): "success" | "warning" | "error" | "default" {
  if (score === null) return "default";
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "error";
}

// ── Weather mini preview ──────────────────────────────────────────────────

function WeatherMini({ weather, t }: { weather: WeatherData; t: ReturnType<typeof useTranslations> }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--spacing-md)",
        flexWrap: "wrap",
        padding: "var(--spacing-sm) var(--spacing-md)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-small)",
        color: "var(--color-text-secondary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <span>🌡 {weather.airTemp}°C</span>
      <span>💨 {weather.windSpeed} km/h</span>
      <span>📊 {weather.pressure} hPa</span>
      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
        Score: {weather.score}/100
      </span>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────

function SessionCard({ session, t, onDelete }: {
  session: Session;
  t: ReturnType<typeof useTranslations>;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      if (res.ok) onDelete(session.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-md)",
        padding: "var(--spacing-md)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-md)",
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

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label={t("deleteSession")}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          padding: "var(--spacing-xs)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--text-small)",
          transition: "color var(--duration-short)",
          opacity: deleting ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-error)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Session Form ──────────────────────────────────────────────────────────

function NewSessionForm({
  spots,
  onCreated,
  t,
}: {
  spots: Spot[];
  onCreated: (session: Session) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const tc = useTranslations("common");

  const today = new Date().toISOString().slice(0, 10);

  const [spotId, setSpotId] = useState("");
  const [date, setDate] = useState(today);
  const [technique, setTechnique] = useState("");
  const [bait, setBait] = useState("");
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch weather preview when spot changes
  useEffect(() => {
    if (!spotId) {
      setWeather(null);
      return;
    }
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    setWeatherLoading(true);
    fetch(`/api/weather?lat=${spot.latitude}&lon=${spot.longitude}`)
      .then((r) => r.json())
      .then((data: WeatherData) => setWeather(data))
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));
  }, [spotId, spots]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || submitted) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId: spotId || undefined,
          date,
          technique: technique || undefined,
          bait: bait || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("createError"));
        return;
      }

      onCreated(data.session);
      // Reset form
      setSpotId("");
      setDate(today);
      setTechnique("");
      setBait("");
      setNotes("");
      setWeather(null);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError(t("createError"));
    } finally {
      setSubmitting(false);
    }
  }

  const techniqueSuggestions = t("techniqueSuggestions").split(",");
  const baitSuggestions = t("baitSuggestions").split(",");

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
      {/* Spot selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("spot")}
        </label>
        <select
          value={spotId}
          onChange={(e) => setSpotId(e.target.value)}
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-primary)",
            width: "100%",
            cursor: "pointer",
          }}
        >
          <option value="">{t("selectSpot")}</option>
          {spots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Weather preview */}
      {weatherLoading && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
          {tc("loading")}
        </div>
      )}
      {weather && !weatherLoading && <WeatherMini weather={weather} t={t} />}

      {/* Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("date")}
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          max={today}
        />
      </div>

      {/* Technique */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("technique")}
        </label>
        <Input
          type="text"
          value={technique}
          onChange={(e) => setTechnique(e.target.value)}
          placeholder={techniqueSuggestions[0]}
          list="technique-suggestions"
          maxLength={100}
        />
        <datalist id="technique-suggestions">
          {techniqueSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      {/* Bait */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("bait")}
        </label>
        <Input
          type="text"
          value={bait}
          onChange={(e) => setBait(e.target.value)}
          placeholder={baitSuggestions[0]}
          list="bait-suggestions"
          maxLength={100}
        />
        <datalist id="bait-suggestions">
          {baitSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      {/* Notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {t("notes")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-primary)",
            resize: "vertical",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Error */}
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

      {/* Success */}
      {submitted && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            color: "var(--color-success)",
            margin: 0,
          }}
          role="status"
        >
          {t("createSuccess")}
        </p>
      )}

      <Button type="submit" disabled={submitting || submitted} style={{ alignSelf: "flex-start" }}>
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

// ── Journal Page ──────────────────────────────────────────────────────────

export default function JournalPage() {
  const t = useTranslations("journal");
  const tc = useTranslations("common");

  const [spots, setSpots] = useState<Spot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [spotsRes, sessionsRes] = await Promise.all([
        fetch("/api/spots"),
        fetch("/api/sessions?page=1"),
      ]);
      const spotsData = await spotsRes.json();
      const sessionsData = await sessionsRes.json();
      setSpots(spotsData.spots ?? spotsData ?? []);
      setSessions(sessionsData.sessions ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleCreated(session: Session) {
    setSessions((prev) => [session, ...prev]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--spacing-md)",
        }}
      >
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

        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <Link
            href="/journal/history"
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            {t("history")}
          </Link>
          <Link
            href="/journal/stats"
            style={{
              padding: "var(--spacing-xs) var(--spacing-sm)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            {t("stats")}
          </Link>
          <Button onClick={() => setShowForm((v) => !v)}>
            {t("newSession")}
          </Button>
        </div>
      </div>

      {/* New session form */}
      {showForm && (
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
              margin: "0 0 var(--spacing-lg)",
            }}
          >
            {t("newSession")}
          </h2>
          <NewSessionForm spots={spots} onCreated={handleCreated} t={t} />
        </div>
      )}

      {/* Recent sessions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
        {loading ? (
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
        ) : sessions.length === 0 && !loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--spacing-3xl) var(--spacing-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-sm)",
              alignItems: "center",
            }}
          >
            <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ opacity: 0.3 }}>
              <circle cx={32} cy={32} r={28} stroke="var(--color-text-muted)" strokeWidth={2} />
              <path d="M20 32 C24 24, 36 24, 40 32 C36 40, 24 40, 20 32Z" stroke="var(--color-text-muted)" strokeWidth={1.5} fill="none" />
            </svg>
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
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                color: "var(--color-text-muted)",
                margin: 0,
              }}
            >
              {t("startFirst")}
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              t={t}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

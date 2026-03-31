"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { REPORT_TYPES, type ReportType } from "@/lib/validations/report";

interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface ReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Icon per report type
const TYPE_ICONS: Record<ReportType, string> = {
  biting: "🎣",
  not_biting: "😔",
  good_conditions: "✅",
  bad_conditions: "⛈️",
  crowded: "👥",
};

const TYPE_LABELS_FR: Record<ReportType, string> = {
  biting: "Ça mord !",
  not_biting: "Ça ne mord pas",
  good_conditions: "Bonnes conditions",
  bad_conditions: "Mauvaises conditions",
  crowded: "Spot bondé",
};

export function ReportForm({ onSuccess, onCancel }: ReportFormProps) {
  const tc = useTranslations("common");

  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("biting");
  const [message, setMessage] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationMode, setLocationMode] = useState<"spot" | "gps">("spot");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user spots for selector
  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSpots(data);
      })
      .catch(() => {});
  }, []);

  // When spot is selected, populate lat/lon
  useEffect(() => {
    if (locationMode === "spot" && selectedSpotId) {
      const spot = spots.find((s) => s.id === selectedSpotId);
      if (spot) {
        setLatitude(spot.latitude);
        setLongitude(spot.longitude);
      }
    }
  }, [selectedSpotId, locationMode, spots]);

  function handleGPS() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError("Impossible d'obtenir la position GPS.");
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSpotId && locationMode === "spot") {
      setError("Sélectionnez un spot.");
      return;
    }
    if (latitude == null || longitude == null) {
      setError("Position requise.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId: selectedSpotId || spots[0]?.id,
          reportType,
          message: message || undefined,
          latitude,
          longitude,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-lg)",
        padding: "var(--spacing-lg)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-h3)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Nouveau signalement
      </h2>

      {/* Report type radio buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Type
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
          {REPORT_TYPES.map((type) => {
            const active = reportType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-xs)",
                  padding: "var(--spacing-xs) var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${active ? "var(--color-primary)" : "var(--color-surface-border)"}`,
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-small)",
                  cursor: "pointer",
                  transition: "all var(--duration-short)",
                }}
              >
                <span>{TYPE_ICONS[type]}</span>
                <span>{TYPE_LABELS_FR[type]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Localisation
        </label>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          {(["spot", "gps"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLocationMode(mode)}
              style={{
                padding: "var(--spacing-xs) var(--spacing-sm)",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${locationMode === mode ? "var(--color-primary)" : "var(--color-surface-border)"}`,
                background: locationMode === mode ? "var(--color-primary)" : "transparent",
                color: locationMode === mode ? "#fff" : "var(--color-text-secondary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                cursor: "pointer",
              }}
            >
              {mode === "spot" ? "Mes spots" : "Position GPS"}
            </button>
          ))}
        </div>

        {locationMode === "spot" ? (
          <select
            value={selectedSpotId}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            required
            style={{
              padding: "var(--spacing-sm)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-surface-border)",
              background: "var(--color-bg)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
            }}
          >
            <option value="">Choisir un spot...</option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
            <button
              type="button"
              onClick={handleGPS}
              disabled={gpsLoading}
              style={{
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-surface-border)",
                background: "var(--color-bg)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-small)",
                cursor: gpsLoading ? "not-allowed" : "pointer",
                opacity: gpsLoading ? 0.6 : 1,
              }}
            >
              {gpsLoading ? "Localisation..." : "Détecter ma position"}
            </button>
            {latitude != null && longitude != null && locationMode === "gps" && (
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                }}
              >
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Optional message */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
        <label
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Message (optionnel)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Détails sur les conditions..."
          style={{
            padding: "var(--spacing-sm)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-surface-border)",
            background: "var(--color-bg)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            resize: "vertical",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-micro)",
            color: "var(--color-text-muted)",
            textAlign: "right",
          }}
        >
          {message.length}/300
        </span>
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

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--spacing-sm)", justifyContent: "flex-end" }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "var(--spacing-sm) var(--spacing-lg)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-surface-border)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
              cursor: "pointer",
            }}
          >
            {tc("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "var(--spacing-sm) var(--spacing-lg)",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: submitting ? "var(--color-text-muted)" : "var(--color-primary)",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background var(--duration-short)",
          }}
        >
          {submitting ? tc("loading") : "Signaler"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SpotFormValues {
  name: string;
  description: string;
  isPublic: boolean;
  latitude: number;
  longitude: number;
}

interface SpotFormProps {
  /** If provided, form is in edit mode */
  initialValues?: Partial<SpotFormValues>;
  /** Pre-filled from map click */
  coordinates?: { lat: number; lng: number };
  onSubmit: (values: SpotFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function SpotForm({
  initialValues,
  coordinates,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: SpotFormProps) {
  const t = useTranslations("spots");
  const tc = useTranslations("common");

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? false);
  const [lat, setLat] = useState(
    initialValues?.latitude ?? coordinates?.lat ?? 0
  );
  const [lng, setLng] = useState(
    initialValues?.longitude ?? coordinates?.lng ?? 0
  );
  const [nameError, setNameError] = useState<string | null>(null);

  // Sync coordinates when map click updates them
  useEffect(() => {
    if (coordinates) {
      setLat(coordinates.lat);
      setLng(coordinates.lng);
    }
  }, [coordinates]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(t("spotName") + " est requis");
      return;
    }
    setNameError(null);
    await onSubmit({ name: name.trim(), description, isPublic, latitude: lat, longitude: lng });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}
    >
      {/* Name */}
      <Input
        label={t("spotName")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("spotName")}
        error={nameError ?? undefined}
        required
        disabled={loading}
      />

      {/* Memo / Description */}
      <div className="flex flex-col gap-[var(--spacing-xs)]">
        <label
          className="text-[var(--text-small)] font-medium text-[var(--color-text-secondary)]"
        >
          {t("memo")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={loading}
          style={{
            width: "100%",
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-bg)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-primary)",
            resize: "vertical",
            minHeight: 80,
            outline: "none",
          }}
          placeholder={t("memo")}
        />
      </div>

      {/* Coordinates (read-only display) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--spacing-sm)",
        }}
      >
        <Input
          label="Latitude"
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
          disabled={loading}
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
          disabled={loading}
        />
      </div>

      {/* Public toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--spacing-sm) var(--spacing-md)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
              color: "var(--color-text-primary)",
              fontWeight: 500,
            }}
          >
            {isPublic ? t("public") : t("private")}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              color: "var(--color-text-muted)",
            }}
          >
            {isPublic ? "Visible par tous les pêcheurs" : "Visible uniquement par toi"}
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          disabled={loading}
          style={{
            width: 48,
            height: 28,
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: isPublic ? "var(--color-water-temp)" : "var(--color-surface-border)",
            position: "relative",
            transition: "background 200ms",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: isPublic ? 23 : 3,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "white",
              transition: "left 200ms",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        </button>
      </div>

      {/* Server error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-small)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--spacing-sm)", justifyContent: "flex-end" }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          {tc("cancel")}
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SpotDetailData {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  userId: string;
  avgRating?: number | null;
  weatherSummary?: string;
}

interface SpotDetailProps {
  spot: SpotDetailData;
  currentUserId: string;
  onEdit?: (spot: SpotDetailData) => void;
  onDelete?: (spotId: string) => Promise<void>;
  onClose?: () => void;
  onRatingSubmit?: (spotId: string, rating: number) => Promise<void>;
  userRating?: number | null;
}

// ── Star rating ────────────────────────────────────────────────────────────

function StarRating({
  value,
  interactive,
  onChange,
}: {
  value: number | null;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  return (
    <div
      style={{ display: "flex", gap: 4 }}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Donner une note" : "Note"}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(null)}
          style={{
            background: "none",
            border: "none",
            cursor: interactive ? "pointer" : "default",
            padding: 0,
            fontSize: 24,
            color: star <= display ? "#f59e0b" : "var(--color-surface-border)",
            transition: "color 120ms",
            lineHeight: 1,
          }}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function SpotDetail({
  spot,
  currentUserId,
  onEdit,
  onDelete,
  onClose,
  onRatingSubmit,
  userRating,
}: SpotDetailProps) {
  const t = useTranslations("spots");
  const tc = useTranslations("common");

  const [deleting, setDeleting] = useState(false);
  const [rating, setRating] = useState<number | null>(userRating ?? null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const isOwner = spot.userId === currentUserId;

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Supprimer ce spot ?")) return;
    setDeleting(true);
    try {
      await onDelete(spot.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleRating(value: number) {
    if (!onRatingSubmit) return;
    setRating(value);
    setRatingLoading(true);
    try {
      await onRatingSubmit(spot.id, value);
    } finally {
      setRatingLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
        padding: "var(--spacing-md)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--spacing-sm)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-h3)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {spot.name}
          </h2>
          <div style={{ marginTop: 4 }}>
            <Badge variant={spot.isPublic ? "info" : "warning"}>
              {spot.isPublic ? t("public") : t("private")}
            </Badge>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: 4,
              borderRadius: "var(--radius-sm)",
              lineHeight: 1,
            }}
            aria-label={tc("back")}
          >
            ✕
          </button>
        )}
      </div>

      {/* Memo */}
      {spot.description && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {spot.description}
        </div>
      )}

      {/* Coordinates */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--spacing-sm)",
        }}
      >
        {[
          { label: "Latitude", value: spot.latitude.toFixed(5) },
          { label: "Longitude", value: spot.longitude.toFixed(5) },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--spacing-xs) var(--spacing-sm)",
            }}
          >
            <div style={{ fontSize: "var(--text-micro)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {label}
            </div>
            <div style={{ fontFamily: "var(--font-data)", fontSize: "var(--text-small)", color: "var(--color-text-primary)", fontWeight: 600 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Average rating */}
      {spot.avgRating != null && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
          <StarRating value={Math.round(spot.avgRating)} />
          <span style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
            {spot.avgRating.toFixed(1)} / 5
          </span>
        </div>
      )}

      {/* Weather summary */}
      {spot.weatherSummary && (
        <div
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-secondary)",
          }}
        >
          {spot.weatherSummary}
        </div>
      )}

      {/* User rating */}
      {onRatingSubmit && (
        <div>
          <div
            style={{
              fontSize: "var(--text-small)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: 6,
            }}
          >
            {t("rating")}
          </div>
          <div style={{ opacity: ratingLoading ? 0.5 : 1 }}>
            <StarRating value={rating} interactive onChange={handleRating} />
          </div>
        </div>
      )}

      {/* Owner actions */}
      {isOwner && (onEdit || onDelete) && (
        <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-xs)" }}>
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(spot)}>
              {tc("edit")}
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={handleDelete} loading={deleting}>
              {tc("delete")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

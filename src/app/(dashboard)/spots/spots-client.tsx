"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpotForm, type SpotFormValues } from "@/components/spots/spot-form";
import { SpotDetail, type SpotDetailData } from "@/components/spots/spot-detail";
import type { SpotMarker } from "@/components/map/fishing-map";

// ── Dynamic Leaflet map (no SSR) ───────────────────────────────────────────

const FishingMap = dynamic(
  () => import("@/components/map/fishing-map").then((m) => m.FishingMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 400,
          background: "var(--color-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body)",
        }}
        aria-busy="true"
        aria-label="Chargement de la carte"
      >
        Chargement de la carte...
      </div>
    ),
  }
);

// ── Types ──────────────────────────────────────────────────────────────────

interface Spot extends SpotMarker {
  createdAt: string;
}

type UIMode =
  | { kind: "idle" }
  | { kind: "adding"; lat: number; lng: number }
  | { kind: "editing"; spot: Spot }
  | { kind: "viewing"; spot: Spot };

// ── Client component ───────────────────────────────────────────────────────

export function SpotsClient({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations("spots");
  const tc = useTranslations("common");

  const [spots, setSpots] = useState<Spot[]>([]);
  const [search, setSearch] = useState("");
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [mode, setMode] = useState<UIMode>({ kind: "idle" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Fetch spots ────────────────────────────────────────────────────────

  const fetchSpots = useCallback(async () => {
    setLoadingSpots(true);
    try {
      const res = await fetch("/api/spots");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Spot[] = await res.json();
      setSpots(data);
    } catch {
      // silently fail — list stays empty
    } finally {
      setLoadingSpots(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // ── Filtered spots ─────────────────────────────────────────────────────

  const filteredSpots = spots.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Map click ──────────────────────────────────────────────────────────

  function handleMapClick(lat: number, lng: number) {
    setMode({ kind: "adding", lat, lng });
    setFormError(null);
  }

  // ── Spot click ─────────────────────────────────────────────────────────

  function handleSpotClick(spot: SpotMarker) {
    const full = spots.find((s) => s.id === spot.id);
    if (full) setMode({ kind: "viewing", spot: full });
  }

  // ── Save (create or update) ────────────────────────────────────────────

  async function handleSave(values: SpotFormValues) {
    setFormLoading(true);
    setFormError(null);
    try {
      if (mode.kind === "editing") {
        const res = await fetch(`/api/spots/${mode.spot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            isPublic: values.isPublic,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
        }
      } else {
        const res = await fetch("/api/spots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
        }
      }
      await fetchSpots();
      setMode({ kind: "idle" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setFormLoading(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function handleDelete(spotId: string) {
    const res = await fetch(`/api/spots/${spotId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchSpots();
    setMode({ kind: "idle" });
  }

  // ── Rate ───────────────────────────────────────────────────────────────

  async function handleRate(spotId: string, rating: number) {
    await fetch(`/api/spots/${spotId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    await fetchSpots();
  }

  // ── Panel content ──────────────────────────────────────────────────────

  function renderPanel() {
    if (mode.kind === "adding") {
      return (
        <div style={{ padding: "var(--spacing-md)" }}>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-h3)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 var(--spacing-md) 0",
            }}
          >
            {t("addSpot")}
          </h2>
          <SpotForm
            coordinates={{ lat: mode.lat, lng: mode.lng }}
            onSubmit={handleSave}
            onCancel={() => setMode({ kind: "idle" })}
            loading={formLoading}
            error={formError}
          />
        </div>
      );
    }

    if (mode.kind === "editing") {
      return (
        <div style={{ padding: "var(--spacing-md)" }}>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-h3)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 var(--spacing-md) 0",
            }}
          >
            {t("editSpot")}
          </h2>
          <SpotForm
            initialValues={{
              name: mode.spot.name,
              description: mode.spot.description ?? "",
              isPublic: mode.spot.isPublic,
              latitude: mode.spot.latitude,
              longitude: mode.spot.longitude,
            }}
            onSubmit={handleSave}
            onCancel={() => setMode({ kind: "idle" })}
            loading={formLoading}
            error={formError}
          />
        </div>
      );
    }

    if (mode.kind === "viewing") {
      return (
        <SpotDetail
          spot={mode.spot as SpotDetailData}
          currentUserId={currentUserId}
          onEdit={(s) => setMode({ kind: "editing", spot: s as Spot })}
          onDelete={handleDelete}
          onClose={() => setMode({ kind: "idle" })}
          onRatingSubmit={handleRate}
        />
      );
    }

    // Idle — list
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Search bar + Add button */}
        <div
          style={{
            padding: "var(--spacing-md)",
            display: "flex",
            gap: "var(--spacing-sm)",
            flexShrink: 0,
            borderBottom: "1px solid var(--color-surface-border)",
          }}
        >
          <div style={{ flex: 1 }}>
            <Input
              placeholder={`${tc("search")}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setMode({ kind: "adding", lat: 46.6034, lng: 1.8883 })}
          >
            + {t("addSpot")}
          </Button>
        </div>

        {/* Spot list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--spacing-sm) var(--spacing-md) var(--spacing-md)",
          }}
        >
          {loadingSpots ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--color-text-muted)",
                padding: "var(--spacing-xl)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body)",
              }}
            >
              {tc("loading")}
            </div>
          ) : filteredSpots.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-body)",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                {search ? tc("noResults") : t("noSpots")}
              </div>
              {!search && (
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-small)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {t("addFirst")}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-sm)",
                marginTop: "var(--spacing-sm)",
              }}
            >
              {filteredSpots.map((spot) => (
                <SpotListItem
                  key={spot.id}
                  spot={spot}
                  onClick={() => setMode({ kind: "viewing", spot })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "calc(100dvh - 56px - 2 * var(--spacing-lg))",
        minHeight: 500,
        gap: "var(--spacing-md)",
        overflow: "hidden",
      }}
    >
      {/* Map */}
      <div
        style={{
          flex: "1 1 0",
          minWidth: 0,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--color-surface-border)",
        }}
      >
        <FishingMap
          spots={filteredSpots}
          currentUserId={currentUserId}
          onMapClick={handleMapClick}
          onSpotClick={handleSpotClick}
          selectedPosition={mode.kind === "adding" ? { lat: mode.lat, lng: mode.lng } : null}
        />
      </div>

      {/* Sidebar */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Page title (only in idle mode) */}
        {mode.kind === "idle" && (
          <div style={{ padding: "var(--spacing-md) var(--spacing-md) 0" }}>
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-h3)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "0 0 var(--spacing-sm) 0",
              }}
            >
              {t("title")}
            </h1>
          </div>
        )}

        {renderPanel()}
      </div>
    </div>
  );
}

// ── Spot list item ─────────────────────────────────────────────────────────

function SpotListItem({ spot, onClick }: { spot: Spot; onClick: () => void }) {
  const t = useTranslations("spots");
  const stars = spot.avgRating != null ? Math.round(spot.avgRating) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: "var(--color-bg)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--spacing-sm) var(--spacing-md)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transition: "border-color var(--duration-short)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-water-temp)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-surface-border)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--spacing-sm)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {spot.name}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: spot.isPublic ? "var(--color-water-temp)" : "#f59e0b",
            flexShrink: 0,
          }}
        >
          {spot.isPublic ? t("public") : t("private")}
        </span>
      </div>

      {spot.description && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {spot.description}
        </span>
      )}

      {stars > 0 && (
        <div style={{ color: "#f59e0b", fontSize: 13, letterSpacing: 1 }}>
          {"★".repeat(stars)}
          {"☆".repeat(5 - stars)}
        </div>
      )}
    </button>
  );
}

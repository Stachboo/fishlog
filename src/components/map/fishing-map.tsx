"use client";

/**
 * FishingMap — Leaflet map with marker clustering, custom spot markers,
 * click-to-add, and RTL support.
 *
 * IMPORTANT: This component must be imported with dynamic() + ssr:false
 * because Leaflet relies on `window` at module load time.
 */

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-rtl.css";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SpotMarker {
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

interface FishingMapProps {
  spots: SpotMarker[];
  currentUserId: string;
  onMapClick?: (lat: number, lng: number) => void;
  onSpotClick?: (spot: SpotMarker) => void;
  center?: [number, number];
  zoom?: number;
}

// ── Marker colors by spot type ─────────────────────────────────────────────

function markerColor(spot: SpotMarker, currentUserId: string): string {
  if (spot.userId === currentUserId && !spot.isPublic) return "#f97316"; // orange — private
  if (spot.isPublic) return "#22d3ee";                                    // cyan — community/public
  return "#22c55e";                                                        // green — public own
}

function createSvgIcon(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 9.941 14 24 16 24s16-14.059 16-24C32 7.163 24.837 0 16 0z"
            fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
      <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
    </svg>
  `;
}

// ── Stars helper ───────────────────────────────────────────────────────────

function renderStars(avg: number | null | undefined): string {
  if (!avg) return "";
  const full = Math.round(avg);
  const stars = "★".repeat(full) + "☆".repeat(5 - full);
  return `<div style="color:#f59e0b;font-size:14px;letter-spacing:1px;">${stars}</div>`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function FishingMap({
  spots,
  currentUserId,
  onMapClick,
  onSpotClick,
  center = [46.6034, 1.8883], // France centroid
  zoom = 6,
}: FishingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);

  // ── Init map once ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic imports to avoid SSR issues (this component is always client-only)
    async function initMap() {
      const L = (await import("leaflet")).default;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await import("leaflet.markercluster");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");

      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Click-to-add listener
      if (onMapClick) {
        map.on("click", (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
      });

      mapRef.current = map;
      clusterGroupRef.current = clusterGroup;
      map.addLayer(clusterGroup);

      addSpotMarkers(L, spots);
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterGroupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update markers when spots change ─────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    import("leaflet").then(({ default: L }) => {
      addSpotMarkers(L, spots);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addSpotMarkers(
    L: any,
    spotsData: SpotMarker[]
  ) {
    if (!clusterGroupRef.current) return;
    clusterGroupRef.current.clearLayers();

    for (const spot of spotsData) {
      const color = markerColor(spot, currentUserId);
      const svgContent = createSvgIcon(color);

      const icon = L.divIcon({
        html: svgContent,
        className: "",
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      const popupHtml = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${spot.name}</div>
          ${spot.description ? `<div style="font-size:13px;color:#64748b;margin-bottom:6px;">${spot.description}</div>` : ""}
          ${renderStars(spot.avgRating)}
          ${spot.weatherSummary ? `<div style="font-size:12px;color:#475569;margin-top:4px;">${spot.weatherSummary}</div>` : ""}
          <div style="margin-top:6px;">
            <span style="
              display:inline-block;
              padding:2px 8px;
              border-radius:9999px;
              font-size:11px;
              font-weight:600;
              background:${color}22;
              color:${color === "#22d3ee" ? "#0891b2" : color === "#f97316" ? "#ea580c" : "#16a34a"};
            ">
              ${spot.isPublic ? "Public" : "Privé"}
            </span>
          </div>
        </div>
      `;

      const marker: Marker = L.marker([spot.latitude, spot.longitude], { icon });
      marker.bindPopup(popupHtml);

      if (onSpotClick) {
        marker.on("click", () => onSpotClick(spot));
      }

      clusterGroupRef.current.addLayer(marker);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: 400 }}
      aria-label="Carte des spots de pêche"
    />
  );
}

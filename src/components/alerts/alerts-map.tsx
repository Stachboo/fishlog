"use client";

/**
 * AlertsMap — Leaflet map showing community report markers.
 * Green: biting, Red: not_biting, Blue: other conditions.
 * Must be imported with dynamic() + ssr:false.
 */

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface ReportMarker {
  id: string;
  reportType: string;
  latitude: number;
  longitude: number;
  message?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  spot?: { name: string } | null;
  user?: { name?: string | null } | null;
}

interface AlertsMapProps {
  reports: ReportMarker[];
  center?: [number, number];
  zoom?: number;
}

function markerColor(reportType: string): string {
  if (reportType === "biting" || reportType === "good_conditions") return "#22c55e"; // green
  if (reportType === "not_biting" || reportType === "bad_conditions") return "#ef4444"; // red
  return "#3b82f6"; // blue for crowded / other
}

function reportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    biting: "Ça mord !",
    not_biting: "Ça ne mord pas",
    good_conditions: "Bonnes conditions",
    bad_conditions: "Mauvaises conditions",
    crowded: "Spot bondé",
  };
  return labels[type] ?? type;
}

function createCircleIcon(color: string): string {
  return `
    <div style="
      width:20px;height:20px;
      border-radius:50%;
      background:${color};
      border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>
  `;
}

export function AlertsMap({
  reports,
  center = [46.6034, 1.8883],
  zoom = 6,
}: AlertsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { center, zoom, zoomControl: true });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      addMarkers(L, reports);
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when reports change
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then(({ default: L }) => {
      addMarkers(L, reports);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  function addMarkers(L: typeof import("leaflet"), data: ReportMarker[]) {
    if (!mapRef.current) return;

    // Remove existing report layers (keep tile layer)
    mapRef.current.eachLayer((layer) => {
      if ((layer as { _isReportMarker?: boolean })._isReportMarker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    for (const report of data) {
      const color = markerColor(report.reportType);
      const icon = L.divIcon({
        html: createCircleIcon(color),
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -14],
      });

      const timeAgo = formatTimeAgo(report.createdAt);
      const expires = report.expiresAt ? formatExpiry(report.expiresAt) : "";

      const popupHtml = `
        <div style="min-width:160px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:14px;color:${color};margin-bottom:4px;">
            ${reportTypeLabel(report.reportType)}
          </div>
          ${report.spot ? `<div style="font-size:13px;font-weight:600;margin-bottom:2px;">${report.spot.name}</div>` : ""}
          ${report.message ? `<div style="font-size:12px;color:#64748b;margin-bottom:4px;">${report.message}</div>` : ""}
          <div style="font-size:11px;color:#94a3b8;">${timeAgo}</div>
          ${expires ? `<div style="font-size:11px;color:#f59e0b;">Expire ${expires}</div>` : ""}
        </div>
      `;

      const marker = L.marker([report.latitude, report.longitude], { icon });
      marker.bindPopup(popupHtml);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (marker as any)._isReportMarker = true;
      marker.addTo(mapRef.current);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: 380 }}
      aria-label="Carte des signalements communautaires"
    />
  );
}

// ── Time helpers ──────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Il y a ${hours}h`;
}

function formatExpiry(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "expiré";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `dans ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `dans ${hours}h${mins}` : `dans ${hours}h`;
}

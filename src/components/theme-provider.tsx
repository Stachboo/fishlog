"use client";

import { useCallback, useEffect, useState } from "react";
import SunCalc from "suncalc";

type ThemeMode = "auto" | "dark" | "light";

const STORAGE_KEY = "fishlog-theme";
const RECHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LAT = 48.8566; // Paris
const DEFAULT_LNG = 2.3522;

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "auto") return stored;
  return "auto";
}

function isNight(lat: number, lng: number): boolean {
  const now = new Date();
  const times = SunCalc.getTimes(now, lat, lng);
  return now < times.sunrise || now > times.sunset;
}

function applyTheme(mode: ThemeMode, lat: number, lng: number) {
  const html = document.documentElement;
  switch (mode) {
    case "dark":
      html.setAttribute("data-theme", "dark");
      break;
    case "light":
      html.setAttribute("data-theme", "light");
      break;
    case "auto":
      if (isNight(lat, lng)) {
        html.setAttribute("data-theme", "dark");
      } else {
        html.removeAttribute("data-theme");
      }
      break;
  }
}

function nextMode(current: ThemeMode): ThemeMode {
  const cycle: ThemeMode[] = ["auto", "dark", "light"];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

const modeIcon: Record<ThemeMode, string> = {
  light: "\u2600\uFE0F",
  dark: "\uD83C\uDF19",
  auto: "\uD83D\uDD04",
};

const modeLabel: Record<ThemeMode, string> = {
  auto: "Auto (solaire)",
  dark: "Mode sombre",
  light: "Mode clair",
};

export function ThemeProvider() {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  // Get geolocation once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Fallback to Paris — already set as default
      },
    );
  }, []);

  // Load stored mode on mount
  useEffect(() => {
    setMode(getStoredMode());
  }, []);

  // Apply theme whenever mode or coords change, and recheck every 5 min
  const apply = useCallback(() => {
    applyTheme(mode, coords.lat, coords.lng);
  }, [mode, coords]);

  useEffect(() => {
    apply();
    const interval = setInterval(apply, RECHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [apply]);

  const handleToggle = () => {
    const next = nextMode(mode);
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={modeLabel[mode]}
      aria-label={modeLabel[mode]}
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        width: 36,
        height: 36,
        borderRadius: "50%",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
        padding: 0,
        transition: "opacity 0.2s",
      }}
    >
      {modeIcon[mode]}
    </button>
  );
}

"use client";

import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HourlyForecast {
  time: string;
  temp: number;
  windSpeed: number;
  windGust: number;
  windDir: number;
  pressure: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
}

export interface HourlyForecastBarProps {
  hourly: HourlyForecast[];
}

// ---------------------------------------------------------------------------
// Weather icons (pure SVG, 24x24)
// ---------------------------------------------------------------------------

function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#fbbf24" />
      <g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}

function PartlyCloudyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="8" r="3.5" fill="#fbbf24" />
      <g stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round">
        <line x1="10" y1="2" x2="10" y2="3.5" />
        <line x1="4.5" y1="4.5" x2="5.6" y2="5.6" />
        <line x1="2" y1="8" x2="3.5" y2="8" />
        <line x1="15.5" y1="4.5" x2="14.4" y2="5.6" />
        <line x1="16.5" y1="8" x2="18" y2="8" />
      </g>
      <path
        d="M8 20h10a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 7 13.5 3 3 0 0 0 8 20z"
        fill="#7a8ba3"
      />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 20h12a5 5 0 0 0 0-10h-.5A6.5 6.5 0 0 0 5 12a4 4 0 0 0 1 8z"
        fill="#7a8ba3"
      />
    </svg>
  );
}

function FogIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <g stroke="#7a8ba3" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="8" x2="21" y2="8" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="3" y1="16" x2="21" y2="16" />
      </g>
    </svg>
  );
}

function DrizzleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 14h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 8a3 3 0 0 0 1 6z"
        fill="#7a8ba3"
      />
      <g stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round">
        <line x1="8" y1="16" x2="7.5" y2="18" />
        <line x1="12" y1="16" x2="11.5" y2="18" />
        <line x1="16" y1="16" x2="15.5" y2="18" />
      </g>
    </svg>
  );
}

function RainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 13h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 7a3 3 0 0 0 1 6z"
        fill="#7a8ba3"
      />
      <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
        <line x1="7" y1="15" x2="6" y2="19" />
        <line x1="11" y1="15" x2="10" y2="19" />
        <line x1="15" y1="15" x2="14" y2="19" />
        <line x1="19" y1="15" x2="18" y2="19" />
      </g>
    </svg>
  );
}

function HeavyRainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 12h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 6a3 3 0 0 0 1 6z"
        fill="#7a8ba3"
      />
      <g stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
        <line x1="7" y1="14" x2="5.5" y2="20" />
        <line x1="11" y1="14" x2="9.5" y2="20" />
        <line x1="15" y1="14" x2="13.5" y2="20" />
        <line x1="19" y1="14" x2="17.5" y2="20" />
      </g>
    </svg>
  );
}

function SnowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 13h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 7a3 3 0 0 0 1 6z"
        fill="#7a8ba3"
      />
      <g fill="#e0e7ff">
        <circle cx="8" cy="16" r="1.2" />
        <circle cx="12" cy="18" r="1.2" />
        <circle cx="16" cy="16" r="1.2" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="14" cy="20" r="1" />
      </g>
    </svg>
  );
}

function ThunderstormIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 12h12a4 4 0 0 0 0-8h-.5A5.5 5.5 0 0 0 5 6a3 3 0 0 0 1 6z"
        fill="#7a8ba3"
      />
      <polygon points="13,13 10,18 12,18 11,22 16,16 13,16 15,13" fill="#fbbf24" />
      <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
        <line x1="7" y1="14" x2="6" y2="18" />
        <line x1="19" y1="14" x2="18" y2="18" />
      </g>
    </svg>
  );
}

function WindArrow({ degrees }: { degrees: number }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ transform: `rotate(${degrees}deg)` }}
    >
      <path d="M6 1 L9 9 L6 7 L3 9 Z" fill="#4ade80" opacity={0.7} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Weather code → icon resolver
// ---------------------------------------------------------------------------

function getWeatherIcon(code: number) {
  if (code === 0) return <SunIcon />;
  if (code >= 1 && code <= 3) return <PartlyCloudyIcon />;
  if (code === 45 || code === 48) return <FogIcon />;
  if (code >= 51 && code <= 55) return <DrizzleIcon />;
  if (code >= 61 && code <= 65) return <RainIcon />;
  if (code >= 71 && code <= 75) return <SnowIcon />;
  if (code >= 80 && code <= 82) return <HeavyRainIcon />;
  if (code >= 95 && code <= 99) return <ThunderstormIcon />;
  return <CloudIcon />;
}

// ---------------------------------------------------------------------------
// Helper: format hour label ("14h")
// ---------------------------------------------------------------------------

function formatHour(isoTime: string): string {
  const d = new Date(isoTime);
  return `${d.getHours()}h`;
}

// ---------------------------------------------------------------------------
// Detect current hour index
// ---------------------------------------------------------------------------

function getCurrentHourIndex(hourly: HourlyForecast[]): number {
  const now = new Date();
  const currentHour = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  ).getTime();

  return hourly.findIndex((h) => {
    const t = new Date(h.time).getTime();
    return t >= currentHour;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HourlyForecastBar({ hourly }: HourlyForecastBarProps) {
  const t = useTranslations("dashboard");
  const currentIdx = getCurrentHourIndex(hourly);

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-surface-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-md)",
      }}
    >
      {/* Hide scrollbar globally for this component */}
      <style>{`
        .hourly-forecast-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Title */}
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-micro)",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-text-muted)",
          marginBottom: "var(--spacing-sm)",
        }}
      >
        {t("nextHours")}
      </div>

      {/* Scroll area */}
      <div
        className="hourly-forecast-scroll"
        style={{
          display: "flex",
          gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
          WebkitOverflowScrolling: "touch",
        }}
      >
        {hourly.map((h, i) => {
          const isCurrent = i === currentIdx;
          const showGusts = h.windGust > h.windSpeed * 1.5;

          return (
            <div
              key={h.time}
              style={{
                width: 64,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "var(--spacing-sm) 0",
                background: isCurrent
                  ? "var(--color-surface-hover)"
                  : "transparent",
                borderRadius: isCurrent ? 8 : 0,
                borderLeft:
                  i > 0
                    ? "1px solid rgba(30, 52, 84, 0.3)"
                    : "none",
                position: "relative",
              }}
            >
              {/* Hour */}
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: "var(--text-micro)",
                  color: isCurrent
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                  fontWeight: isCurrent ? 600 : 500,
                }}
              >
                {formatHour(h.time)}
              </span>

              {/* Weather icon */}
              <div style={{ lineHeight: 0 }}>{getWeatherIcon(h.weatherCode)}</div>

              {/* Temperature */}
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-primary)",
                  fontWeight: 700,
                }}
              >
                {Math.round(h.temp)}°
              </span>

              {/* Wind speed */}
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: "var(--text-micro)",
                  color: "var(--color-wind-speed)",
                }}
              >
                {Math.round(h.windSpeed)} km/h
              </span>

              {/* Gusts (if significant) */}
              {showGusts && (
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: "0.5625rem",
                    color: "var(--color-wind-speed)",
                    opacity: 0.7,
                  }}
                >
                  ↑ {Math.round(h.windGust)}
                </span>
              )}

              {/* Wind direction arrow */}
              <WindArrow degrees={h.windDir} />

              {/* Precipitation */}
              {h.precipitation > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: "var(--text-micro)",
                    color: "#60a5fa",
                  }}
                >
                  💧 {h.precipitation}mm
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

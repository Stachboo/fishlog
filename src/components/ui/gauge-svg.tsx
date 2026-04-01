"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface GaugeSVGProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  /** CSS color string for the arc and value text */
  colorScale: string;
  icon?: ReactNode;
  className?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
// Full semicircle: from 180° to 360° (bottom half of circle — appears as top arc)
// We use startAngle=-210° endAngle=30° for a 240° sweep (typical gauge feel)
const START_ANGLE = -210; // degrees
const END_ANGLE = 30;     // degrees
const SWEEP = END_ANGLE - START_ANGLE; // 240°

const CX = SIZE / 2;
const CY = SIZE / 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngleDeg);
  const end = polarToCartesian(cx, cy, r, endAngleDeg);
  const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// Arc circumference for the full sweep
const ARC_LENGTH = (SWEEP / 360) * 2 * Math.PI * RADIUS;

// ── Component ──────────────────────────────────────────────────────────────

export function GaugeSVG({
  value,
  min,
  max,
  unit,
  label,
  colorScale,
  icon,
  className,
}: GaugeSVGProps) {
  const [visible, setVisible] = useState(false);
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: only animate when gauge enters viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Trigger animation after visibility is set (allows CSS transition)
  useEffect(() => {
    if (visible) {
      // rAF to ensure layout is flushed before transition starts
      const id = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(id);
    }
  }, [visible]);

  // Clamp value
  const clampedValue = Math.min(Math.max(value, min), max);
  const ratio = max === min ? 0 : (clampedValue - min) / (max - min);

  // stroke-dashoffset: full = hidden, 0 = fully drawn
  const dashOffset = ARC_LENGTH * (1 - ratio);
  const displayedOffset = animated ? dashOffset : ARC_LENGTH;

  // Arc paths
  const trackPath = describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE);
  const valuePath = describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE);

  // Format value: no decimals for large values, 1 decimal otherwise
  const formattedValue =
    Math.abs(clampedValue) >= 100
      ? Math.round(clampedValue).toString()
      : clampedValue % 1 === 0
      ? clampedValue.toString()
      : clampedValue.toFixed(1);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex flex-col items-center group", className)}
      style={{ width: SIZE, minHeight: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        role="meter"
        aria-valuenow={clampedValue}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={`${label}: ${formattedValue} ${unit}`}
        style={{
          // GPU-accelerated hover glow via CSS custom property
          filter: "drop-shadow(0 0 0px transparent)",
          transition: "filter 200ms ease-out",
        }}
        // Inline hover: upgrade to colored glow via style manipulation
        // (Tailwind group-hover can't interpolate CSS vars into filter strings)
        onMouseEnter={(e) => {
          (e.currentTarget as SVGSVGElement).style.filter = `drop-shadow(0 0 8px ${colorScale}26)`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as SVGSVGElement).style.filter = "drop-shadow(0 0 0px transparent)";
        }}
      >
        {/* Track arc */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--color-surface-border)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={valuePath}
          fill="none"
          stroke={colorScale}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={displayedOffset}
          style={{
            transition: animated
              ? "stroke-dashoffset 400ms cubic-bezier(0,0,0.2,1)"
              : "none",
            willChange: "stroke-dashoffset",
          }}
        />

        {/* Center: icon (top) */}
        {icon && (
          <foreignObject
            x={CX - 16}
            y={CY - 32}
            width={32}
            height={32}
            aria-hidden="true"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                color: colorScale,
                opacity: 0.8,
              }}
            >
              {icon}
            </div>
          </foreignObject>
        )}

        {/* Center: value text */}
        <text
          x={CX}
          y={CY + (icon ? 16 : 8)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colorScale}
          fontFamily="var(--font-data)"
          fontSize={icon ? 20 : 24}
          fontWeight={600}
          letterSpacing="-0.5"
        >
          {formattedValue}
        </text>

        {/* Center: unit */}
        <text
          x={CX}
          y={CY + (icon ? 34 : 30)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-text-muted)"
          fontFamily="var(--font-data)"
          fontSize={11}
          fontWeight={400}
        >
          {unit}
        </text>
      </svg>

      {/* Label below SVG */}
      <span
        className="mt-[-8px] text-center text-[var(--color-text-secondary)]"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-small)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

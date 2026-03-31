"use client";

import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface CompassSVGProps {
  /** Wind direction in degrees (0 = North, 90 = East, …) */
  direction: number;
  /** Label displayed below the compass */
  label: string;
  size?: number;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function CompassSVG({
  direction,
  label,
  size = 120,
  className,
}: CompassSVGProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR - 8;

  // Normalize direction to 0–360
  const normalizedDir = ((direction % 360) + 360) % 360;

  // Cardinal label positions (on outerR - 2)
  const cardinalR = innerR - 10;
  const cardinals = [
    { label: "N", angle: -90 },
    { label: "E", angle: 0 },
    { label: "S", angle: 90 },
    { label: "W", angle: 180 },
  ] as const;

  function toXY(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Arrow tip and tail (direction = "wind is going TO this direction")
  const arrowLen = innerR - 6;
  const arrowTailLen = arrowLen * 0.55;
  const arrowAngle = normalizedDir - 90; // 0° = North = -90° in SVG space

  const tip = toXY(arrowAngle, arrowLen);
  const tail = toXY(arrowAngle + 180, arrowTailLen);

  // Arrow head side points
  const headSize = 8;
  const leftHead = toXY(arrowAngle - 140, headSize);
  const rightHead = toXY(arrowAngle + 140, headSize);

  // Tick marks for N/E/S/W
  const tickOuter = outerR - 2;
  const tickInner = outerR - 8;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Direction du vent: ${normalizedDir}°`}
      >
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="none"
          stroke="var(--color-surface-border)"
          strokeWidth={1.5}
        />

        {/* Inner background */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="var(--color-surface)"
          opacity={0.6}
        />

        {/* Cardinal tick marks */}
        {cardinals.map(({ label: cl, angle }) => {
          const outerPt = toXY(angle, tickOuter);
          const innerPt = toXY(angle, tickInner);
          return (
            <line
              key={cl}
              x1={outerPt.x}
              y1={outerPt.y}
              x2={innerPt.x}
              y2={innerPt.y}
              stroke={cl === "N" ? "var(--color-wind-speed)" : "var(--color-text-muted)"}
              strokeWidth={cl === "N" ? 2 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Cardinal labels */}
        {cardinals.map(({ label: cl, angle }) => {
          const pos = toXY(angle, cardinalR);
          return (
            <text
              key={cl}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={cl === "N" ? "var(--color-wind-speed)" : "var(--color-text-muted)"}
              fontFamily="var(--font-data)"
              fontSize={9}
              fontWeight={cl === "N" ? 700 : 400}
            >
              {cl}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="var(--color-text-secondary)" />

        {/* Arrow tail */}
        <line
          x1={cx}
          y1={cy}
          x2={tail.x}
          y2={tail.y}
          stroke="var(--color-text-muted)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* Arrow shaft */}
        <line
          x1={cx}
          y1={cy}
          x2={tip.x}
          y2={tip.y}
          stroke="var(--color-wind-speed)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Arrow head */}
        <polygon
          points={`${tip.x},${tip.y} ${leftHead.x},${leftHead.y} ${rightHead.x},${rightHead.y}`}
          fill="var(--color-wind-speed)"
        />
      </svg>

      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-small)",
          color: "var(--color-text-secondary)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

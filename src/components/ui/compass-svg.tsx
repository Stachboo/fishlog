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

// ── Helpers ────────────────────────────────────────────────────────────────

function degreesToCardinal(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(((deg % 360 + 360) % 360) / 22.5) % 16];
}

function polarToXY(cx: number, cy: number, angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Component ──────────────────────────────────────────────────────────────

export function CompassSVG({
  direction,
  label,
  size = 140,
  className,
}: CompassSVGProps) {
  const cx = size / 2;
  const cy = size / 2;
  const normalizedDir = ((direction % 360) + 360) % 360;
  const cardinal = degreesToCardinal(normalizedDir);

  // Radii (proportional to size)
  const outerR = size / 2 - 2;
  const bezelWidth = size * 0.06;
  const innerR = outerR - bezelWidth;
  const dialR = innerR - 1;
  const tickOuterR = innerR - 2;
  const tickMajorInnerR = tickOuterR - size * 0.07;
  const tickMinorInnerR = tickOuterR - size * 0.04;
  const tickSmallInnerR = tickOuterR - size * 0.025;
  const cardinalR = tickMajorInnerR - size * 0.07;
  const needleLen = dialR * 0.62;
  const needleTailLen = dialR * 0.38;
  const needleWidth = size * 0.045;
  const pivotR = size * 0.045;

  // Cardinal directions at 0, 90, 180, 270
  const cardinals = [
    { lbl: "N", angle: 0 },
    { lbl: "E", angle: 90 },
    { lbl: "S", angle: 180 },
    { lbl: "W", angle: 270 },
  ];

  // Intercardinal directions at 45, 135, 225, 315
  const intercardinals = [
    { angle: 45 },
    { angle: 135 },
    { angle: 225 },
    { angle: 315 },
  ];

  // Degree tick marks every 30 degrees (excluding cardinal/intercardinal)
  const degreeTicks: number[] = [];
  for (let i = 0; i < 360; i += 30) {
    if (i % 90 !== 0 && i % 45 !== 0) {
      degreeTicks.push(i);
    }
  }

  // Small ticks every 10 degrees (excluding above)
  const smallTicks: number[] = [];
  for (let i = 0; i < 360; i += 10) {
    if (i % 30 !== 0) {
      smallTicks.push(i);
    }
  }

  // Needle diamond points (before rotation — pointing north)
  const needleTip = { x: cx, y: cy - needleLen };
  const needleTail = { x: cx, y: cy + needleTailLen };
  const needleLeft = { x: cx - needleWidth, y: cy };
  const needleRight = { x: cx + needleWidth, y: cy };

  const northHalf = `M ${needleTip.x} ${needleTip.y} L ${needleRight.x} ${needleRight.y} L ${needleLeft.x} ${needleLeft.y} Z`;
  const southHalf = `M ${needleTail.x} ${needleTail.y} L ${needleRight.x} ${needleRight.y} L ${needleLeft.x} ${needleLeft.y} Z`;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Boussole de vent: ${normalizedDir}° ${cardinal} — ${label}`}
      >
        <defs>
          {/* Metallic bezel gradient */}
          <linearGradient id="bezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="25%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="75%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>

          {/* Inner bezel ring (darker edge) */}
          <linearGradient id="bezelInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>

          {/* Dial radial gradient — concave look */}
          <radialGradient id="dialGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a2d4d" />
            <stop offset="60%" stopColor="#12213b" />
            <stop offset="100%" stopColor="#0a1628" />
          </radialGradient>

          {/* Needle north gradient (red) */}
          <linearGradient id="needleNorthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          {/* Needle south gradient (silver) */}
          <linearGradient id="needleSouthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8ecf1" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          {/* Pivot ball bearing gradient */}
          <radialGradient id="pivotGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#4b5563" />
          </radialGradient>

          {/* Pivot highlight */}
          <radialGradient id="pivotHighlight" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Outer glow on dial */}
          <radialGradient id="dialEdgeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(100,140,200,0.08)" />
          </radialGradient>

          {/* Drop shadow filter for bezel */}
          <filter id="bezelShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>

          {/* Needle shadow filter */}
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
          </filter>

          {/* Inner shadow for concave effect */}
          <filter id="innerShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset dx="0" dy="1" result="offset" />
            <feComposite in="SourceGraphic" in2="offset" operator="over" />
          </filter>
        </defs>

        {/* ── Outer bezel ring (metallic) ── */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="url(#bezelGrad)"
          filter="url(#bezelShadow)"
        />

        {/* Inner bezel edge */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR + 1}
          fill="url(#bezelInnerGrad)"
        />

        {/* ── Dial face ── */}
        <circle
          cx={cx}
          cy={cy}
          r={dialR}
          fill="url(#dialGrad)"
        />

        {/* Subtle edge glow */}
        <circle
          cx={cx}
          cy={cy}
          r={dialR}
          fill="url(#dialEdgeGlow)"
        />

        {/* ── Small tick marks every 10° ── */}
        {smallTicks.map((angle) => {
          const p1 = polarToXY(cx, cy, angle, tickOuterR);
          const p2 = polarToXY(cx, cy, angle, tickSmallInnerR);
          return (
            <line
              key={`st-${angle}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#2a3f5f"
              strokeWidth={0.75}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Degree ticks every 30° (minor, excluding cardinals) ── */}
        {degreeTicks.map((angle) => {
          const p1 = polarToXY(cx, cy, angle, tickOuterR);
          const p2 = polarToXY(cx, cy, angle, tickMinorInnerR);
          return (
            <line
              key={`dt-${angle}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#3d5a80"
              strokeWidth={1}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Intercardinal tick marks (NE, SE, SW, NW) ── */}
        {intercardinals.map(({ angle }) => {
          const p1 = polarToXY(cx, cy, angle, tickOuterR);
          const p2 = polarToXY(cx, cy, angle, tickMinorInnerR);
          return (
            <line
              key={`ic-${angle}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#4a5d78"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Cardinal tick marks (N, E, S, W) ── */}
        {cardinals.map(({ lbl, angle }) => {
          const p1 = polarToXY(cx, cy, angle, tickOuterR);
          const p2 = polarToXY(cx, cy, angle, tickMajorInnerR);
          return (
            <line
              key={`ct-${lbl}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={lbl === "N" ? "#f97316" : "#7a8ba3"}
              strokeWidth={lbl === "N" ? 2 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Cardinal labels ── */}
        {cardinals.map(({ lbl, angle }) => {
          const pos = polarToXY(cx, cy, angle, cardinalR);
          const isNorth = lbl === "N";
          return (
            <text
              key={`cl-${lbl}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isNorth ? "#f97316" : "#7a8ba3"}
              fontFamily="var(--font-data)"
              fontSize={isNorth ? size * 0.09 : size * 0.072}
              fontWeight={isNorth ? 800 : 600}
              style={isNorth ? { textShadow: "0 0 6px rgba(249,115,22,0.4)" } : undefined}
            >
              {lbl}
            </text>
          );
        })}

        {/* ── Rotating needle group ── */}
        <g
          style={{
            transform: `rotate(${normalizedDir}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          filter="url(#needleShadow)"
        >
          {/* North half of needle (red) */}
          <path d={northHalf} fill="url(#needleNorthGrad)" />

          {/* Subtle highlight on north half */}
          <path
            d={`M ${cx} ${needleTip.y} L ${cx + needleWidth * 0.3} ${cy} L ${cx} ${cy} Z`}
            fill="rgba(255,255,255,0.1)"
          />

          {/* South half of needle (silver) */}
          <path d={southHalf} fill="url(#needleSouthGrad)" />

          {/* Subtle shadow on south half */}
          <path
            d={`M ${cx} ${cy} L ${cx - needleWidth * 0.3} ${cy} L ${cx} ${needleTail.y} Z`}
            fill="rgba(0,0,0,0.15)"
          />

          {/* Needle outline for crispness */}
          <path
            d={`M ${needleTip.x} ${needleTip.y} L ${needleRight.x} ${needleRight.y} L ${needleTail.x} ${needleTail.y} L ${needleLeft.x} ${needleLeft.y} Z`}
            fill="none"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.5}
          />
        </g>

        {/* ── Center pivot (ball bearing) ── */}
        <circle
          cx={cx}
          cy={cy}
          r={pivotR}
          fill="url(#pivotGrad)"
          stroke="#374151"
          strokeWidth={0.5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={pivotR * 0.7}
          fill="url(#pivotHighlight)"
        />

        {/* ── Degree readout (bottom of dial) ── */}
        <text
          x={cx}
          y={cy + dialR * 0.52}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#4a5d78"
          fontFamily="var(--font-data)"
          fontSize={size * 0.065}
          fontWeight={500}
        >
          {`${normalizedDir}°`}
        </text>

        {/* ── Cardinal direction readout (above degree) ── */}
        <text
          x={cx}
          y={cy + dialR * 0.34}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#e8ecf1"
          fontFamily="var(--font-data)"
          fontSize={size * 0.085}
          fontWeight={700}
        >
          {cardinal}
        </text>
      </svg>

      {/* Label below the compass */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "var(--color-text-secondary)",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

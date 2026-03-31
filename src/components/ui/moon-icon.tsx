"use client";

// ── Types ──────────────────────────────────────────────────────────────────

interface MoonIconProps {
  /**
   * Moon phase as a float 0–1:
   *   0.0 = new moon (dark)
   *   0.25 = first quarter (right half lit)
   *   0.5 = full moon
   *   0.75 = last quarter (left half lit)
   *   1.0 = new moon (dark, same as 0)
   */
  phase: number;
  size?: number;
  className?: string;
}

// ── Helper ─────────────────────────────────────────────────────────────────

/**
 * Returns the SVG path describing the lit crescent/disc for a given phase.
 *
 * The moon circle has center (cx,cy) and radius R.
 * We draw the lit portion using two arcs:
 *  - The outer arc always traces the lit semicircle
 *  - The inner ellipse (terminator) transitions from concave (waxing)
 *    through flat (quarter) to convex (full) to concave (waning)
 *
 * Phase mapping:
 *   0.0  → new (no light)
 *   0.25 → first quarter (right half)
 *   0.5  → full
 *   0.75 → last quarter (left half)
 */
function moonPath(phase: number, cx: number, cy: number, R: number): string {
  // Normalize to 0–1
  const p = ((phase % 1) + 1) % 1;

  if (p < 0.02 || p > 0.98) {
    // New moon: almost nothing — tiny circle for visual presence
    return "";
  }

  if (p > 0.48 && p < 0.52) {
    // Full moon: complete disc
    return `M ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy}`;
  }

  const isWaxing = p < 0.5; // 0→0.5 waxing (right side lit), 0.5→1 waning (left side lit)

  // The lit limb is always the outer circle arc.
  // The terminator is an ellipse whose x-radius goes:
  //   - waxing 0→0.25: R→0 (concave, = full crescent with inner arc)
  //   - waxing 0.25→0.5: 0→R (convex, gibbous)
  //   - waning 0.5→0.75: R→0 (convex waning gibbous)
  //   - waning 0.75→1: 0→R (concave, crescent)

  let ellipseRx: number;
  let terminatorSweepRight: boolean; // which way the inner arc sweeps

  if (isWaxing) {
    if (p <= 0.25) {
      // Crescent (waxing): right side lit, inner arc concave (sweeps right→up→left)
      ellipseRx = R * (1 - p / 0.25);       // R→0
      terminatorSweepRight = true;           // inner arc is concave (same side = counter-sweep)
    } else {
      // Gibbous (waxing): right side lit, inner arc convex
      ellipseRx = R * ((p - 0.25) / 0.25);  // 0→R
      terminatorSweepRight = false;
    }
  } else {
    const q = p - 0.5;
    if (q <= 0.25) {
      // Gibbous (waning): left side lit, inner arc convex
      ellipseRx = R * (1 - q / 0.25);       // R→0
      terminatorSweepRight = false;
    } else {
      // Crescent (waning): left side lit, inner arc concave
      ellipseRx = R * ((q - 0.25) / 0.25);  // 0→R
      terminatorSweepRight = true;
    }
  }

  const top = { x: cx, y: cy - R };
  const bottom = { x: cx, y: cy + R };

  if (isWaxing) {
    // Lit on the right: outer arc goes top → right → bottom (large arc, clockwise)
    // Terminator goes bottom → top through the left (the inner ellipse)
    const sweep1 = 1; // outer arc clockwise
    const sweep2 = terminatorSweepRight ? 1 : 0; // inner terminator
    return (
      `M ${top.x} ${top.y} ` +
      `A ${R} ${R} 0 0 ${sweep1} ${bottom.x} ${bottom.y} ` +
      `A ${ellipseRx} ${R} 0 0 ${sweep2} ${top.x} ${top.y}`
    );
  } else {
    // Lit on the left: outer arc goes top → left → bottom (large arc, counter-clockwise)
    const sweep1 = 0;
    const sweep2 = terminatorSweepRight ? 0 : 1;
    return (
      `M ${top.x} ${top.y} ` +
      `A ${R} ${R} 0 0 ${sweep1} ${bottom.x} ${bottom.y} ` +
      `A ${ellipseRx} ${R} 0 0 ${sweep2} ${top.x} ${top.y}`
    );
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function MoonIcon({ phase, size = 32, className }: MoonIconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 2;

  const p = ((phase % 1) + 1) % 1;
  const isNew = p < 0.02 || p > 0.98;
  const isFull = p > 0.48 && p < 0.52;

  const litPath = moonPath(phase, cx, cy, R);

  // Phase label for accessibility
  let phaseLabel = "Lune croissante";
  if (isNew) phaseLabel = "Nouvelle lune";
  else if (isFull) phaseLabel = "Pleine lune";
  else if (p > 0.23 && p < 0.27) phaseLabel = "Premier quartier";
  else if (p > 0.73 && p < 0.77) phaseLabel = "Dernier quartier";
  else if (p > 0.5) phaseLabel = "Lune décroissante";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={phaseLabel}
      className={className}
    >
      {/* Dark moon disc (always visible as background) */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="var(--color-surface)"
        stroke="var(--color-surface-border)"
        strokeWidth={1}
      />

      {/* New moon: dim outline only */}
      {isNew && (
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="var(--color-moon)"
          strokeWidth={1}
          opacity={0.3}
        />
      )}

      {/* Lit portion */}
      {!isNew && litPath && (
        <path
          d={litPath}
          fill="var(--color-moon)"
          fillRule="nonzero"
        />
      )}
    </svg>
  );
}

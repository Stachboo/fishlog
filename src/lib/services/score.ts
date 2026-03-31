// ── Fishing Score Algorithm ────────────────────────────────────────────────
// Computes a fishing score 0–100 from weather conditions.
// Each factor contributes a bounded number of points (total max = 100).

interface ScoreInput {
  airTemp: number;         // °C
  waterTemp: number | null; // °C — null for inland locations
  windSpeed: number;       // km/h
  pressure: number;        // hPa
  pressurePrev?: number;   // hPa one hour ago (optional, for trend)
  moonPhase: number;       // 0–1
  sunriseISO: string;      // ISO datetime
  sunsetISO: string;       // ISO datetime
  nowISO?: string;         // ISO datetime (defaults to now)
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Linear interpolation clamped to [0,1] */
function lerp01(value: number, lo: number, hi: number): number {
  if (hi === lo) return 0;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}

/** Score for air temperature (max 15 pts) */
function scoreAirTemp(temp: number): number {
  // Optimal 15–25°C
  if (temp >= 15 && temp <= 25) return 15;
  if (temp >= 5 && temp < 15) return Math.round(lerp01(temp, 5, 15) * 15);
  if (temp > 25 && temp <= 35) return Math.round(lerp01(temp, 35, 25) * 15);
  return 0; // <5°C or >35°C
}

/** Score for water temperature (max 20 pts) */
function scoreWaterTemp(temp: number | null): number {
  if (temp === null) return 10; // inland — partial credit (no penalty)
  if (temp >= 12 && temp <= 20) return 20;
  if (temp >= 5 && temp < 12) return Math.round(lerp01(temp, 5, 12) * 20);
  if (temp > 20 && temp <= 28) return Math.round(lerp01(temp, 28, 20) * 20);
  return 0; // <5°C or >28°C
}

/** Score for wind speed (max 15 pts) */
function scoreWindSpeed(speed: number): number {
  if (speed < 15) return 15;
  if (speed <= 30) return 8;
  return 0;
}

/** Score for atmospheric pressure (max 15 pts) */
function scorePressure(pressure: number): number {
  // Optimal 1010–1020 hPa
  if (pressure >= 1010 && pressure <= 1020) return 15;
  if (pressure >= 995 && pressure < 1010) return Math.round(lerp01(pressure, 995, 1010) * 15);
  if (pressure > 1020 && pressure <= 1035) return Math.round(lerp01(pressure, 1035, 1020) * 15);
  return 5; // still some value at extreme pressures
}

/** Score for moon phase (max 10 pts) */
function scoreMoonPhase(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  // New moon ~0, Full moon ~0.5 — both are optimal
  const distFromNew = Math.min(p, 1 - p);           // 0 at new, 0.5 at full
  const distFromFull = Math.abs(p - 0.5);           // 0 at full, 0.5 at new/end
  const minDist = Math.min(distFromNew, distFromFull); // 0 at new/full, 0.25 at quarter
  if (minDist <= 0.05) return 10; // near new or full
  if (minDist <= 0.15) return 5;  // near quarter
  return 3;
}

/** Score for time of day (max 15 pts) */
function scoreTimeOfDay(sunriseISO: string, sunsetISO: string, nowISO: string): number {
  const now = new Date(nowISO).getTime();
  const sunrise = new Date(sunriseISO).getTime();
  const sunset = new Date(sunsetISO).getTime();

  if (isNaN(sunrise) || isNaN(sunset)) return 5; // fallback

  const dawn = sunrise - 30 * 60 * 1000;  // 30 min before sunrise
  const dawnEnd = sunrise + 90 * 60 * 1000; // 90 min after sunrise
  const dusk = sunset - 60 * 60 * 1000;    // 60 min before sunset
  const duskEnd = sunset + 30 * 60 * 1000; // 30 min after sunset

  // Dawn window
  if (now >= dawn && now <= dawnEnd) return 15;
  // Dusk window
  if (now >= dusk && now <= duskEnd) return 15;
  // Night fishing
  if (now < dawn || now > duskEnd) return 10;
  // Midday (rest of daytime)
  return 5;
}

/** Score for pressure trend (max 10 pts) */
function scorePressureTrend(current: number, previous?: number): number {
  if (previous === undefined) return 5; // no data — neutral
  const delta = current - previous; // positive = rising, negative = falling
  if (delta >= -2 && delta <= -0.5) return 10; // slight fall — fish feed more
  if (delta >= -0.5 && delta <= 2) return 5;   // stable / slight rise
  return 0; // rapid change either direction
}

// ── Main export ────────────────────────────────────────────────────────────

export function computeFishingScore(input: ScoreInput): number {
  const now = input.nowISO ?? new Date().toISOString();

  const pts =
    scoreAirTemp(input.airTemp) +
    scoreWaterTemp(input.waterTemp) +
    scoreWindSpeed(input.windSpeed) +
    scorePressure(input.pressure) +
    scoreMoonPhase(input.moonPhase) +
    scoreTimeOfDay(input.sunriseISO, input.sunsetISO, now) +
    scorePressureTrend(input.pressure, input.pressurePrev);

  return Math.max(0, Math.min(100, Math.round(pts)));
}

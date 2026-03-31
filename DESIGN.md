# Design System — FishLog

## Product Context
- **What this is:** PWA SaaS dashboard for fishermen, displaying real-time weather/fishing conditions via gauges
- **Who it's for:** French and Arabic-speaking recreational fishermen (FR/MA/DZ/TN markets)
- **Space/industry:** Fishing + weather, no direct competitor with FR/AR support and cockpit-style dashboard
- **Project type:** Web app (PWA), mobile-first dashboard

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian crossed with automobile cockpit
- **Decoration level:** Intentional — subtle glow/halo around active gauges, light grain on surfaces. No decorative gradients, no blobs.
- **Mood:** Serious instrument, not casual lifestyle app. Like checking your car dashboard at night: data glows on a dark background, everything has a purpose. Inspires confidence that the data is precise.
- **Reference sites:** Windy.com (dark map overlays, data density), car dashboard UI on Dribbble (gauge aesthetics)

## Typography
- **Display/Hero:** General Sans — geometric, modern, slightly cold. Signals "precision instrument." Self-hosted from Fontshare.
- **Body:** DM Sans — clean, excellent legibility on dark backgrounds, supports French diacritics. Loaded via Google Fonts.
- **UI/Labels:** DM Sans (same as body, weight 500 for labels)
- **Data/Tables:** Geist Mono — tabular-nums, perfect alignment for gauge values and numbers. Loaded via Google Fonts.
- **Code:** Geist Mono
- **Arabic:** Noto Sans Arabic — the only serious choice for RTL + cross-browser readability. Loaded via Google Fonts.
- **Loading:** Google Fonts CDN for DM Sans, Geist Mono, Noto Sans Arabic. Self-hosted (Fontshare) for General Sans.
- **Scale:**
  - Hero: 42px / 2.625rem (font-weight: 700)
  - H1: 28px / 1.75rem (font-weight: 700)
  - H2: 22px / 1.375rem (font-weight: 600)
  - H3: 18px / 1.125rem (font-weight: 600)
  - Body: 15px / 0.9375rem (font-weight: 400)
  - Small: 13px / 0.8125rem (font-weight: 400)
  - Micro: 11px / 0.6875rem (font-weight: 500, uppercase, letter-spacing: 0.08em)
  - Data Large: 28px / 1.75rem (Geist Mono, font-weight: 600)
  - Data Gauge: 22px / 1.375rem (Geist Mono, font-weight: 600)
  - Data Small: 12px / 0.75rem (Geist Mono)

## Color

### Approach: Expressive with constraint
Each gauge has its own unique accent color, but the rest of the UI is monochrome. Color is only used for data, never for decoration.

> **Tailwind v4 convention:** All tokens use `--color-*` and `--spacing-*` prefixes in code (required by `@theme` directive to generate utility classes). In CSS: `var(--color-bg)`. In Tailwind classes: `bg-bg`, `text-text-primary`, `p-sm`, etc.

### Backgrounds & Surfaces
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0a1628` | Page background |
| `--color-surface` | `#12213b` | Cards, gauge containers, panels |
| `--color-surface-hover` | `#1a2d4d` | Hover state on surfaces |
| `--color-surface-border` | `#1e3454` | Borders, dividers, gauge tracks |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#e8ecf1` | Headings, gauge values, primary content |
| `--color-text-secondary` | `#7a8ba3` | Labels, secondary info, descriptions |
| `--color-text-muted` | `#4a5d78` | Placeholders, disabled states, section titles |

### Gauge Accents
| Token | Hex | Gauge | Rationale |
|-------|-----|-------|-----------|
| `--color-air-temp` | `#ff7b3a` | Air Temperature | Warm orange = heat perception |
| `--color-water-temp` | `#00d4ff` | Water Temperature | Cool cyan = water association |
| `--color-wind-speed` | `#4ade80` | Wind Speed | Green = nature/movement |
| `--color-pressure` | `#a78bfa` | Atmospheric Pressure | Soft purple = atmospheric, subtle |
| `--color-moon` | `#d4d4d8` | Moon Phase | Silver = moonlight |
| `--color-sunrise` | `#fbbf24` | Sunrise/Sunset | Amber = golden hour |
| `--color-score-good` | `#4ade80` | Score high (80-100) | Green = good conditions |
| `--color-score-mid` | `#fbbf24` | Score medium (40-79) | Amber = moderate |
| `--color-score-bad` | `#ef4444` | Score low (0-39) | Red = poor conditions |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#4ade80` | Success states, confirmations |
| `--color-warning` | `#fbbf24` | Warnings, caution alerts |
| `--color-error` | `#ef4444` | Errors, destructive actions |
| `--color-info` | `#00d4ff` | Information, tips |

### Light Mode Strategy
- Background: `#f0f2f5` | Surface: `#ffffff` | Borders: `#e2e5ea`
- Text: `#0a1628` / `#4a5d78` / `#7a8ba3`
- Gauge accents: reduce saturation 10-20% for readability on white
- Trigger: `prefers-color-scheme` media query + manual toggle (stored in localStorage)
- Dark mode auto-activates at sunset (suncalc) if no manual preference set

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-2xs` | 2px | Micro gaps, icon padding |
| `--spacing-xs` | 4px | Tight spacing, inline gaps |
| `--spacing-sm` | 8px | Small padding, list gaps |
| `--spacing-md` | 16px | Standard padding, card internal |
| `--spacing-lg` | 24px | Section spacing, card gaps |
| `--spacing-xl` | 32px | Major section breaks |
| `--spacing-2xl` | 48px | Page section spacing |
| `--spacing-3xl` | 64px | Hero spacing, page margins |

## Layout
- **Approach:** Grid-disciplined
- **Dashboard structure:**
  - Hero gauge (Score Session): centered, largest element, always visible
  - Gauge grid: 2 columns (mobile 375px), 4 columns (tablet 768px), 6 columns / row (desktop 1024px+)
- **Max content width:** 1200px
- **Border radius:**
  - sm: 4px (buttons small, tags)
  - md: 8px (buttons, inputs, alerts)
  - lg: 12px (cards, gauge containers, panels)
  - full: 9999px (avatars, toggles, pills)
- **Touch targets:** minimum 44x44px (WCAG AA)

## The 8 "Gauges"
Not all gauges are the same component. The dashboard has 3 distinct visual types:

| # | Name | Type | Component | Color |
|---|------|------|-----------|-------|
| 1 | Score Session | Hero gauge | Large semicircular SVG arc, gradient fill | `--color-score-good` to `--color-score-bad` |
| 2 | Air Temperature | Standard gauge | Small semicircular SVG arc | `--color-air-temp` |
| 3 | Water Temperature | Standard gauge | Small semicircular SVG arc | `--color-water-temp` |
| 4 | Wind Speed | Standard gauge | Small semicircular SVG arc | `--color-wind-speed` |
| 5 | Atmospheric Pressure | Standard gauge | Small semicircular SVG arc | `--color-pressure` |
| 6 | Sunrise/Sunset | Standard gauge | Small semicircular SVG arc | `--color-sunrise` |
| 7 | Wind Direction | Compass | SVG circle + arrow + cardinal labels | `--color-wind-speed` |
| 8 | Moon Phase | Dynamic icon | SVG moon shape that changes form | `--color-moon` |

### GaugeSVG Component API
```
{ value, min, max, unit, label, colorScale, icon }
```
- Arc: semicircular, stroke-linecap round, track color `--color-surface-border`
- Value: centered inside arc, Geist Mono, colored with gauge accent
- Label: below arc, DM Sans micro style, `--color-text-secondary`
- Animation: stroke-dashoffset from 0 to value, ease-out 400ms on mount
- Glow: subtle `filter: drop-shadow(0 0 Xpx color)` at 15% opacity on the arc

## Motion
- **Approach:** Intentional — animations that aid comprehension, nothing decorative
- **Easing:**
  - Enter: `cubic-bezier(0, 0, 0.2, 1)` (ease-out)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (ease-in)
  - Move: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Duration:**
  - Micro: 50-100ms (button press, toggle)
  - Short: 150-250ms (hover, focus, state transitions)
  - Medium: 250-400ms (gauge arc animation, page transitions)
  - Long: 400-700ms (hero gauge entrance on first load only)
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables all animations, gauges render at final state immediately

## RTL Support
- Container: `direction: rtl` on `<html>` when Arabic locale selected
- Gauge grid: automatically reverses order via CSS grid + `direction: rtl`
- Labels: Noto Sans Arabic, all text right-aligned
- Compass: cardinal labels switch to Arabic abbreviations
- Navigation: hamburger moves to right, back arrow flips
- Numbers: Western Arabic numerals (0-9), not Eastern Arabic

## Accessibility
- **Standard:** WCAG 2.1 Level AA
- **Contrast:** all text meets 4.5:1 ratio on dark background (verified)
- **Touch targets:** 44x44px minimum on all interactive elements
- **Screen readers:** `aria-label` on each gauge with full description (e.g., "Air temperature: 12 degrees celsius")
- **Gauge values:** `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Focus indicators:** 2px outline in gauge accent color, offset 2px
- **Reduced motion:** respected via media query

## States Table
Every feature must handle all 5 states:

| State | Visual | Content |
|-------|--------|---------|
| Loading | Pulse animation on gauge track, skeleton for value | — |
| Empty | Gauge at 0 with dashed track | "Ajoutez un lieu pour commencer" |
| Error | Red border on gauge, error icon | "Impossible de charger. Reessayer" |
| Success | Normal render with entry animation | Live data |
| Partial | Available gauges render, unavailable show "—" | "Donnees partielles" badge |

## Onboarding (3 steps)
1. **Welcome:** "Bienvenue sur FishLog" + logo animation
2. **Add location:** Search input (Nominatim) + "Ou est-ce que tu peches ?"
3. **See gauges:** Gauges animate in sequence with real data + "Sauvegarde ton premier spot"

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-31 | Initial design system created | Created by /design-consultation. Industrial cockpit aesthetic chosen to differentiate from generic blue fishing apps. |
| 2026-03-31 | Zero blue primary | All fishing apps use blue. FishLog uses orange + cyan accents on deep navy background to break category association. |
| 2026-03-31 | Cockpit metaphor over cards | Gauges are the product, not a wrapper around data. Car dashboard mental model matches fishermen's familiarity with boat instruments. |
| 2026-03-31 | General Sans for display | Geometric, technical, slightly cold. Signals precision instrument, not lifestyle app. |
| 2026-03-31 | Geist Mono for data | Tabular-nums ensures perfect alignment in gauges. Monospace reinforces the instrument feel. |
| 2026-03-31 | 3 gauge types | Hero (score), standard (5 weather gauges), compass + moon icon. Not all data fits a semicircular gauge. |

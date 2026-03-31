// Landing page placeholder — will redirect to /dashboard once auth is implemented
// For now: simple brand mark to verify fonts and design tokens load correctly

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--spacing-lg)",
        padding: "var(--spacing-md)",
        background: "var(--color-bg)",
      }}
    >
      {/* Brand mark */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-hero)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          FishLog
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: "var(--color-text-secondary)",
            marginTop: "var(--spacing-sm)",
          }}
        >
          Tableau de bord pêche — bientôt disponible
        </p>
      </div>

      {/* Gauge accent color swatches — visual token check */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
        aria-hidden="true"
      >
        {[
          ["var(--color-air-temp)", "Air"],
          ["var(--color-water-temp)", "Eau"],
          ["var(--color-wind-speed)", "Vent"],
          ["var(--color-pressure)", "Pression"],
          ["var(--color-moon)", "Lune"],
          ["var(--color-sunrise)", "Lever"],
        ].map(([color, label]) => (
          <div
            key={label}
            title={label}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-full)",
              background: color,
            }}
          />
        ))}
      </div>

      {/* Data font check */}
      <p
        style={{
          fontFamily: "var(--font-data)",
          fontSize: "var(--text-data-gauge)",
          fontWeight: 600,
          color: "var(--color-air-temp)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        12.4°C
      </p>
    </main>
  );
}

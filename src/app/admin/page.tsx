// ── Admin Dashboard Page ────────────────────────────────────────────────────
// Server component — fetches stats directly (no client fetch needed).

import { getOwmCallsToday } from "@/lib/services/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { fishingSessions } from "@/lib/db/schema/sessions";
import { spots } from "@/lib/db/schema/spots";
import { sql, gte } from "drizzle-orm";

const OWM_DAILY_BUDGET = 1000;

export const metadata = { title: "Admin — FishLog" };

// ── Helpers ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#0a1628",
        border: "1px solid #1e3352",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        minWidth: "180px",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: accent ?? "#e2e8f0",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#22c55e";
  return (
    <div
      style={{
        background: "#1e3352",
        borderRadius: "9999px",
        height: "8px",
        overflow: "hidden",
        marginTop: "0.5rem",
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          background: color,
          borderRadius: "9999px",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfDay = new Date(todayStr + "T00:00:00.000Z");
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setUTCDate(startOfDay.getUTCDate() - 7);
  const startOfMonth = new Date(startOfDay);
  startOfMonth.setUTCDate(1);

  const [
    totalUsersResult,
    totalSessionsResult,
    sessionsToday,
    sessionsWeek,
    sessionsMonth,
    activeUsersResult,
    totalSpotsResult,
    owmCalls,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(fishingSessions),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fishingSessions)
      .where(gte(fishingSessions.date, todayStr)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fishingSessions)
      .where(gte(fishingSessions.createdAt, startOfWeek)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fishingSessions)
      .where(gte(fishingSessions.createdAt, startOfMonth)),
    db
      .selectDistinct({ userId: fishingSessions.userId })
      .from(fishingSessions)
      .where(gte(fishingSessions.createdAt, startOfWeek)),
    db.select({ count: sql<number>`count(*)::int` }).from(spots),
    getOwmCallsToday(),
  ]);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const totalSessions = totalSessionsResult[0]?.count ?? 0;
  const sessionsCountToday = sessionsToday[0]?.count ?? 0;
  const sessionsCountWeek = sessionsWeek[0]?.count ?? 0;
  const sessionsCountMonth = sessionsMonth[0]?.count ?? 0;
  const activeUsers = activeUsersResult.length;
  const totalSpots = totalSpotsResult[0]?.count ?? 0;
  const budgetPct = Math.round((owmCalls / OWM_DAILY_BUDGET) * 100);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          color: "#e2e8f0",
        }}
      >
        Tableau de bord admin
      </h1>
      <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "2rem" }}>
        Mis à jour le {now.toLocaleString("fr-FR")}
      </p>

      {/* ── Users & spots ── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={sectionTitle}>Utilisateurs & spots</h2>
        <div style={cardGrid}>
          <StatCard label="Utilisateurs totaux" value={totalUsers} />
          <StatCard label="Spots totaux" value={totalSpots} />
          <StatCard
            label="Utilisateurs actifs (7j)"
            value={activeUsers}
            accent="#60a5fa"
          />
        </div>
      </section>

      {/* ── Sessions ── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={sectionTitle}>Sessions</h2>
        <div style={cardGrid}>
          <StatCard label="Aujourd'hui" value={sessionsCountToday} />
          <StatCard label="Cette semaine" value={sessionsCountWeek} />
          <StatCard label="Ce mois" value={sessionsCountMonth} />
          <StatCard label="Total" value={totalSessions} sub="toutes les sessions" />
        </div>

        {/* Simple table */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Période</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {[
              { period: "Aujourd'hui", count: sessionsCountToday },
              { period: "7 derniers jours", count: sessionsCountWeek },
              { period: "Ce mois", count: sessionsCountMonth },
              { period: "Total", count: totalSessions },
            ].map(({ period, count }) => (
              <tr key={period}>
                <td style={tdStyle}>{period}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── OWM API Budget ── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={sectionTitle}>Budget API OpenWeatherMap</h2>
        <div
          style={{
            background: "#0a1628",
            border: "1px solid #1e3352",
            borderRadius: "0.75rem",
            padding: "1.25rem 1.5rem",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "0.25rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              Appels aujourd'hui
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: budgetPct > 80 ? "#ef4444" : "#e2e8f0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {owmCalls} / {OWM_DAILY_BUDGET}
            </span>
          </div>
          <ProgressBar pct={budgetPct} />
          <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.5rem" }}>
            {budgetPct}% du quota journalier utilisé (plan gratuit)
          </div>
        </div>
      </section>

      {/* ── System info ── */}
      <section>
        <h2 style={sectionTitle}>Système</h2>
        <div style={cardGrid}>
          <StatCard
            label="Cache Redis"
            value={process.env.UPSTASH_REDIS_REST_URL ? "Connecté" : "Non configuré"}
            accent={process.env.UPSTASH_REDIS_REST_URL ? "#22c55e" : "#f59e0b"}
          />
          <StatCard
            label="Offline PWA"
            value={process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true" ? "Activé" : "Désactivé"}
            accent={process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true" ? "#22c55e" : "#64748b"}
          />
          <StatCard
            label="Environnement"
            value={process.env.NODE_ENV ?? "unknown"}
          />
        </div>
      </section>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "1rem",
};

const cardGrid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "1rem",
  marginBottom: "1rem",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  borderCollapse: "collapse" as const,
  fontSize: "0.875rem",
};

const thStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  textAlign: "left" as const,
  color: "#475569",
  borderBottom: "1px solid #1e3352",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  color: "#94a3b8",
  borderBottom: "1px solid #1e3352",
};

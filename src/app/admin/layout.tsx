// ── Admin Layout ────────────────────────────────────────────────────────────
// Dark minimal layout with admin gate. Redirects non-admins to /.

import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Guard: must be logged in and have admin email
  if (!user || !isAdmin(user.email)) {
    redirect("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07101f",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #1e3352",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          background: "#0a1628",
        }}
      >
        <span
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "#60a5fa",
          }}
        >
          FishLog Admin
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            background: "#1e3352",
            color: "#93c5fd",
            padding: "0.2rem 0.6rem",
            borderRadius: "9999px",
          }}
        >
          {user.email}
        </span>
        <Link
          href="/"
          style={{
            marginLeft: "auto",
            fontSize: "0.875rem",
            color: "#64748b",
            textDecoration: "none",
          }}
        >
          ← Retour au tableau de bord
        </Link>
      </header>

      {/* Content */}
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}

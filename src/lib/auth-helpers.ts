import { auth } from "@/lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user from the session.
 * Returns null if the user is not logged in.
 * For use in Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

/**
 * Checks whether the given email belongs to an admin.
 * Admin email is configured via the ADMIN_EMAIL environment variable.
 */
export function isAdmin(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Returns the current authenticated user or throws a 401 Response.
 * Use in Server Actions or Route Handlers that require authentication.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

/**
 * Returns the current authenticated admin user or throws a 401 Response.
 * Use in Server Actions or Route Handlers that require admin access.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!isAdmin(user.email)) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

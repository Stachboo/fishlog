import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublicApi = pathname === "/api/health" || pathname.startsWith("/api/weather") || pathname === "/api/geocode";
  const isDashboard = pathname === "/";

  // Always allow auth API routes, public APIs, and dashboard
  if (isApiAuth || isPublicApi || isDashboard) return;

  // Redirect unauthenticated users to login for protected routes
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect authenticated users away from login page
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

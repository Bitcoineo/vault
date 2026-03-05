import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isAuthRoute = pathname.startsWith("/auth");
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicRoute = pathname === "/";
  const isShareRoute = pathname.startsWith("/share/");
  const isShareApiRoute = pathname.startsWith("/api/share/");

  // Allow auth API routes (NextAuth needs these)
  if (isApiAuthRoute) return;

  // Share routes are public (no auth required)
  if (isShareRoute || isShareApiRoute) return;

  // Landing page is public
  if (isPublicRoute) return;

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/files", req.nextUrl));
  }

  // Auth pages are public
  if (isAuthRoute) return;

  // API routes return JSON 401 instead of redirect
  if (isApiRoute && !isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protect all other routes
  if (!isLoggedIn) {
    return Response.redirect(new URL("/auth/signin", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

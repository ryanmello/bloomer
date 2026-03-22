import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  isExemptRoute,
  rateLimitExceededResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export const runtime = "nodejs"; // Use Node.js runtime instead of Edge to avoid Prisma WASM issues

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // -----------------------------------------------------------------
  // API routes: apply rate limiting
  // -----------------------------------------------------------------
  if (pathname.startsWith("/api")) {
    if (!isExemptRoute(pathname)) {
      // Identify caller: authenticated user ID or IP fallback.
      const identifier =
        req.auth?.user?.id ??
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";

      const result = await checkRateLimit(identifier, pathname);

      if (!result.allowed) {
        return rateLimitExceededResponse(result);
      }

      // Attach rate-limit info headers to the forwarded response.
      const response = NextResponse.next();
      const headers = rateLimitHeaders(result);
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
      return response;
    }

    return NextResponse.next();
  }

  // -----------------------------------------------------------------
  // Page routes: auth redirects (unchanged)
  // -----------------------------------------------------------------
  const isLoggedIn = !!req.auth;

  // Define auth pages
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // Define public pages that unauthenticated users can access
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/verify-2fa") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/unsubscribe") ||
    pathname.startsWith("/subscribe");

  // Redirect authenticated users away from auth pages to dashboard
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect non-authenticated users to sign-in if trying to access protected pages
  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

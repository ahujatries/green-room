import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware for Green Room.
 *
 * Two responsibilities, in order:
 *   1. Refresh the Supabase auth session on every matched request (so cookies
 *      stay fresh for Server Components) via updateSession(). This returns a
 *      response carrying the refreshed Set-Cookie headers AND the resolved user.
 *   2. Enforce route protection: anonymous visitors are bounced to /login
 *      (with ?next= preserving where they were headed), and authenticated
 *      visitors are kept out of /login (sent home instead).
 *
 * IMPORTANT: we always return the response produced by updateSession (or a
 * redirect that has copied its cookies) so the refreshed session persists.
 */

// Paths reachable without a session. Everything else requires auth.
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/auth/") || // OAuth + magic-link callback, etc.
    pathname.startsWith("/_next") || // Next.js internals
    pathname === "/favicon.ico"
  );
}

export async function middleware(request: NextRequest) {
  // Step 1 — refresh the session. `supabaseResponse` carries the refreshed
  // cookies; `user` is null when the visitor is not authenticated.
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Step 2a — signed-in users have no business on /login; send them home.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  // Step 2b — anonymous users hitting a protected path go to /login,
  // remembering where they wanted to go via ?next=.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  // Step 3 — allowed through; return the session-refreshing response so the
  // refreshed cookies persist to the browser.
  return supabaseResponse;
}

// Carry the refreshed Supabase cookies onto a redirect response so the session
// is not lost when we short-circuit with a NextResponse.redirect().
function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - common image / asset extensions
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|mp3|mp4|wav|webm)$).*)",
  ],
};

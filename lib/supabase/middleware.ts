import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Session-refresh helper for Next.js middleware. Rotates the auth cookies on
// every request (Supabase tokens are short-lived) and returns both the response
// carrying the refreshed cookies AND the resolved user, so the caller can make
// the route-protection decision. Keep this dependency-light: it runs on the Edge.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Fail open: if Supabase isn't configured, do NOT throw — a throw here 500s
  // the entire site (middleware runs on every route). Run with no session so
  // the app stays reachable; auth resumes automatically once env vars are set.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { supabaseResponse, user: null, configured: false };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run logic between createServerClient and getUser() — it
  // refreshes the token and a slip here causes hard-to-debug logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user, configured: true };
}

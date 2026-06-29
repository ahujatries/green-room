import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { getCookieDomain } from "@/lib/supabase/cookie-domain";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Server-side Supabase client (RSC, Route Handlers, Server Actions). Bound to
// the request's cookies so the user's session travels with every query. The
// try/catch on set() is the documented no-op for the read-only RSC context,
// where cookies can't be mutated — middleware refreshes the session instead.
//
// On *.tryarqo.com the auth cookie is scoped to `.tryarqo.com` so the session
// is shared with Arqo (app.tryarqo.com). The cookie NAME stays the Supabase
// default so it matches what Arqo wrote.
export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = getCookieDomain(headerStore.get("host"));

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; the session is
            // refreshed in middleware.
          }
        },
      },
    },
  );
}

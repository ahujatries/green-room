import { createBrowserClient } from "@supabase/ssr";

import { getCookieDomain } from "@/lib/supabase/cookie-domain";

// Browser-side Supabase client. Reads the publishable (anon) key — RLS does the
// rest: this client can only ever see the signed-in user's own rows.
//
// On *.tryarqo.com we scope the auth cookie to `.tryarqo.com` so the session is
// shared with Arqo (app.tryarqo.com) — a user signed into Arqo is signed in
// here too. NOTE: we never set a custom `storageKey`/cookie name — the default
// must match Arqo's for the shared cookie to line up.
export function createClient() {
  const cookieDomain =
    typeof window !== "undefined"
      ? getCookieDomain(window.location.hostname)
      : undefined;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined,
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the magic-link redirect (the dev/localhost fallback sign-in path).
// Supabase sends the user back here with a `code` to exchange for a session,
// plus an optional `next` path to land on once they're signed in. The Arqo
// shared-session round-trip uses /auth/landing instead (no code to exchange).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow same-origin relative redirects; default to home.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // No load balancer in front of us locally — trust the origin.
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        // Behind Vercel's proxy — honour the public host, not the internal one.
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send them to the friendly error page.
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

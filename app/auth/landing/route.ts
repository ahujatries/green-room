import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Return landing for "Log in with Arqo".
//
// Unlike /auth/callback (which exchanges an OAuth/magic-link `code`), the Arqo
// round-trip lands here with NO code: the shared `.tryarqo.com` auth cookie is
// already set by the time the browser arrives. So we just check whether a
// session is now visible and route accordingly:
//   - session present → the validated same-origin `next`, else home.
//   - no session      → back to /login.
//
// (In the common case the user is recognised by middleware before they ever
// hit /login, so this route mostly serves the post-Arqo-login redirect.)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Only allow same-origin relative redirects; default to home.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Honour the public host when behind Vercel's proxy, mirroring /auth/callback.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const base =
    !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;

  if (user) {
    return NextResponse.redirect(`${base}${next}`);
  }

  // No shared session arrived — send them to sign in (preserve `next`).
  const loginNext = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(`${base}/login${loginNext}`);
}

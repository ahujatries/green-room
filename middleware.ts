import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Refresh the Supabase auth cookies on navigation so a signed-in writer's
// session stays live for server reads. Crucially, this is also what makes
// "Log in with Arqo" work: on *.tryarqo.com `updateSession` reads and re-writes
// the SHARED `.tryarqo.com`-scoped cookie, so a user already signed into Arqo
// is recognised here on their first request — no round-trip needed.
//
// `updateSession` fails open: if Supabase isn't configured it runs with no
// session rather than 500-ing the whole site. We do NOT gate any route here —
// the Green Room is public and sign-in is optional (you can paste a script and
// meet its cast with no account); `/login` is opt-in.
export async function middleware(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Everything except Next internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4|woff2?)$).*)",
  ],
};

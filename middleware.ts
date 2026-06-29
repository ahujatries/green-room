import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Refresh the Supabase auth cookies on navigation so a signed-in writer's
// session stays live for server reads (app/page.tsx reads it to load their
// scripts). `updateSession` fails open — if Supabase isn't configured it runs
// with no session rather than 500-ing the whole site. We don't gate any route
// here: the Green Room is public and sign-in is optional.
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

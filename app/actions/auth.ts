"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Sign the current user out of Green Room and send them back to the entry.
 *
 * Wired into the call-sheet header's avatar control. Redirecting to "/" (not
 * "/login") lands them on the public entry as a guest — the brutalist flow's
 * sign-in lives inside that screen, so there's no orphaned dark login page to
 * bounce through. The redirect throws (Next's control-flow signal) so nothing
 * after it runs.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

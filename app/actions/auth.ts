"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Sign the current user out of Green Room and send them back to /login.
 *
 * Wired into the user menu's sign-out control. The redirect throws
 * (Next's control-flow signal) so nothing after it runs.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

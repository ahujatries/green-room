import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Server-side "who is signed in?" helper. Returns the authenticated user or null.
// Always uses getUser() (not getSession()) so the token is validated against the
// Supabase Auth server rather than trusted from the cookie — the safe default
// for any server-side authorization decision.
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

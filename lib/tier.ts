import { createClient } from "@/lib/supabase/server";

// Which subscription tiers get the *premium* voice — a higher-quality ElevenLabs
// model (and, if set, a premium voice id). Everyone gets ElevenLabs; premium
// tiers just get the richer model. Overridable via env so the premium set can
// change without a deploy.
const PREMIUM_TIERS = (
  process.env.PREMIUM_VOICE_TIERS ?? "studio,staff,max"
)
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

export type Tier = string;

// "What plan is this user on?" — read from Arqo's authoritative subscription
// record. Green Room shares Arqo's red-ball Supabase, where the plan lives in
// `public.profiles.subscription_state` (text: 'free' | 'pro' |
// 'pro_launch_pricing' | 'studio' | 'team' | 'canceled'), keyed by the auth
// user id. We read it with the request's *own* authenticated session: the
// profiles RLS policy lets an authenticated user SELECT their own row, so no
// service-role key is needed (and Green Room only ships the anon key by design).
//
// Everything fails safe to "free": no session, a missing/renamed column, an
// RLS denial, or any thrown error all resolve to "free" so a glitch can never
// accidentally hand out the premium voice. (This is *not* the auth-metadata
// best-effort it used to be — that returned "free" for everyone because the
// real plan was never written to user metadata.)
export async function getUserTier(): Promise<Tier> {
  try {
    const supabase = await createClient();
    // getUser() validates the token against the Auth server rather than
    // trusting the cookie — the right default for an authorization decision.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "free";

    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_state")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return "free";

    const state = (data as { subscription_state?: unknown }).subscription_state;
    return typeof state === "string" && state ? state.toLowerCase() : "free";
  } catch {
    return "free";
  }
}

// Is the current user on a premium tier? Used only to pick the richer ElevenLabs
// model/voice — base ElevenLabs is served to everyone regardless. Fails safe to
// false so a missing/renamed plan field never accidentally upgrades the voice.
export async function isPremiumTier(): Promise<boolean> {
  const tier = await getUserTier();
  return PREMIUM_TIERS.includes(tier);
}

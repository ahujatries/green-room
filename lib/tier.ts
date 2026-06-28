import { getUser } from "@/lib/supabase/user";

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

// Best-effort "what plan is this user on?" — read from the Supabase user the
// app already authenticates (Green Room shares Arqo's red-ball auth). We look in
// the usual metadata slots; if nothing is found we fail safe to "free" so a
// missing/renamed field can never accidentally hand out the premium voice.
//
// NOTE: Arqo's authoritative subscription record may live in a table rather than
// auth metadata. If so, point this one function at that lookup — every gate
// below reads through it, so nothing else has to change.
export async function getUserTier(): Promise<Tier> {
  try {
    const user = await getUser();
    if (!user) return "free";
    const meta = {
      ...(user.app_metadata as Record<string, unknown> | undefined),
      ...(user.user_metadata as Record<string, unknown> | undefined),
    };
    const raw =
      meta.plan ?? meta.tier ?? meta.subscription_tier ?? meta.subscription;
    return typeof raw === "string" ? raw.toLowerCase() : "free";
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

// Shared password-gate helpers.
//
// The whole site sits behind one shared password (env SITE_PASSWORD). The cookie
// never stores the password itself — it stores a SHA-256 token derived from it,
// so a leaked cookie reveals nothing and a forged one can't be computed without
// the password. Edge-compatible: uses Web Crypto only, so middleware can import
// it.

export const GATE_COOKIE = "gr_gate";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Stable token for a given password. Same input → same hex digest, so the
// layout can recompute the expected value and compare against the cookie.
export async function gateToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`green-room:gate:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Server-side gate check used by the root layout. Fails open when no password is
// configured (e.g. local dev) so the gate never triggers by accident.
export async function isGateUnlocked(): Promise<boolean> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return true;
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(GATE_COOKIE)?.value;
  return !!token && token === (await gateToken(password));
}

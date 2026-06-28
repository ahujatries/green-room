"use client";

// Client helpers for the viral share loop. Build a /s?... link for a character
// moment and fire the native share sheet (falling back to clipboard). The link
// carries the writer's referral code when they've joined, so a share doubles as
// a referral.

const JOINED_KEY = "gr:arqo-joined:v1";
const MAX_QUOTE = 220;

export type ShareMoment = {
  name: string;
  role?: string;
  line: string;
  initial?: string;
};

/** Pull the signed-up writer's referral code, if any, for share attribution. */
export function myReferralCode(): string | null {
  try {
    const raw = localStorage.getItem(JOINED_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { referralCode?: string | null };
    const code = v.referralCode ?? "";
    return /^[A-Za-z0-9_-]{6,32}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, m: ShareMoment): string {
  const u = new URL("/s", origin);
  u.searchParams.set("n", m.name);
  if (m.role) u.searchParams.set("r", m.role);
  u.searchParams.set("q", m.line.replace(/\s+/g, " ").trim().slice(0, MAX_QUOTE));
  u.searchParams.set("i", (m.initial || m.name.charAt(0) || "•").charAt(0).toUpperCase());
  const ref = myReferralCode();
  if (ref) u.searchParams.set("ref", ref);
  return u.toString();
}

export type ShareResult = "shared" | "copied" | "failed";

export async function shareMoment(m: ShareMoment): Promise<ShareResult> {
  const url = buildShareUrl(window.location.origin, m);
  const text = `“${m.line.replace(/\s+/g, " ").trim().slice(0, 180)}” — ${m.name}`;

  const nav = navigator as Navigator & {
    share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  };
  if (typeof nav.share === "function") {
    try {
      await nav.share({ title: "The Green Room by Arqo", text, url });
      return "shared";
    } catch (e) {
      // User dismissed the sheet — that's not a failure, don't also copy.
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
      // Otherwise fall through to clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

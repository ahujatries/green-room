// POST /api/waitlist — Green Room's funnel into the Arqo waitlist.
//
// Green Room is top-of-funnel for Arqo: every signup here lands in the SAME
// waitlist as tryarqo.com, tagged `source=green_room` for attribution. We don't
// touch the database directly — we proxy to Arqo's own /api/waitlist endpoint
// (server-to-server, so no CORS, no service-role secret in this project), which
// owns insert + dedup + referral codes + the Day-0 welcome email. We just add
// the source tag and forward the inbound referral code.
//
// Request:  { email: string, ref?: string }
// Response: { ok: true, position?, referralCode?, referralCount? } | { ok:false, error }

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Apex 307-redirects to www; POST straight to www so the body survives.
const ARQO_WAITLIST =
  process.env.ARQO_WAITLIST_URL ?? "https://www.tryarqo.com/api/waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REF_RE = /^[A-Za-z0-9_-]{6,32}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let email = "";
  let ref: string | null = null;
  try {
    const body = (await req.json()) as { email?: string; ref?: string };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    ref = typeof body.ref === "string" && REF_RE.test(body.ref.trim()) ? body.ref.trim() : null;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(ARQO_WAITLIST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the real visitor's UA so Arqo's row records the true client.
        "user-agent": req.headers.get("user-agent") ?? "green-room",
        referer: req.headers.get("referer") ?? "https://greenroom.tryarqo.com",
      },
      body: JSON.stringify({ email, source: "green_room", ref: ref ?? undefined }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      position?: number | null;
      referralCode?: string | null;
      referralCount?: number | null;
    };

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || "Could not save your spot. Try again." },
        { status: res.status === 429 ? 429 : 502 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        position: data.position ?? null,
        referralCode: data.referralCode ?? null,
        referralCount: data.referralCount ?? 0,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach the waitlist. Try again in a moment." },
      { status: 502 },
    );
  }
}

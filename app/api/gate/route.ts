import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, GATE_MAX_AGE, gateToken } from "@/lib/gate";

// Verifies the shared password and, on success, sets the gate cookie and sends
// the visitor on to wherever they were headed. Plain form POST so it works
// without client JS.

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const submitted = String(form.get("password") ?? "");

  const expected = process.env.SITE_PASSWORD ?? "";

  // The gate UI lives at the root layout, so both outcomes return to "/".
  if (!expected || submitted !== expected) {
    const back = new URL("/", req.url);
    back.searchParams.set("e", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  res.cookies.set(GATE_COOKIE, await gateToken(expected), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: GATE_MAX_AGE,
  });
  return res;
}

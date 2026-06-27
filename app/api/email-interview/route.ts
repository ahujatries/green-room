import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import { getUser } from "@/lib/supabase/user";
import { saveInterview, type InterviewTurn } from "@/lib/green-room/sessions";
import { renderInterviewEmail } from "@/lib/email/interview-template";

// "Email me this interview." Auth-required: the transcript only ever goes to the
// signed-in user's own verified address — never an address supplied in the body,
// so this can't be turned into an open relay. The same call also persists the
// interview to gr_chat_* (best-effort) so it's saved, not just sent.
//
// Sends from greenroom@tryarqo.com (the tryarqo.com domain is already verified
// in Resend). Override with GREEN_ROOM_FROM if needed.
const FROM = process.env.GREEN_ROOM_FROM ?? "The Green Room <greenroom@tryarqo.com>";

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Email isn't configured (missing RESEND_API_KEY)." },
      { status: 503 },
    );
  }

  const user = await getUser();
  if (!user?.email) {
    return Response.json(
      { error: "Sign in to email yourself this interview." },
      { status: 401 },
    );
  }

  let body: {
    characterName?: string;
    characterRef?: string | null;
    scriptId?: string | null;
    scriptTitle?: string;
    transcript?: InterviewTurn[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const turns = (body.transcript ?? []).filter(
    (t) => t && typeof t.text === "string" && t.text.trim().length > 0,
  );
  if (turns.length === 0) {
    return Response.json(
      { error: "Nothing to send yet — say something first." },
      { status: 400 },
    );
  }

  const characterName = body.characterName?.trim() || "the character";
  const scriptTitle = body.scriptTitle?.trim() || "The Green Room";
  const appUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://green-room.vercel.app";

  // Persist first (best-effort) so a save failure never blocks the email.
  try {
    await saveInterview({
      characterName,
      characterRef: body.characterRef ?? null,
      scriptId: body.scriptId ?? null,
      title: `Interview with ${characterName}`,
      turns,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { surface: "email-interview", step: "save" } });
  }

  const { subject, html, text } = renderInterviewEmail({
    characterName,
    scriptTitle,
    turns,
    appUrl,
  });

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: user.email,
      subject,
      html,
      text,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    Sentry.captureException(err, { tags: { surface: "email-interview", step: "send" } });
    return Response.json(
      { error: "Couldn't send the email. Try again in a moment." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, sentTo: user.email });
}

import { createClient } from "@/lib/supabase/server";
import type { GrChatMode } from "@/lib/supabase/types";

export type InterviewTurn = { role: "user" | "assistant"; text: string };

// Persist one interview (a session + its messages) for the signed-in user. RLS
// on gr_chat_* enforces ownership — every row is stamped with auth.uid(), and a
// signed-out caller simply gets null back (no rows written). Best-effort: the
// caller (e.g. the email route) shouldn't fail just because saving did.
export async function saveInterview(input: {
  characterName: string;
  characterRef?: string | null;
  scriptId?: string | null;
  mode?: GrChatMode;
  title?: string | null;
  turns: InterviewTurn[];
}): Promise<{ sessionId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // The user owns the row (user_id = auth.uid()), so the SELECT policy passes
  // and RETURNING the new id is safe here.
  const { data: session, error: sessionError } = await supabase
    .from("gr_chat_sessions")
    .insert({
      user_id: user.id,
      character_name: input.characterName,
      character_ref: input.characterRef ?? null,
      script_id: input.scriptId ?? null,
      mode: input.mode ?? "chat",
      title: input.title ?? null,
    })
    .select("id")
    .single();
  if (sessionError || !session) return null;

  if (input.turns.length > 0) {
    const rows = input.turns.map((t) => ({
      session_id: session.id,
      user_id: user.id,
      role: t.role,
      content: t.text,
    }));
    await supabase.from("gr_chat_messages").insert(rows);
  }

  return { sessionId: session.id };
}

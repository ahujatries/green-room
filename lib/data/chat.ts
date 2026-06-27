// Server-side persistence for Green Room chat transcripts.
//
// Every Green Room conversation is one row in `gr_chat_sessions` (per writer +
// script + character + mode) with its turns appended to `gr_chat_messages`.
// All writes go through the request-scoped Supabase server client, so RLS scopes
// every row to the logged-in writer — we never pass a user id around manually,
// and we never touch the service role.
//
// Persistence is best-effort and NEVER load-bearing for the chat itself: if the
// writer somehow isn't authenticated, every helper here no-ops (returns null)
// rather than throwing, so a failed insert can't take down a streaming reply.

import { createClient } from "@/lib/supabase/server";
import type { GrChatMode, GrChatRole } from "@/lib/supabase/types";

/** Get the logged-in writer's id, or null if unauthenticated. */
async function currentUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Resolve the single session row for this (writer, script, character, mode),
 * creating it the first time. One conversation per tuple — subsequent calls
 * reuse the existing row so a transcript keeps growing across visits.
 *
 * Returns the session id, or null if the writer isn't authenticated (in which
 * case the caller simply skips persistence).
 */
export async function resolveOrCreateSession({
  scriptId,
  characterId,
  characterName,
  mode = "chat",
}: {
  scriptId: string;
  characterId: string;
  characterName: string;
  mode?: GrChatMode;
}): Promise<string | null> {
  if (!scriptId || !characterId) return null;

  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return null;

  // Reuse an existing conversation for this tuple if one is there.
  const { data: existing } = await supabase
    .from("gr_chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("script_id", scriptId)
    .eq("character_ref", characterId)
    .eq("mode", mode)
    .maybeSingle();

  if (existing?.id) return String(existing.id);

  const { data: created, error } = await supabase
    .from("gr_chat_sessions")
    .insert({
      user_id: userId,
      script_id: scriptId,
      character_ref: characterId,
      character_name: characterName,
      mode,
    })
    .select("id")
    .maybeSingle();

  if (error || !created?.id) return null;
  return String(created.id);
}

/**
 * Append one turn to a session. No-ops (returns false) when the session id is
 * missing or the writer isn't authenticated, so persistence can never break the
 * conversation.
 */
export async function appendMessage(
  sessionId: string | null,
  role: GrChatRole,
  content: string,
): Promise<boolean> {
  if (!sessionId) return false;
  const text = (content ?? "").trim();
  if (!text) return false;

  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return false;

  const { error } = await supabase.from("gr_chat_messages").insert({
    session_id: sessionId,
    user_id: userId,
    role,
    content: text,
  });

  if (error) return false;

  // Keep the session's updated_at fresh so recent conversations sort first.
  await supabase
    .from("gr_chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return true;
}

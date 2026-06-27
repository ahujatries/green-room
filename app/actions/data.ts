"use server";

// Server actions the client app shell calls to pull the signed-in writer's
// OWN Arqo data on demand — when they switch into a different script from the
// picker. Everything here runs through the request-scoped Supabase server
// client, so Postgres RLS keeps a writer to their own rows; we never pass a
// user id and never touch the service role.
//
// The page (app/page.tsx) loads the FIRST script's characters server-side for a
// fast initial paint; these actions serve every subsequent selection.

import { loadCharacters } from "@/lib/data/characters";
import { loadScriptText, type LoadedScript } from "@/lib/data/scripts";
import type { Character } from "@/lib/characters";

/**
 * The cast of one of the writer's scripts, already mapped into the app's
 * `Character` shape (so home-view / chat-view / dossier need no changes).
 * Returns [] when the script has no characters or isn't the writer's.
 */
export async function getCharacters(scriptId: string): Promise<Character[]> {
  if (!scriptId) return [];
  return loadCharacters(scriptId);
}

/**
 * The readable, reconstructed page text of one script — the same shape
 * `buildSystemPrompt` consumes. Returned to the client only so a future
 * surface can show it; grounding for chat still happens server-side in
 * /api/chat per the contract. Returns null when not the writer's / untitled.
 */
export async function getScriptText(
  scriptId: string,
): Promise<LoadedScript | null> {
  if (!scriptId) return null;
  return loadScriptText(scriptId);
}

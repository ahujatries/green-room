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
import {
  listScripts,
  loadScriptText,
  type LoadedScript,
  type ScriptListItem,
} from "@/lib/data/scripts";
import type { Character, Room } from "@/lib/characters";

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

/**
 * The signed-in writer's own Arqo scripts, newest first — the "Your scripts"
 * shelf in the Library. RLS scopes this to the caller, so an unauthenticated
 * request matches nothing and gets []. The client calls this to refresh the
 * list after sign-in without a full reload.
 */
export async function listMyScripts(): Promise<ScriptListItem[]> {
  return listScripts();
}

/**
 * Load one of the writer's scripts as a fully-grounded `Room` — the readable
 * page text plus its cast, both RLS-scoped to the owner. This is the same shape
 * the catalog rooms and pasted scripts use, so every downstream screen
 * (detail / chat / call / video) treats a real Arqo script identically and the
 * chat/voice routes ground on `room.script.text` with no special-casing.
 *
 * Returns null when the script isn't the writer's, is a vault script, or is
 * untitled — anything we shouldn't be grounding a character in.
 */
export async function loadMyRoom(scriptId: string): Promise<Room | null> {
  if (!scriptId) return null;

  const [script, cast] = await Promise.all([
    loadScriptText(scriptId),
    loadCharacters(scriptId),
  ]);

  if (!script) return null;

  return {
    script: {
      title: script.title,
      format: script.format,
      logline: script.logline ?? "",
      text: script.text,
    },
    cast,
  };
}

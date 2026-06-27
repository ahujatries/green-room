// The one place chat and voice both reach to assemble the grounded context for
// a (scriptId, characterId) pair: the character's dossier AND the page they
// live on, loaded together. Keeping it here means both backends ground on the
// exact same truth — the soul of Green Room is that a character knows only the
// page, so there must be a single definition of "the page" + "the character".

import type { Character } from "@/lib/characters";
import { loadCharacter } from "@/lib/data/characters";
import { loadScriptText, type LoadedScript } from "@/lib/data/scripts";

/**
 * Everything a backend needs to put the model fully in-character and grounded:
 * the mapped `Character` and the reconstructed `script` (already in the
 * `{ title, format, logline, text }` shape `buildSystemPrompt` expects).
 */
export type GroundedContext = {
  character: Character;
  script: LoadedScript;
};

/**
 * Assemble the grounded context for one character on one script.
 *
 * Loads the script text and the character in parallel (both RLS-scoped, so a
 * writer can only ever ground against their own work). Returns null if either
 * piece is missing — a vault/untitled script, or a character that doesn't
 * exist for this writer — so callers can cleanly refuse rather than ground a
 * character in a void.
 */
export async function loadGroundedContext(
  scriptId: string,
  characterId: string,
): Promise<GroundedContext | null> {
  if (!scriptId || !characterId) return null;

  const [script, character] = await Promise.all([
    loadScriptText(scriptId),
    loadCharacter(scriptId, characterId),
  ]);

  if (!script || !character) return null;

  return { script, character };
}

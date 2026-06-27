// Server-side reads of the logged-in writer's OWN Arqo screenplays.
//
// Every query here runs through the request-scoped Supabase server client, so
// Postgres RLS does the isolation for us — a writer can only ever see their own
// rows. We never pass a user id around; we never touch the service role. The
// most we do defensively is drop vault scripts (encrypted, unreadable) and
// untitled rows, and degrade to []/null when the writer has nothing yet.

import { createClient } from "@/lib/supabase/server";
import type {
  ArqoScriptRow,
  ArqoSceneRow,
  ArqoScriptElementRow,
} from "@/lib/supabase/types";


/** A script as the Green Room home/list needs it — light, ordered, safe. */
export type ScriptListItem = {
  id: string;
  title: string;
  logline: string | null;
  synopsis: string | null;
  format: string | null;
  pageCount: number | null;
  updatedAt: string | null;
};

/**
 * The reconstructed, readable form of one script. This is the exact shape
 * `lib/prompt.ts` `buildSystemPrompt` consumes as its `script` argument:
 * `{ title, format, logline, text }`. `text` is a flattened screenplay the
 * model can read like a page.
 */
export type LoadedScript = {
  id: string;
  title: string;
  format: string;
  logline: string | null;
  text: string;
};

/**
 * The writer's non-vault scripts, newest first.
 *
 * Vault scripts (`is_vault = true`) are excluded: their fields live only as
 * ciphertext and there is nothing readable to ground a character in. Rows
 * without a title are skipped too — they're half-created shells, not work.
 *
 * Returns [] when the writer has no scripts (or isn't authenticated, since RLS
 * then matches nothing).
 */
export async function listScripts(): Promise<ScriptListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scripts")
    .select("id, title, logline, synopsis, format, page_count, updated_at, is_vault")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<Partial<ArqoScriptRow>>)
    .filter((row) => !row.is_vault && typeof row.title === "string" && row.title.trim().length > 0)
    .map((row) => ({
      id: String(row.id),
      title: row.title as string,
      logline: row.logline ?? null,
      synopsis: row.synopsis ?? null,
      format: row.format != null ? String(row.format) : null,
      pageCount: row.page_count ?? null,
      updatedAt: row.updated_at ?? null,
    }));
}

// element_type → how that line reads on the page. Screenplays are mostly
// whitespace and capitalization; we don't try to pixel-match Final Draft, we
// just make it read like a screenplay so the model is grounded in the writing,
// not in a database dump.
function formatElement(type: string | null, content: string): string[] {
  const text = (content ?? "").trim();
  if (!text) return [""];

  switch (type) {
    case "scene_heading":
      // e.g. INT. MIRADOR DINER — NIGHT
      return ["", text.toUpperCase()];
    case "transition":
      // Right-ish; we approximate with a clear, uppercased standalone line.
      return ["", text.toUpperCase()];
    case "character":
      // A cue introduces the speaker. Uppercased, indented, blank line before.
      return ["", `\t\t\t${text.toUpperCase()}`];
    case "parenthetical":
      // Sits tucked under the cue, in parens if the writer didn't add them.
      return [`\t\t${text.startsWith("(") ? text : `(${text})`}`];
    case "dialogue":
      // The spoken line, indented under the cue.
      return [`\t\t${text}`];
    case "action":
      // Plain scene description, full width.
      return ["", text];
    case "general":
    default:
      return ["", text];
  }
}

/**
 * Reconstruct a readable screenplay string for one script, ordered scenes →
 * elements, plus the title/format/logline `buildSystemPrompt` needs.
 *
 * Two queries (scenes, then their elements) rather than a join, so the ordering
 * is unambiguous: scenes by `scene_number`, elements by `element_order`. Both
 * are RLS-scoped through `scenes.script_id` / `script_elements.scene_id`.
 *
 * Returns null when the script doesn't exist for this writer, is a vault
 * script, or is untitled — i.e. anything we shouldn't be grounding against.
 */
export async function loadScriptText(scriptId: string): Promise<LoadedScript | null> {
  if (!scriptId) return null;

  const supabase = await createClient();

  const { data: scriptData, error: scriptError } = await supabase
    .from("scripts")
    .select("id, title, format, logline, is_vault")
    .eq("id", scriptId)
    .maybeSingle();

  if (scriptError || !scriptData) return null;

  const script = scriptData as Partial<ArqoScriptRow>;
  if (script.is_vault) return null;
  const title = typeof script.title === "string" && script.title.trim() ? script.title : null;
  if (!title) return null;

  // Scenes in reading order.
  const { data: sceneData } = await supabase
    .from("scenes")
    .select("id, scene_number, title, synopsis")
    .eq("script_id", scriptId)
    .order("scene_number", { ascending: true });

  const scenes = (sceneData as Array<Partial<ArqoSceneRow>>) ?? [];

  let text = "";

  if (scenes.length > 0) {
    const sceneIds = scenes.map((s) => String(s.id));

    // All elements for these scenes in one shot; we bucket + order client-side.
    const { data: elementData } = await supabase
      .from("script_elements")
      .select("id, scene_id, element_order, element_type, content")
      .in("scene_id", sceneIds)
      .order("element_order", { ascending: true });

    const elements = (elementData as Array<Partial<ArqoScriptElementRow>>) ?? [];

    const byScene = new Map<string, Array<Partial<ArqoScriptElementRow>>>();
    for (const el of elements) {
      const key = String(el.scene_id);
      const bucket = byScene.get(key);
      if (bucket) bucket.push(el);
      else byScene.set(key, [el]);
    }

    const lines: string[] = [];
    for (const scene of scenes) {
      const sceneEls = (byScene.get(String(scene.id)) ?? []).slice().sort(
        (a, b) => (a.element_order ?? 0) - (b.element_order ?? 0),
      );

      // If the scene has no heading element, fall back to its own title so the
      // reader still gets the slug line.
      const hasHeading = sceneEls.some((e) => e.element_type === "scene_heading");
      if (!hasHeading && scene.title && scene.title.trim()) {
        lines.push("", scene.title.toUpperCase());
      }

      for (const el of sceneEls) {
        lines.push(...formatElement(el.element_type ?? null, el.content ?? ""));
      }
    }

    text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  // If there were no scenes/elements at all, hand back a minimal but honest
  // page so grounding has *something* true to stand on rather than a void.
  if (!text) {
    text = `${title.toUpperCase()}${script.logline ? `\n\n${script.logline}` : ""}`;
  }

  return {
    id: String(script.id),
    title,
    format: script.format != null ? String(script.format) : "screenplay",
    logline: script.logline ?? null,
    text,
  };
}

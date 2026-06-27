// Map the writer's real Arqo characters INTO the app's existing `Character`
// shape, so every Green Room surface (cast cards, dossier, chat, voice) keeps
// working unchanged — it never learns that the data went from hard-coded demo
// to live screenplay.
//
// The interesting work is the *derivation*. Arqo stores a character as a few
// loose text fields plus a jsonb blob; the Green Room `Character` is a tight,
// opinionated dossier where the unwritten parts are deliberately `null`. We
// translate one into the other, and — crucially — we read the character's
// actual dialogue back out of `script_elements` so "what's established" is
// grounded in what they've literally said on the page, not a summary.

import { createClient } from "@/lib/supabase/server";
import type {
  ArqoCharacterRow,
  ArqoSceneRow,
  ArqoScriptElementRow,
} from "@/lib/supabase/types";
import type { Character, Facet } from "@/lib/characters";

const MAX_BLURB = 160;
const MAX_DIALOGUE_LINES = 6;

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const match = clean.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : clean).trim();
}

/**
 * Pull the dialogue this character actually speaks across the script.
 *
 * In `script_elements`, a `character` cue is immediately followed (in
 * `element_order`) by its `parenthetical`/`dialogue` lines. We walk each scene
 * in order, track the "current speaker" from cue elements, and collect the
 * dialogue under cues whose name matches this character. Matching is loose
 * (case-insensitive, ignores trailing extensions like "(CONT'D)", "(V.O.)").
 */
function collectDialogue(
  characterName: string,
  scenes: Array<Partial<ArqoSceneRow>>,
  elementsByScene: Map<string, Array<Partial<ArqoScriptElementRow>>>,
): string[] {
  const target = normalizeCue(characterName);
  if (!target) return [];

  const lines: string[] = [];

  for (const scene of scenes) {
    const els = (elementsByScene.get(String(scene.id)) ?? [])
      .slice()
      .sort((a, b) => (a.element_order ?? 0) - (b.element_order ?? 0));

    let speakerIsTarget = false;
    for (const el of els) {
      const type = el.element_type;
      const content = (el.content ?? "").trim();
      if (type === "character") {
        speakerIsTarget = normalizeCue(content) === target;
      } else if (type === "dialogue" && speakerIsTarget && content) {
        lines.push(content.replace(/\s+/g, " ").trim());
        if (lines.length >= MAX_DIALOGUE_LINES) return lines;
      } else if (type === "scene_heading" || type === "action" || type === "transition") {
        // A non-cue/non-dialogue beat ends the current speaker context.
        speakerIsTarget = false;
      }
      // parenthetical / general: leave speaker context intact.
    }
  }

  return lines;
}

// "NADIA (CONT'D)" / "August (V.O.)" → "nadia" / "august"
function normalizeCue(raw: string): string {
  return raw
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ── facet derivation from the jsonb `data` blob ───────────────────────────
// Arqo's character `data` is free-form jsonb. We best-effort sniff a handful
// of common keys for each Green Room facet. Anything we can't find stays
// `null` — which is the intended "still unwritten" state, the soul of the app.

function readJsonString(data: unknown, keys: string[]): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function deriveFacets(row: Partial<ArqoCharacterRow>): Facet[] {
  const data = row.data;
  return [
    {
      key: "want",
      label: "WHAT THEY WANT",
      value:
        readJsonString(data, ["want", "goal", "objective", "desire"]) ??
        firstSentence(row.arc_notes) ??
        null,
    },
    {
      key: "wound",
      label: "THE WOUND",
      value: readJsonString(data, ["wound", "fear", "flaw", "ghost"]),
    },
    {
      key: "secret",
      label: "THE SECRET",
      value: readJsonString(data, ["secret", "lie", "misbelief"]),
    },
    {
      key: "voice",
      label: "HOW THEY SPEAK",
      value:
        readJsonString(data, ["voice", "voiceNote", "speech", "manner"]) ??
        null,
    },
  ];
}

function deriveVoiceNote(row: Partial<ArqoCharacterRow>): string {
  return (
    readJsonString(row.data, ["voice", "voiceNote", "speech", "manner"]) ??
    firstSentence(row.arc_notes) ??
    `Speak as ${row.name ?? "this character"} would — grounded in what's on the page, never inventing what hasn't been written.`
  );
}

function deriveRole(row: Partial<ArqoCharacterRow>): { role: string; roleShort: string } {
  const desc = firstSentence(row.description) ?? "";
  const short = truncate(desc || (row.description ?? "") || "character", 48);
  return {
    role: desc || `Character in this script`,
    roleShort: short || "character",
  };
}

function deriveEstablished(
  row: Partial<ArqoCharacterRow>,
  dialogue: string[],
): string {
  const parts: string[] = [];
  if (row.bio && row.bio.trim()) parts.push(row.bio.trim());
  if (row.arc_notes && row.arc_notes.trim()) parts.push(row.arc_notes.trim());

  const lines = parts.length
    ? parts.map((p) => `- ${p.replace(/\s+/g, " ").trim()}`)
    : [];

  if (dialogue.length) {
    lines.push("");
    lines.push("What they actually say on the page:");
    for (const line of dialogue) lines.push(`- "${line}"`);
  }

  if (!lines.length) {
    return `- The page has barely written ${row.name ?? "them"} yet. Almost everything about them is still undecided.`;
  }

  return lines.join("\n");
}

function deriveOpeners(name: string): string[] {
  const who = name || "you";
  return [
    `What do you want most right now, ${who}?`,
    `What aren't you telling me yet?`,
    `What would you never do — and why?`,
  ];
}

const DEFAULT_DEFER =
  "That's not on the page yet. I won't make it up for you — that part's still yours to decide.";

/**
 * Map one Arqo character row (plus its derived dialogue) into the app's
 * `Character`. The Arqo character UUID becomes the Green Room `id`, so every
 * downstream link (chat session, call, dossier route) is stable.
 */
function mapCharacter(
  row: Partial<ArqoCharacterRow>,
  dialogue: string[],
): Character {
  const name = (typeof row.name === "string" && row.name.trim()) ? row.name.trim() : "Unnamed";
  const { role, roleShort } = deriveRole(row);
  const blurbSource = row.description || row.bio || "";
  const blurb = blurbSource
    ? truncate(blurbSource, MAX_BLURB)
    : `A character the writer hasn't finished yet.`;

  return {
    id: String(row.id),
    name,
    initial: name.charAt(0).toUpperCase() || "?",
    role,
    roleShort,
    blurb,
    established: deriveEstablished(row, dialogue),
    voiceNote: deriveVoiceNote(row),
    openers: deriveOpeners(name),
    facets: deriveFacets(row),
    defer: DEFAULT_DEFER,
  };
}

/**
 * Load every character on a script, mapped into the app `Character` shape.
 *
 * One characters query + (if there are any) one scenes query + one elements
 * query, so dialogue derivation costs three round-trips total regardless of
 * cast size. All RLS-scoped through `script_id` / `scene_id`.
 *
 * Returns [] when the script has no characters, doesn't belong to the writer,
 * or doesn't exist.
 */
export async function loadCharacters(scriptId: string): Promise<Character[]> {
  if (!scriptId) return [];

  const supabase = await createClient();

  const { data: charData, error } = await supabase
    .from("characters")
    .select("id, script_id, name, description, bio, arc_notes, data, manual")
    .eq("script_id", scriptId)
    .order("name", { ascending: true });

  if (error || !charData || charData.length === 0) return [];

  const characters = charData as Array<Partial<ArqoCharacterRow>>;

  // Load the script's scenes + elements once, then derive each character's
  // dialogue from the shared buckets.
  const { data: sceneData } = await supabase
    .from("scenes")
    .select("id, scene_number")
    .eq("script_id", scriptId)
    .order("scene_number", { ascending: true });

  const scenes = (sceneData as Array<Partial<ArqoSceneRow>>) ?? [];
  const elementsByScene = new Map<string, Array<Partial<ArqoScriptElementRow>>>();

  if (scenes.length > 0) {
    const sceneIds = scenes.map((s) => String(s.id));
    const { data: elementData } = await supabase
      .from("script_elements")
      .select("id, scene_id, element_order, element_type, content")
      .in("scene_id", sceneIds)
      .order("element_order", { ascending: true });

    for (const el of (elementData as Array<Partial<ArqoScriptElementRow>>) ?? []) {
      const key = String(el.scene_id);
      const bucket = elementsByScene.get(key);
      if (bucket) bucket.push(el);
      else elementsByScene.set(key, [el]);
    }
  }

  return characters
    .filter((row) => row.id != null)
    .map((row) => {
      const dialogue = collectDialogue(String(row.name ?? ""), scenes, elementsByScene);
      return mapCharacter(row, dialogue);
    });
}

/**
 * Load a single character by id within a script, mapped to `Character`.
 * Convenience for the grounding helper / single-character routes. Returns null
 * when not found.
 */
export async function loadCharacter(
  scriptId: string,
  characterId: string,
): Promise<Character | null> {
  if (!scriptId || !characterId) return null;
  const all = await loadCharacters(scriptId);
  return all.find((c) => c.id === characterId) ?? null;
}

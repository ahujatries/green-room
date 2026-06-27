// POST /api/cast — turn a pasted screenplay into a playable cast.
//
// This is what makes "bring your own script" work: the writer pastes a script,
// and we derive the Character[] the room needs — each grounded ONLY in what the
// page establishes. The model does the reading; we normalize + harden the
// result into the exact Character shape lib/characters.ts defines, and fall
// back to ALL-CAPS cue extraction if the model returns nothing usable.
//
// Request:  { title?: string, format?: string, logline?: string, text: string }
// Response: { characters: Character[], logline: string }
//           { error: string }  — 4xx/5xx
//
// Routed through the Vercel AI Gateway (OIDC in prod), same as the other routes.

import { generateText } from "ai";
import type { Character, Facet } from "@/lib/characters";

export const maxDuration = 45;

type RawCharacter = {
  name?: string;
  role?: string;
  roleShort?: string;
  look?: string;
  blurb?: string;
  voiceNote?: string;
  established?: string;
  openers?: string[];
  want?: string | null;
  wound?: string | null;
  secret?: string | null;
  speaks?: string | null;
};

function slug(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "character";
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function facetVal(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || /^(unknown|n\/a|none|tbd|null|undecided|unwritten)$/i.test(s)) {
    return null;
  }
  return s;
}

// Build a full Character from the model's loose object, filling every required
// field so the UI (cards, dossier, prompt) never sees a hole.
function normalize(raw: RawCharacter, taken: Set<string>): Character | null {
  const name = str(raw.name);
  if (!name) return null;

  const role = str(raw.role, "A character");
  const facets: Facet[] = [
    { key: "want", label: "WHAT THEY WANT", value: facetVal(raw.want) },
    { key: "wound", label: "THE WOUND", value: facetVal(raw.wound) },
    { key: "secret", label: "THE SECRET", value: facetVal(raw.secret) },
    { key: "voice", label: "HOW THEY SPEAK", value: facetVal(raw.speaks) },
  ];

  const openers = Array.isArray(raw.openers)
    ? raw.openers.map((o) => str(o)).filter(Boolean).slice(0, 3)
    : [];

  return {
    id: slug(name, taken),
    name,
    initial: name.charAt(0).toUpperCase(),
    role,
    roleShort: str(raw.roleShort, role.replace(/^the\s+/i, "")).toLowerCase(),
    look: str(raw.look) || undefined,
    blurb: str(raw.blurb, role),
    voiceNote: str(raw.voiceNote, "Speaks plainly, grounded in the page."),
    established: str(
      raw.established,
      `- ${name} appears in this script. Everything not on the page is still unwritten.`,
    ),
    openers:
      openers.length > 0
        ? openers
        : [
            `Who are you in this story?`,
            `What do you want?`,
            `What hasn't the page decided about you yet?`,
          ],
    facets,
    defer:
      "That's not on the page yet. I'm not going to make it up for you — that part's still yours to decide.",
  };
}

// Fallback: pull character names from ALL-CAPS dialogue cues (Fountain / standard
// screenplay format) so the room is never empty even if the model fails.
function cuesFromText(text: string): Character[] {
  const counts = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s{0,20}([A-Z][A-Z0-9 .'’\-]{1,28})(?:\s*\(.*\))?\s*$/);
    if (!m) continue;
    const name = m[1].trim().replace(/\s+/g, " ");
    // Skip scene headings / transitions / common non-name cues.
    if (
      /^(INT|EXT|INT\.\/EXT|I\/E|EST|CUT TO|FADE|SMASH|DISSOLVE|MATCH CUT|THE END|TITLE|SUPER|MONTAGE|CONTINUED|OMITTED|ANGLE|POV|INSERT|BACK TO|LATER|MEANWHILE)\b/.test(
        name,
      )
    ) {
      continue;
    }
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const taken = new Set<string>();
  return [...counts.entries()]
    .filter(([, c]) => c >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([rawName]) => {
      const name =
        rawName.charAt(0) + rawName.slice(1).toLowerCase().replace(/(^|\s)\w/g, (s) => s.toUpperCase());
      return normalize({ name, role: "A character in this script" }, taken)!;
    });
}

function extractJson(text: string): unknown {
  // Strip code fences and grab the first {...} or [...] block.
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const open = cleaned[start];
  const close = open === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let title: string;
  let text: string;
  try {
    const body = (await req.json()) as {
      title?: string;
      text?: string;
    };
    title = str(body.title, "Untitled");
    text = str(body.text);
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (text.length < 40) {
    return Response.json(
      { error: "Paste a bit more of the script so the room has something to read." },
      { status: 400 },
    );
  }

  // Keep the model prompt bounded; the cast lives in the first chunk for most
  // scripts, and we still keep the full text client-side for grounding.
  const excerpt = text.slice(0, 18000);

  const system = `You read a screenplay and return its cast as STRICT JSON — nothing else.

Return a JSON object: { "logline": string, "characters": Character[] }.
- "logline": one vivid sentence capturing the story's hook. If the script gives one, use/refine it.
- "characters": the SPEAKING / significant characters only (skip walk-ons), most central first, max 6.

Each Character:
{
  "name": string,                 // as written on the page
  "role": string,                 // e.g. "The waitress · 34" — role + age if known, else just the role
  "roleShort": string,            // e.g. "waitress, 34" (short, lowercase-ish)
  "look": string,                 // ONE spoiler-free sentence describing their on-screen appearance for a casting photo
  "blurb": string,                // one line on who they are in the story, grounded in the page
  "voiceNote": string,            // how they speak: rhythm, diction, what they do with a question
  "established": string,          // markdown bullet list ("- ...") of ONLY what the page settles about them; do not invent
  "openers": string[],            // exactly 3 questions the writer might ask this character, in the writer's voice
  "want": string|null,            // what they want in the scene (null if the page doesn't say)
  "wound": string|null,           // their wound (null if undecided)
  "secret": string|null,          // their secret (null if undecided)
  "speaks": string|null           // a short note on how they speak (null if undecided)
}

CRITICAL: ground everything ONLY in the provided pages. If the page hasn't decided something, use null — never invent backstory. Output ONLY the JSON.`;

  let parsed: unknown = null;
  try {
    const { text: out } = await generateText({
      model: process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-4.6",
      system,
      prompt: `TITLE: ${title}\n\nPAGES:\n${excerpt}`,
      temperature: 0.4,
      headers: { "x-title": "Arqo · The Green Room (cast)" },
    });
    parsed = extractJson(out);
  } catch {
    parsed = null;
  }

  const taken = new Set<string>();
  let logline = "";
  let characters: Character[] = [];

  if (parsed && typeof parsed === "object") {
    const obj = parsed as { logline?: string; characters?: RawCharacter[] };
    const list = Array.isArray(obj.characters)
      ? obj.characters
      : Array.isArray(parsed)
        ? (parsed as RawCharacter[])
        : [];
    logline = str(obj.logline);
    characters = list
      .map((c) => normalize(c, taken))
      .filter((c): c is Character => c !== null)
      .slice(0, 6);
  }

  // If the model gave us nothing usable, fall back to cue extraction so the
  // writer still lands in a working room.
  if (characters.length === 0) {
    characters = cuesFromText(text);
  }

  if (characters.length === 0) {
    return Response.json(
      {
        error:
          "Couldn't find any characters in that. Make sure character names are on their own line above their dialogue.",
      },
      { status: 422 },
    );
  }

  return Response.json({
    characters,
    logline: logline || "A new script, waiting to be read.",
  });
}

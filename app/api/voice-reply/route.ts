// POST /api/voice-reply — the in-character text turn for Voice/Video mode.
//
// Unlike /api/chat (which streams a UI message), this returns a single, short,
// SPOKEN-length reply as plain JSON, ready to be sent to /api/speech. It reuses
// the exact same grounding system prompt as the text chat so the character's
// canon discipline ("never invent what the page hasn't decided") is identical
// across typed and spoken modes.
//
// Request:  { character: Character, script: WorkScript,
//             messages: { role: "user" | "assistant"; content: string }[] }
// Response: { text: string }   (200)
//           { error: string }  (4xx/5xx)
//
// Character + script are sent inline by the client (no auth, no DB) — same room
// the browser holds for /api/chat.

import { generateText, type ModelMessage } from "ai";
import type { Character, WorkScript } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/prompt";
import { chatModel } from "@/lib/llm";

export const maxDuration = 30;

type ChatTurn = { role: "user" | "assistant"; content: string };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Belt-and-braces for the "## You are being spoken aloud" rule: models still
// sometimes open with a screenplay speaker label ("VADER:", "Obi-Wan —") which
// TTS would read out as the character announcing their own name. Strip a leading
// label that matches the character's name (full, or its first/last token)
// followed by a separator. Requiring the separator keeps real dialogue that just
// happens to start with the name ("Luke, listen to me") untouched.
function stripSpeakerLabel(text: string, name: string): string {
  const parts = name.trim().split(/\s+/);
  const candidates = new Set([name.trim(), parts[0], parts[parts.length - 1]]);
  const alt = [...candidates]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");
  if (!alt) return text;
  return text.replace(new RegExp(`^\\s*(?:${alt})\\s*[:：\\-—–]+\\s*`, "i"), "");
}

// Layered on top of the shared grounding prompt. The base prompt already asks
// for tight, spoken replies; this hardens it for true voice output where stage
// directions, asterisks, and markdown would be read aloud literally.
const SPOKEN_STYLE = `## You are being spoken aloud right now
Your reply will be turned into audio and played back. Therefore:
- Keep it to 2-4 sentences. This is talking, not writing.
- No stage directions, no parentheticals, no asterisks, no markdown, no emoji, no narration of actions. Only the words you would actually say out loud.
- Do NOT prefix your line with your own name or a speaker label (no "Vader:", no "OBI-WAN —"). This is a phone call, not a script page — just say the words.
- Sound like natural speech: contractions, plain punctuation. Never describe your tone — just use it.`;

// The call-pickup opener, produced once when a call connects (greeting: true).
// Villainy is INFERRED from the persona — the model knows who it's inhabiting —
// so this scales across the whole catalog without tagging each character.
const GREETING_STYLE = `## You are answering a phone call
The phone just rang — a number you don't recognize — and you've picked up. Give ONLY your opening words, the way THIS person answers a call from a stranger.
- If you're an ordinary, open, or warm person, greet normally — a hello, maybe your name.
- But if you're a villain, a guarded antagonist, or someone powerful with enemies who trusts no one, do NOT greet warmly. Answer with cold suspicion: who is this, how did you get this number, what do you want. Demand, don't welcome.
Keep it to one short line. You don't know who is calling yet — don't use their name or assume anything about them.`;

export async function POST(req: Request) {
  let character: Character | undefined;
  let script: WorkScript | undefined;
  let messages: ChatTurn[];
  let greeting = false;

  try {
    const body = (await req.json()) as {
      character?: Character;
      script?: WorkScript;
      messages?: ChatTurn[];
      greeting?: boolean;
    };
    character = body.character;
    script = body.script;
    messages = Array.isArray(body.messages) ? body.messages : [];
    greeting = body.greeting === true;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!character?.name || !script?.text) {
    return Response.json(
      { error: "Missing character or script." },
      { status: 400 },
    );
  }

  // A greeting is the call pickup — it needs no prior turn. Otherwise require a
  // turn to respond to. Sanitize to the minimal {role, content} the model wants,
  // dropping empties so a stray turn can't poison the context.
  let modelMessages: ModelMessage[];
  if (greeting) {
    modelMessages = [
      {
        role: "user",
        content: "[The phone rings. You don't recognize the number. You pick up.]",
      },
    ];
  } else {
    modelMessages = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
      .map((m) => ({ role: m.role, content: m.content }));
    if (modelMessages.length === 0) {
      return Response.json(
        { error: "`messages` must contain at least one turn." },
        { status: 400 },
      );
    }
  }

  const system = `${buildSystemPrompt(character, script)}\n\n${SPOKEN_STYLE}${
    greeting ? `\n\n${GREETING_STYLE}` : ""
  }`;

  try {
    const { text } = await generateText({
      model: chatModel(),
      system,
      messages: modelMessages,
      temperature: 0.85,
      headers: { "x-title": "Arqo · The Green Room (voice)" },
    });

    return Response.json({ text: stripSpeakerLabel(text.trim(), character.name) });
  } catch (err) {
    return Response.json(
      { error: `Reply generation failed: ${String(err)}` },
      { status: 500 },
    );
  }
}

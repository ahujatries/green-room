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

export const maxDuration = 30;

type ChatTurn = { role: "user" | "assistant"; content: string };

// Layered on top of the shared grounding prompt. The base prompt already asks
// for tight, spoken replies; this hardens it for true voice output where stage
// directions, asterisks, and markdown would be read aloud literally.
const SPOKEN_STYLE = `## You are being spoken aloud right now
Your reply will be turned into audio and played back. Therefore:
- Keep it to 2-4 sentences. This is talking, not writing.
- No stage directions, no parentheticals, no asterisks, no markdown, no emoji, no narration of actions. Only the words you would actually say out loud.
- Sound like natural speech: contractions, plain punctuation. Never describe your tone — just use it.`;

export async function POST(req: Request) {
  let character: Character | undefined;
  let script: WorkScript | undefined;
  let messages: ChatTurn[];

  try {
    const body = (await req.json()) as {
      character?: Character;
      script?: WorkScript;
      messages?: ChatTurn[];
    };
    character = body.character;
    script = body.script;
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!character?.name || !script?.text) {
    return Response.json(
      { error: "Missing character or script." },
      { status: 400 },
    );
  }
  if (messages.length === 0) {
    return Response.json(
      { error: "`messages` must contain at least one turn." },
      { status: 400 },
    );
  }

  // Sanitize to the minimal {role, content} shape the model layer expects, and
  // drop anything empty so a stray turn can't poison the context.
  const modelMessages: ModelMessage[] = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  if (modelMessages.length === 0) {
    return Response.json(
      { error: "No non-empty messages to respond to." },
      { status: 400 },
    );
  }

  const system = `${buildSystemPrompt(character, script)}\n\n${SPOKEN_STYLE}`;

  try {
    const { text } = await generateText({
      model: process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-4.6",
      system,
      messages: modelMessages,
      temperature: 0.85,
      headers: { "x-title": "Arqo · The Green Room (voice)" },
    });

    return Response.json({ text: text.trim() });
  } catch (err) {
    return Response.json(
      { error: `Reply generation failed: ${String(err)}` },
      { status: 500 },
    );
  }
}

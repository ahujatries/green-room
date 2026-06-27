// POST /api/voice-reply — the in-character text turn for Voice/Video mode.
//
// Unlike /api/chat (which streams a UI message), this returns a single, short,
// SPOKEN-length reply as plain JSON, ready to be sent to /api/speech. It reuses
// the exact same grounding system prompt as the text chat so the character's
// canon discipline ("never invent what the page hasn't decided") is identical
// across typed and spoken modes.
//
// Request:  { characterId: string,
//             messages: { role: "user" | "assistant"; content: string }[] }
// Response: { text: string }   (200)
//           { error: string }  (4xx/5xx)
//
// Model + routing: plain string model id → routed through the Vercel AI Gateway
// automatically (AI_GATEWAY_API_KEY locally, OIDC in prod), same as /api/chat.
// Uses generateText from `ai@5` — no new SDK deps, so the chat route stays put.

import { generateText, type ModelMessage } from "ai";
import { getCharacter, SCRIPT } from "@/lib/characters";
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
  let characterId: string;
  let messages: ChatTurn[];

  try {
    const body = (await req.json()) as {
      characterId?: string;
      messages?: ChatTurn[];
    };
    characterId = body.characterId ?? "";
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const character = getCharacter(characterId);
  if (!character) {
    return Response.json({ error: "Unknown character." }, { status: 400 });
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

  const system = `${buildSystemPrompt(character, SCRIPT)}\n\n${SPOKEN_STYLE}`;

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

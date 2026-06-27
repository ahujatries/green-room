import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { buildSystemPrompt } from "@/lib/prompt";
import type { Character, WorkScript } from "@/lib/characters";

// Streamed responses can run a little long; give them room on Vercel.
export const maxDuration = 30;

// The character + script are sent inline by the client (no auth, no DB). The
// browser owns the room; the server just grounds the model in what it's given.
export async function POST(req: Request) {
  const { messages, character, script } = (await req.json()) as {
    messages: UIMessage[];
    character: Character;
    script: WorkScript;
  };

  if (!character?.name || !script?.text) {
    return new Response("Missing character or script", { status: 400 });
  }

  // Plain string model id → routed through the Vercel AI Gateway automatically
  // (auth via AI_GATEWAY_API_KEY locally, or OIDC when deployed on Vercel).
  const result = streamText({
    model: process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-4.6",
    system: buildSystemPrompt(character, script),
    messages: convertToModelMessages(messages),
    temperature: 0.85,
    headers: {
      "x-title": "Arqo · The Green Room",
    },
  });

  return result.toUIMessageStreamResponse();
}

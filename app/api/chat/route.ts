import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getCharacter, SCRIPT } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/prompt";

// Streamed responses can run a little long; give them room on Vercel.
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, characterId } = (await req.json()) as {
    messages: UIMessage[];
    characterId: string;
  };

  const character = getCharacter(characterId);
  if (!character) {
    return new Response("Unknown character", { status: 400 });
  }

  // Plain string model id → routed through the Vercel AI Gateway automatically
  // (auth via AI_GATEWAY_API_KEY locally, or OIDC when deployed on Vercel).
  const result = streamText({
    model: process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-4.6",
    system: buildSystemPrompt(character, SCRIPT),
    messages: convertToModelMessages(messages),
    temperature: 0.85,
    headers: {
      "x-title": "Arqo · The Green Room",
    },
  });

  return result.toUIMessageStreamResponse();
}

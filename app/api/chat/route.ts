import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { buildSystemPrompt } from "@/lib/prompt";
import { loadGroundedContext } from "@/lib/data/grounding";
import { resolveOrCreateSession, appendMessage } from "@/lib/data/chat";
import type { LoadedScript } from "@/lib/data/scripts";

// `buildSystemPrompt` is typed against the hard-coded demo `SCRIPT` (it carries
// a literal shape with a `meta` line). The grounded `LoadedScript` is the real
// thing it consumes — same fields `buildSystemPrompt` actually reads (title,
// format, logline, text). Bridge the structural gap here so neither prompt.ts
// nor the grounding helper has to bend to the other.
function asPromptScript(script: LoadedScript): Parameters<typeof buildSystemPrompt>[1] {
  // `buildSystemPrompt` only reads title/format/logline/text — all present on a
  // LoadedScript. The cast (via unknown) is solely to satisfy the demo SCRIPT's
  // literal types and its extra `meta` field, which the prompt never references.
  return script as unknown as Parameters<typeof buildSystemPrompt>[1];
}

// Streamed responses can run a little long; give them room on Vercel.
export const maxDuration = 30;

// Pull the plain text out of a UI message (AI SDK 5 messages are part arrays).
function messageText(message: UIMessage | undefined): string {
  if (!message) return "";
  const parts = message.parts ?? [];
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

export async function POST(req: Request) {
  const { messages, scriptId, characterId } = (await req.json()) as {
    messages: UIMessage[];
    scriptId: string;
    characterId: string;
  };

  if (!scriptId || !characterId) {
    return new Response("Missing scriptId or characterId", { status: 400 });
  }

  // Resolve the REAL character + script text for this writer. RLS guarantees we
  // only ever load their own work; a missing piece means there's nothing
  // truthful to ground against, so we refuse rather than invent.
  const grounded = await loadGroundedContext(scriptId, characterId);
  if (!grounded) {
    return new Response("Unknown script or character", { status: 400 });
  }

  const { character, script } = grounded;

  // Persistence is best-effort and decoupled from the stream: resolve (or
  // create) the one session for this tuple, and record the writer's newest turn
  // before we start streaming. Any auth/DB hiccup degrades to no-op.
  const sessionId = await resolveOrCreateSession({
    scriptId,
    characterId,
    characterName: character.name,
    mode: "chat",
  });

  const latestUserText = messageText(messages[messages.length - 1]);
  if (latestUserText) {
    await appendMessage(sessionId, "user", latestUserText);
  }

  // Plain string model id → routed through the Vercel AI Gateway automatically
  // (auth via AI_GATEWAY_API_KEY locally, or OIDC when deployed on Vercel).
  const result = streamText({
    model: process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-4.6",
    system: buildSystemPrompt(character, asPromptScript(script)),
    messages: convertToModelMessages(messages),
    temperature: 0.85,
    headers: {
      "x-title": "Arqo · The Green Room",
    },
    onFinish: async ({ text }) => {
      await appendMessage(sessionId, "assistant", text);
    },
  });

  return result.toUIMessageStreamResponse();
}

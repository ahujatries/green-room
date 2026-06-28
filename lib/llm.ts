// Resolve the chat / voice-turn language model.
//
// Why this exists: the Vercel AI Gateway free tier returns 403
// (RestrictedModelsError) for every usable Claude model, which took text AND
// voice down in prod. When ANTHROPIC_API_KEY is set we call Anthropic
// DIRECTLY (no gateway, no AI credits) for the LLM turns; otherwise we fall
// back to the gateway-routed string id so local/dev and any future
// gateway-funded setup keep working unchanged.
//
// Only the LLM turns (/api/chat, /api/voice-reply) route through here. The
// speech/transcription modalities have no Anthropic equivalent and stay on the
// gateway (see lib/gateway.ts), authed by AI_GATEWAY_API_KEY.
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

// Anthropic-native id (hyphenated) for direct calls; the dotted
// "anthropic/claude-sonnet-4.6" form is a gateway slug, not an API model id.
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const DEFAULT_GATEWAY_MODEL = "anthropic/claude-sonnet-4.6";

export function chatModel(): LanguageModel {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_CHAT_MODEL ?? DEFAULT_ANTHROPIC_MODEL);
  }
  return process.env.CHAT_MODEL ?? DEFAULT_GATEWAY_MODEL;
}

// Tiny server-only helper for talking to the Vercel AI Gateway over its REST
// API for the speech (TTS) and transcription (STT) modalities.
//
// Why REST instead of the `@ai-sdk/gateway` speech/transcription helpers?
// Two independent reasons, both verified against the live gateway on 2026-06-27:
//   1. `gateway.speechModel()` / `gateway.transcriptionModel()` only exist in
//      `@ai-sdk/gateway@4`, which requires `ai@6`. This repo's chat route
//      (owned by another dev) runs on `ai@5`; bumping `ai` a major version
//      would risk breaking it. The HARD constraint is "only add deps, don't
//      break their files."
//   2. Even on a clean `ai@6` + `@ai-sdk/gateway@4` install, the SDK helper
//      currently throws `AI_UnsupportedModelVersionError` ("AI SDK 5 only
//      supports models that implement specification version v2") *before*
//      making any network call — i.e. the SDK speech path is presently broken
//      in the published versions. REST is the only working path.
//
// The endpoint convention below was reverse-engineered from the exact request
// the working `ai@5` gateway language-model call makes, then confirmed for the
// speech/transcription modalities (both reach authentication with these
// headers — a real key returns audio/text; a dummy key returns a clean
// "Authentication failed"). See VOICE_PIPELINE.md for the full investigation.
//
// Auth: on Vercel the platform injects `VERCEL_OIDC_TOKEN` and the gateway
// accepts it as a Bearer token — no key needed in prod. Locally we fall back to
// `AI_GATEWAY_API_KEY` (the same env var the chat route documents).

export const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v4/ai";

// The gateway's request/response protocol version. Sent on every call; the
// gateway rejects calls whose protocol it doesn't recognize.
export const AI_GATEWAY_PROTOCOL_VERSION = "0.0.1";

// All current AI SDK model specs are spec version "2".
const MODEL_SPECIFICATION_VERSION = "2";

/**
 * Resolve the Bearer token used to authenticate Gateway REST calls.
 * Prefers an explicit API key (local dev); falls back to the Vercel-injected
 * OIDC token (production). Returns null when neither is present so callers can
 * surface a clean 500 instead of a cryptic upstream error.
 */
export function getGatewayToken(): string | null {
  return process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN ?? null;
}

/**
 * Build the full header set for a Gateway modality REST call, or null if no
 * auth token is available.
 *
 * @param modality  "speech" | "transcription" — selects the typed model-id /
 *                   spec-version header names the gateway protocol expects.
 * @param modelId   e.g. "openai/tts-1" or "openai/whisper-1".
 */
export function gatewayModalityHeaders(
  modality: "speech" | "transcription",
  modelId: string,
): Record<string, string> | null {
  const token = getGatewayToken();
  if (!token) return null;
  const authMethod = process.env.AI_GATEWAY_API_KEY ? "api-key" : "oidc";
  return {
    Authorization: `Bearer ${token}`,
    "ai-gateway-auth-method": authMethod,
    "ai-gateway-protocol-version": AI_GATEWAY_PROTOCOL_VERSION,
    // The gateway has shipped two different model-id header conventions for the
    // modality REST endpoints: the documented `ai-model-id` and the typed
    // `ai-<modality>-model-id` used by the SDK's language-model call. Sending
    // both is harmless and survives whichever the endpoint currently expects
    // (without both, speech 400s with "Missing or empty model identifier").
    "ai-model-id": modelId,
    [`ai-${modality}-model-id`]: modelId,
    [`ai-${modality}-model-specification-version`]: MODEL_SPECIFICATION_VERSION,
    "Content-Type": "application/json",
  };
}

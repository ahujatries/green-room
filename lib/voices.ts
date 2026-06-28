// ElevenLabs in-account premade voice ids (GET /v1/voices). These live in the
// account's own voice list, so they work on the free plan — unlike arbitrary
// library voices, which 402 with paid_plan_required. Each is chosen to match a
// character's gender / age / tone (see each character's voiceNote).
//
// Kept in its own module (not characters.ts) so the per-work cast files can
// import these ids without forming an import cycle with characters.ts.
export const VOICES = {
  sarah: "EXAVITQu4vr4xnSDxMaL", // young female, confident — Nadia
  brian: "nPczCjzI2devNBz1zQrb", // deep, resonant, comforting older male — August
  liam: "TX3LPaxmHKxFdv7VOQHJ", // energetic young male — Luke
  daniel: "onwK4e9ZLuTAKqWW03F9", // British, steady, formal — Obi-Wan
  alice: "Xb7hH8MSUJpSbSDYk0k2", // British, clear, commanding female — Leia
  chris: "iP95p4xoKVk53GoZ742B", // charming, casual, wry male — Han
  adam: "pNInz6obpgDQGcFmaJgB", // dominant, firm male — Vader
} as const;

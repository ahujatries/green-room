// POST /api/speech — text-to-speech, called directly (no Vercel AI Gateway).
//
// ElevenLabs is the default voice for everyone when ELEVENLABS_API_KEY is set —
// premium tiers (studio/staff/max) get a richer model and, if configured, a
// premium voice id. OpenAI tts-1 is only a fallback for setups that have an
// OpenAI key but no ElevenLabs key. (The gateway path was removed — it 502'd.)
//
// Request:  { text: string, voice?: string }
// Response: 200 with raw MP3 bytes and Content-Type: audio/mpeg
//           On error: JSON { error } with a 4xx/5xx status.

import { NextRequest } from "next/server";
import { isPremiumTier } from "@/lib/tier";

export const maxDuration = 30;

// ElevenLabs — the default provider.
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL ?? "eleven_turbo_v2_5";
const ELEVENLABS_PREMIUM_MODEL =
  process.env.ELEVENLABS_PREMIUM_MODEL ?? "eleven_multilingual_v2";
// Default to an in-account premade voice ("George" — warm storyteller). NOTE:
// free ElevenLabs plans can only use voices that are in the account's own voice
// list (GET /v1/voices), NOT arbitrary library voices like "Rachel" (that 402s
// with paid_plan_required). Override per deploy with ELEVENLABS_VOICE_ID.
const ELEVENLABS_DEFAULT_VOICE =
  process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb"; // "George"
const ELEVENLABS_PREMIUM_VOICE =
  process.env.ELEVENLABS_PREMIUM_VOICE_ID ?? ELEVENLABS_DEFAULT_VOICE;

// OpenAI TTS — fallback only.
const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_SPEECH_MODEL = process.env.SPEECH_MODEL ?? "tts-1";
const OPENAI_DEFAULT_VOICE = process.env.SPEECH_VOICE ?? "alloy";

export async function POST(req: NextRequest) {
  let text: string;
  let voice: string | undefined;
  // Optional per-character overrides (e.g. Vader: a richer model + steadier
  // prosody before the browser-side processing in lib/voice-fx.ts).
  let modelId: string | undefined;
  let voiceSettings: Record<string, unknown> | undefined;
  try {
    const body = (await req.json()) as {
      text?: string;
      voice?: string;
      modelId?: string;
      voiceSettings?: Record<string, unknown>;
    };
    text = (body.text ?? "").trim();
    voice = body.voice?.trim() || undefined;
    modelId = body.modelId?.trim() || undefined;
    voiceSettings = body.voiceSettings;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!text) {
    return Response.json({ error: "Missing `text` to synthesize." }, { status: 400 });
  }

  const hasEleven = !!process.env.ELEVENLABS_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  // ElevenLabs first (the configured provider). Fall back to OpenAI only if it
  // fails AND an OpenAI key exists.
  if (hasEleven) {
    const premium = await isPremiumTier();
    const result = await synthesizeElevenLabs(text, voice, premium, modelId, voiceSettings);
    if (result) return result;
    if (!hasOpenAI) {
      return Response.json(
        { error: "ElevenLabs speech failed and no OpenAI fallback configured." },
        { status: 502 },
      );
    }
  }

  if (hasOpenAI) return synthesizeOpenAI(text, voice);

  return Response.json(
    { error: "Speech is not configured. Set ELEVENLABS_API_KEY (or OPENAI_API_KEY)." },
    { status: 500 },
  );
}

// --- ElevenLabs (default) -------------------------------------------------
// Returns a 200 MP3 Response on success, or null on any failure.
async function synthesizeElevenLabs(
  text: string,
  voice: string | undefined,
  premium: boolean,
  modelOverride?: string,
  voiceSettings?: Record<string, unknown>,
): Promise<Response | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  const voiceId =
    voice || (premium ? ELEVENLABS_PREMIUM_VOICE : ELEVENLABS_DEFAULT_VOICE);
  // A per-character model override (e.g. Vader's multilingual_v2) wins over the
  // tier default, so the chosen voice sounds right even for non-premium users.
  const modelId =
    modelOverride || (premium ? ELEVENLABS_PREMIUM_MODEL : ELEVENLABS_MODEL);
  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          ...(voiceSettings ? { voice_settings: voiceSettings } : {}),
        }),
      },
    );
    if (!upstream.ok) return null;
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (bytes.byteLength === 0) return null;
    return mp3Response(bytes);
  } catch {
    return null;
  }
}

// --- OpenAI tts-1 (fallback) ----------------------------------------------
async function synthesizeOpenAI(
  text: string,
  voice: string | undefined,
): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY!;
  try {
    const upstream = await fetch(OPENAI_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_SPEECH_MODEL,
        input: text,
        voice: voice || OPENAI_DEFAULT_VOICE,
        response_format: "mp3",
      }),
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return Response.json(
        { error: `Speech upstream failed (${upstream.status}).`, detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }
    const bytes = Buffer.from(await upstream.arrayBuffer());
    return mp3Response(bytes);
  } catch (err) {
    return Response.json(
      { error: `Speech request errored: ${String(err)}` },
      { status: 500 },
    );
  }
}

function mp3Response(bytes: Buffer): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

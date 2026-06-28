// POST /api/speech — text-to-speech, called directly (no Vercel AI Gateway).
//
// Two providers:
//   • OpenAI tts-1 — the default for everyone (logged out, free, pro). Reliable,
//     cheap, ships now. This replaces the gateway path that was 502-ing in prod.
//   • ElevenLabs — higher-quality, more characterful voice, served ONLY to
//     premium tiers (studio/staff/max) and ONLY when ELEVENLABS_API_KEY is set.
//     Until both are in place the feature is dormant and everyone gets OpenAI.
//
// Request:  { text: string, voice?: string }
// Response: 200 with raw MP3 bytes and Content-Type: audio/mpeg
//           (so the client can do `new Audio(URL.createObjectURL(blob))`)
//           On error: JSON { error } with a 4xx/5xx status.

import { NextRequest } from "next/server";
import { canUsePremiumVoice } from "@/lib/tier";

export const maxDuration = 30;

// OpenAI TTS — the default provider.
const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_SPEECH_MODEL = process.env.SPEECH_MODEL ?? "tts-1";
const OPENAI_DEFAULT_VOICE = process.env.SPEECH_VOICE ?? "alloy";

// ElevenLabs — the premium provider.
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL ?? "eleven_turbo_v2_5";
// A sensible default voice id; per-character voices can be layered on later.
const ELEVENLABS_DEFAULT_VOICE =
  process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // "Rachel"

export async function POST(req: NextRequest) {
  let text: string;
  let voice: string | undefined;
  try {
    const body = (await req.json()) as { text?: string; voice?: string };
    text = (body.text ?? "").trim();
    voice = body.voice?.trim() || undefined;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!text) {
    return Response.json(
      { error: "Missing `text` to synthesize." },
      { status: 400 },
    );
  }

  // Premium users on a configured ElevenLabs key get the richer voice; everyone
  // else (and any failure to confirm tier) falls through to OpenAI.
  if (await canUsePremiumVoice()) {
    const result = await synthesizeElevenLabs(text, voice);
    if (result) return result;
    // ElevenLabs failed — degrade to OpenAI rather than 500 the call.
  }

  return synthesizeOpenAI(text, voice);
}

// --- OpenAI tts-1 ---------------------------------------------------------
async function synthesizeOpenAI(
  text: string,
  voice: string | undefined,
): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Speech is not configured. Set OPENAI_API_KEY." },
      { status: 500 },
    );
  }
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

// --- ElevenLabs (premium) -------------------------------------------------
// Returns a 200 MP3 Response on success, or null on any failure so the caller
// can fall back to OpenAI.
async function synthesizeElevenLabs(
  text: string,
  voice: string | undefined,
): Promise<Response | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  const voiceId = voice || ELEVENLABS_DEFAULT_VOICE;
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
        body: JSON.stringify({ text, model_id: ELEVENLABS_MODEL }),
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

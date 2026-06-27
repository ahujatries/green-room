// POST /api/speech — text-to-speech via the Vercel AI Gateway (tts-1).
//
// Request:  { text: string, voice?: string }
// Response: 200 with the raw MP3 bytes and Content-Type: audio/mpeg
//           (so the client can do `new Audio(URL.createObjectURL(blob))`)
//           On error: JSON { error } with a 4xx/5xx status.
//
// We call the Gateway's REST speech endpoint directly (returns base64 audio) and
// re-emit it as binary. See lib/gateway.ts for why REST over the SDK helper.

import { NextRequest } from "next/server";
import { AI_GATEWAY_BASE_URL, gatewayModalityHeaders } from "@/lib/gateway";

export const maxDuration = 30;

const SPEECH_MODEL = process.env.SPEECH_MODEL ?? "openai/tts-1";
// "alloy" is the neutral default; the UI can pass a per-character voice.
const DEFAULT_VOICE = process.env.SPEECH_VOICE ?? "alloy";

export async function POST(req: NextRequest) {
  const headers = gatewayModalityHeaders("speech", SPEECH_MODEL);
  if (!headers) {
    return Response.json(
      {
        error:
          "AI Gateway is not configured. Set AI_GATEWAY_API_KEY locally (OIDC handles this in production).",
      },
      { status: 500 },
    );
  }

  let text: string;
  let voice: string;
  try {
    const body = (await req.json()) as { text?: string; voice?: string };
    text = (body.text ?? "").trim();
    voice = body.voice?.trim() || DEFAULT_VOICE;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!text) {
    return Response.json(
      { error: "Missing `text` to synthesize." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${AI_GATEWAY_BASE_URL}/speech-model`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, voice, outputFormat: "mp3" }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return Response.json(
        {
          error: `Speech upstream failed (${upstream.status}).`,
          detail: detail.slice(0, 500),
        },
        { status: 502 },
      );
    }

    // The REST endpoint returns { audio: <base64>, warnings: [] }.
    const result = (await upstream.json()) as { audio?: string };
    if (!result.audio) {
      return Response.json(
        { error: "Upstream returned no audio." },
        { status: 502 },
      );
    }

    const bytes = Buffer.from(result.audio, "base64");
    // Hand back a fresh ArrayBuffer-backed body the Response can stream.
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      { error: `Speech request errored: ${String(err)}` },
      { status: 500 },
    );
  }
}

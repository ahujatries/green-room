// POST /api/transcribe — speech-to-text via the Vercel AI Gateway (whisper-1).
//
// Accepts EITHER:
//   • multipart/form-data with an `audio` file field (what MediaRecorder + a
//     FormData upload produce — the primary path the client hook uses), or
//   • application/json: { audio: string /* base64, no data: prefix */,
//                         mediaType?: string /* defaults to audio/webm */ }
//
// Returns: { text: string }   (200)
//          { error: string }  (4xx/5xx)
//
// We call the Gateway's REST transcription endpoint directly rather than the
// `@ai-sdk/gateway` helper — see lib/gateway.ts for why (keeps the repo on ai@5).

import { NextRequest } from "next/server";
import { AI_GATEWAY_BASE_URL, gatewayModalityHeaders } from "@/lib/gateway";

// Transcription of a short utterance is quick, but give it headroom on Vercel.
export const maxDuration = 30;

// Whisper via the Gateway. Overridable for testing / model swaps.
const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL ?? "openai/whisper-1";

export async function POST(req: NextRequest) {
  const headers = gatewayModalityHeaders("transcription", TRANSCRIBE_MODEL);
  if (!headers) {
    return Response.json(
      {
        error:
          "AI Gateway is not configured. Set AI_GATEWAY_API_KEY locally (OIDC handles this in production).",
      },
      { status: 500 },
    );
  }

  // --- 1. Normalize the incoming audio into a base64 string + media type. ---
  let audioBase64: string;
  let mediaType: string;

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("audio");
      if (!(file instanceof Blob)) {
        return Response.json(
          { error: "Expected an `audio` file field in the form data." },
          { status: 400 },
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.byteLength === 0) {
        return Response.json({ error: "Empty audio upload." }, { status: 400 });
      }
      audioBase64 = buf.toString("base64");
      // Blob.type is the most reliable hint (e.g. "audio/webm;codecs=opus").
      mediaType = file.type || "audio/webm";
    } else {
      // Assume JSON { audio: base64, mediaType? }.
      const body = (await req.json()) as {
        audio?: string;
        mediaType?: string;
      };
      if (!body.audio || typeof body.audio !== "string") {
        return Response.json(
          { error: "Missing `audio` (base64 string) in JSON body." },
          { status: 400 },
        );
      }
      // Tolerate a data: URL prefix if a caller sends one.
      audioBase64 = body.audio.includes(",")
        ? body.audio.slice(body.audio.indexOf(",") + 1)
        : body.audio;
      mediaType = body.mediaType ?? "audio/webm";
    }
  } catch {
    return Response.json(
      { error: "Could not parse request body." },
      { status: 400 },
    );
  }

  // --- 2. Hand the audio to the Gateway transcription endpoint. ---
  try {
    const upstream = await fetch(`${AI_GATEWAY_BASE_URL}/transcription-model`, {
      method: "POST",
      headers,
      body: JSON.stringify({ audio: audioBase64, mediaType }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return Response.json(
        {
          error: `Transcription upstream failed (${upstream.status}).`,
          detail: detail.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const result = (await upstream.json()) as { text?: string };
    return Response.json({ text: result.text ?? "" });
  } catch (err) {
    return Response.json(
      { error: `Transcription request errored: ${String(err)}` },
      { status: 500 },
    );
  }
}

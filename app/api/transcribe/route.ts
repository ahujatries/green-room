// POST /api/transcribe — speech-to-text via OpenAI Whisper, called directly.
//
// We call api.openai.com straight (not the Vercel AI Gateway): the gateway's
// audio modality was 502-ing in production on the free tier, the same wall that
// already forced chat + voice-reply onto a direct provider. Whisper is an OpenAI
// model, so the direct path is OpenAI.
//
// Accepts EITHER:
//   • multipart/form-data with an `audio` file field (what MediaRecorder + a
//     FormData upload produce — the primary path the client hook uses), or
//   • application/json: { audio: string /* base64, no data: prefix */,
//                         mediaType?: string /* defaults to audio/webm */ }
//
// Returns: { text: string }   (200)
//          { error: string }  (4xx/5xx)

import { NextRequest } from "next/server";

// Transcription of a short utterance is quick, but give it headroom on Vercel.
export const maxDuration = 30;

// Whisper via OpenAI. Overridable for testing / model swaps.
const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL ?? "whisper-1";
const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Transcription is not configured. Set OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  // --- 1. Normalize the incoming audio into a Blob + filename. ---
  let audioBlob: Blob;
  let filename: string;

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
      if (file.size === 0) {
        return Response.json({ error: "Empty audio upload." }, { status: 400 });
      }
      audioBlob = file;
      filename = (file instanceof File && file.name) || "speech.webm";
    } else {
      // Assume JSON { audio: base64, mediaType? }.
      const body = (await req.json()) as { audio?: string; mediaType?: string };
      if (!body.audio || typeof body.audio !== "string") {
        return Response.json(
          { error: "Missing `audio` (base64 string) in JSON body." },
          { status: 400 },
        );
      }
      // Tolerate a data: URL prefix if a caller sends one.
      const base64 = body.audio.includes(",")
        ? body.audio.slice(body.audio.indexOf(",") + 1)
        : body.audio;
      const mediaType = body.mediaType ?? "audio/webm";
      audioBlob = new Blob([Buffer.from(base64, "base64")], { type: mediaType });
      const ext = mediaType.includes("mp4")
        ? "mp4"
        : mediaType.includes("mpeg")
          ? "mp3"
          : mediaType.includes("wav")
            ? "wav"
            : "webm";
      filename = `speech.${ext}`;
    }
  } catch {
    return Response.json(
      { error: "Could not parse request body." },
      { status: 400 },
    );
  }

  // --- 2. Hand the audio to OpenAI's transcription endpoint (multipart). ---
  try {
    const upstreamForm = new FormData();
    upstreamForm.append("file", audioBlob, filename);
    upstreamForm.append("model", TRANSCRIBE_MODEL);

    const upstream = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
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

// POST /api/transcribe — speech-to-text, called directly (no Vercel AI Gateway).
//
// ElevenLabs Scribe is the default STT when ELEVENLABS_API_KEY is set; OpenAI
// whisper-1 is a fallback for setups with an OpenAI key but no ElevenLabs key.
// (The gateway audio path was removed — it 502'd in production.)
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

export const maxDuration = 30;

const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const ELEVENLABS_STT_MODEL = process.env.ELEVENLABS_STT_MODEL ?? "scribe_v1";
const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL ?? "whisper-1";

export async function POST(req: NextRequest) {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!elevenKey && !openaiKey) {
    return Response.json(
      { error: "Transcription is not configured. Set ELEVENLABS_API_KEY (or OPENAI_API_KEY)." },
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
      const body = (await req.json()) as { audio?: string; mediaType?: string };
      if (!body.audio || typeof body.audio !== "string") {
        return Response.json(
          { error: "Missing `audio` (base64 string) in JSON body." },
          { status: 400 },
        );
      }
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
    return Response.json({ error: "Could not parse request body." }, { status: 400 });
  }

  // --- 2. Transcribe. ElevenLabs first; OpenAI fallback. ---
  if (elevenKey) {
    const text = await transcribeElevenLabs(audioBlob, filename, elevenKey);
    if (text !== null) return Response.json({ text });
    if (!openaiKey) {
      return Response.json(
        { error: "ElevenLabs transcription failed and no OpenAI fallback configured." },
        { status: 502 },
      );
    }
  }

  return transcribeOpenAI(audioBlob, filename, openaiKey!);
}

// --- ElevenLabs Scribe (default) — returns text, or null on failure. ------
async function transcribeElevenLabs(
  audioBlob: Blob,
  filename: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", audioBlob, filename);
    form.append("model_id", ELEVENLABS_STT_MODEL);
    const upstream = await fetch(ELEVENLABS_STT_URL, {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });
    if (!upstream.ok) return null;
    const result = (await upstream.json()) as { text?: string };
    return result.text ?? "";
  } catch {
    return null;
  }
}

// --- OpenAI whisper-1 (fallback) ------------------------------------------
async function transcribeOpenAI(
  audioBlob: Blob,
  filename: string,
  apiKey: string,
): Promise<Response> {
  try {
    const form = new FormData();
    form.append("file", audioBlob, filename);
    form.append("model", OPENAI_TRANSCRIBE_MODEL);
    const upstream = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return Response.json(
        { error: `Transcription upstream failed (${upstream.status}).`, detail: detail.slice(0, 500) },
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

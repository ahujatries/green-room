// POST /api/casting — generate an AI casting photo for a character.
//
// The design's Video "read-through" has an empty casting slot ("who plays
// {name}?"). This fills it: a cinematic portrait generated from the character's
// spoiler-free `look`, via an image model routed through the Vercel AI Gateway
// (same gateway path as /api/chat + /api/voice-reply — OIDC in prod, the pulled
// token locally). It's the 5th Gateway modality in the app: text, STT, TTS,
// reply, and now image.
//
// Request:  { characterId: string }
// Response: { image: string }  — a data: URL (image/*) ready for <img src>/bg
//           { error: string }  — 4xx/5xx

import { generateText } from "ai";
import { getCharacter } from "@/lib/characters";

// Image generation is slower than text; give it headroom.
export const maxDuration = 60;

const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "google/gemini-3-pro-image";

export async function POST(req: Request) {
  let characterId: string;
  try {
    const body = (await req.json()) as { characterId?: string };
    characterId = body.characterId ?? "";
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const character = getCharacter(characterId);
  if (!character) {
    return Response.json({ error: "Unknown character." }, { status: 400 });
  }

  // Demo characters carry a tuned `look`; anything else falls back to a prompt
  // derived from role + blurb so the route still works for sourced characters.
  const look = character.look ?? `${character.role}. ${character.blurb}`;
  const prompt =
    `Cinematic casting portrait for a film character. ${look} ` +
    `Single subject, head-and-shoulders framing, photoreal, 35mm film look, ` +
    `natural skin texture. No text, no captions, no watermark, no border.`;

  try {
    const result = await generateText({
      model: IMAGE_MODEL,
      prompt,
    });

    // Image models return their output in result.files (uint8Array + mediaType).
    const files = (result as { files?: Array<{ mediaType?: string; uint8Array: Uint8Array }> }).files ?? [];
    const image = files.find((f) => f.mediaType?.startsWith("image/"));
    if (!image) {
      return Response.json(
        { error: "The model returned no image." },
        { status: 502 },
      );
    }

    const base64 = Buffer.from(image.uint8Array).toString("base64");
    return Response.json({ image: `data:${image.mediaType};base64,${base64}` });
  } catch (err) {
    return Response.json(
      { error: `Casting generation failed: ${String(err)}` },
      { status: 500 },
    );
  }
}

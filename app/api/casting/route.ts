// POST /api/casting — generate an AI casting photo for a character.
//
// The design's Video "read-through" has an empty casting slot ("who plays
// {name}?"). This fills it: a cinematic portrait generated from the character's
// spoiler-free `look`, via an image model routed through the Vercel AI Gateway.
//
// SHIPPED DISABLED. This account is funded only for Anthropic (text) and
// ElevenLabs (voice) — there is NO image-generation key, and the Vercel AI
// Gateway image path fails on the free tier (the same wall that forced
// chat + voice-reply onto Anthropic-direct and STT/TTS onto ElevenLabs-direct).
// Claude does not generate images, so there is no funded drop-in provider.
//
// Rather than 500 on every click, casting is gated behind
// NEXT_PUBLIC_CASTING_ENABLED. While unset/false, this route returns a clean
// 503 and the UI shows an intentional "casting coming soon" state. To turn it
// back on once an image provider is funded: wire IMAGE_MODEL to that provider
// (and its key), then set NEXT_PUBLIC_CASTING_ENABLED=true.
//
// Request:  { character: Character }   (sent inline by the client; no auth/DB)
// Response: { image: string }  — a data: URL (image/*) ready for <img src>/bg
//           { error: string }  — 4xx/5xx

import { generateText } from "ai";
import type { Character } from "@/lib/characters";

// Image generation is slower than text; give it headroom.
export const maxDuration = 60;

const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "google/gemini-3-pro-image";
const CASTING_ENABLED = process.env.NEXT_PUBLIC_CASTING_ENABLED === "true";

export async function POST(req: Request) {
  // No funded image provider → fail cleanly instead of hitting the gateway and
  // 500ing. The client renders a "coming soon" state for this, never an error.
  if (!CASTING_ENABLED) {
    return Response.json(
      { error: "Casting is coming soon.", available: false },
      { status: 503 },
    );
  }

  let character: Character | undefined;
  try {
    const body = (await req.json()) as { character?: Character };
    character = body.character;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!character?.name) {
    return Response.json({ error: "Missing character." }, { status: 400 });
  }

  // A tuned `look` is best; anything else falls back to a prompt derived from
  // role + blurb so the route still works for any pasted-script character.
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

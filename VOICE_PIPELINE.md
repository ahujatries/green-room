# Voice + Video pipeline — integration contract

The speech loop for The Green Room's **Voice Call** and **Video Call** modes.
This doc is the source of truth for how the pipeline is wired.

```
app/api/transcribe/route.ts   POST  audio → { text }            (STT, ElevenLabs Scribe)
app/api/voice-reply/route.ts  POST  turns → { text }            (in-character reply, Anthropic-direct)
app/api/speech/route.ts       POST  text  → audio/mpeg bytes    (TTS, ElevenLabs)
lib/use-voice-call.ts         "use client" hook that drives the whole loop
components/call-view.tsx       Voice Call screen (orb + waveform)
components/video-view.tsx      Video Call screen (casting photo + read-through)
```

**No Vercel AI Gateway in the voice path.** STT and TTS call ElevenLabs
directly; the reply LLM calls Anthropic directly. `lib/gateway.ts` still exists
but is now only used by `/api/casting` (image generation). This is a
deliberate change from the original design — the gateway audio modalities
502'd in production and the gateway free tier 403'd the Claude models, so each
hop was moved to the provider's own API. See [History](#history--why-no-gateway).

**Two keys run the whole experience:** `ELEVENLABS_API_KEY` (STT + TTS) and
`ANTHROPIC_API_KEY` (the reply). **No OpenAI key is required** — OpenAI is a
fallback only. See [Env](#env).

---

## TL;DR for the UI

You almost certainly only need the hook. Both call screens already use it.

```tsx
"use client";
import { useVoiceCall } from "@/lib/use-voice-call";

function CallScreen({ character, script }) {
  const { status, caption, transcript, level, start, end, sendText } =
    useVoiceCall({ character, script });
  // status drives the orb/waveform; level (0..1) is live mic loudness;
  // caption is the line on screen; transcript is the full log.
  // start() to begin the always-on call, end() to hang up,
  // sendText("...") to feed a typed line.
}
```

The call is **always-on**: there is no mute / push-to-talk button. `start()`
opens the mic for the whole call; you just talk, pause, and the character
replies. The only control is **End call** (`end()`).

---

## `useVoiceCall` — the hook (primary integration surface)

```ts
import { useVoiceCall } from "@/lib/use-voice-call";

function useVoiceCall(options: {
  character: Character;   // the inhabited character (sent inline; no auth/DB)
  script: WorkScript;     // the work the character is grounded in
  voice?: string;         // optional TTS voice id override passed to /api/speech
}): {
  status: "idle" | "listening" | "thinking" | "speaking";
  caption: string;                                   // line currently on screen
  transcript: { role: "user" | "assistant"; text: string }[]; // full ordered log
  level: number;                                     // live mic loudness 0..1 (reactive orb)
  start: () => void;                                 // begin the always-on call (asks mic permission)
  end: () => void;                                   // hang up: stop mic + audio, reset to idle
  sendText: (text: string) => void;                  // feed a typed line (skips STT)
};
```

### State machine — continuous, always-on

```
   start() ─▶ listening ──(you pause ~1.1s)──▶ thinking ──▶ speaking ──(audio ends)──▶ listening
                  ▲                              (STT→reply→TTS)            │
                  └──────────────(you barge in: sustained speech)──────────┘

   end() returns to idle from anywhere.   sendText() enters at "thinking".
```

- **`idle`** — before `start()` / after `end()`. `caption` may hold the last
  line or an error message.
- **`listening`** — mic is open and a voice-activity detector (VAD) is watching
  for the end of your turn. `level` tracks your live loudness.
- **`thinking`** — transcribing your turn and/or generating the reply.
  `caption` shows your line.
- **`speaking`** — the character's audio is playing. `caption` shows the reply.

### Behavior notes (so the UI can trust it)

- **Always-on, no mute.** Once `start()` runs, the mic stays open for the whole
  call. There is no mute or push-to-talk; the loop auto-resumes listening after
  every reply.
- **Voice-activity detection ends your turn.** While `listening`, sustained
  speech above a threshold marks your turn; ~1.1s of trailing silence ends it
  and kicks off transcribe → reply → speak. Sub-250ms blips are ignored, so a
  cough or click won't trigger a turn.
- **Barge-in.** While the character is `speaking`, sustained, louder speech
  (~320ms above a higher threshold) **cuts their playback** and hands the floor
  straight back to you. The higher bar plus the browser's echo cancellation
  keeps the character's own voice from interrupting itself.
- **`start()`** is a no-op unless `status === "idle"`. It requests mic
  permission via `getUserMedia`; on denial it sets `status = "idle"` and puts an
  explanatory message in `caption` (no throw) — you can still `sendText`.
- **`sendText(line)`** appends the line as a user turn and runs it straight
  through **voice-reply → speech**, skipping transcription. It interrupts any
  in-flight capture/playback first. Empty/whitespace is ignored.
- **`end()`** stops recording, stops playback, releases the mic, tears down the
  audio graph, resets to `idle`, clears `caption`. Leaves `transcript` intact.
- The reply **text appears in `caption`/`transcript` before audio is ready**;
  if TTS fails the text still shows and the loop resumes listening.
- All errors are graceful: mic denied, nothing caught, transcription failure,
  and reply failure each set a human-readable `caption` and resume the loop
  (or fall to `idle` if the call has ended). Voice errors are reported to Sentry.
- Browser APIs used: `getUserMedia`, `MediaRecorder`, `AudioContext` /
  `AnalyserNode` (for VAD + `level`), `HTMLAudioElement`,
  `URL.createObjectURL`. No external deps. Cleans up stream, audio graph, and
  object URLs on unmount.
- The recorded audio container is whatever `MediaRecorder` produces (typically
  `audio/webm;codecs=opus` on Chrome/Edge/Firefox, `audio/mp4` on Safari). The
  hook uploads it as multipart and the server reads the type from the blob.

---

## Endpoints

### `POST /api/transcribe` — speech → text (ElevenLabs Scribe)

Calls ElevenLabs Scribe directly:
`POST https://api.elevenlabs.io/v1/speech-to-text`, model `scribe_v1`,
multipart `file` + `model_id`, auth header `xi-api-key: $ELEVENLABS_API_KEY`.
If ElevenLabs fails (or no `ELEVENLABS_API_KEY` is set) and `OPENAI_API_KEY`
exists, it falls back to OpenAI `whisper-1`.

Accepts **either** multipart or JSON.

**Request A — multipart/form-data** (what the hook sends):
- field `audio`: the recorded audio file (Blob/File)

**Request B — application/json**:
```json
{ "audio": "<base64 string, no data: prefix>", "mediaType": "audio/webm" }
```
`mediaType` is optional (defaults to `audio/webm`). A `data:` URL prefix is tolerated.

**Response**
```json
{ "text": "the transcript" }          // 200
{ "error": "..." }                     // 400 bad input · 500 not configured · 502 upstream
```

`500` is returned only when neither `ELEVENLABS_API_KEY` nor `OPENAI_API_KEY`
is set.

**Env**: `ELEVENLABS_STT_MODEL` overrides the Scribe model (default `scribe_v1`);
`TRANSCRIBE_MODEL` overrides the OpenAI fallback model (default `whisper-1`).

---

### `POST /api/voice-reply` — conversation turns → in-character reply (Anthropic-direct)

Builds the **same grounding system prompt as `/api/chat`**
(`buildSystemPrompt(character, script)`), plus a spoken-style layer: 2–4
sentences, **no stage directions / asterisks / markdown / emoji** — only the
words the character would say aloud. Calls `generateText` with the model from
`lib/llm.ts#chatModel()`, which is **Anthropic-direct** (`claude-sonnet-4-6`)
when `ANTHROPIC_API_KEY` is set, and falls back to a gateway-routed string id
otherwise. `temperature: 0.85`.

`character` and `script` are sent inline by the client (no auth, no DB) — the
same room the browser holds for `/api/chat`.

**Request**
```json
{
  "character": { "name": "...", "...": "..." },
  "script":    { "text": "...", "...": "..." },
  "messages": [
    { "role": "user", "content": "Why do you keep your distance?" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```
`messages` is the full ordered history (`role` is `"user"` | `"assistant"`).
Empty turns are filtered out server-side.

**Response**
```json
{ "text": "the spoken-length reply" }  // 200
{ "error": "..." }                     // 400 missing character/script or empty messages · 500 generation failed
```

**Env**: `ANTHROPIC_CHAT_MODEL` overrides the direct model (default
`claude-sonnet-4-6`); `CHAT_MODEL` is the gateway-routed fallback id used only
when `ANTHROPIC_API_KEY` is absent.

---

### `POST /api/speech` — text → spoken audio (ElevenLabs)

Calls ElevenLabs directly:
`POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128`,
auth header `xi-api-key: $ELEVENLABS_API_KEY`, body `{ text, model_id }`.

- **Premium tiers** (`studio,staff,max` — overridable via `PREMIUM_VOICE_TIERS`)
  get `eleven_multilingual_v2`; **everyone else** gets `eleven_turbo_v2_5`.
  Tier is resolved server-side from the Supabase user via `lib/tier.ts`
  (`isPremiumTier()`), failing safe to non-premium.
- **Voice id** comes from `ELEVENLABS_VOICE_ID` (default `JBFqnCBsd6RMkjVDRZzb`,
  ElevenLabs' premade "George"). A per-request `voice` in the body overrides it.
- If ElevenLabs fails (or no `ELEVENLABS_API_KEY` is set) and `OPENAI_API_KEY`
  exists, it falls back to OpenAI `tts-1`.

> **⚠️ ElevenLabs free-tier constraint — use an in-account voice.**
> `ELEVENLABS_VOICE_ID` **must be a voice that exists in the account's own
> voice list** (`GET https://api.elevenlabs.io/v1/voices`). On a free plan,
> ElevenLabs rejects arbitrary **library** voices (e.g. "Rachel") with
> **`402 paid_plan_required`**. The default ("George") is a premade voice that
> sits in every account, so it works on free plans. If you override
> `ELEVENLABS_VOICE_ID`, add that voice to the account first, or stay on a
> premade / in-account id.

**Request**
```json
{ "text": "Drink your coffee.", "voice": "JBFqnCBsd6RMkjVDRZzb" }
```
`voice` is optional (defaults to the tier-appropriate voice id above).

**Response**
- **200**: raw **MP3 bytes**, `Content-Type: audio/mpeg`, `Cache-Control: no-store`.
  Consume with `await res.blob()` → `URL.createObjectURL(blob)` → `new Audio(url)`.
- **error**: JSON `{ "error": "..." }` with `400` (missing text), `500` (neither
  provider configured), or `502` (upstream / no audio).

**Env**: `ELEVENLABS_MODEL` (default `eleven_turbo_v2_5`),
`ELEVENLABS_PREMIUM_MODEL` (default `eleven_multilingual_v2`),
`ELEVENLABS_VOICE_ID`, `ELEVENLABS_PREMIUM_VOICE_ID` (defaults to
`ELEVENLABS_VOICE_ID`), `PREMIUM_VOICE_TIERS`. OpenAI fallback: `SPEECH_MODEL`
(default `tts-1`), `SPEECH_VOICE` (default `alloy`).

---

## Env

The voice pipeline needs **two** keys. Everything else is an optional override
or a fallback.

```bash
# --- Required for voice/video ---
ELEVENLABS_API_KEY=        # STT (Scribe) + TTS. Free plan is fine — but see the
                           # in-account-voice constraint under /api/speech.
ANTHROPIC_API_KEY=         # the in-character reply LLM (Anthropic-direct, no gateway)

# --- ElevenLabs tuning (optional) ---
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb   # "George" (premade, free-tier safe). MUST be in-account.
ELEVENLABS_PREMIUM_VOICE_ID=               # premium-tier voice id (defaults to ELEVENLABS_VOICE_ID)
ELEVENLABS_MODEL=eleven_turbo_v2_5         # base TTS model
ELEVENLABS_PREMIUM_MODEL=eleven_multilingual_v2  # premium-tier TTS model
ELEVENLABS_STT_MODEL=scribe_v1             # Scribe model
PREMIUM_VOICE_TIERS=studio,staff,max       # which user tiers get the premium model/voice

# --- LLM tuning (optional) ---
ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6     # direct model for chat + voice-reply

# --- OpenAI fallback (optional — NOT required) ---
# Only used if a provider above fails or its key is missing.
OPENAI_API_KEY=
TRANSCRIBE_MODEL=whisper-1
SPEECH_MODEL=tts-1
SPEECH_VOICE=alloy

# --- Gateway: the voice path no longer uses it ---
# lib/gateway.ts is now only used by /api/casting (image generation). The
# CHAT_MODEL / AI_GATEWAY_API_KEY vars are the LLM fallback when ANTHROPIC_API_KEY
# is absent. In prod on Vercel, OIDC supplies the gateway credential for casting.
AI_GATEWAY_API_KEY=
CHAT_MODEL=anthropic/claude-sonnet-4.6     # gateway-routed fallback id (no ANTHROPIC_API_KEY)
```

Put keys in `.env.local` (gitignored) for local smoke tests.

---

## History — why no gateway

The pipeline originally routed **every** AI call through the Vercel AI Gateway
(`whisper-1` / `tts-1` for audio, a gateway-slug Claude model for the reply).
That broke in production and was replaced provider-by-provider across PRs
[#13–#16](https://github.com/ahujatries/green-room/pulls):

- **Reply LLM → Anthropic-direct (#10).** The gateway **free tier returns 403
  `RestrictedModelsError`** for every usable Claude model, which took both text
  chat and voice replies down in prod. `lib/llm.ts#chatModel()` now calls
  Anthropic directly when `ANTHROPIC_API_KEY` is set.
- **STT + TTS → ElevenLabs-direct (#13, #15).** The gateway audio modality
  endpoints **502'd in production**. `/api/transcribe` and `/api/speech` now
  call ElevenLabs' own REST API directly (OpenAI kept only as a fallback, so no
  OpenAI key is required).
- **Always-on barge-in client (#13, #14).** The mute / push-to-talk button was
  removed in favor of a continuous, OpenAI-advanced-voice-style loop: open mic,
  VAD-ended turns, and barge-in over the character's playback.
- **Free-tier-safe default voice (#16).** The default `ELEVENLABS_VOICE_ID` was
  pinned to an in-account premade voice so free ElevenLabs plans don't 402 on a
  library voice.

`lib/gateway.ts` survives because `/api/casting` still uses the gateway for
image generation (`google/gemini-3-pro-image`), authed by `AI_GATEWAY_API_KEY`
locally and OIDC in production.

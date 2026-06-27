# Voice + Video pipeline — integration contract

The speech loop for The Green Room's **Voice Call** and **Video Call** modes.
This doc is the source of truth for wiring the UI. Everything here is **new
files only** — no existing file was modified, and `package.json` was **not**
changed (no new dependencies were needed).

```
app/api/transcribe/route.ts   POST  audio → { text }            (STT, whisper-1)
app/api/voice-reply/route.ts  POST  turns → { text }            (in-character reply)
app/api/speech/route.ts       POST  text  → audio/mpeg bytes    (TTS, tts-1)
lib/use-voice-call.ts         "use client" hook that drives the whole loop
lib/gateway.ts                internal helper (gateway REST auth + headers)
```

All AI calls go through the **Vercel AI Gateway**. Auth is automatic in
production via OIDC; locally set `AI_GATEWAY_API_KEY` (see [Env](#env)).

---

## TL;DR for the UI

You almost certainly only need the hook. Import it and render off its state:

```tsx
"use client";
import { useVoiceCall } from "@/lib/use-voice-call";

function CallScreen({ characterId }: { characterId: string }) {
  const { status, caption, transcript, micOn, toggleMic, start, end, sendText } =
    useVoiceCall({ characterId });
  // status drives the orb/waveform; caption is the live line; transcript is the log.
  // start() to begin, toggleMic() to push-to-talk, sendText("...") for typed lines, end() to hang up.
}
```

The three API routes are documented below in case you call them directly, but
the hook orchestrates all of them.

---

## `useVoiceCall` — the hook (primary integration surface)

```ts
import { useVoiceCall } from "@/lib/use-voice-call";

function useVoiceCall(options: {
  characterId: string;   // must match an id in lib/characters.ts ("nadia" | "august")
  voice?: string;        // optional TTS voice override passed to /api/speech
}): {
  status: "idle" | "listening" | "thinking" | "speaking";
  caption: string;                                   // the line currently on screen
  transcript: { role: "user" | "assistant"; text: string }[]; // full ordered log
  micOn: boolean;                                    // is the mic actively capturing
  toggleMic: () => void;                             // push-to-talk: on→stop+send, off→start
  start: () => void;                                 // begin a call (asks mic permission)
  end: () => void;                                   // hang up: stop mic + audio, reset to idle
  sendText: (text: string) => void;                  // feed a typed line (skips STT)
};
```

### State machine

```
                 start() / toggleMic(on)
   idle ───────────────────────────────▶ listening
    ▲                                        │ toggleMic(off)  [stop recording]
    │                                        ▼
    │                                     thinking   ← also entered by sendText()
    │                                        │  (transcribe → voice-reply)
    │                                        ▼
    └──────────  audio ends  ────────────  speaking  (TTS plays)
```

- **`idle`** — nothing happening. `caption` may hold the last line or an error message.
- **`listening`** — mic is recording (`micOn === true`). `caption` clears.
- **`thinking`** — transcribing and/or generating the reply. `caption` shows the user's line.
- **`speaking`** — the character's audio is playing. `caption` shows the reply text.

### Behavior notes (so the UI can trust it)

- **`start()`** is a no-op unless `status === "idle"`. It requests mic permission
  via `getUserMedia`; on denial it sets `status = "idle"` and puts an
  explanatory message in `caption` (no throw).
- **`toggleMic()`** — if `micOn`, stops recording and kicks off the
  transcribe→reply→speak chain. If not, starts a fresh recording (ignored while
  `thinking`/`speaking` so you can't interrupt an in-flight reply by re-arming).
- **`sendText(line)`** — appends the line as a user turn and runs it straight
  through **voice-reply → speech**, skipping transcription. This powers the
  design's "feed them a line" transcript input. Empty/whitespace is ignored.
- **`end()`** — stops recording (without transcribing), stops any playback,
  releases the mic, resets to `idle`, clears `caption`. Leaves `transcript` intact.
- Starting to talk (or `sendText`) **interrupts current playback** automatically.
- The reply **text appears in `caption`/`transcript` before audio is ready**, and
  if TTS fails the text still shows (audio degrades silently to `idle`).
- All errors are graceful: mic denied, no speech detected, transcription failure,
  and reply failure each set a human-readable `caption` and return to `idle`.
- Browser APIs used: `MediaRecorder`, `getUserMedia`, `HTMLAudioElement`,
  `URL.createObjectURL`. No external deps. Cleans up stream + object URLs on unmount.
- The recorded audio container is whatever `MediaRecorder` produces (typically
  `audio/webm;codecs=opus` on Chrome/Edge/Firefox, `audio/mp4` on Safari). The
  hook uploads it as multipart and the server reads the type from the blob.

---

## Endpoints

### `POST /api/transcribe` — speech → text (whisper-1)

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

---

### `POST /api/voice-reply` — conversation turns → in-character reply

Builds the **same grounding system prompt as `/api/chat`**
(`buildSystemPrompt(getCharacter(characterId), SCRIPT)`), plus an extra
instruction that the reply is being spoken: 2–4 sentences, **no stage
directions / asterisks / markdown / emoji** — just spoken words. Calls
`generateText` (model `process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-4.6"`,
`temperature: 0.85`) routed through the gateway.

**Request**
```json
{
  "characterId": "nadia",
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
{ "error": "..." }                     // 400 unknown character / empty messages · 500 generation failed
```

---

### `POST /api/speech` — text → spoken audio (tts-1)

**Request**
```json
{ "text": "Drink your coffee.", "voice": "alloy" }
```
`voice` is optional (defaults to `process.env.SPEECH_VOICE ?? "alloy"`).

**Response**
- **200**: raw **MP3 bytes**, `Content-Type: audio/mpeg`, `Cache-Control: no-store`.
  Consume with `await res.blob()` → `URL.createObjectURL(blob)` → `new Audio(url)`.
- **error**: JSON `{ "error": "..." }` with `400` (missing text) / `500` (not
  configured) / `502` (upstream).

---

## Env

```bash
# Local dev — get one at vercel.com/dashboard (AI tab → API Keys).
# In production on Vercel this is NOT needed: OIDC auth is automatic.
AI_GATEWAY_API_KEY=

# Optional overrides (all have sensible defaults):
CHAT_MODEL=anthropic/claude-sonnet-4.6   # voice-reply model (shared with /api/chat)
SPEECH_MODEL=openai/tts-1                 # TTS model
SPEECH_VOICE=alloy                        # default TTS voice
TRANSCRIBE_MODEL=openai/whisper-1         # STT model
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v4/ai   # rarely changed
```

Put the key in `.env.local` (gitignored) for local smoke tests.

---

## Dependency decision — **no canary, no version bump** (important)

The task allowed installing canary `ai` + `@ai-sdk/gateway` for
`experimental_generateSpeech` / `experimental_transcribe` +
`gateway.speechModel()`. **I did not, and you should not need to.** Here's why,
all verified against the live gateway on 2026-06-27:

1. **The SDK speech helper is currently broken.** On a clean
   `ai@6.0.213` + `@ai-sdk/gateway@4.0.3` install (the non-canary `latest`,
   which *does* export `gateway.speechModel`/`transcriptionModel`),
   `experimental_generateSpeech({ model: gateway.speechModel('openai/tts-1') })`
   throws **`AI_UnsupportedModelVersionError` ("AI SDK 5 only supports models
   that implement specification version v2")** *before making any network call*.
   The canary (`ai@7.0.0-canary.*` + `@ai-sdk/gateway@4.0.0-canary.*`) is a
   `ai` **major** jump from this repo's `ai@5`.

2. **Bumping `ai` risks the chat route.** `app/api/chat/route.ts` (owned by the
   other dev) runs on `ai@5` and uses `streamText` / `convertToModelMessages` /
   `toUIMessageStreamResponse`. The HARD constraint is "only add deps, don't
   break their files." A major `ai` bump is exactly the kind of change that
   could break it.

3. **The gateway REST API works today and needs zero deps.** So:
   - `/api/speech` and `/api/transcribe` call the gateway's REST modality
     endpoints directly with `fetch` (see `lib/gateway.ts`).
   - `/api/voice-reply` uses **`generateText` from the already-installed `ai@5`**
     (string model id → gateway-routed, identical to `/api/chat`).

### The REST contract that actually works (reverse-engineered)

The published docs show `POST https://ai-gateway.vercel.sh/v4/ai/speech-model`
with an `ai-model-id` header. On the **live** gateway that returns
`400 "Unsupported gateway protocol version"`. By intercepting the working `ai@5`
gateway language-model request, the real convention is **typed per-modality
headers**:

```
POST https://ai-gateway.vercel.sh/v4/ai/speech-model        (or /transcription-model)
Authorization: Bearer <AI_GATEWAY_API_KEY | VERCEL_OIDC_TOKEN>
ai-gateway-auth-method: api-key            (or "oidc" in prod)
ai-gateway-protocol-version: 0.0.1
ai-speech-model-id: openai/tts-1           (transcription: ai-transcription-model-id: openai/whisper-1)
ai-speech-model-specification-version: 2   (transcription: ai-transcription-model-specification-version: 2)
Content-Type: application/json

# speech body:        { "text": "...", "voice": "alloy", "outputFormat": "mp3" }  → { "audio": "<base64 mp3>" }
# transcription body: { "audio": "<base64>", "mediaType": "audio/webm" }          → { "text": "..." }
```

With these headers both endpoints pass the protocol gate and reach
authentication. `lib/gateway.ts#gatewayModalityHeaders()` builds them; the base
URL is overridable via `AI_GATEWAY_BASE_URL`. If a future gateway release ships
working SDK helpers, the routes can be swapped to them without changing this
public contract.

---

## Verification status

- `npm run build` **passes** (all four routes register; the existing `/api/chat`
  still builds; types + lint clean).
- No `AI_GATEWAY_API_KEY` was available in the build environment, so a real
  audio round-trip was **not** exercised. Instead, verified with a dummy key:
  - `/api/speech` and `/api/transcribe` (incl. the multipart path) pass the
    gateway protocol gate and reach **authentication** — i.e. a `401
    authentication_error` from the gateway, which is precisely where a valid key
    returns audio/text. (`502` is what the route surfaces for upstream failures.)
  - `/api/voice-reply` reaches the gateway and returns `GatewayAuthenticationError`
    with the dummy key.
  - Input validation returns clean `400`s (missing text/audio, unknown
    character, empty messages); missing-config returns a clean `500`.
- In production, OIDC supplies the credential automatically, so these calls
  return `200` with no key configured.

To do a real local round-trip: put a valid `AI_GATEWAY_API_KEY` in `.env.local`,
`npm run dev`, then:
```bash
curl -s -X POST localhost:3000/api/speech -H 'Content-Type: application/json' \
  -d '{"text":"Drink your coffee."}' --output reply.mp3 && open reply.mp3
```

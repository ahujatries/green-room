# The Green Room

**Talk to the people you're writing.** An Arqo experiment, built at the Vercel NYC hackathon.

A rehearsal room for screenwriters. Pick a character from your script and interview
them — they answer from what the page has actually established. The twist, and the
whole point: when you ask about something you *haven't written yet*, they don't make
it up. They feel the gap, name it, offer a couple of possibilities that would be true
to who they already are, and hand the decision back to you.

It's Arqo's thesis made tangible — **memory and continuity, an amplifier for the
writer, never a ghostwriter.** The character is grounded only in the script; it won't
write your screenplay, it helps you discover it.

## Built on Vercel's AI stack

- **Vercel AI SDK 5** — `streamText` + `toUIMessageStreamResponse` on the server, the
  `useChat` hook (`@ai-sdk/react`) driving a streaming transcript on the client.
- **Vercel AI Gateway** — the model is a plain string id (`anthropic/claude-sonnet-4.6`),
  so every call is routed, observable, and provider-swappable through the Gateway. Flip
  `CHAT_MODEL` to `anthropic/claude-opus-4.7`, `openai/gpt-5.5`, etc. with zero code
  changes.
- **Next.js 15 App Router** on Vercel Functions.

The character's behavior lives entirely in [`lib/prompt.ts`](lib/prompt.ts) — the
"surface the undecided, hand authorship back" rule is the product.

## Run it

```bash
npm install
cp .env.example .env.local   # add your AI_GATEWAY_API_KEY
npm run dev
```

Get an AI Gateway key from the [Vercel dashboard](https://vercel.com/dashboard) → AI →
API Keys. When deployed on Vercel, OIDC handles auth automatically and the key is
optional.

## Deploy

```bash
vercel
```

Set `AI_GATEWAY_API_KEY` (or rely on OIDC) in Project → Settings → Environment
Variables.

## The sample script

Ships with an original short, *The Last Shift* — a 2:47 AM diner two-hander
([`lib/characters.ts`](lib/characters.ts)) chosen because it's full of deliberate
gaps. Ask Nadia why she really left, or August what's in the envelope, and watch the
gap get handed back to you. Swap in any script + character bible to make it yours.

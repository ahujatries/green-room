"use client";

import { useEffect, useState } from "react";
import type { Character, WorkScript } from "@/lib/characters";
import { useVoiceCall } from "@/lib/use-voice-call";
import { CallTranscript } from "./call-transcript";

function useTimer() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function VideoView({
  character,
  script,
  onExit,
}: {
  character: Character;
  script: WorkScript;
  onExit: () => void;
}) {
  const call = useVoiceCall({ character, script, voice: character.voiceId });
  const [showScript, setShowScript] = useState(false);
  const [castImg, setCastImg] = useState<string | null>(null);
  const [castState, setCastState] = useState<
    "idle" | "loading" | "error" | "auth"
  >("idle");
  const timer = useTimer();

  // AI casting needs an image-generation provider. This account is funded only
  // for Anthropic (text) + ElevenLabs (voice) — no image key — so casting ships
  // disabled and the slot shows an intentional "coming soon" state instead of a
  // button that 500s. Flip NEXT_PUBLIC_CASTING_ENABLED=true (with /api/casting
  // wired to a funded image model) to light it back up. See app/api/casting.
  const castingEnabled = process.env.NEXT_PUBLIC_CASTING_ENABLED === "true";

  // Auto-start the continuous voice loop on entry; release the mic on exit.
  useEffect(() => {
    call.start();
    return () => call.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel =
    call.status === "thinking"
      ? "…"
      : call.status === "speaking"
        ? character.name.toUpperCase()
        : call.status === "listening"
          ? "Listening"
          : "Connecting…";

  // Generate an AI casting photo for this character via /api/casting (an image
  // model through the Vercel AI Gateway). Character is sent inline — no auth.
  async function generateCasting() {
    if (!castingEnabled || castState === "loading") return;
    setCastState("loading");
    try {
      const res = await fetch("/api/casting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),
      });
      const data = (await res.json()) as { image?: string; error?: string };
      if (!res.ok || !data.image) throw new Error(data.error || "failed");
      setCastImg(data.image);
      setCastState("idle");
    } catch {
      setCastState("error");
    }
  }

  return (
    <div className="rise absolute inset-0 flex flex-col overflow-hidden bg-forestdeep">
      {/* Casting photo / portrait well — fills the full-bleed stage. */}
      {castImg ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={castImg}
            alt={`${character.name} — casting`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <button
            onClick={generateCasting}
            disabled={castState === "loading"}
            className="absolute right-3.5 top-[68px] z-30 border-2 border-callbone/40 bg-forestdeep/60 px-2.5 py-1 font-mono text-[7.5px] font-bold uppercase tracking-[0.13em] text-callfog transition-colors hover:border-spring disabled:opacity-60"
          >
            {castState === "loading" ? "recasting…" : "↻ recast"}
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-forest px-8">
          <span className="flex h-[120px] w-[120px] items-center justify-center border-2 border-brink bg-forestdeep font-script text-[48px] text-field hard-deep">
            {character.initial}
          </span>
          {castingEnabled ? (
            <>
              <button
                onClick={generateCasting}
                disabled={castState === "loading"}
                className="border-2 border-spring bg-spring/10 px-4 py-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-springpale transition-colors hover:bg-spring/20 disabled:opacity-60"
              >
                {castState === "loading" ? "casting…" : "✦ generate casting"}
              </button>
              <span className="max-w-[230px] text-center font-mono text-[8px] uppercase tracking-[0.13em] text-quill2">
                {castState === "auth"
                  ? "sign in to cast this role"
                  : castState === "error"
                    ? "couldn't cast — try again"
                    : `who plays ${character.name}?`}
              </span>
            </>
          ) : (
            <>
              {/* No funded image provider yet — present casting as an
                  intentional upcoming feature, not a broken button. */}
              <span className="cursor-default border-2 border-callbone/25 bg-callbone/5 px-4 py-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-quill2">
                ✦ casting · coming soon
              </span>
              <span className="max-w-[230px] text-center font-mono text-[8px] uppercase tracking-[0.13em] text-quill2">
                ai casting is in the works
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Top gradient bar: back · name + title · live timer ──────────── */}
      <div className="relative z-20 flex items-center gap-2.5 bg-gradient-to-b from-forestdeep/85 to-transparent px-4 pb-6 pt-4">
        <button
          onClick={onExit}
          aria-label="Back"
          className="flex h-8 w-8 flex-none items-center justify-center border-2 border-callbone/40 bg-forestdeep/50 transition-colors hover:border-spring"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F7F2E6"
            strokeWidth="2.4"
            strokeLinecap="square"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="min-w-0">
          <span className="block truncate font-script text-[16px] font-bold text-callbone">
            {character.name}
          </span>
          <span className="block truncate font-mono text-[7.5px] font-medium uppercase tracking-[0.13em] text-springdim">
            {script.title}
          </span>
        </span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1.5 bg-forestdeep/50 px-2 py-[5px] font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-spring">
          <span className="dot h-1.5 w-1.5 rounded-full bg-spring" />
          {timer}
        </span>
      </div>

      <span className="flex-1" />

      {/* ── Self-PIP tile ──────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-[150px] right-3.5 z-30 flex h-[112px] w-[84px] flex-col justify-end overflow-hidden border-2 border-spring bg-forest p-1.5">
        <span className="font-script text-[15px] text-field">You</span>
        <span className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-quill2">
          camera off
        </span>
      </div>

      {/* ── "From the page" caption block ──────────────────────────────── */}
      <div className="relative z-20 mx-4 mb-3.5 border-l-2 border-spring bg-forestdeep/72 px-3 py-2.5">
        <div className="mb-1 font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-springdim">
          {character.name} · {statusLabel}
        </div>
        <div className="font-script text-[13px] leading-[1.5] text-callbone">
          {call.caption ||
            "Just start talking — they're listening. You can cut in anytime."}
        </div>
      </div>

      {/* ── Controls: mute · end · script ──────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-center gap-4 bg-gradient-to-t from-forestdeep/90 to-transparent px-4 pb-[18px] pt-3.5">
        <button
          aria-label="Mute"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 border-callbone/40 bg-forestdeep/40 text-callbone transition-colors hover:border-spring"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
          </svg>
        </button>
        <button
          onClick={onExit}
          aria-label="End call"
          className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-brink bg-flamecall text-callbone transition-transform hover:-translate-y-0.5"
          style={{ boxShadow: "4px 4px 0 0 var(--color-brink)" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F7F2E6"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <path d="M3 9c5-4 13-4 18 0l-2.5 3-3.5-1v-2a11 11 0 0 0-6 0v2L5.5 12z" />
          </svg>
        </button>
        <button
          onClick={() => setShowScript(true)}
          aria-label="Script"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 border-callbone/40 bg-forestdeep/40 text-callbone transition-colors hover:border-spring"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M9 9h6M9 13h6M9 17h4" />
          </svg>
        </button>
      </div>

      {showScript && (
        <CallTranscript
          name={character.name}
          transcript={call.transcript}
          thinking={call.status === "thinking"}
          onSend={call.sendText}
          onClose={() => setShowScript(false)}
        />
      )}
    </div>
  );
}

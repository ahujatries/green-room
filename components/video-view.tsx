"use client";

import { useEffect, useState } from "react";
import type { Character, WorkScript } from "@/lib/characters";
import { useVoiceCall } from "@/lib/use-voice-call";
import { CallTranscript } from "./call-transcript";
import { Hang, Mic, MicOff, Script } from "./icons";

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
  const call = useVoiceCall({ character, script });
  const [showScript, setShowScript] = useState(false);
  const [castImg, setCastImg] = useState<string | null>(null);
  const [castState, setCastState] = useState<
    "idle" | "loading" | "error" | "auth"
  >("idle");
  const timer = useTimer();

  // Generate an AI casting photo for this character via /api/casting (an image
  // model through the Vercel AI Gateway). Character is sent inline — no auth.
  async function generateCasting() {
    if (castState === "loading") return;
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
    <div className="absolute inset-0 flex flex-col gap-3 px-3.5 pb-6 pt-3.5">
      {/* The feed */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[20px] border border-bonelit/15 bg-ink shadow-[0_24px_50px_-22px_rgba(0,0,0,0.8)]">
        {/* Casting photo slot — an AI-generated portrait, or the prompt to make one. */}
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
              className="absolute right-3 top-11 rounded-full border border-bonelit/25 bg-[rgba(6,13,8,0.5)] px-2.5 py-1 font-mono text-[7.5px] font-bold uppercase tracking-[0.13em] text-fog transition-colors hover:border-spring disabled:opacity-60"
            >
              {castState === "loading" ? "recasting…" : "↻ recast"}
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-stage px-6">
            <span className="flex h-[110px] w-[110px] items-center justify-center rounded-2xl bg-canopy font-script text-[44px] text-[#f3eee3]">
              {character.initial}
            </span>
            <button
              onClick={generateCasting}
              disabled={castState === "loading"}
              className="rounded-full border border-spring/50 bg-spring/10 px-4 py-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-springpale transition-colors hover:border-spring disabled:opacity-60"
            >
              {castState === "loading" ? "casting…" : "✦ generate casting"}
            </button>
            <span className="max-w-[230px] text-center font-mono text-[8px] uppercase tracking-[0.13em] text-mist">
              {castState === "auth"
                ? "sign in to cast this role"
                : castState === "error"
                  ? "couldn't cast — try again"
                  : `who plays ${character.name}?`}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[rgba(243,238,227,0.92)] px-[11px] py-[5px]">
          <span className="h-1.5 w-1.5 rounded-full bg-spring" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-ink">
            read-through · live
          </span>
        </div>
        <div className="pointer-events-none absolute right-3.5 top-3 font-mono text-[8.5px] font-medium uppercase tracking-[0.13em] text-[rgba(243,238,227,0.9)] [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
          {timer}
        </div>

        {/* Your PiP */}
        <div className="pointer-events-none absolute bottom-[96px] right-3 flex h-[60px] w-[84px] flex-col items-center justify-center gap-[3px] rounded-[10px] border border-[rgba(243,238,227,0.18)] bg-[#0f0e0a]">
          <div className="font-script text-[12px] text-[#f3eee3]">you</div>
          <div className="font-mono text-[6.5px] uppercase tracking-[0.13em] text-[#8b8576]">
            camera off
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-[88px] left-3">
          <div className="font-script text-[17px] font-bold text-[#f3eee3] [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            {character.name}
          </div>
          <div className="mt-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[rgba(243,238,227,0.82)] [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
            {character.role}
          </div>
        </div>

        {/* Caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 min-h-[72px] border-t border-line bg-[rgba(243,238,227,0.95)] px-3.5 py-3">
          <div className="mb-1.5 font-mono text-[7.5px] font-bold uppercase tracking-[0.16em] text-sage">
            {call.status === "thinking"
              ? "…"
              : call.status === "listening"
                ? "Listening"
                : character.name.toUpperCase()}
          </div>
          <div className="font-script text-[13.5px] leading-[1.5] text-ink">
            {call.caption ||
              "Read them a line, or feed one in from the script."}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-none items-center justify-center gap-3">
        <button
          onClick={call.toggleMic}
          aria-label="Mute"
          className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border transition-colors ${
            call.micOn
              ? "border-flame bg-flame/10 text-flame"
              : "border-bonelit/20 bg-bonelit/5 text-bonelit hover:border-spring"
          }`}
        >
          {call.micOn ? <MicOff size={19} /> : <Mic size={19} />}
        </button>
        <button
          onClick={() => setShowScript(true)}
          className="flex h-[46px] items-center gap-2 rounded-full border border-bonelit/20 bg-bonelit/5 px-[18px] font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-bonelit transition-colors hover:border-spring"
        >
          <Script size={15} />
          script
        </button>
        <button
          onClick={onExit}
          aria-label="End call"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-flame bg-flame text-[#fbf9f4] transition-colors hover:bg-[#d4502a]"
        >
          <Hang size={19} />
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

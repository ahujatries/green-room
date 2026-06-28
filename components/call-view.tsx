"use client";

import { useEffect, useState } from "react";
import type { Character, WorkScript } from "@/lib/characters";
import { useVoiceCall } from "@/lib/use-voice-call";
import { CallTranscript } from "./call-transcript";
import { Back, Hang, Script } from "./icons";

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

// Resting heights for the waveform bars (prototype renders an 11-bar arc).
const BARS = [9, 16, 24, 13, 20, 28, 11, 18, 24, 9, 15, 22, 10];

export function CallView({
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
  const timer = useTimer();
  const live = call.status === "speaking" || call.status === "listening";

  // Auto-start the continuous loop on entry (OpenAI-voice style) and release the
  // mic on exit. `start` / `end` are stable across renders.
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

  return (
    <div className="rise absolute inset-0 flex flex-col bg-forest p-5 text-callbone">
      {/* ── Top row: back · script title · live ──────────────────────────── */}
      <div className="flex flex-none items-center gap-2.5">
        <button
          onClick={onExit}
          aria-label="Back"
          className="flex h-8 w-8 flex-none items-center justify-center border-2 border-callbone/30 transition-colors hover:border-spring"
        >
          <Back size={14} stroke={2.4} className="text-callbone" />
        </button>
        <span className="min-w-0 truncate font-mono text-[8px] font-medium uppercase tracking-[0.13em] text-springdim">
          {script.title}
        </span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-spring">
          <span
            className="h-1.5 w-1.5 flex-none rounded-full bg-spring"
            style={{ animation: "blink 1.2s steps(1) infinite" }}
          />
          Voice · live
        </span>
      </div>

      {/* ── Stage: avatar ring · name · role · waveform · timer ──────────── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <div className="relative flex h-[150px] w-[150px] flex-none items-center justify-center">
          {/* Spring ring + soft glow, reacting to the live call phase. */}
          <span
            className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-spring bg-forestdeep font-script text-[52px] text-field transition-transform duration-100"
            style={{
              transform:
                call.status === "listening"
                  ? `scale(${1 + call.level * 0.08})`
                  : "scale(1)",
              boxShadow:
                call.status === "speaking"
                  ? "0 0 0 8px rgba(165,232,87,0.18)"
                  : call.status === "listening"
                    ? `0 0 0 ${4 + call.level * 16}px rgba(165,232,87,${0.08 + call.level * 0.22})`
                    : "0 0 0 8px rgba(165,232,87,0.12)",
            }}
          >
            {character.initial}
          </span>
        </div>

        <div className="text-center">
          <div className="font-script text-[27px] font-bold leading-none text-callbone">
            {character.name}
          </div>
          <div className="mt-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-spring">
            {character.role}
          </div>
        </div>

        {/* Live waveform — tracks the writer's mic while listening, animates while
            speaking, rests otherwise. */}
        <div className="flex h-[30px] items-center gap-1">
          {BARS.map((h, i) => {
            const listening = call.status === "listening";
            const height = listening
              ? Math.max(4, h * (0.3 + call.level * 1.4))
              : h;
            return (
              <span
                key={i}
                className={call.status === "speaking" ? "wavebar" : ""}
                style={{
                  height,
                  width: 4,
                  borderRadius: 2,
                  background: "var(--color-spring)",
                  transformOrigin: "center",
                  animationDelay: `${i * 0.06}s`,
                  opacity: live ? 1 : 0.4,
                  transition: "height 0.08s linear",
                }}
              />
            );
          })}
        </div>

        <div className="font-mono text-[11px] font-medium tracking-[0.1em] text-quill2">
          {timer}
        </div>
      </div>

      {/* ── "From the page" quote block ──────────────────────────────────── */}
      <div className="mb-4 border-l-2 border-spring py-2 pl-3">
        <div className="mb-1 font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-springdim">
          {character.name} · {statusLabel}
        </div>
        <div className="font-script text-[13px] leading-[1.55] text-callfog">
          {call.caption ||
            "Just start talking — I'm listening. You can cut in anytime."}
        </div>
      </div>

      {/* ── Round controls: script · end · speaker ───────────────────────── */}
      <div className="flex flex-none items-center justify-center gap-5">
        <button
          onClick={() => setShowScript(true)}
          aria-label="Transcript"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-callbone/30 bg-transparent text-callbone transition-colors hover:border-spring"
        >
          <Script size={18} stroke={2} />
        </button>
        <button
          onClick={onExit}
          aria-label="End call"
          className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-brink bg-flamecall text-callbone hard transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px]"
        >
          <Hang size={24} stroke={2} />
        </button>
        <button
          onClick={() => setShowScript(true)}
          aria-label="Feed a line"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-callbone/30 bg-transparent text-callbone transition-colors hover:border-spring"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M4 9v6h4l5 4V5L8 9z" />
            <path d="M16 9a4 4 0 0 1 0 6" />
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

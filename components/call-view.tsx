"use client";

import { useEffect, useState } from "react";
import type { Character, WorkScript } from "@/lib/characters";
import { useVoiceCall } from "@/lib/use-voice-call";
import { CallTranscript } from "./call-transcript";
import { Hang, Script } from "./icons";

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
    <div className="absolute inset-0 flex flex-col gap-3 px-3.5 pb-6 pt-3.5">
      {/* The well */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-bonelit/15 bg-stage shadow-[0_24px_50px_-22px_rgba(0,0,0,0.8)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(78% 52% at 50% 30%, rgba(63,122,28,0.32), transparent 72%)",
          }}
        />
        <div className="relative flex flex-none items-center justify-between p-3.5">
          <div className="flex items-center gap-1.5 rounded-full bg-[rgba(243,238,227,0.92)] px-[11px] py-[5px]">
            <span className="h-1.5 w-1.5 rounded-full bg-spring" />
            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-ink">
              voice · live
            </span>
          </div>
          <span className="font-mono text-[8.5px] font-medium uppercase tracking-[0.13em] text-[rgba(243,238,227,0.85)]">
            {timer}
          </span>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-[22px] py-2">
          <div className="relative flex h-[172px] w-[172px] flex-none items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-spring/20" />
            <span className="absolute inset-[18px] rounded-full border border-spring/40" />
            <span
              className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-canopy font-script text-[52px] text-[#f3eee3] transition-transform duration-100"
              style={{
                // Listening: pulse with the writer's voice. Speaking: steady glow.
                transform:
                  call.status === "listening"
                    ? `scale(${1 + call.level * 0.08})`
                    : "scale(1)",
                boxShadow:
                  call.status === "speaking"
                    ? "0 0 0 6px rgba(165,232,87,0.18)"
                    : call.status === "listening"
                      ? `0 0 0 ${2 + call.level * 14}px rgba(165,232,87,${0.06 + call.level * 0.22})`
                      : "none",
              }}
            >
              {character.initial}
            </span>
          </div>
          <div className="text-center">
            <div className="font-script text-[23px] font-bold text-bonelit">
              {character.name}
            </div>
            <div className="mt-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em] text-springpale">
              {character.role}
            </div>
          </div>
          <div className="flex h-7 items-center gap-1">
            {BARS.map((h, i) => {
              // While listening, the bars track the writer's live mic level;
              // while speaking, they animate; otherwise they rest.
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
                    animationDelay: `${i * 0.06}s`,
                    background: "var(--color-spring)",
                    width: 3,
                    borderRadius: 2,
                    opacity: live ? 1 : 0.4,
                    transition: "height 0.08s linear",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Caption */}
        <div className="relative flex-none border-t border-line bg-[rgba(243,238,227,0.95)] px-3.5 py-3 min-h-[74px]">
          <div className="mb-1.5 font-mono text-[7.5px] font-bold uppercase tracking-[0.16em] text-sage">
            {statusLabel}
          </div>
          <div className="font-script text-[13.5px] leading-[1.5] text-ink">
            {call.caption ||
              "Just start talking — I'm listening. You can cut in anytime."}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-none items-center justify-center gap-3">
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

"use client";

import { useEffect, useRef, useState } from "react";
import type { Character } from "@/lib/characters";
import { useInterimCall } from "./interim-call";
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

const BARS = [9, 16, 24, 13, 20, 28, 11, 18, 24, 9, 15, 22, 10];

export function CallView({
  character,
  onExit,
}: {
  character: Character;
  onExit: () => void;
}) {
  const call = useInterimCall({
    characterId: character.id,
    characterName: character.name,
  });
  const [showScript, setShowScript] = useState(false);
  const timer = useTimer();
  const live = call.status === "speaking" || call.status === "listening";
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      call.start();
    }
  }, [call]);

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
              className={`flex h-[120px] w-[120px] items-center justify-center rounded-full bg-canopy font-script text-[52px] text-[#f3eee3] transition-shadow ${
                call.status === "speaking"
                  ? "shadow-[0_0_0_6px_rgba(165,232,87,0.18)]"
                  : ""
              }`}
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
            {BARS.map((h, i) => (
              <span
                key={i}
                className={live ? "wavebar" : ""}
                style={{
                  height: h,
                  animationDelay: `${i * 0.06}s`,
                  background: "var(--color-spring)",
                  width: 3,
                  borderRadius: 2,
                  opacity: live ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="relative flex-none border-t border-line bg-[rgba(243,238,227,0.95)] px-3.5 py-3 min-h-[74px]">
          <div className="mb-1.5 font-mono text-[7.5px] font-bold uppercase tracking-[0.16em] text-sage">
            {call.status === "thinking"
              ? "…"
              : call.status === "listening"
                ? "Listening"
                : character.name.toUpperCase()}
          </div>
          <div className="font-script text-[13.5px] leading-[1.5] text-ink">
            {call.caption ||
              "Tap the mic and speak — or open the script to feed them a line."}
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

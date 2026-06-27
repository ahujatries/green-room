"use client";

import { useEffect, useRef, useState } from "react";
import type { Turn } from "./interim-call";
import { ArrowRight, Close } from "./icons";

// The "live transcript" bottom sheet shared by Voice and Video calls.
// Includes the design's "feed them a line" composer, routed through sendText.
export function CallTranscript({
  name,
  transcript,
  thinking,
  onSend,
  onClose,
}: {
  name: string;
  transcript: Turn[];
  thinking: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState("");
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [transcript, thinking]);

  function fire() {
    const t = val.trim();
    if (!t) return;
    onSend(t);
    setVal("");
  }

  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(4,10,6,0.6)]" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex h-[80%] flex-col rounded-t-[22px] bg-paper shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex flex-none justify-center pb-1 pt-2.5">
          <span className="h-1 w-[38px] rounded-full bg-[#d9d2c2]" />
        </div>
        <div className="flex flex-none items-center gap-2.5 border-b border-line px-[18px] pb-3 pt-1.5">
          <span className="flex-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-sage">
            Live transcript
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line bg-bone text-ink"
          >
            <Close size={14} stroke={2} />
          </button>
        </div>

        <div
          ref={scroll}
          className="scroll-thin flex-1 overflow-y-auto px-[18px] pb-1.5 pt-4"
        >
          {transcript.length === 0 && !thinking && (
            <p className="py-6 text-center text-[12.5px] italic text-ink-faint">
              The room is quiet. Say something — or feed {name} a line.
            </p>
          )}
          {transcript.map((m, i) => {
            const isAuthor = m.role === "author";
            return (
              <div key={i} className="mb-[15px]">
                <div
                  className={`mb-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] ${
                    isAuthor ? "text-ink-faint" : "text-canopy"
                  }`}
                >
                  {isAuthor ? "You" : name}
                </div>
                <div
                  className={
                    isAuthor
                      ? "text-[13px] leading-[1.55] text-ink-soft"
                      : "whitespace-pre-wrap font-script text-[13px] leading-[1.6] text-ink"
                  }
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {thinking && (
            <div className="flex items-center gap-1.5 pb-3.5 pt-0.5">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </div>

        <div className="flex flex-none items-center gap-[9px] border-t border-line px-3.5 pb-[22px] pt-3">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                fire();
              }
            }}
            placeholder="Feed them a line…"
            className="min-w-0 flex-1 rounded-xl border border-line bg-bone px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-canopy"
          />
          <button
            onClick={fire}
            disabled={!val.trim()}
            aria-label="Send"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-canopy bg-canopy text-[#f3eee3] transition-colors hover:bg-[#346416] disabled:opacity-30"
          >
            <ArrowRight size={18} stroke={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

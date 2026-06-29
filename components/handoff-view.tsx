"use client";

// HANDOFF — "Taking you to Arqo…".
//
// The brief transitional beat between Authorize and the welcome screen: the
// Green Room cube handing off to the Arqo spiral, a marching row of squares.
// Pixel-faithful to MacRd › 02 · HANDOFF. The parent owns the timer and calls
// us purely to render; it advances to the welcome screen on its own.

import { RoomCube, SpiralMark } from "@/components/brand-marks";

export function HandoffView() {
  return (
    <div className="rise flex h-full flex-col items-center justify-center px-8 text-center">
      {/* cube → … → spiral */}
      <div className="flex items-center gap-3">
        <span className="flex h-[58px] w-[58px] items-center justify-center border-2 border-brink bg-bonepaper hard-sm">
          <RoomCube tone="green" className="h-[38px] w-[38px]" />
        </span>
        <span className="flex gap-1">
          <span className="h-2 w-2 bg-brink/30" />
          <span className="h-2 w-2 bg-brink/60" />
          <span className="h-2 w-2 bg-brink" />
        </span>
        <span className="flex h-[58px] w-[58px] items-center justify-center border-2 border-brink bg-forest">
          <SpiralMark className="h-[34px] w-[34px] text-spring" />
        </span>
      </div>

      <h1 className="mt-7 font-sans text-[26px] font-black uppercase leading-[1.02] tracking-[-0.02em] text-brink">
        Taking you to Arqo…
      </h1>
      <p className="mx-auto mt-2.5 max-w-[280px] text-[13px] leading-[1.55] text-quill">
        Stepping out to sign you in. One account, lit across every Arqo room.
      </p>

      {/* marching squares */}
      <div className="mt-7 flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 border-2 border-brink bg-spring pop"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>

      <p className="absolute bottom-6 left-0 right-0 text-center font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-quill">
        Handing off · app.tryarqo.com
      </p>
    </div>
  );
}

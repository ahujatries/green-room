"use client";

// DETAIL — one room's call sheet: logline + the cast you can talk to, each with
// chat / call / video. SPINE STUB: functional + on-brand; Wave B (B4) replaces
// the body with the pixel-faithful prototype port (DETAIL section).

import type { Mode } from "@/components/green-room";
import type { CatalogEntry } from "@/lib/catalog";

export function DetailView({
  entry,
  onEnter,
}: {
  entry: CatalogEntry;
  onEnter: (charId: string, mode: Mode) => void;
}) {
  return (
    <div className="gr-scroll pop h-full overflow-y-auto px-[18px] pb-[22px] pt-5">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        {entry.eyebrow}
      </div>
      <h1 className="mt-2 font-script text-[26px] font-bold leading-tight text-brink">
        {entry.script.title}
      </h1>
      <div className="mt-2 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-quill">
        {entry.meta}
      </div>
      <p className="mt-3 text-[13.5px] leading-[1.5] text-brink/85">
        {entry.script.logline}
      </p>

      <div className="mb-3 mt-5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        The cast · talk now
      </div>
      <div className="flex flex-col gap-[13px]">
        {entry.cast.map((c) => (
          <div key={c.id} className="border-2 border-brink bg-bonepaper hard">
            <div className="border-b-2 border-brink p-[13px]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 flex-none items-center justify-center border-2 border-brink bg-forest font-script text-[16px] font-bold text-field">
                  {c.initial}
                </span>
                <span>
                  <span className="block font-script text-[16px] font-bold text-brink">
                    {c.name}
                  </span>
                  <span className="block font-mono text-[7.5px] font-medium uppercase tracking-[0.12em] text-quill">
                    {c.roleShort}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.45] text-brink/80">
                {c.blurb}
              </p>
            </div>
            <div className="flex gap-2 p-[13px]">
              {(["chat", "call", "video"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onEnter(c.id, m)}
                  className="flex-1 border-2 border-brink bg-spring py-2 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-brink hard-sm"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

// DETAIL — one room's call sheet: a key-art cover banner, eyebrow + title +
// meta + logline, then "The cast" — a card per character (cover well, name,
// roleShort, blurb) with chat / call / video buttons. Pixel-faithful port of
// the PROTOTYPE DETAIL section, expressed in the brutalist call-sheet tokens.

import type { Mode } from "@/components/green-room";
import { coverInitial, type CatalogEntry } from "@/lib/catalog";

export function DetailView({
  entry,
  onEnter,
}: {
  entry: CatalogEntry;
  onEnter: (charId: string, mode: Mode) => void;
}) {
  return (
    <div className="gr-scroll rise h-full overflow-y-auto px-[18px] pb-[22px] pt-5">
      {/* Key-art cover banner — a forest well with the title initial */}
      <div className="relative mb-[18px] h-[140px] overflow-hidden border-2 border-brink bg-forest hard">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest to-forestdeep">
          <span className="font-script text-[64px] font-bold leading-none text-field/35">
            {coverInitial(entry.script.title)}
          </span>
        </div>
        <span className="absolute left-[11px] top-[9px] z-[2] bg-forestdeep/55 px-[7px] py-[3px] font-mono text-[7px] font-bold uppercase tracking-[0.13em] text-field">
          Key art
        </span>
      </div>

      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        {entry.eyebrow}
      </div>
      <h1 className="mt-2 font-script text-[30px] font-bold leading-[1.02] text-brink">
        {entry.script.title}
      </h1>
      <div className="mt-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-quill">
        {entry.meta}
      </div>
      <p className="mt-[11px] text-[13.5px] leading-[1.55] text-brink">
        {entry.script.logline}
      </p>

      {/* The cast — section rule */}
      <div className="mb-3 mt-5 flex items-center gap-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
          The cast
        </span>
        <span className="h-0.5 flex-1 bg-brink/15" />
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.08em] text-quill/80">
          pick how you meet them
        </span>
      </div>

      <div className="flex flex-col gap-[13px]">
        {entry.cast.map((c) => (
          <div
            key={c.id}
            className="border-2 border-brink bg-bonepaper hard"
          >
            {/* Casting well — forest block with the character's name overlaid */}
            <div className="relative h-[128px] overflow-hidden border-b-2 border-brink bg-forest">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest to-forestdeep">
                <span className="font-script text-[56px] font-bold leading-none text-field/30">
                  {c.initial}
                </span>
              </div>
              <span className="absolute left-3 top-2 z-[2] bg-forestdeep/55 px-[7px] py-[3px] font-mono text-[7px] font-bold uppercase tracking-[0.13em] text-field">
                Casting · {c.name}
              </span>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-forestdeep/90 to-transparent px-3.5 pb-[11px] pt-6">
                <span className="block font-script text-[21px] font-bold leading-none text-callbone">
                  {c.name}
                </span>
                <span className="mt-[3px] block font-mono text-[7.5px] font-bold uppercase tracking-[0.12em] text-spring">
                  {c.roleShort}
                </span>
              </div>
            </div>

            <div className="p-[13px]">
              <p className="mb-[11px] text-[12px] leading-[1.45] text-brink">
                {c.blurb}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onEnter(c.id, "chat")}
                  className="flex flex-1 flex-col items-center gap-1.5 border-2 border-brink bg-spring px-1 py-[9px] hard-sm lift"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1A2418"
                    strokeWidth="2"
                    strokeLinecap="square"
                  >
                    <path d="M4 5h16v11H9l-4 4v-4H4z" />
                  </svg>
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-brink">
                    Chat
                  </span>
                </button>
                <button
                  onClick={() => onEnter(c.id, "call")}
                  className="flex flex-1 flex-col items-center gap-1.5 border-2 border-brink bg-bonepaper px-1 py-[9px] hard-sm lift"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3F7A1C"
                    strokeWidth="1.9"
                    strokeLinecap="square"
                  >
                    <path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </svg>
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-brink">
                    Call
                  </span>
                </button>
                <button
                  onClick={() => onEnter(c.id, "video")}
                  className="flex flex-1 flex-col items-center gap-1.5 border-2 border-brink bg-bonepaper px-1 py-[9px] hard-sm lift"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3F7A1C"
                    strokeWidth="1.9"
                    strokeLinecap="square"
                  >
                    <rect x="3" y="6" width="12" height="12" />
                    <path d="M15 10l6-3v10l-6-3z" />
                  </svg>
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-brink">
                    Video
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t-2 border-brink/[0.18] pt-[14px] text-[11.5px] leading-[1.55] text-quill">
        They only know what the page knows. Ask past it and they&rsquo;ll tell
        you it&rsquo;s still yours to decide.
      </p>
    </div>
  );
}

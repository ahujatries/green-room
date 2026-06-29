"use client";

// ENTRY — the call sheet. First screen: tonight's featured room + a door to
// "your own scripts". Pixel-faithful port of PROTOTYPE.html › ENTRY (Option C):
// a featured film card (cover well + meta + logline → onMeetCast) above a dark
// "Your own scripts?" panel (→ onConnect).

import type { CatalogEntry } from "@/lib/catalog";

export function EntryView({
  featured,
  onMeetCast,
  onConnect,
}: {
  featured: CatalogEntry;
  onMeetCast: () => void;
  onConnect: () => void;
}) {
  const { script, cast } = featured;

  return (
    <div className="gr-scroll rise flex h-full flex-col overflow-hidden px-5 py-[22px]">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Tonight&apos;s call sheet
      </div>
      <h1 className="mt-[11px] font-sans text-[25px] font-black uppercase leading-[1.05] tracking-[-0.02em] text-brink">
        Start with a scene already on its feet.
      </h1>

      {/* Featured film card */}
      <button
        onClick={onMeetCast}
        className="lift mt-[18px] block w-full border-2 border-brink bg-bonepaper text-left hard"
      >
        {/* Cover well */}
        <div className="relative flex h-[124px] items-end overflow-hidden border-b-2 border-brink bg-forest">
          <span className="absolute left-3 top-[10px] z-[2] border-2 border-brink bg-spring px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-brink">
            Talk now · no account
          </span>
          <span className="absolute right-3 top-[9px] z-[2] bg-forestdeep/50 px-1.5 py-[3px] font-mono text-[7.5px] font-medium uppercase tracking-[0.14em] text-field">
            Casting · sample
          </span>
          <span className="relative z-[2] w-full whitespace-nowrap bg-gradient-to-b from-transparent to-forestdeep/90 px-3.5 pb-[11px] pt-6 font-script text-[26px] font-bold leading-none text-callbone">
            {script.title}
          </span>
        </div>

        {/* Meta + logline + CTA */}
        <div className="p-[14px]">
          <div className="font-mono text-[8.5px] font-medium uppercase tracking-[0.13em] text-quill">
            {script.format} · {cast.length} characters
          </div>
          <p className="mt-2.5 font-script text-[13px] leading-[1.5] text-brink">
            {script.logline}
          </p>
          <span className="mt-3.5 flex w-full items-center justify-center gap-2 border-2 border-brink bg-spring p-[13px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink hard-sm">
            Meet the cast →
          </span>
        </div>
      </button>

      <span className="flex-1" />

      {/* Dark "Your own scripts?" panel */}
      <button
        onClick={onConnect}
        className="mt-[18px] block w-full border-2 border-brink bg-forest p-4 text-left"
      >
        <div className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-spring">
          Your own scripts?
        </div>
        <p className="mb-[13px] mt-2 text-[12.5px] leading-[1.5] text-quill2">
          Browse the Library of ready-to-run scenes — or paste <em>your</em> own
          screenplay and talk to its cast.
        </p>
        <span className="flex w-full items-center justify-center gap-2 border-2 border-brink bg-spring p-[13px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink">
          Browse the Library →
        </span>
      </button>
    </div>
  );
}

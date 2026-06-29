"use client";

// ENTRY — the marquee. First screen: the room's pitch, then the three doors in.
// Pixel-faithful to MacRd › ENTRY (Option A · The Marquee):
//   • a dark "S01 · The Room" marquee card with the headline pitch
//   • SIGN IN WITH ARQO   → the Arqo consent handoff (onSignIn)
//   • CREATE A FREE ACCOUNT → straight into the Library on a free account (onBrowse)
//   • a dashed "talk to a sample" door that needs no account at all (onMeetCast)

import type { CatalogEntry } from "@/lib/catalog";
import { SpiralMark } from "@/components/brand-marks";

export function EntryView({
  featured,
  onSignIn,
  onBrowse,
  onMeetCast,
}: {
  featured: CatalogEntry;
  onSignIn: () => void;
  onBrowse: () => void;
  onMeetCast: () => void;
}) {
  const { script, cast } = featured;

  return (
    <div className="gr-scroll rise flex h-full flex-col overflow-y-auto px-5 py-[22px]">
      {/* Marquee card */}
      <div className="border-2 border-brink bg-forest p-5 hard">
        <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-spring">
          S01 · The Room
        </div>
        <h1 className="mt-3 font-sans text-[27px] font-black uppercase leading-[0.98] tracking-[-0.025em] text-callbone">
          Talk to the people you&rsquo;re writing<span className="text-spring">.</span>
        </h1>
        <p className="mt-3 text-[13px] leading-[1.55] text-quill2">
          Pick a character. Interview them. They answer from the page — and when
          you ask past what you&rsquo;ve written, they hand the choice back to you.
        </p>
      </div>

      {/* Door 1 — Sign in with Arqo */}
      <button
        type="button"
        onClick={onSignIn}
        className="lift mt-[18px] flex w-full items-center justify-center gap-2.5 border-2 border-brink bg-spring p-[15px] font-mono text-[10.5px] font-bold uppercase tracking-[0.13em] text-brink hard"
      >
        <SpiralMark className="h-[18px] w-[18px] text-brink" />
        Sign in with Arqo
      </button>

      {/* Door 2 — Create a free account */}
      <button
        type="button"
        onClick={onBrowse}
        className="mt-2.5 flex w-full items-center justify-center border-2 border-brink bg-bonepaper p-[14px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-brink transition-colors hover:bg-field"
      >
        Create a free account
      </button>

      <span className="flex-1" />

      {/* Door 3 — talk to a sample, no account */}
      <div className="mt-[26px] flex items-center gap-2.5">
        <span className="h-px flex-1 bg-brink/20" />
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-quill">
          Or just look around
        </span>
        <span className="h-px flex-1 bg-brink/20" />
      </div>

      <button
        type="button"
        onClick={onMeetCast}
        className="lift mt-3.5 flex w-full items-center justify-between gap-3 border-2 border-dashed border-brink/55 bg-bonepaper/70 px-3.5 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-canopytext">
            No account · sample
          </span>
          <span className="mt-1 block truncate font-script text-[14px] font-bold leading-tight text-brink">
            Talk to {script.title}
          </span>
          <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.1em] text-quill">
            {script.format} · {cast.length} characters
          </span>
        </span>
        <span className="flex-none font-sans text-[18px] font-black text-brink">→</span>
      </button>
    </div>
  );
}

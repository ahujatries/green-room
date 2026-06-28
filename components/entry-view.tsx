"use client";

// ENTRY — the call sheet. First screen: tonight's featured room + a door to
// "your own scripts". SPINE STUB: functional + on-brand; Wave B (B1) replaces
// the body with the pixel-faithful prototype port (ENTRY section).

import type { CatalogEntry } from "@/lib/catalog";
import { coverInitial } from "@/lib/catalog";

export function EntryView({
  featured,
  onMeetCast,
  onConnect,
}: {
  featured: CatalogEntry;
  onMeetCast: () => void;
  onConnect: () => void;
}) {
  return (
    <div className="gr-scroll pop flex h-full flex-col overflow-y-auto px-5 py-[22px]">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Tonight&apos;s call sheet
      </div>

      <button
        onClick={onMeetCast}
        className="lift mt-[18px] block w-full border-2 border-brink bg-bonepaper text-left hard"
      >
        <div className="flex h-[124px] items-end border-b-2 border-brink bg-forest p-3">
          <span className="font-script text-[40px] font-bold leading-none text-field">
            {coverInitial(featured.script.title)}
          </span>
        </div>
        <div className="p-[14px]">
          <div className="font-mono text-[8.5px] font-medium uppercase tracking-[0.13em] text-quill">
            {featured.script.format} · {featured.cast.length} characters
          </div>
          <div className="mt-1.5 font-script text-[20px] font-bold text-brink">
            {featured.script.title}
          </div>
          <p className="mt-2 text-[13px] leading-[1.5] text-brink/80">
            {featured.script.logline}
          </p>
        </div>
      </button>

      <button
        onClick={onConnect}
        className="mt-[18px] border-2 border-brink bg-forest p-4 text-left"
      >
        <div className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-spring">
          Your own scripts?
        </div>
        <div className="mt-1.5 text-[13px] leading-[1.5] text-field">
          Connect your Arqo ID to bring your own cast into the room.
        </div>
      </button>
    </div>
  );
}

"use client";

// LIBRARY — the catalog shelf. Featured room + public-domain works + a door to
// paste your own. SPINE STUB: functional + on-brand; Wave B (B3) replaces the
// body with the pixel-faithful prototype port (LIBRARY section).

import type { Account } from "@/components/green-room";
import type { CatalogEntry } from "@/lib/catalog";
import { coverInitial } from "@/lib/catalog";

export function LibraryView({
  featured,
  works,
  onOpen,
  onPasteOwn,
}: {
  featured: CatalogEntry;
  works: CatalogEntry[];
  account: Account;
  onOpen: (id: string) => void;
  onPasteOwn: () => void;
}) {
  return (
    <div className="gr-scroll pop h-full overflow-y-auto px-4 pb-[22px] pt-[18px]">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Featured · talk now
      </div>
      <button
        onClick={() => onOpen(featured.id)}
        className="lift mt-[11px] block w-full border-2 border-brink bg-bonepaper text-left hard"
      >
        <div className="flex h-24 items-end border-b-2 border-brink bg-forest p-3">
          <span className="font-script text-[34px] font-bold leading-none text-field">
            {coverInitial(featured.script.title)}
          </span>
        </div>
        <div className="px-[13px] py-3">
          <div className="font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-quill">
            {featured.eyebrow} · {featured.cast.length} characters
          </div>
          <div className="mt-1 font-script text-[17px] font-bold text-brink">
            {featured.script.title}
          </div>
        </div>
      </button>

      <div className="mb-[11px] mt-[18px] font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Public domain · the shelf
      </div>
      <div className="flex flex-col gap-2.5">
        {works.map((w) => (
          <button
            key={w.id}
            onClick={() => onOpen(w.id)}
            className="lift flex items-center gap-3 border-2 border-brink bg-bonepaper px-3 py-[11px] text-left hard-sm"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center border-2 border-brink bg-forest font-script text-[18px] font-bold text-field">
              {coverInitial(w.script.title)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-script text-[15px] font-bold text-brink">
                {w.script.title}
              </span>
              <span className="block font-mono text-[7.5px] font-medium uppercase tracking-[0.12em] text-quill">
                {w.meta.split(" · ").slice(-1)[0]} · {w.cast.length} char.
              </span>
            </span>
          </button>
        ))}

        <button
          onClick={onPasteOwn}
          className="mt-1 border-2 border-dashed border-brink/50 bg-transparent px-3 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-quill"
        >
          + Paste your own script
        </button>
      </div>
    </div>
  );
}

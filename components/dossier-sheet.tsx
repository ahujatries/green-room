"use client";

import type { Character } from "@/lib/characters";

// The character file — facets that are written show their value; the unwritten
// ones read "still unwritten". The blanks are the whole point of the app.
// Brutalist call-sheet reskin: a bonepaper sheet with a hard ink shadow that
// slides up over the field. Logic/props unchanged.
export function DossierSheet({
  character,
  fileFraction,
  onClose,
}: {
  character: Character;
  fileFraction: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50">
      <div
        className="absolute inset-0 bg-forestdeep/60"
        onClick={onClose}
      />
      <div className="rise absolute inset-x-0 bottom-0 flex max-h-[82%] flex-col border-t-2 border-brink bg-bonepaper shadow-[0_-6px_0_0_var(--color-forestdeep)]">
        {/* ── File header ──────────────────────────────────────────────── */}
        <div className="flex flex-none items-center gap-[11px] border-b-2 border-brink bg-field px-[18px] py-3">
          <span className="flex h-[36px] w-[36px] flex-none items-center justify-center border-2 border-brink bg-forest font-script text-[15px] font-bold text-field hard-sm">
            {character.initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-script text-[16px] font-bold text-brink">
              {character.name}
            </div>
            <div className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-canopytext">
              Character file · {fileFraction} written
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-[32px] w-[32px] flex-none items-center justify-center border-2 border-brink bg-bonepaper text-brink hard-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A2418"
              strokeWidth="2.4"
              strokeLinecap="square"
            >
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        {/* ── Facet rows ───────────────────────────────────────────────── */}
        <div className="gr-scroll flex-1 overflow-y-auto px-[18px] pb-6 pt-2">
          {character.facets.map((f) => (
            <div
              key={f.key}
              className="border-b-2 border-brink/15 py-[13px]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`h-[7px] w-[7px] flex-none border border-brink ${
                    f.value ? "bg-spring" : "bg-transparent"
                  }`}
                />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-canopytext">
                  {f.label}
                </span>
              </div>
              {f.value ? (
                <div className="pl-[15px] font-script text-[13.5px] leading-[1.55] text-brink">
                  {f.value}
                </div>
              ) : (
                <div className="pl-[15px] font-script text-[12.5px] italic text-quill">
                  still unwritten
                </div>
              )}
            </div>
          ))}
          <p className="mt-3 border-t-2 border-brink/15 pt-3.5 font-sans text-[11.5px] leading-[1.55] text-quill">
            They only know what the page knows. The blanks fill in as you
            write — or as you decide them out loud.
          </p>
        </div>
      </div>
    </div>
  );
}

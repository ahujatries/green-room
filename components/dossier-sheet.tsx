"use client";

import type { Character } from "@/lib/characters";
import { Close } from "./icons";

// The character file — facets that are written show their value; the unwritten
// ones read "still unwritten". The blanks are the whole point of the app.
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
      <div className="absolute inset-0 bg-[rgba(4,10,6,0.6)]" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[80%] flex-col rounded-t-[22px] bg-paper shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex flex-none justify-center pb-1 pt-2.5">
          <span className="h-1 w-[38px] rounded-full bg-[#d9d2c2]" />
        </div>
        <div className="flex flex-none items-center gap-[11px] border-b border-line px-[18px] pb-3.5 pt-2">
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-canopy font-script text-[15px] font-bold text-[#f3eee3]">
            {character.initial}
          </span>
          <div className="flex-1">
            <div className="font-script text-[15px] font-bold text-ink">
              {character.name}
            </div>
            <div className="mt-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-sage">
              Character file · {fileFraction} written
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border border-line bg-bone text-ink"
          >
            <Close size={14} stroke={2} />
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-[18px] pb-6 pt-1.5">
          {character.facets.map((f) => (
            <div key={f.key} className="border-b border-[#efe8d8] py-[13px]">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`h-[7px] w-[7px] flex-none rounded-full ${
                    f.value
                      ? "border border-canopy bg-spring"
                      : "border border-[#c9c0ad]"
                  }`}
                />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-sage">
                  {f.label}
                </span>
              </div>
              {f.value ? (
                <div className="pl-[15px] font-script text-[13.5px] leading-[1.5] text-ink">
                  {f.value}
                </div>
              ) : (
                <div className="pl-[15px] text-[12.5px] italic text-ink-faint">
                  — still unwritten —
                </div>
              )}
            </div>
          ))}
          <p className="pt-3 text-[11px] leading-[1.6] text-ink-faint">
            They only know what the page knows. The blanks fill in as you write —
            or as you decide them out loud.
          </p>
        </div>
      </div>
    </div>
  );
}

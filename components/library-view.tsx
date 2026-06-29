"use client";

// LIBRARY — the shelf. A "Featured · talk now" hero room (Star Wars), then the
// writer's OWN Arqo scripts when signed in (a sign-in door when not), then a
// "More to talk to" shelf for the rest of the catalog and a paste-your-own
// door. Expressed in the call-sheet tokens.

import type { Account } from "@/components/green-room";
import type { CatalogEntry } from "@/lib/catalog";
import { coverInitial } from "@/lib/catalog";
import type { ScriptListItem } from "@/lib/data/scripts";

export function LibraryView({
  featured,
  works,
  myScripts,
  account,
  onOpen,
  onOpenMine,
  onSignIn,
  onPasteOwn,
}: {
  featured: CatalogEntry;
  works: CatalogEntry[];
  myScripts: ScriptListItem[];
  account: Account;
  onOpen: (id: string) => void;
  onOpenMine: (id: string) => void;
  onSignIn: () => void;
  onPasteOwn: () => void;
}) {
  const signedIn = account === "arqo";
  const acctLabel = signedIn ? "Signed in" : "No account · guest";

  return (
    <div className="flex h-full flex-col">
      {/* Search affordance (static — search is not wired) */}
      <div className="flex flex-none items-center gap-[9px] border-b-2 border-brink bg-bonepaper px-4 py-3.5">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5A6450"
          strokeWidth="2.2"
          strokeLinecap="square"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-quill">
          Search scripts &amp; characters
        </span>
      </div>

      <div className="gr-scroll rise min-h-0 flex-1 overflow-y-auto px-4 pb-[22px] pt-[18px]">
        {/* ── Featured · talk now ──────────────────────────────────────── */}
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
          Featured · talk now
        </div>
        <button
          onClick={() => onOpen(featured.id)}
          className="lift mt-[11px] block w-full border-2 border-brink bg-bonepaper text-left hard"
        >
          <div className="relative flex h-24 items-end overflow-hidden border-b-2 border-brink bg-forest">
            {/* gradient cover well — the title's initial sits behind the wash */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-script text-[64px] font-bold leading-none text-field/25">
              {coverInitial(featured.script.title)}
            </span>
            <span className="absolute right-2.5 top-[9px] z-[2] border-2 border-brink bg-spring px-[7px] py-[3px] font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-brink">
              {account === "none" ? "No account" : "Talk now"}
            </span>
            <span className="relative z-[2] w-full whitespace-nowrap bg-gradient-to-t from-forestdeep/90 to-transparent px-3 pb-2.5 pt-[18px] font-script text-[21px] font-bold leading-none text-callbone">
              {featured.script.title}
            </span>
          </div>
          <div className="px-[13px] py-3">
            <div className="font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-quill">
              {featured.eyebrow} · {featured.cast.length} characters
            </div>
            <p className="mt-2 text-[12px] leading-[1.45] text-brink/90">
              {featured.script.logline}
            </p>
          </div>
        </button>

        {/* ── Your scripts ─────────────────────────────────────────────── */}
        <div className="mb-[11px] mt-[18px] flex items-center gap-2.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
            Your scripts
          </span>
          <span className="h-0.5 flex-1 bg-brink/15" />
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-quill">
            {acctLabel}
          </span>
        </div>

        {!signedIn ? (
          // Guest — the door into real sign-in.
          <button
            onClick={onSignIn}
            className="block w-full border-2 border-brink bg-forest p-4 text-left"
          >
            <p className="mb-[13px] text-[12.5px] leading-[1.5] text-quill2">
              Sign in with Arqo to talk to <em>your</em> cast — your scripts come
              with you.
            </p>
            <span className="flex w-full items-center justify-center gap-2 border-2 border-brink bg-spring p-[12px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/arqo-spiral.svg" alt="" className="h-[15px] w-[15px]" />
              Sign in with Arqo
            </span>
          </button>
        ) : myScripts.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {myScripts.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpenMine(s.id)}
                className="lift flex items-center gap-3 border-2 border-brink bg-bonepaper px-3 py-[11px] text-left hard-sm"
              >
                <span className="flex h-[52px] w-[52px] flex-none items-center justify-center border-2 border-brink bg-forest font-script text-[22px] font-bold text-field">
                  {coverInitial(s.title)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-script text-[13.5px] font-bold leading-[1.1] text-brink">
                    {s.title}
                  </span>
                  <span className="mt-[3px] block truncate font-mono text-[8px] uppercase tracking-[0.08em] text-quill">
                    {[s.format, s.pageCount ? `${s.pageCount} pp` : null]
                      .filter(Boolean)
                      .join(" · ") || "your script"}
                  </span>
                </span>
                <span className="flex-none font-mono text-[14px] text-brink">
                  →
                </span>
              </button>
            ))}
          </div>
        ) : (
          // Signed in, nothing written yet.
          <p className="border-2 border-dashed border-brink/40 px-3 py-4 text-center font-mono text-[9.5px] leading-[1.6] uppercase tracking-[0.06em] text-quill">
            No scripts in your Arqo account yet. Write one in Arqo and it&apos;ll
            show up here.
          </p>
        )}

        {/* ── More to talk to (catalog samples + paste-your-own) ───────── */}
        <div className="mb-[11px] mt-[18px] flex items-center gap-2.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
            More to talk to
          </span>
          <span className="h-0.5 flex-1 bg-brink/15" />
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-quill">
            Samples
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {works.map((w) => (
            <button
              key={w.id}
              onClick={() => onOpen(w.id)}
              className="lift flex items-center gap-3 border-2 border-brink bg-bonepaper px-3 py-[11px] text-left hard-sm"
            >
              <span className="flex h-[52px] w-[52px] flex-none items-center justify-center border-2 border-brink bg-forest font-script text-[22px] font-bold text-field">
                {coverInitial(w.script.title)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-script text-[13.5px] font-bold leading-[1.1] text-brink">
                  {w.script.title}
                </span>
                <span className="mt-[3px] block truncate font-mono text-[8px] uppercase tracking-[0.08em] text-quill">
                  {w.eyebrow} · {w.cast.length} char.
                </span>
              </span>
              <span className="flex-none font-mono text-[14px] text-brink">
                →
              </span>
            </button>
          ))}

          {/* ── + paste your own ───────────────────────────────────────── */}
          <button
            onClick={onPasteOwn}
            className="mt-1 border-2 border-dashed border-brink/50 bg-transparent px-3 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-quill"
          >
            + Paste your own script
          </button>
        </div>
      </div>
    </div>
  );
}

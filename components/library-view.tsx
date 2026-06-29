"use client";

// LIBRARY — the catalog shelf. A "Featured · talk now" hero room, a shelf of the
// other catalog rooms, and a door to paste your own. A live search box filters
// the whole catalog by script OR character; while a query is active the shelves
// collapse into a single ranked result list. Expressed in the call-sheet tokens.

import { useMemo, useState } from "react";

import type { Account } from "@/components/green-room";
import type { CatalogEntry } from "@/lib/catalog";
import { coverInitial } from "@/lib/catalog";

// Does this entry match the query, and on which characters? Searches the script
// (title / eyebrow / logline) and every cast member (name / role / blurb), so
// "make search work" covers scripts AND characters per the box's promise.
function matchEntry(
  entry: CatalogEntry,
  q: string,
): { hit: boolean; chars: string[] } {
  const scriptHit =
    entry.script.title.toLowerCase().includes(q) ||
    entry.eyebrow.toLowerCase().includes(q) ||
    entry.script.logline.toLowerCase().includes(q);

  const chars = entry.cast
    .filter((c) =>
      [c.name, c.role, c.roleShort, c.blurb]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
    )
    .map((c) => c.name);

  return { hit: scriptHit || chars.length > 0, chars };
}

export function LibraryView({
  featured,
  works,
  account,
  onOpen,
  onPasteOwn,
}: {
  featured: CatalogEntry;
  works: CatalogEntry[];
  account: Account;
  onOpen: (id: string) => void;
  onPasteOwn: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const acctLabel =
    account === "arqo"
      ? "Signed in"
      : account === "free"
        ? "Free account"
        : "No account · guest";

  // Featured + the rest, deduped, searched as one pool.
  const all = useMemo(() => {
    const seen = new Set<string>();
    return [featured, ...works].filter((e) =>
      seen.has(e.id) ? false : (seen.add(e.id), true),
    );
  }, [featured, works]);

  const results = useMemo(() => {
    if (!q) return [];
    return all
      .map((entry) => ({ entry, ...matchEntry(entry, q) }))
      .filter((r) => r.hit);
  }, [all, q]);

  return (
    <div className="flex h-full flex-col">
      {/* Search — live filter over scripts & characters */}
      <div className="flex flex-none items-center gap-[9px] border-b-2 border-brink bg-bonepaper px-4 py-3">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5A6450"
          strokeWidth="2.2"
          strokeLinecap="square"
          className="flex-none"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scripts & characters"
          aria-label="Search scripts and characters"
          className="min-w-0 flex-1 bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] text-brink outline-none placeholder:text-quill"
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="flex-none font-mono text-[11px] font-bold text-quill hover:text-brink"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="gr-scroll rise min-h-0 flex-1 overflow-y-auto px-4 pb-[22px] pt-[18px]">
        {q ? (
          /* ── Search results ─────────────────────────────────────────── */
          <>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
              {results.length} result{results.length === 1 ? "" : "s"}
            </div>

            {results.length === 0 ? (
              <p className="mt-4 text-[12px] leading-[1.5] text-quill">
                Nothing matches “{query.trim()}”. Try a title or a character
                name — or paste your own script below.
              </p>
            ) : (
              <div className="mt-[11px] flex flex-col gap-2.5">
                {results.map(({ entry, chars }) => (
                  <button
                    key={entry.id}
                    onClick={() => onOpen(entry.id)}
                    className="lift flex items-center gap-3 border-2 border-brink bg-bonepaper px-3 py-[11px] text-left hard-sm"
                  >
                    <span className="flex h-[52px] w-[52px] flex-none items-center justify-center border-2 border-brink bg-forest font-script text-[22px] font-bold text-field">
                      {coverInitial(entry.script.title)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-script text-[13.5px] font-bold leading-[1.1] text-brink">
                        {entry.script.title}
                      </span>
                      <span className="mt-[3px] block truncate font-mono text-[8px] uppercase tracking-[0.08em] text-quill">
                        {entry.eyebrow} · {entry.cast.length} char.
                      </span>
                      {chars.length > 0 ? (
                        <span className="mt-[3px] block truncate font-mono text-[8px] uppercase tracking-[0.08em] text-canopytext">
                          ↳ {chars.join(", ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex-none font-mono text-[14px] text-brink">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Default shelves (no active query) ───────────────────────── */
          <>
            {/* Featured · talk now */}
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
              Featured · talk now
            </div>
            <button
              onClick={() => onOpen(featured.id)}
              className="lift mt-[11px] block w-full border-2 border-brink bg-bonepaper text-left hard"
            >
              <div className="relative flex h-24 items-end overflow-hidden border-b-2 border-brink bg-forest">
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

            {/* The rest of the catalog */}
            <div className="mb-[11px] mt-[18px] flex items-center gap-2.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
                The library
              </span>
              <span className="h-0.5 flex-1 bg-brink/15" />
              <span className="font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-quill">
                {acctLabel}
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

              {/* + paste your own */}
              <button
                onClick={onPasteOwn}
                className="mt-1 border-2 border-dashed border-brink/50 bg-transparent px-3 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-quill"
              >
                + Paste your own script
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

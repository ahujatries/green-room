"use client";

import { useState } from "react";
import { CHARACTERS, SCRIPT } from "@/lib/characters";
import { ChatPanel } from "@/components/chat-panel";

export default function Page() {
  const [selectedId, setSelectedId] = useState<string>(CHARACTERS[0].id);
  const selected = CHARACTERS.find((c) => c.id === selectedId)!;

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-6 md:px-8 md:py-10">
      {/* Wordmark */}
      <header className="mb-7 flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block h-3.5 w-3.5 rounded-full bg-canopy ring-4 ring-spring/35"
          />
          <h1 className="text-[19px] font-black tracking-tight text-ink">
            the green room
          </h1>
          <span className="ml-1 hidden text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint sm:inline">
            an arqo experiment
          </span>
        </div>
        <p className="hidden text-right text-[13px] leading-tight text-ink-soft md:block">
          talk to the people
          <br />
          you&rsquo;re writing
        </p>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-[300px_1fr]">
        {/* Cast list */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-2xl border border-line bg-paper/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              The work
            </p>
            <p className="mt-1.5 font-mono text-[15px] font-bold leading-snug text-ink">
              {SCRIPT.title}
            </p>
            <p className="mt-1 text-[12.5px] uppercase tracking-wide text-sage">
              {SCRIPT.format}
            </p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
              {SCRIPT.logline}
            </p>
          </div>

          <p className="mt-1 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            The cast
          </p>
          <div className="flex flex-col gap-2.5">
            {CHARACTERS.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={[
                    "group rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-canopy bg-paper shadow-[0_1px_0_0_var(--color-spring)]"
                      : "border-line bg-paper/50 hover:border-sage hover:bg-paper",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[15px] font-bold text-ink">
                      {c.name}
                    </span>
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-spring ring-2 ring-canopy/40" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] uppercase tracking-wide text-sage">
                    {c.role}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
                    {c.blurb}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="mt-auto px-1 pt-3 text-[11px] leading-relaxed text-ink-faint">
            They only know what the page knows. Ask past it and they&rsquo;ll
            tell you it&rsquo;s still yours to decide.
          </p>
        </aside>

        {/* Conversation — remounts per character so each is a fresh room */}
        <ChatPanel key={selected.id} character={selected} />
      </div>
    </div>
  );
}

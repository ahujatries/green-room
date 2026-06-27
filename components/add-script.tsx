"use client";

// The first thing you see (no auth): paste a script, name it, build the room.
// We send the text to /api/cast, which derives the cast, and hand a complete
// Room back up. A one-tap sample makes the room usable before you paste a thing.

import { useState } from "react";

import type { Character, Room } from "@/lib/characters";
import { SAMPLE_ROOM } from "@/lib/characters";

export function AddScript({ onReady }: { onReady: (room: Room) => void }) {
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (body.length < 40 || loading) {
      if (body.length < 40) {
        setError("Paste a bit more of the script so the room has something to read.");
      }
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Untitled", text: body }),
      });
      const data = (await res.json()) as {
        characters?: Character[];
        logline?: string;
        error?: string;
      };
      if (!res.ok || !data.characters?.length) {
        throw new Error(data.error || "Couldn't read that script. Try again.");
      }
      onReady({
        script: {
          title: title.trim() || "Untitled",
          format: format.trim() || "screenplay",
          logline: data.logline ?? "",
          text: body,
        },
        cast: data.characters,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-void">
      <div className="shell-bg grain relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden font-sans text-bonelit sm:my-4 sm:h-[860px] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:border sm:border-bonelit/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* spiral watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/arqo-spiral.svg"
          alt=""
          className="pointer-events-none absolute -bottom-[90px] -right-[70px] z-0 w-[380px] opacity-[0.045]"
        />

        <div className="relative z-10 flex h-full flex-col">
          {/* bulb strip */}
          <div className="flex h-[14px] flex-none items-center justify-between border-b border-black/40 bg-[rgba(6,13,8,0.5)] px-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="bulb" />
            ))}
          </div>

          {/* header */}
          <header className="flex flex-none items-center gap-[9px] border-b border-bonelit/10 px-[18px] pb-[11px] pt-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arqo-spiral.svg"
              alt="Arqo"
              className="h-[22px] w-[22px] flex-none"
            />
            <span className="font-sans text-[18px] font-black tracking-tight text-bonelit">
              the green room
            </span>
          </header>

          {/* body */}
          <div className="gr-scroll min-h-0 flex-1 overflow-y-auto px-[22px] pb-8 pt-[26px]">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
              Add your script
            </p>
            <h1 className="mt-3 font-script text-[30px] font-bold leading-[1.08] tracking-tight text-bonelit">
              Bring a page. Meet who&rsquo;s on it.
            </h1>
            <p className="mt-3 text-[14px] leading-[1.6] text-fog">
              Paste a scene or a whole script. The room reads it, casts the
              characters, and lets you talk to them — grounded only in what you
              wrote.
            </p>

            <form onSubmit={build} className="mt-6 flex flex-col gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                disabled={loading}
                className="w-full rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[12px] text-[15px] text-bonelit placeholder:text-mist/60 transition-colors focus:border-spring focus:outline-none focus:ring-1 focus:ring-spring/40 disabled:opacity-60"
              />
              <input
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="Format — e.g. feature, short film, pilot (optional)"
                disabled={loading}
                className="w-full rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[12px] text-[14px] text-bonelit placeholder:text-mist/60 transition-colors focus:border-spring focus:outline-none focus:ring-1 focus:ring-spring/40 disabled:opacity-60"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  "Paste your script here…\n\nINT. DINER — NIGHT\n\nNADIA wipes the counter. AUGUST watches.\n\n          NADIA\n     We close when the coffee's gone."
                }
                rows={12}
                disabled={loading}
                className="gr-scroll w-full resize-none rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[13px] font-mono text-[12.5px] leading-[1.6] text-bonelit placeholder:text-mist/40 transition-colors focus:border-spring focus:outline-none focus:ring-1 focus:ring-spring/40 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex items-center justify-center rounded-xl bg-spring px-4 py-[14px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Reading the page…" : "Build the room"}
              </button>
            </form>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-flame/40 bg-flame/10 px-3 py-2 text-[12px] leading-[1.5] text-flame"
              >
                {error}
              </p>
            )}

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-bonelit/15" />
              <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-mist2">
                or
              </span>
              <span className="h-px flex-1 bg-bonelit/15" />
            </div>

            <button
              type="button"
              onClick={() => onReady(SAMPLE_ROOM)}
              disabled={loading}
              className="flex w-full items-center justify-between rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[13px] text-left transition-colors hover:border-spring disabled:opacity-50"
            >
              <span>
                <span className="block font-script text-[15px] font-bold text-bonelit">
                  Try the sample — &ldquo;The Last Shift&rdquo;
                </span>
                <span className="mt-0.5 block font-mono text-[8.5px] font-medium uppercase tracking-[0.12em] text-mist">
                  a 2-hander to meet the room
                </span>
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-springpale">
                open →
              </span>
            </button>

            <p className="mt-7 text-[11.5px] leading-[1.6] text-mist2">
              They only know what the page knows. Your script stays in this
              browser — nothing is saved to an account.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AddScript;

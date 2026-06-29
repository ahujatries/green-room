"use client";

// WELCOME — "The light's on for you".
//
// The return / signed-in confirmation after the Arqo handoff. Pixel-faithful to
// MacRd › 03 · RETURN: green-lit cube, the welcome-back line with the writer's
// first name, an identity chip, and "Enter the Green Room →" into the library.

import { AuthHeader, RoomCube } from "@/components/brand-marks";

export function WelcomeView({
  name,
  email,
  onEnter,
}: {
  name: string;
  email: string;
  onEnter: () => void;
}) {
  const firstName = name.trim().split(/\s+/)[0] || "writer";
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <AuthHeader />

      <div className="rise flex min-h-0 flex-1 flex-col px-6 pb-6 pt-8">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex h-[78px] w-[78px] items-center justify-center border-2 border-brink bg-bonepaper hard">
            <RoomCube tone="green" className="h-[52px] w-[52px]" />
          </span>

          <div className="mt-6 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
            Signed in with Arqo
          </div>
          <h1 className="mt-3 font-sans text-[30px] font-black uppercase leading-[0.98] tracking-[-0.025em] text-brink">
            The light&rsquo;s on
            <br />
            for you.
          </h1>
          <p className="mx-auto mt-3.5 max-w-[290px] text-[13.5px] leading-[1.55] text-quill">
            Welcome back, {firstName}. Your cast is on their marks — let&rsquo;s
            pick up where the scene left off.
          </p>

          <div className="mt-6 flex items-center gap-2.5 border-2 border-brink bg-bonepaper px-3 py-2 hard-sm">
            <span className="flex h-7 w-7 flex-none items-center justify-center border-2 border-brink bg-flame font-sans text-[12px] font-black text-callbone">
              {initial}
            </span>
            <span className="font-mono text-[11px] text-brink">{email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="flex w-full items-center justify-center gap-2 border-2 border-brink bg-spring p-[15px] font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brink hard transition-transform hover:-translate-y-px active:translate-y-0"
        >
          Enter the Green Room →
        </button>
        <p className="mt-3 text-center font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-quill">
          Dropping you into the room…
        </p>
      </div>
    </div>
  );
}

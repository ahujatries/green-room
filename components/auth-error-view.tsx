"use client";

// AUTH ERROR — "That link's gone dark".
//
// The sign-in failure screen (expired/used magic link, denied authorize, etc.).
// Pixel-faithful to MacRd › 04 · ERROR: the red-lit cube, the flame eyebrow, and
// "Try again" back to the entry. The red clap-stripe cap is rendered by the
// shell (green-room.tsx) when this screen is active.

import { AuthHeader, RoomCube } from "@/components/brand-marks";

export function AuthErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <AuthHeader />

      <div className="rise flex min-h-0 flex-1 flex-col px-6 pb-6 pt-8">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex h-[78px] w-[78px] items-center justify-center border-2 border-brink bg-bonepaper hard">
            <RoomCube tone="red" className="h-[52px] w-[52px]" />
          </span>

          <div className="mt-6 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-flamecall">
            Auth error · the light&rsquo;s red
          </div>
          <h1 className="mt-3 font-sans text-[30px] font-black uppercase leading-[0.98] tracking-[-0.025em] text-brink">
            That link&rsquo;s
            <br />
            gone dark.
          </h1>
          <p className="mx-auto mt-3.5 max-w-[300px] text-[13.5px] leading-[1.55] text-quill">
            The sign-in link expired or was already used. Happens to the best
            takes — let&rsquo;s run it again from the top.
          </p>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="flex w-full items-center justify-center border-2 border-brink bg-spring p-[15px] font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brink hard transition-transform hover:-translate-y-px active:translate-y-0"
        >
          Try again
        </button>
        <p className="mt-3 text-center font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-quill">
          /auth/auth-code-error
        </p>
      </div>
    </div>
  );
}

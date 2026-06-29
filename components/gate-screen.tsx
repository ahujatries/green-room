"use client";

// The password gate, rendered by the root layout whenever the visitor lacks a
// valid gate cookie. Brutalist call-sheet styling, no Arqo branding. Plain form
// POST → /api/gate (Node route), which sets the cookie and reloads. We keep the
// gate in the layout (not middleware) because this Next/Vercel combo mis-bundles
// Edge middleware (`__dirname is not defined`).

import { useEffect, useState } from "react";

export function GateScreen() {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(new URLSearchParams(window.location.search).get("e") === "1");
  }, []);

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-forest p-6 font-sans">
      <div className="w-full max-w-[400px] border-2 border-brink bg-field text-brink shadow-[10px_10px_0_0_var(--color-forestdeep)]">
        <div className="clap h-[10px] border-b-2 border-brink" />

        <div className="border-b-2 border-brink bg-headerdeep px-5 py-4">
          <span className="font-sans text-[17px] font-black uppercase leading-none tracking-[-0.01em] text-callbone">
            The <span className="text-spring">Green</span> Room
          </span>
        </div>

        <form action="/api/gate" method="POST" className="px-5 py-7">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
            Private preview
          </p>
          <h1 className="mt-3 font-sans text-[22px] font-black uppercase leading-[1.05] tracking-[-0.02em] text-brink">
            Enter the password to continue.
          </h1>

          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Password"
            className="mt-5 w-full border-2 border-brink bg-bonepaper px-3.5 py-3 text-[15px] text-brink outline-none transition-colors placeholder:text-quill focus:bg-field"
          />

          {error ? (
            <p
              role="alert"
              className="mt-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-flamecall"
            >
              Wrong password — try again.
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center border-2 border-brink bg-spring p-[13px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-brink hard-sm transition-opacity hover:opacity-90"
          >
            Enter →
          </button>
        </form>
      </div>
    </main>
  );
}

export default GateScreen;

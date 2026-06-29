"use client";

// SIGN IN — the real Arqo connect screen, in call-sheet brutalist dress.
//
// This replaces the old faked "consent" demo: every control here drives a real
// Supabase sign-in against Arqo's project (the same project Arqo itself uses),
// so signing in here IS signing into your Arqo account. On success Supabase
// redirects through /auth/callback, which exchanges the code for a session and
// lands back on "/", where the server re-reads the session and the writer's own
// scripts. Google + magic-link are the providers configured for the project.

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignInView({ onBack }: { onBack: () => void }) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<null | "email" | "google">(null);
  const [error, setError] = useState<string | null>(null);

  // Land back on the entry once signed in; the server picks up the session.
  function redirectTo() {
    return `${location.origin}/auth/callback?next=/`;
  }

  async function signInWithGoogle() {
    setError(null);
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    // On success the browser is redirected away; we only reach here on error.
    if (error) {
      setLoading(null);
      setError(error.message);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    setLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="gr-scroll rise flex h-full flex-col items-center justify-center overflow-hidden px-6 py-8 text-center">
        <span className="border-2 border-brink bg-spring px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-brink hard-sm">
          Check your email
        </span>
        <h1 className="mt-5 font-sans text-[24px] font-black uppercase leading-[1.08] tracking-[-0.02em] text-brink">
          The light&apos;s on for you.
        </h1>
        <p className="mt-3 max-w-[280px] text-[12.5px] leading-[1.55] text-quill">
          We sent a sign-in link to{" "}
          <span className="font-bold text-brink">{email.trim()}</span>. Open it
          on this device to step inside.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="mt-7 border-2 border-brink/40 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-quill"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="gr-scroll rise flex h-full flex-col overflow-hidden px-5 py-6">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Connect · Arqo ID
      </div>
      <h1 className="mt-[11px] font-sans text-[24px] font-black uppercase leading-[1.06] tracking-[-0.02em] text-brink">
        Sign in with Arqo to talk to your cast.
      </h1>
      <p className="mb-[18px] mt-2.5 text-[12.5px] leading-[1.5] text-quill">
        Use your Arqo account — your scripts come with you. They only know
        what&apos;s on the page; everything you bring stays yours.
      </p>

      {/* Continue with Google — primary */}
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-2 border-2 border-brink bg-spring p-[14px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink hard-sm disabled:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arqo-spiral.svg" alt="" className="h-[15px] w-[15px]" />
        {loading === "google" ? "Connecting…" : "Continue with Arqo"}
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-0.5 flex-1 bg-brink/15" />
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-quill">
          or by email
        </span>
        <span className="h-0.5 flex-1 bg-brink/15" />
      </div>

      {/* Magic link */}
      <form onSubmit={sendMagicLink} className="flex flex-col gap-2.5">
        <label
          htmlFor="gr-email"
          className="font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-quill"
        >
          Email
        </label>
        <input
          id="gr-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          disabled={loading !== null}
          className="w-full border-2 border-brink bg-bonepaper px-3.5 py-[12px] font-mono text-[13px] text-brink placeholder:text-quill/60 focus:outline-none focus:ring-2 focus:ring-spring disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="border-2 border-brink bg-forest p-[13px] font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-spring disabled:opacity-50"
        >
          {loading === "email" ? "Sending…" : "Send me a link"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 border-2 border-flame/50 bg-flame/10 px-3 py-2 font-mono text-[10px] leading-[1.5] text-flame"
        >
          {error}
        </p>
      )}

      <span className="flex-1" />

      <button
        type="button"
        onClick={onBack}
        className="mt-5 block w-full border-2 border-brink/30 p-[11px] text-center font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-quill"
      >
        ← Back to the call sheet
      </button>
    </div>
  );
}

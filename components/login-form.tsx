"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

// "Log in with Arqo" — the single production sign-in path.
//
// Green Room and Arqo share one Supabase project AND the `.tryarqo.com` parent
// domain, so they share the same auth cookie. If a session already exists the
// middleware picks it up silently and the user never sees this screen. When it
// doesn't, "Continue with Arqo" sends them to Arqo's login with a `next` return
// URL; Arqo authenticates them and redirects back here with the shared cookie
// set.
//
// The email magic-link is kept ONLY as a dev/localhost fallback — it renders
// just off-*.tryarqo.com (where the shared-cookie mechanism can't apply), as a
// subordinate text link. Google + GitHub are gone.

// Arqo's login page. The default points at production; overridable for preview
// environments via env.
const ARQO_LOGIN_URL =
  process.env.NEXT_PUBLIC_ARQO_LOGIN_URL ?? "https://app.tryarqo.com/login";

export function LoginForm({ next }: { next?: string }) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<null | "email" | "arqo">(null);
  const [error, setError] = useState<string | null>(null);

  // Magic-link is dev-only: render it solely on hosts where we can't share
  // Arqo's cookie (localhost, *.vercel.app, custom dev domains). On
  // *.tryarqo.com production users only ever see "Continue with Arqo".
  const showDevMagicLink =
    typeof window !== "undefined" &&
    getCookieDomain(window.location.hostname) === undefined;

  // Where Arqo (and the magic-link) should land the user back in Green Room.
  function returnUrl() {
    const nextParam =
      next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "";
    return `${location.origin}/auth/landing${nextParam}`;
  }

  function continueWithArqo() {
    setError(null);
    setLoading("arqo");
    const target = `${ARQO_LOGIN_URL}?next=${encodeURIComponent(returnUrl())}`;
    window.location.href = target;
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Magic-link still uses /auth/callback — it returns with a `code` to
      // exchange. (Arqo's round-trip uses /auth/landing — cookie already set.)
      options: {
        emailRedirectTo: `${location.origin}/auth/callback${
          next && next.startsWith("/")
            ? `?next=${encodeURIComponent(next)}`
            : ""
        }`,
      },
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
      <div className="rise w-full rounded-2xl border border-line bg-paper px-6 py-8 text-center shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)]">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopy">
          Check your email
        </p>
        <h2 className="mt-3 font-script text-[24px] font-bold leading-tight text-ink">
          The light&rsquo;s on for you.
        </h2>
        <p className="mx-auto mt-3 max-w-[260px] text-[13px] leading-[1.6] text-ink-soft">
          We sent a sign-in link to{" "}
          <span className="font-semibold text-ink">{email.trim()}</span>. Open it
          on this device to step inside.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="mt-6 font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-ink-faint underline-offset-4 transition-colors hover:text-canopy hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={continueWithArqo}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-spring px-4 py-[14px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arqo-spiral.svg" alt="" className="h-[15px] w-[15px]" />
        {loading === "arqo" ? "Opening Arqo…" : "Continue with Arqo"}
      </button>

      <p className="mt-3 text-center text-[11px] leading-[1.6] text-mist2">
        Use your Arqo account. Already signed in? You&rsquo;re already in.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-flame/40 bg-flame/10 px-3 py-2 text-[12px] leading-[1.5] text-flame"
        >
          {error}
        </p>
      )}

      {showDevMagicLink && (
        <div className="mt-7 border-t border-bonelit/15 pt-5">
          <p className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-mist2">
            Dev fallback
          </p>
          <form onSubmit={sendMagicLink} className="mt-3 flex flex-col gap-2.5">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              disabled={loading !== null}
              className="w-full rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[12px] text-[14px] text-bonelit placeholder:text-mist/60 transition-colors focus:border-spring focus:outline-none focus:ring-1 focus:ring-spring/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading !== null}
              className="self-start font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-ink-faint underline underline-offset-4 transition-colors hover:text-springpale disabled:opacity-50"
            >
              {loading === "email" ? "Sending…" : "Email me a magic link"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

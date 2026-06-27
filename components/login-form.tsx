"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// NOTE: Google + magic-link are already configured for Arqo's Supabase project.
// The GitHub provider may still need enabling in the Supabase dashboard
// (Authentication → Providers → GitHub) before that button works end-to-end.

type OAuthProvider = "google" | "github";

export function LoginForm({ next }: { next?: string }) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<null | "email" | OAuthProvider>(null);
  const [error, setError] = useState<string | null>(null);

  function redirectTo() {
    const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
    return `${location.origin}/auth/callback${nextParam}`;
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

  async function signInWith(provider: OAuthProvider) {
    setError(null);
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    // On success the browser is redirected away; we only reach here on error.
    if (error) {
      setLoading(null);
      setError(error.message);
    }
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
      <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
        <label
          htmlFor="email"
          className="font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-mist"
        >
          Email
        </label>
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
          className="w-full rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[13px] text-[15px] text-bonelit placeholder:text-mist/60 transition-colors focus:border-spring focus:outline-none focus:ring-1 focus:ring-spring/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="mt-1 flex items-center justify-center rounded-xl bg-spring px-4 py-[13px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading === "email" ? "Sending…" : "Send me a link"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-bonelit/15" />
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-mist2">
          or
        </span>
        <span className="h-px flex-1 bg-bonelit/15" />
      </div>

      <div className="flex flex-col gap-2.5">
        <ProviderButton
          label="Continue with Google"
          onClick={() => signInWith("google")}
          loading={loading === "google"}
          disabled={loading !== null}
        />
        <ProviderButton
          label="Continue with GitHub"
          onClick={() => signInWith("github")}
          loading={loading === "github"}
          disabled={loading !== null}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-flame/40 bg-flame/10 px-3 py-2 text-[12px] leading-[1.5] text-flame"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function ProviderButton({
  label,
  onClick,
  loading,
  disabled,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[12px] font-mono text-[9.5px] font-bold uppercase tracking-[0.11em] text-bonelit transition-colors hover:border-spring hover:bg-bonelit/10 disabled:opacity-50"
    >
      {loading ? "Connecting…" : label}
    </button>
  );
}

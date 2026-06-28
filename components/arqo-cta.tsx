"use client";

// The funnel. Green Room exists to turn "wow, I talked to my character" into an
// Arqo signup. This is the conversion surface: the pitch (these characters
// forget; Arqo remembers) + a one-field waitlist capture that posts to
// /api/waitlist → the real Arqo waitlist, tagged source=green_room.
//
// Brand stays subordinate to Arqo: the spiral, "by Arqo", the master promise.

import { useEffect, useState } from "react";

const JOINED_KEY = "gr:arqo-joined:v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State = "idle" | "sending" | "done" | "error";

// Read an inbound ?ref= so an invited writer credits their referrer on signup.
function inboundRef(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = new URLSearchParams(window.location.search).get("ref")?.trim();
  return v && /^[A-Za-z0-9_-]{6,32}$/.test(v) ? v : undefined;
}

export function ArqoCta({
  characterName,
  variant = "inline",
}: {
  characterName?: string;
  variant?: "inline" | "panel";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // If they've already joined this browser, open straight to the thank-you.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOINED_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { position?: number | null; referralCode?: string | null };
        setState("done");
        setPosition(saved.position ?? null);
        setReferralCode(saved.referralCode ?? null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || state === "sending") {
      if (!EMAIL_RE.test(value)) setError("Enter a valid email.");
      return;
    }
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, ref: inboundRef() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        position?: number | null;
        referralCode?: string | null;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      setPosition(data.position ?? null);
      setReferralCode(data.referralCode ?? null);
      setState("done");
      try {
        localStorage.setItem(
          JOINED_KEY,
          JSON.stringify({ position: data.position ?? null, referralCode: data.referralCode ?? null }),
        );
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  const inviteUrl =
    referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : null;

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — link is still visible */
    }
  }

  const frame =
    variant === "panel"
      ? "rounded-2xl border border-spring/30 bg-[rgba(165,232,87,0.06)] px-5 py-6"
      : "rounded-2xl border border-spring/25 bg-[rgba(165,232,87,0.05)] px-4 py-[18px]";

  if (state === "done") {
    return (
      <div className={frame}>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arqo-spiral.svg" alt="Arqo" className="h-[18px] w-[18px]" />
          <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-springpale">
            You&rsquo;re on the Arqo waitlist
          </span>
        </div>
        <p className="mt-2.5 font-script text-[18px] font-bold leading-[1.25] text-bonelit">
          {position ? <>You&rsquo;re #{position} in line.</> : <>Saved your spot.</>}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-fog">
          We&rsquo;ll email you once before launch — nothing else. Arqo is the
          studio that remembers your scripts, your cast, every page.
        </p>
        {inviteUrl ? (
          <div className="mt-3.5">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-mist">
              Jump the line — invite a writer
            </p>
            <button
              type="button"
              onClick={copyInvite}
              className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg border border-bonelit/20 bg-bonelit/5 px-3 py-2 text-left transition-colors hover:border-spring"
            >
              <span className="truncate font-mono text-[11px] text-fog">{inviteUrl}</span>
              <span className="flex-none font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-springpale">
                {copied ? "copied ✓" : "copy"}
              </span>
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={frame}>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arqo-spiral.svg" alt="Arqo" className="h-[18px] w-[18px]" />
        <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-springpale">
          Keep them · by Arqo
        </span>
      </div>
      <p className="mt-2.5 font-script text-[18px] font-bold leading-[1.25] text-bonelit">
        {characterName ? `${characterName} forgets when you close this tab.` : "They forget when you close this tab."}
      </p>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-fog">
        Arqo is the screenwriting studio that remembers — your scripts, your
        cast, and every conversation. Join the waitlist and pick up right where
        the page left off.
      </p>

      <form onSubmit={join} className="mt-3.5 flex flex-col gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          disabled={state === "sending"}
          className="w-full rounded-xl border border-bonelit/20 bg-bonelit/5 px-4 py-[12px] text-[15px] text-bonelit placeholder:text-mist/60 transition-colors focus:border-spring focus:outline-none focus:ring-1 focus:ring-spring/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="flex items-center justify-center rounded-xl bg-spring px-4 py-[13px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "sending" ? "Saving your spot…" : "Join the Arqo waitlist"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-[11.5px] leading-[1.5] text-flame">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-[10.5px] leading-[1.5] text-mist2">
          One email before launch. No spam, ever.
        </p>
      )}
    </div>
  );
}

export default ArqoCta;

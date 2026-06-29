"use client";

// CONSENT — "Green Room wants to connect to your Arqo ID".
//
// The OAuth-style authorize interstitial shown when a writer taps "Sign in with
// Arqo" on the entry screen. Pixel-faithful to MacRd › 01 · SIGN IN WITH ARQO:
// the permission glyph row, the identity card, the scope list (two grants + one
// standing guarantee), and Authorize / Not now. Reskinned in the call-sheet
// system — no real OAuth backend on the preview, so Authorize hands off via the
// parent's `onAuthorize`.

import { AuthHeader, SpiralMark } from "@/components/brand-marks";

export function ConsentView({
  name,
  email,
  onAuthorize,
  onCancel,
}: {
  name: string;
  email: string;
  onAuthorize: () => void;
  onCancel: () => void;
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <AuthHeader />

      <div className="gr-scroll rise flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-[22px]">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
          Connect · Arqo ID
        </div>

        {/* Permission glyph row — windows handing off to the spiral */}
        <div className="mt-4 flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center border-2 border-brink bg-forest">
            <span className="h-[11px] w-[14px] border border-spring/70" />
          </span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 bg-brink/40" />
            <span className="h-1.5 w-1.5 bg-brink/70" />
            <span className="h-1.5 w-1.5 bg-brink" />
          </span>
          <span className="flex h-[34px] w-[34px] items-center justify-center border-2 border-brink bg-bonepaper">
            <SpiralMark className="h-[18px] w-[18px] text-canopytext" />
          </span>
        </div>

        <h1 className="mt-4 font-sans text-[24px] font-black uppercase leading-[1.04] tracking-[-0.02em] text-brink">
          Green Room wants to connect to your Arqo ID
        </h1>

        {/* Identity card */}
        <div className="mt-[18px] flex items-center gap-3 border-2 border-brink bg-bonepaper p-3 hard-sm">
          <span className="flex h-9 w-9 flex-none items-center justify-center border-2 border-brink bg-flame font-sans text-[15px] font-black text-callbone">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-sans text-[13.5px] font-bold leading-tight text-brink">
              {name}
            </span>
            <span className="block truncate font-mono text-[10px] leading-tight text-quill">
              {email}
            </span>
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="flex-none font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-canopytext underline-offset-2 hover:underline"
          >
            Switch
          </button>
        </div>

        {/* Scopes */}
        <div className="mt-[22px] font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-quill">
          Green Room will be able to
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          <ScopeRow granted>Read your scripts, characters, and pages</ScopeRow>
          <ScopeRow granted>See your name and profile photo</ScopeRow>
          <ScopeRow>
            Never writes to your account — never trains on your work
          </ScopeRow>
        </ul>

        <span className="flex-1" />

        {/* Actions */}
        <button
          type="button"
          onClick={onAuthorize}
          className="mt-7 flex w-full items-center justify-center border-2 border-brink bg-spring p-[14px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brink hard-sm transition-transform hover:-translate-y-px active:translate-y-0"
        >
          Authorize Green Room
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2.5 flex w-full items-center justify-center border-2 border-brink bg-bonepaper p-[12px] font-mono text-[9.5px] font-bold uppercase tracking-[0.13em] text-brink transition-colors hover:bg-field"
        >
          Not now
        </button>
        <p className="mt-3.5 text-center font-mono text-[8.5px] leading-[1.6] tracking-[0.06em] text-quill">
          Revoke anytime in Arqo › Settings › Connected apps
        </p>
      </div>
    </div>
  );
}

/** One scope row — a granted permission (spring check) or a standing guarantee. */
function ScopeRow({
  children,
  granted = false,
}: {
  children: React.ReactNode;
  granted?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      {granted ? (
        <span className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center border-2 border-brink bg-spring">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a2418" strokeWidth="3.2" strokeLinecap="square">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : (
        <span className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center border-2 border-brink bg-bonepaper">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5a6450" strokeWidth="2.6" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="9" rx="1" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      )}
      <span
        className={`text-[13px] leading-[1.45] ${granted ? "text-brink" : "text-quill"}`}
      >
        {children}
      </span>
    </li>
  );
}

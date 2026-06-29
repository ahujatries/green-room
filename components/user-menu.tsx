"use client";

import { useEffect, useRef, useState } from "react";

import { SpiralMark } from "@/components/brand-marks";

export type UserMenuProps = {
  /** Display name of the signed-in writer. */
  name?: string | null;
  /** The signed-in user's email, if any. */
  email?: string | null;
  /** Optional avatar URL (e.g. from an OAuth provider). */
  avatarUrl?: string | null;
  /** Sign out of the room (client flow on the preview — no /login route here). */
  onSignOut?: () => void;
};

/**
 * Signed-in-with-Arqo account control for the brand header.
 *
 * A name + flame-avatar chip that opens the call-sheet account menu: identity,
 * the "Signed in with Arqo" badge, room shortcuts, a link out to manage the
 * Arqo account, and sign-out. Pixel-faithful to MacRd › 05 · SIGNED IN.
 */
export function UserMenu({ name, email, avatarUrl, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = name?.trim() || email?.trim() || "Account";
  const firstName = displayName.split(/\s+/)[0];
  const initial = (displayName[0] ?? "?").toUpperCase();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger chip — NAME + flame avatar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${displayName}`}
        className="flex items-center gap-2 border-2 border-brink bg-headerdeep py-[3px] pl-2.5 pr-[3px] transition-colors hover:bg-header"
      >
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-callbone">
          {firstName}
        </span>
        <span className="flex h-[26px] w-[26px] items-center justify-center overflow-hidden border-2 border-brink bg-flame font-sans text-[12px] font-black text-callbone">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initial
          )}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="pop absolute right-0 z-50 mt-2 w-[244px] border-2 border-brink bg-bonepaper hard-lg"
        >
          {/* Identity */}
          <div className="flex items-center gap-2.5 border-b-2 border-brink px-3.5 pb-3 pt-3.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center border-2 border-brink bg-flame font-sans text-[15px] font-black text-callbone">
              {initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-sans text-[13px] font-bold leading-tight text-brink">
                {displayName}
              </span>
              {email ? (
                <span className="block truncate font-mono text-[10px] leading-tight text-quill">
                  {email}
                </span>
              ) : null}
            </span>
          </div>

          <div className="border-b-2 border-brink px-3.5 py-2">
            <span className="inline-flex items-center gap-1.5 bg-spring px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-brink">
              <SpiralMark className="h-3 w-3 text-brink" />
              Signed in with Arqo
            </span>
          </div>

          {/* Room shortcuts */}
          <div className="border-b-2 border-brink py-1.5">
            <MenuItem label="Your scripts" icon="scripts" />
            <MenuItem label="Account settings" icon="settings" />
            <MenuItem label="Manage Arqo account" icon="external" external />
          </div>

          {/* Sign out */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut?.();
            }}
            className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-field"
          >
            <svg className="mt-0.5 h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="#b95236" strokeWidth="2.2" strokeLinecap="square">
              <path d="M14 5H6v14h8M11 12H21M17 8l4 4-4 4" />
            </svg>
            <span>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-flamecall">
                Sign out
              </span>
              <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.1em] text-quill">
                Back to the Green Room
              </span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  label,
  icon,
  external = false,
}: {
  label: string;
  icon: "scripts" | "settings" | "external";
  external?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-field"
    >
      <span className="flex-none text-brink">
        {icon === "scripts" ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
            <path d="M4 6h16M4 11h16M4 16h10" />
          </svg>
        ) : icon === "settings" ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square">
            <path d="M14 4h6v6M20 4l-9 9M9 5H5v14h14v-4" />
          </svg>
        )}
      </span>
      <span className="flex-1 font-mono text-[10px] font-bold uppercase tracking-[0.11em] text-brink">
        {label}
      </span>
      {external ? (
        <span className="flex-none font-sans text-[12px] font-black text-quill">↗</span>
      ) : null}
    </button>
  );
}

export default UserMenu;

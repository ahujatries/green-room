"use client";

import { useEffect, useRef, useState } from "react";

import { signOut } from "@/app/actions/auth";

export type UserMenuProps = {
  /** The signed-in user's email, if any. */
  email?: string | null;
  /** Optional avatar URL (e.g. from an OAuth provider). */
  avatarUrl?: string | null;
};

/**
 * Compact signed-in-user control for the app header.
 *
 * Shows an avatar initial (or photo) that opens a small popover with the
 * email and a sign-out button wired to the `signOut` server action.
 * Styled to the dressing-room aesthetic — bonelit text, faint borders,
 * paper-on-void surfaces.
 */
export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initial = (email?.trim()?.[0] ?? "?").toUpperCase();

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={email ? `Account: ${email}` : "Account"}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-bonelit/15 bg-stage font-mono text-[12px] font-bold uppercase tracking-wide text-springpale transition-colors hover:border-bonelit/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-spring/40"
      >
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
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[208px] overflow-hidden rounded-[18px] border border-bonelit/15 bg-paper shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)]"
        >
          <div className="border-b border-line/80 px-4 pb-[11px] pt-[13px]">
            <p className="font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-canopy">
              Signed in
            </p>
            <p
              className="mt-[6px] truncate text-[12.5px] leading-tight text-ink"
              title={email ?? undefined}
            >
              {email ?? "Your account"}
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-[11px] text-left text-[12.5px] font-medium text-flame transition-colors hover:bg-line/60 focus:bg-line/60 focus:outline-none"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;

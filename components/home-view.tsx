"use client";

import { useEffect, useRef, useState } from "react";

import type { Character } from "@/lib/characters";
import type { ScriptListItem } from "@/lib/data/scripts";
import { Chat, Phone, Video } from "./icons";
import { ArqoCta } from "./arqo-cta";

export type Mode = "chat" | "call" | "video";

// A short, in-aesthetic meta line for a real script: page count + cast size +
// when it was last touched. Mirrors the demo's "12 pp · 2 characters · …".
function scriptMeta(script: ScriptListItem | undefined, castCount: number): string {
  if (!script) return "";
  const bits: string[] = [];
  if (script.pageCount != null) bits.push(`${script.pageCount} pp`);
  bits.push(`${castCount} ${castCount === 1 ? "character" : "characters"}`);
  if (script.format) bits.push(script.format);
  return bits.join(" · ");
}

export function HomeView({
  script,
  scripts,
  onSelectScript,
  switching,
  characters,
  onEnter,
}: {
  /** The script currently open in the room. */
  script: ScriptListItem | undefined;
  /** Every script the writer owns — fuels the picker. */
  scripts: ScriptListItem[];
  /** Switch into another script (loads its cast server-side). */
  onSelectScript: (id: string) => void;
  /** True while a script switch is loading its cast. */
  switching: boolean;
  /** The open script's cast, mapped into the app Character shape. */
  characters: Character[];
  onEnter: (id: string, mode: Mode) => void;
}) {
  const logline =
    script?.logline ?? script?.synopsis ?? "No logline written yet.";
  const meta = scriptMeta(script, characters.length);

  return (
    <div className="gr-scroll h-full overflow-y-auto px-[18px] pb-10 pt-[22px]">
      {/* The work */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
          The work · your script
        </p>
        {scripts.length > 1 ? (
          <ScriptPicker
            scripts={scripts}
            currentId={script?.id}
            onSelect={onSelectScript}
            disabled={switching}
          />
        ) : null}
      </div>

      <h1 className="mt-3 font-script text-[33px] font-bold leading-[1.05] tracking-tight text-bonelit">
        {script?.title ?? "Untitled"}
      </h1>
      {meta ? (
        <p className="mb-3 mt-[11px] font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-mist">
          {meta}
        </p>
      ) : null}
      <p className="m-0 text-[15px] leading-[1.6] text-fog">{logline}</p>

      {/* The cast */}
      <div className="mb-4 mt-[30px] flex items-center gap-[11px]">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
          The cast
        </span>
        <span className="h-px flex-1 bg-bonelit/15" />
        <span className="text-[10.5px] text-mist2">
          {switching ? "loading…" : "pick how you meet them"}
        </span>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper/[0.04] px-4 py-[22px] text-center">
          <p className="font-script text-[17px] font-bold leading-[1.3] text-bonelit">
            No one&rsquo;s been cast yet.
          </p>
          <p className="mt-2 text-[13px] leading-[1.6] text-fog">
            This script has no characters on the page yet. Write a few in Arqo
            and they&rsquo;ll be waiting here when you come back.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[13px]">
          {characters.map((c, i) => (
            <article
              key={c.id}
              className="rise flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)]"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Banner — casting photo slot; falls back to a big initial. */}
              <div className="relative h-[180px] bg-stage">
                <span className="absolute inset-0 flex items-center justify-center font-script text-[66px] font-bold text-canopy">
                  {c.initial}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(8,13,8,0.94)] via-[rgba(8,13,8,0.5)] to-transparent px-4 pb-[13px] pt-[34px]">
                  <div className="font-script text-[22px] font-bold leading-none text-[#f3eee3]">
                    {c.name}
                  </div>
                  <div className="mt-[7px] font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-springpale">
                    {c.roleShort}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-[13px] px-4 pb-4 pt-[15px]">
                <p className="text-[13px] leading-[1.55] text-ink-soft">
                  {c.blurb}
                </p>
                <div className="flex gap-2">
                  <CastButton label="Chat" onClick={() => onEnter(c.id, "chat")}>
                    <Chat className="text-canopy" />
                  </CastButton>
                  <CastButton label="Call" onClick={() => onEnter(c.id, "call")}>
                    <Phone className="text-canopy" />
                  </CastButton>
                  <CastButton label="Video" onClick={() => onEnter(c.id, "video")}>
                    <Video className="text-canopy" />
                  </CastButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {characters.length > 0 ? (
        <div className="mt-7">
          <ArqoCta variant="panel" />
        </div>
      ) : null}

      <p className="mt-[22px] border-t border-bonelit/15 px-0.5 pt-[14px] text-[11.5px] leading-[1.6] text-mist2">
        They only know what the page knows. Ask past it and they&rsquo;ll tell
        you it&rsquo;s still yours to decide.
      </p>
    </div>
  );
}

// A small dropdown to move between the writer's scripts, styled to the room.
function ScriptPicker({
  scripts,
  currentId,
  onSelect,
  disabled,
}: {
  scripts: ScriptListItem[];
  currentId: string | undefined;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    <div ref={rootRef} className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-bonelit/20 bg-bonelit/5 px-[11px] py-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-fog transition-colors hover:border-spring disabled:opacity-40"
      >
        switch script
        <span className="text-[8px] text-springpale">▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 max-h-[260px] w-[230px] overflow-y-auto rounded-[16px] border border-bonelit/15 bg-paper shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)]"
        >
          {scripts.map((s) => {
            const active = s.id === currentId;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (!active) onSelect(s.id);
                }}
                className={`block w-full border-b border-line/70 px-3.5 py-2.5 text-left text-[12.5px] leading-tight transition-colors last:border-b-0 hover:bg-line/60 ${
                  active ? "font-bold text-canopy" : "text-ink"
                }`}
              >
                <span className="block truncate">{s.title}</span>
                {active ? (
                  <span className="mt-0.5 block font-mono text-[7.5px] font-bold uppercase tracking-[0.15em] text-sage">
                    open now
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CastButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-[7px] rounded-xl border border-line bg-bone px-[6px] py-[11px] transition-colors hover:border-canopy hover:bg-[#efe9db] focus:outline-2 focus:outline-offset-2 focus:outline-spring"
    >
      {children}
      <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-ink">
        {label}
      </span>
    </button>
  );
}

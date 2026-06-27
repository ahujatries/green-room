"use client";

import type { Character } from "@/lib/characters";
import { SCRIPT } from "@/lib/characters";
import { Chat, Phone, Video } from "./icons";

export type Mode = "chat" | "call" | "video";

export function HomeView({
  characters,
  onEnter,
}: {
  characters: Character[];
  onEnter: (id: string, mode: Mode) => void;
}) {
  return (
    <div className="gr-scroll h-full overflow-y-auto px-[18px] pb-10 pt-[22px]">
      {/* The work */}
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
        The work · feature
      </p>
      <h1 className="mt-3 font-script text-[33px] font-bold leading-[1.05] tracking-tight text-bonelit">
        {SCRIPT.title}
      </h1>
      <p className="mb-3 mt-[11px] font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-mist">
        {SCRIPT.meta}
      </p>
      <p className="m-0 text-[15px] leading-[1.6] text-fog">{SCRIPT.logline}</p>

      {/* The cast */}
      <div className="mb-4 mt-[30px] flex items-center gap-[11px]">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
          The cast
        </span>
        <span className="h-px flex-1 bg-bonelit/15" />
        <span className="text-[10.5px] text-mist2">pick how you meet them</span>
      </div>

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

      <p className="mt-[22px] border-t border-bonelit/15 px-0.5 pt-[14px] text-[11.5px] leading-[1.6] text-mist2">
        They only know what the page knows. Ask past it and they&rsquo;ll tell
        you it&rsquo;s still yours to decide.
      </p>
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

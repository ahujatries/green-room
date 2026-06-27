"use client";

import { useState } from "react";
import { CHARACTERS, SCRIPT, fileFraction, getCharacter } from "@/lib/characters";
import { HomeView, type Mode } from "@/components/home-view";
import { ChatView } from "@/components/chat-view";
import { CallView } from "@/components/call-view";
import { VideoView } from "@/components/video-view";
import { DossierSheet } from "@/components/dossier-sheet";
import { Back } from "@/components/icons";

type View = "home" | "chat" | "call" | "video";

const MODE_LABEL: Record<Exclude<View, "home">, string> = {
  chat: "Chat",
  call: "Call",
  video: "Video Call",
};

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [charId, setCharId] = useState<string>(CHARACTERS[0].id);
  const [dossier, setDossier] = useState(false);

  const character = getCharacter(charId)!;
  const isHome = view === "home";
  const fraction = fileFraction(character);

  function enter(id: string, mode: Mode) {
    setCharId(id);
    setView(mode);
    setDossier(false);
  }
  function goHome() {
    setView("home");
    setDossier(false);
  }

  return (
    <main className="min-h-dvh w-full bg-void">
      <div className="shell-bg grain relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden font-sans text-bonelit sm:my-4 sm:h-[860px] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:border sm:border-bonelit/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* spiral watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/arqo-spiral.svg"
          alt=""
          className="pointer-events-none absolute -bottom-[90px] -right-[70px] z-0 w-[380px] opacity-[0.045]"
        />

        <div className="relative z-10 flex h-full flex-col">
          {/* bulb strip */}
          <div className="flex h-[14px] flex-none items-center justify-between border-b border-black/40 bg-[rgba(6,13,8,0.5)] px-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="bulb" />
            ))}
          </div>

          {/* header */}
          {isHome ? (
            <header className="flex flex-none items-center gap-[9px] border-b border-bonelit/10 px-[18px] pb-[11px] pt-[13px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/arqo-spiral.svg"
                alt="Arqo"
                className="h-[22px] w-[22px] flex-none"
              />
              <span className="font-sans text-[18px] font-black tracking-tight text-bonelit">
                the green room
              </span>
              <div className="flex-1" />
              <span className="text-right font-mono text-[8px] font-medium uppercase leading-[1.4] tracking-[0.13em] text-mist">
                an arqo
                <br />
                experiment
              </span>
            </header>
          ) : (
            <header className="flex flex-none items-center gap-[11px] border-b border-bonelit/10 px-3.5 py-[11px]">
              <button
                onClick={goHome}
                aria-label="Back"
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-bonelit/20 bg-bonelit/5 text-fog transition-colors hover:border-spring"
              >
                <Back size={15} stroke={2.2} />
              </button>
              <div className="min-w-0">
                <div className="font-mono text-[8.5px] font-medium uppercase tracking-[0.13em] text-mist">
                  {SCRIPT.title}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="font-script text-[12.5px] font-bold text-bonelit">
                    {character.name}
                  </span>
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-springpale">
                    · {MODE_LABEL[view]}
                  </span>
                </div>
              </div>
              <div className="flex-1" />
              <button
                onClick={goHome}
                aria-label="Home"
                className="flex h-[34px] w-[34px] flex-none items-center justify-center opacity-70 transition-opacity hover:opacity-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/arqo-spiral.svg" alt="home" className="h-5 w-5" />
              </button>
            </header>
          )}

          {/* content */}
          <div className="relative min-h-0 flex-1">
            {view === "home" && (
              <HomeView characters={CHARACTERS} onEnter={enter} />
            )}
            {view === "chat" && (
              <ChatView
                key={charId}
                character={character}
                fileFraction={fraction}
                onOpenDossier={() => setDossier(true)}
              />
            )}
            {view === "call" && (
              <CallView key={charId} character={character} onExit={goHome} />
            )}
            {view === "video" && (
              <VideoView key={charId} character={character} onExit={goHome} />
            )}
          </div>
        </div>

        {dossier && (
          <DossierSheet
            character={character}
            fileFraction={fraction}
            onClose={() => setDossier(false)}
          />
        )}
      </div>
    </main>
  );
}

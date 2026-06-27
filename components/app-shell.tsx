"use client";

import { useState, useTransition } from "react";

import type { Character } from "@/lib/characters";
import { fileFraction, getCharacter } from "@/lib/characters";
import type { ScriptListItem } from "@/lib/data/scripts";
import { getCharacters } from "@/app/actions/data";
import { HomeView, type Mode } from "@/components/home-view";
import { ChatView } from "@/components/chat-view";
import { CallView } from "@/components/call-view";
import { VideoView } from "@/components/video-view";
import { DossierSheet } from "@/components/dossier-sheet";
import { UserMenu } from "@/components/user-menu";
import { Back } from "@/components/icons";

type View = "home" | "chat" | "call" | "video";

const MODE_LABEL: Record<Exclude<View, "home">, string> = {
  chat: "Chat",
  call: "Call",
  video: "Video Call",
};

/** Find a character within a list by id (the live cast, not the demo). */
function findCharacter(cast: Character[], id: string | null): Character | undefined {
  if (!id) return undefined;
  return cast.find((c) => c.id === id) ?? getCharacter(id);
}

export function AppShell({
  user,
  scripts,
  initialScriptId,
  initialCharacters,
}: {
  user: { id: string; email: string | null };
  scripts: ScriptListItem[];
  initialScriptId: string;
  initialCharacters: Character[];
}) {
  // Which of the writer's scripts we're inside, and that script's mapped cast.
  const [scriptId, setScriptId] = useState<string>(initialScriptId);
  const [cast, setCast] = useState<Character[]>(initialCharacters);

  // View state (carried over verbatim from the old client page).
  const [view, setView] = useState<View>("home");
  const [charId, setCharId] = useState<string | null>(
    initialCharacters[0]?.id ?? null,
  );
  const [dossier, setDossier] = useState(false);
  const [switching, startSwitch] = useTransition();

  const script = scripts.find((s) => s.id === scriptId) ?? scripts[0];
  const character = findCharacter(cast, charId);
  const isHome = view === "home";
  const fraction = character ? fileFraction(character) : "0/0";

  function enter(id: string, mode: Mode) {
    setCharId(id);
    setView(mode);
    setDossier(false);
  }
  function goHome() {
    setView("home");
    setDossier(false);
  }

  // Switch into a different script: load its cast via the server action, then
  // reset to that script's home with its first character selected.
  function selectScript(id: string) {
    if (id === scriptId || switching) return;
    startSwitch(async () => {
      const next = await getCharacters(id);
      setScriptId(id);
      setCast(next);
      setCharId(next[0]?.id ?? null);
      setView("home");
      setDossier(false);
    });
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
              <UserMenu email={user.email} />
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
                <div className="truncate font-mono text-[8.5px] font-medium uppercase tracking-[0.13em] text-mist">
                  {script?.title ?? "Untitled"}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="font-script text-[12.5px] font-bold text-bonelit">
                    {character?.name ?? "—"}
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
              <HomeView
                script={script}
                scripts={scripts}
                onSelectScript={selectScript}
                switching={switching}
                characters={cast}
                onEnter={enter}
              />
            )}
            {view === "chat" && character && (
              <ChatView
                key={`${scriptId}:${character.id}`}
                scriptId={scriptId}
                character={character}
                fileFraction={fraction}
                onOpenDossier={() => setDossier(true)}
              />
            )}
            {view === "call" && character && (
              <CallView
                key={`${scriptId}:${character.id}`}
                character={character}
                onExit={goHome}
              />
            )}
            {view === "video" && character && (
              <VideoView
                key={`${scriptId}:${character.id}`}
                character={character}
                onExit={goHome}
              />
            )}
          </div>
        </div>

        {dossier && character && (
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

export default AppShell;

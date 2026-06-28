"use client";

// The client root of The Green Room (no auth, no DB).
//
// It owns the one piece of app state: the current "room" — a pasted script plus
// its derived cast — persisted to localStorage so a refresh keeps you inside.
// No room yet → the add-script screen. A room → the shell (home / chat / call /
// video), with a "new script" affordance to swap the page out.

import { useEffect, useState } from "react";

import type { Character, Room, WorkScript } from "@/lib/characters";
import { fileFraction } from "@/lib/characters";
import type { ScriptListItem } from "@/lib/data/scripts";
import { AddScript } from "@/components/add-script";
import { HomeView, type Mode } from "@/components/home-view";
import { ChatView } from "@/components/chat-view";
import { CallView } from "@/components/call-view";
import { VideoView } from "@/components/video-view";
import { DossierSheet } from "@/components/dossier-sheet";
import { Back } from "@/components/icons";

const STORAGE_KEY = "gr:room:v1";

export function GreenRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [ready, setReady] = useState(false);

  // Load any saved room once, on the client, to avoid a hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Room;
        if (parsed?.script?.text && Array.isArray(parsed.cast) && parsed.cast.length) {
          setRoom(parsed);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  function open(next: Room) {
    setRoom(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full / disabled — room still works for this session */
    }
  }

  function clear() {
    setRoom(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // Avoid a flash of the wrong screen before localStorage is read.
  if (!ready) {
    return <main className="min-h-dvh w-full bg-void" />;
  }

  if (!room) {
    return <AddScript onReady={open} />;
  }

  return <RoomShell room={room} onNewScript={clear} />;
}

// One page count estimate so the home meta line reads like the demo's "12 pp".
function estimatePages(text: string): number {
  const lines = text.split(/\r?\n/).length;
  return Math.max(1, Math.round(lines / 55));
}

type View = "home" | "chat" | "call" | "video";

const MODE_LABEL: Record<Exclude<View, "home">, string> = {
  chat: "Chat",
  call: "Call",
  video: "Video Call",
};

function RoomShell({
  room,
  onNewScript,
}: {
  room: Room;
  onNewScript: () => void;
}) {
  const { script, cast } = room;

  const [view, setView] = useState<View>("home");
  const [charId, setCharId] = useState<string | null>(cast[0]?.id ?? null);
  const [dossier, setDossier] = useState(false);

  const character = cast.find((c) => c.id === charId);
  const isHome = view === "home";
  const fraction = character ? fileFraction(character) : "0/0";

  // HomeView is built for the Arqo-script list shape; give it a one-item list
  // synthesized from the pasted script so the cast cards render unchanged.
  const listItem: ScriptListItem = {
    id: "work",
    title: script.title,
    logline: script.logline || null,
    synopsis: null,
    format: script.format || null,
    pageCount: estimatePages(script.text),
    updatedAt: null,
  };

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
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-springpale">
                by Arqo
              </span>
              <div className="flex-1" />
              <button
                onClick={onNewScript}
                className="rounded-full border border-bonelit/20 bg-bonelit/5 px-[12px] py-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-fog transition-colors hover:border-spring hover:text-bonelit"
              >
                new script
              </button>
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
                  {script.title || "Untitled"}
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
                script={listItem}
                scripts={[listItem]}
                onSelectScript={() => {}}
                switching={false}
                characters={cast}
                onEnter={enter}
              />
            )}
            {view === "chat" && character && (
              <ChatView
                key={character.id}
                script={script}
                character={character}
                fileFraction={fraction}
                onOpenDossier={() => setDossier(true)}
              />
            )}
            {view === "call" && character && (
              <CallView
                key={character.id}
                character={character}
                script={script}
                onExit={goHome}
              />
            )}
            {view === "video" && character && (
              <VideoView
                key={character.id}
                character={character}
                script={script}
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

export default GreenRoom;

// Re-export for callers that want the room type at the component boundary.
export type { Character, WorkScript };

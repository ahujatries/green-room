"use client";

// The client root of The Green Room — call-sheet brutalist flow.
//
// A small screen state machine inside one phone-shaped "field":
//   entry → consent → library → detail → chat / call / video
// The library is the curated catalog (lib/catalog.ts); a writer can also paste
// their own script (AddScript), which becomes a "custom" room handled exactly
// like a catalog entry. No auth, no DB — the room is passed inline to the
// chat/voice routes, and a pasted room is remembered in localStorage.

import { useState } from "react";

import type { Character, Room } from "@/lib/characters";
import { fileFraction } from "@/lib/characters";
import { FEATURED, WORKS, getWork, type CatalogEntry } from "@/lib/catalog";
import { AddScript } from "@/components/add-script";
import { EntryView } from "@/components/entry-view";
import { ConsentView } from "@/components/consent-view";
import { LibraryView } from "@/components/library-view";
import { DetailView } from "@/components/detail-view";
import { ChatView } from "@/components/chat-view";
import { CallView } from "@/components/call-view";
import { VideoView } from "@/components/video-view";
import { DossierSheet } from "@/components/dossier-sheet";

export type Screen =
  | "entry"
  | "consent"
  | "library"
  | "detail"
  | "chat"
  | "call"
  | "video";
export type Account = "none" | "free" | "arqo";
export type Mode = "chat" | "call" | "video";

const STORAGE_KEY = "gr:room:v1";
const CUSTOM = "custom";

// One nav frame, snapshotted onto a back-stack so the brutalist back button
// retraces the exact path (library → detail → chat → back → back …).
type Frame = { screen: Screen; workId: string | null; charId: string | null };

export function GreenRoom() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [account, setAccount] = useState<Account>("none");
  const [workId, setWorkId] = useState<string | null>(null);
  const [charId, setCharId] = useState<string | null>(null);
  const [customRoom, setCustomRoom] = useState<Room | null>(null);
  const [dossier, setDossier] = useState(false);
  const [adding, setAdding] = useState(false);
  const [, setHistory] = useState<Frame[]>([]);

  // The active catalog entry — a real catalog work, or a synthesized entry that
  // wraps a pasted script so every downstream screen stays catalog-shaped.
  const entry: CatalogEntry | null =
    workId === CUSTOM && customRoom
      ? {
          id: CUSTOM,
          eyebrow: "Your script",
          meta: customRoom.script.format || "your script",
          script: customRoom.script,
          cast: customRoom.cast,
        }
      : workId
        ? (getWork(workId) ?? null)
        : null;

  const character: Character | undefined = entry?.cast.find(
    (c) => c.id === charId,
  );
  const fraction = character ? fileFraction(character) : "0/0";

  function nav(next: Screen, patch: Partial<Frame> = {}) {
    setHistory((h) => [...h, { screen, workId, charId }]);
    if ("workId" in patch) setWorkId(patch.workId ?? null);
    if ("charId" in patch) setCharId(patch.charId ?? null);
    setDossier(false);
    setScreen(next);
  }

  function back() {
    setDossier(false);
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (!prev) {
        setScreen("entry");
        return h;
      }
      setScreen(prev.screen);
      setWorkId(prev.workId);
      setCharId(prev.charId);
      return h.slice(0, -1);
    });
  }

  function openWork(id: string) {
    nav("detail", { workId: id, charId: null });
  }
  function enter(id: string, mode: Mode) {
    nav(mode, { charId: id });
  }

  // Pasted-script path: AddScript overlay → custom room → its detail screen.
  function onReadyCustom(room: Room) {
    setCustomRoom(room);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    } catch {
      /* storage full / disabled — room still works this session */
    }
    setAdding(false);
    nav("detail", { workId: CUSTOM, charId: null });
  }

  if (adding) {
    return <AddScript onReady={onReadyCustom} />;
  }

  const showBrand =
    screen === "entry" || screen === "consent" || screen === "library";
  const showBack = screen === "detail" || screen === "chat";
  const bare = screen === "call" || screen === "video"; // full-bleed, own chrome
  const backLabel = account === "none" ? "The Green Room" : "The Library";

  const acctMap: Record<
    Account,
    { label: string; name: string; initial: string }
  > = {
    none: { label: "Guest", name: "no account", initial: "·" },
    free: { label: "Free account", name: "reader", initial: "+" },
    arqo: { label: "Signed in", name: "Isabella", initial: "I" },
  };
  const acct = acctMap[account];

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-forest p-0 font-sans sm:p-6">
      <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-field text-brink sm:h-[860px] sm:max-h-[calc(100dvh-3rem)] sm:border-2 sm:border-brink sm:shadow-[10px_10px_0_0_var(--color-forestdeep)]">
        {/* clap-stripe cap */}
        <div className="clap h-[10px] flex-none border-b-2 border-brink" />

        {/* ── Brand header (entry / consent / library) ─────────────────── */}
        {showBrand && (
          <header className="flex flex-none items-center gap-[9px] border-b-2 border-brink bg-headerdeep px-4 py-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arqo-spiral.svg" alt="Arqo" className="h-8 w-8 flex-none" />
            <span className="font-sans text-[16px] font-black uppercase leading-none tracking-[-0.01em] text-callbone">
              The <span className="text-spring">Green</span> Room
            </span>
            <span className="flex-1" />
            {screen === "library" ? (
              <span className="flex items-center gap-2">
                <span className="text-right">
                  <span className="block font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-spring">
                    {acct.label}
                  </span>
                  <span className="block font-mono text-[8px] text-field">
                    {acct.name}
                  </span>
                </span>
                <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border-2 border-brink bg-spring font-script text-[14px] font-bold text-brink">
                  {acct.initial}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-spring">
                  By
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/arqo-spiral.svg" alt="" className="h-[21px] w-[21px]" />
                <span className="font-sans text-[19px] font-black tracking-[-0.04em] text-callbone">
                  arqo
                </span>
              </span>
            )}
          </header>
        )}

        {/* ── Back header (detail / chat) ──────────────────────────────── */}
        {showBack && (
          <header className="flex flex-none items-center gap-[11px] border-b-2 border-brink bg-header px-3.5 py-[11px]">
            <button
              onClick={back}
              aria-label="Back"
              className="flex h-8 w-8 flex-none items-center justify-center border-2 border-brink bg-bonepaper"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A2418"
                strokeWidth="2.4"
                strokeLinecap="square"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            {screen === "detail" ? (
              <>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-field">
                  {backLabel}
                </span>
                <span className="flex-1" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/arqo-spiral.svg" alt="" className="h-5 w-5" />
              </>
            ) : (
              <>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[8px] font-medium uppercase tracking-[0.13em] text-springdim">
                    {entry?.script.title}
                  </span>
                  <span className="mt-0.5 block">
                    <span className="font-script text-[13px] font-bold text-callbone">
                      {character?.name}
                    </span>{" "}
                    <span className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-spring">
                      · Chat
                    </span>
                  </span>
                </span>
                <span className="flex-1" />
                <span className="border-2 border-spring px-2 py-[5px] font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-field">
                  File {fraction}
                </span>
              </>
            )}
          </header>
        )}

        {/* ── Screen body ──────────────────────────────────────────────── */}
        <div
          className={
            bare
              ? "relative flex min-h-0 flex-1 flex-col"
              : "relative min-h-0 flex-1"
          }
        >
          {screen === "entry" && (
            <EntryView
              featured={FEATURED}
              more={WORKS.filter((w) => w.id !== FEATURED.id)}
              onMeetCast={() => openWork(FEATURED.id)}
              onOpenWork={openWork}
              onConnect={() => nav("consent")}
            />
          )}
          {screen === "consent" && (
            <ConsentView
              onCreateFree={() => {
                setAccount("free");
                nav("library");
              }}
              onAuthorize={() => {
                setAccount("arqo");
                nav("library");
              }}
              onBack={back}
            />
          )}
          {screen === "library" && (
            <LibraryView
              featured={FEATURED}
              works={WORKS.filter((w) => w.id !== FEATURED.id)}
              account={account}
              onOpen={openWork}
              onPasteOwn={() => setAdding(true)}
            />
          )}
          {screen === "detail" && entry && (
            <DetailView entry={entry} onEnter={enter} />
          )}
          {screen === "chat" && character && entry && (
            <ChatView
              key={character.id}
              script={entry.script}
              character={character}
              fileFraction={fraction}
              onOpenDossier={() => setDossier(true)}
            />
          )}
          {screen === "call" && character && entry && (
            <CallView
              key={character.id}
              character={character}
              script={entry.script}
              onExit={back}
            />
          )}
          {screen === "video" && character && entry && (
            <VideoView
              key={character.id}
              character={character}
              script={entry.script}
              onExit={back}
            />
          )}
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

export type { Character };

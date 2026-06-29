"use client";

// The client root of The Green Room — call-sheet brutalist flow.
//
// A small screen state machine inside one phone-shaped "field":
//   entry → signin → library → detail → chat / call / video
// The library is the curated catalog (lib/catalog.ts); a writer can also paste
// their own script (AddScript) or — once signed in with their Arqo account —
// open one of their REAL Arqo scripts, loaded on demand into the same room
// shape. Catalog rooms, pasted rooms and real Arqo rooms are all handled
// identically downstream; the chat/voice routes ground on `room.script.text`.

import { useState } from "react";

import type { Character, Room } from "@/lib/characters";
import { fileFraction } from "@/lib/characters";
import { FEATURED, WORKS, getWork, type CatalogEntry } from "@/lib/catalog";
import type { ScriptListItem } from "@/lib/data/scripts";
import { loadMyRoom } from "@/app/actions/data";
import { signOut } from "@/app/actions/auth";
import { AddScript } from "@/components/add-script";
import { EntryView } from "@/components/entry-view";
import { SignInView } from "@/components/sign-in-view";
import { LibraryView } from "@/components/library-view";
import { DetailView } from "@/components/detail-view";
import { ChatView } from "@/components/chat-view";
import { CallView } from "@/components/call-view";
import { VideoView } from "@/components/video-view";
import { DossierSheet } from "@/components/dossier-sheet";

export type Screen =
  | "entry"
  | "signin"
  | "library"
  | "detail"
  | "chat"
  | "call"
  | "video";
export type Account = "none" | "arqo";
export type Mode = "chat" | "call" | "video";

/** The signed-in writer, as the client needs it (the server maps it from the
 *  Supabase session in app/page.tsx). Null when nobody's signed in. */
export type GrUser = {
  id: string;
  email: string | null;
  name: string;
  initial: string;
} | null;

const STORAGE_KEY = "gr:room:v1";
const CUSTOM = "custom";

// One nav frame, snapshotted onto a back-stack so the brutalist back button
// retraces the exact path (library → detail → chat → back → back …).
type Frame = { screen: Screen; workId: string | null; charId: string | null };

export function GreenRoom({
  initialUser = null,
  initialScripts = [],
}: {
  initialUser?: GrUser;
  initialScripts?: ScriptListItem[];
}) {
  const [screen, setScreen] = useState<Screen>("entry");
  const [account] = useState<Account>(initialUser ? "arqo" : "none");
  const [workId, setWorkId] = useState<string | null>(null);
  const [charId, setCharId] = useState<string | null>(null);
  const [customRoom, setCustomRoom] = useState<Room | null>(null);
  // The writer's real Arqo scripts, and a cache of any we've fully loaded into
  // a room (page text + cast) so re-opening one is instant.
  const [myScripts] = useState<ScriptListItem[]>(initialScripts);
  const [realRooms, setRealRooms] = useState<Record<string, Room>>({});
  const [busy, setBusy] = useState(false);
  const [dossier, setDossier] = useState(false);
  const [adding, setAdding] = useState(false);
  const [, setHistory] = useState<Frame[]>([]);

  // The active catalog entry — a pasted room, one of the writer's real Arqo
  // scripts (loaded into `realRooms`), or a curated catalog work. Every branch
  // resolves to the same catalog-shaped entry so downstream screens are blind
  // to where the room came from.
  const entry: CatalogEntry | null =
    workId === CUSTOM && customRoom
      ? {
          id: CUSTOM,
          eyebrow: "Your script",
          meta: customRoom.script.format || "your script",
          script: customRoom.script,
          cast: customRoom.cast,
        }
      : workId && realRooms[workId]
        ? {
            id: workId,
            eyebrow: "Your script",
            meta: realRooms[workId].script.format || "your script",
            script: realRooms[workId].script,
            cast: realRooms[workId].cast,
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

  // Open one of the writer's REAL Arqo scripts: load its room (page text + cast)
  // through the RLS-scoped server action the first time, cache it, then show its
  // detail screen exactly like a catalog room.
  async function openMyScript(scriptId: string) {
    if (realRooms[scriptId]) {
      nav("detail", { workId: scriptId, charId: null });
      return;
    }
    setBusy(true);
    try {
      const room = await loadMyRoom(scriptId);
      if (room) {
        setRealRooms((m) => ({ ...m, [scriptId]: room }));
        nav("detail", { workId: scriptId, charId: null });
      }
    } finally {
      setBusy(false);
    }
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
    screen === "entry" || screen === "signin" || screen === "library";
  const showBack = screen === "detail" || screen === "chat";
  const bare = screen === "call" || screen === "video"; // full-bleed, own chrome
  const backLabel = account === "none" ? "The Green Room" : "The Library";

  const acct =
    account === "arqo" && initialUser
      ? {
          label: "Signed in",
          name: initialUser.name,
          initial: initialUser.initial,
        }
      : { label: "Guest", name: "no account", initial: "·" };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-forest p-0 font-sans sm:p-6">
      <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-field text-brink sm:h-[860px] sm:max-h-[calc(100dvh-3rem)] sm:border-2 sm:border-brink sm:shadow-[10px_10px_0_0_var(--color-forestdeep)]">
        {/* clap-stripe cap */}
        <div className="clap h-[10px] flex-none border-b-2 border-brink" />

        {/* ── Brand header (entry / signin / library) ──────────────────── */}
        {showBrand && (
          <header className="flex flex-none items-center gap-[9px] border-b-2 border-brink bg-headerdeep px-4 py-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arqo-spiral.svg" alt="Arqo" className="h-8 w-8 flex-none" />
            <span className="font-sans text-[16px] font-black uppercase leading-none tracking-[-0.01em] text-callbone">
              The <span className="text-spring">Green</span> Room
            </span>
            <span className="flex-1" />
            {screen === "library" && account === "arqo" ? (
              // Avatar doubles as the sign-out control (server action).
              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign out"
                  className="flex items-center gap-2"
                >
                  <span className="text-right">
                    <span className="block font-mono text-[7.5px] font-bold uppercase tracking-[0.1em] text-spring">
                      {acct.label}
                    </span>
                    <span className="block max-w-[92px] truncate font-mono text-[8px] text-field">
                      {acct.name}
                    </span>
                  </span>
                  <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border-2 border-brink bg-spring font-script text-[14px] font-bold text-brink">
                    {acct.initial}
                  </span>
                </button>
              </form>
            ) : screen === "library" ? (
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
              onConnect={() => nav("signin")}
            />
          )}
          {screen === "signin" && <SignInView onBack={back} />}
          {screen === "library" && (
            <LibraryView
              featured={FEATURED}
              works={WORKS.filter((w) => w.id !== FEATURED.id)}
              myScripts={myScripts}
              account={account}
              onOpen={openWork}
              onOpenMine={openMyScript}
              onSignIn={() => nav("signin")}
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

          {/* Loading veil while a real Arqo room is fetched. */}
          {busy && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-field/70 backdrop-blur-[1px]">
              <span className="border-2 border-brink bg-bonepaper px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-brink hard-sm">
                Opening your script…
              </span>
            </div>
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

"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { Character, WorkScript } from "@/lib/characters";
import { ArrowRight, Restart, Stop } from "./icons";
import { shareMoment, type ShareResult } from "@/lib/share";

function textOf(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

// A small "share this line" affordance under a character's reply. Sharing posts
// a /s?... link (with the writer's referral code) → the viral loop back to Arqo.
function ShareLine({
  name,
  role,
  line,
  initial,
}: {
  name: string;
  role: string;
  line: string;
  initial: string;
}) {
  const [result, setResult] = useState<ShareResult | "sharing" | null>(null);

  async function onShare() {
    setResult("sharing");
    const r = await shareMoment({ name, role, line, initial });
    setResult(r);
    if (r !== "failed") setTimeout(() => setResult(null), 2000);
  }

  const label =
    result === "copied"
      ? "link copied ✓"
      : result === "shared"
        ? "shared ✓"
        : result === "failed"
          ? "try again"
          : result === "sharing"
            ? "…"
            : "share this line";

  return (
    <button
      onClick={onShare}
      disabled={result === "sharing"}
      className="flex items-center gap-1.5 pl-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-quill transition-colors hover:text-canopytext disabled:opacity-60"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {label}
    </button>
  );
}

export function ChatView({
  script,
  character,
  fileFraction,
  onOpenDossier,
}: {
  script: WorkScript;
  character: Character;
  fileFraction: string;
  onOpenDossier: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // No auth, no DB: the client sends the full grounding (character + the
      // pasted script) inline; the server just builds the system prompt.
      body: { character, script },
    }),
  });

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-field">
      {/* Live bar — call-sheet status strip */}
      <div className="flex flex-none items-center gap-2 border-b-2 border-brink bg-bonepaper px-3.5 py-2">
        <span className="h-[7px] w-[7px] flex-none rounded-full border border-brink bg-spring" />
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-quill">
          Chat · live
        </span>
        <div className="flex-1" />
        <button
          onClick={onOpenDossier}
          className="border-2 border-brink bg-field px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-brink transition-all hover:bg-spring"
        >
          File {fileFraction}
        </button>
        <button
          onClick={() => setMessages([])}
          aria-label="Restart"
          className="flex h-[30px] w-[30px] items-center justify-center border-2 border-brink bg-bonepaper text-brink transition-all hover:bg-spring"
        >
          <Restart size={14} stroke={2} />
        </button>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="gr-scroll flex flex-1 flex-col gap-[13px] overflow-y-auto px-3.5 pb-2 pt-4"
      >
        {empty && (
          <div className="flex flex-col gap-[11px] px-0.5 py-1">
            <div className="font-script text-[19px] font-bold leading-[1.3] text-brink">
              You&rsquo;re alone with {character.name}.
            </div>
            <div className="text-[13px] leading-[1.55] text-brink/80">
              They only know what the page knows. Start where the scene leaves
              off — or push past it, and watch what they refuse to invent.
            </div>
            <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-canopytext">
              TRY
            </div>
            <div className="flex flex-col items-stretch gap-[9px]">
              {character.openers.map((op) => (
                <button
                  key={op}
                  onClick={() => send(op)}
                  className="lift border-2 border-brink bg-bonepaper px-[13px] py-2.5 text-left text-[13px] text-brink hard-sm"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isAuthor = m.role === "user";
          return (
            <div
              key={m.id}
              className={`pop flex ${isAuthor ? "justify-end" : "justify-start"}`}
            >
              {isAuthor ? (
                <div className="max-w-[80%] border-2 border-brink bg-brink px-[13px] py-2.5 text-[13.5px] leading-[1.45] text-callbone">
                  {textOf(m)}
                </div>
              ) : (
                <div className="flex max-w-[90%] flex-col items-start gap-[7px]">
                  <div className="whitespace-pre-wrap border-2 border-brink bg-bonepaper px-[14px] py-3 font-script text-[13px] leading-[1.6] text-brink hard-sm">
                    {textOf(m)}
                  </div>
                  {textOf(m).trim().length > 0 && !(busy && m.id === messages[messages.length - 1]?.id) ? (
                    <ShareLine
                      name={character.name}
                      role={character.role}
                      line={textOf(m)}
                      initial={character.initial}
                    />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="pop flex justify-start">
            <div className="flex items-center gap-1.5 border-2 border-brink bg-bonepaper px-4 py-3.5 hard-sm">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

      </div>

      {/* Composer */}
      <div className="flex flex-none items-center gap-[9px] border-t-2 border-brink bg-bonepaper px-3.5 pb-[26px] pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={`Ask ${character.name} something…`}
          className="min-w-0 flex-1 border-2 border-brink bg-field px-3.5 py-3 text-[13.5px] text-brink outline-none transition-colors placeholder:text-quill focus:bg-bonepaper"
        />
        {busy ? (
          <button
            onClick={stop}
            aria-label="Stop"
            className="flex h-[46px] w-[46px] flex-none items-center justify-center border-2 border-brink bg-bonepaper text-flamecall transition-all hover:bg-flamecall hover:text-callbone hard-sm"
          >
            <Stop size={13} />
          </button>
        ) : (
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            aria-label="Send"
            className="lift flex h-[46px] w-[46px] flex-none items-center justify-center border-2 border-brink bg-spring text-brink hard-sm disabled:opacity-30"
          >
            <ArrowRight size={19} stroke={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}

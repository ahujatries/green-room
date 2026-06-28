"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { Character, WorkScript } from "@/lib/characters";
import { ArrowRight, Restart, Stop } from "./icons";
import { ArqoCta } from "./arqo-cta";
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
      className="flex items-center gap-1.5 pl-1 font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-mist transition-colors hover:text-springpale disabled:opacity-60"
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

  // The conversion moment: once they've felt the character reply a couple of
  // times, surface the Arqo waitlist inline at the tail of the transcript.
  const assistantCount = messages.filter((m) => m.role === "assistant").length;

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Live bar */}
      <div className="flex flex-none items-center gap-[9px] border-b border-bonelit/10 bg-[rgba(6,13,8,0.35)] px-4 py-[9px]">
        <span className="h-[7px] w-[7px] flex-none rounded-full bg-spring" />
        <span className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-mist2">
          chat · live
        </span>
        <div className="flex-1" />
        <button
          onClick={onOpenDossier}
          className="rounded-full border border-bonelit/20 bg-bonelit/5 px-[11px] py-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-fog transition-colors hover:border-spring"
        >
          file {fileFraction}
        </button>
        <button
          onClick={() => setMessages([])}
          aria-label="Restart"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-bonelit/20 text-fog transition-colors hover:border-spring"
        >
          <Restart size={14} stroke={1.9} />
        </button>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="gr-scroll flex-1 overflow-y-auto px-4 pb-1.5 pt-[18px]"
      >
        {empty && (
          <div className="flex flex-col gap-[13px] px-0.5 py-3.5">
            <div className="font-script text-[21px] font-bold leading-[1.3] text-bonelit">
              You&rsquo;re alone with {character.name}.
            </div>
            <div className="text-[14px] leading-[1.6] text-fog">
              They only know what the page knows. Start where the scene leaves
              off — or push past it, and watch what they refuse to invent.
            </div>
            <div className="mt-2 font-mono text-[9px] font-bold tracking-[0.18em] text-springpale">
              TRY
            </div>
            <div className="flex flex-col items-start gap-[9px]">
              {character.openers.map((op) => (
                <button
                  key={op}
                  onClick={() => send(op)}
                  className="rounded-full border border-bonelit/20 bg-paper/5 px-[15px] py-2.5 text-left text-[13px] text-fog transition-colors hover:border-spring hover:text-bonelit"
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
              className={`mb-4 flex ${isAuthor ? "justify-end" : "justify-start"}`}
            >
              {isAuthor ? (
                <div className="max-w-[82%] rounded-2xl rounded-br-md bg-ink px-[15px] py-3 text-[14.5px] leading-[1.5] text-[#f3eee3]">
                  {textOf(m)}
                </div>
              ) : (
                <div className="flex max-w-[86%] flex-col items-start gap-1.5">
                  <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-[15px] font-script text-[14.5px] leading-[1.62] text-ink">
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
          <div className="mb-4 flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3.5">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        {assistantCount >= 2 && !busy && (
          <div className="mb-4 mt-1">
            <ArqoCta characterName={character.name} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex flex-none items-center gap-[9px] border-t border-bonelit/10 bg-[rgba(6,13,8,0.4)] px-3.5 pb-[26px] pt-3">
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
          className="min-w-0 flex-1 rounded-xl border border-bonelit/20 bg-bonelit/5 px-3.5 py-3 text-[14.5px] text-bonelit outline-none transition-colors placeholder:text-mist focus:border-spring"
        />
        {busy ? (
          <button
            onClick={stop}
            aria-label="Stop"
            className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl border border-bonelit/25 text-flame transition-colors hover:border-flame"
          >
            <Stop size={13} />
          </button>
        ) : (
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            aria-label="Send"
            className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl border border-canopy bg-canopy text-[#f3eee3] transition-colors hover:bg-[#346416] disabled:opacity-30"
          >
            <ArrowRight size={19} stroke={2} />
          </button>
        )}
      </div>
    </div>
  );
}

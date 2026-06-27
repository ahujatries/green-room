"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { Character } from "@/lib/characters";

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function ChatPanel({ character }: { character: Character }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { characterId: character.id },
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <section className="flex min-h-[60dvh] flex-col overflow-hidden rounded-2xl border border-line bg-paper md:min-h-0">
      {/* Who you're talking to */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-canopy font-mono text-[15px] font-bold text-bone">
          {character.name[0]}
        </span>
        <div className="leading-tight">
          <p className="font-mono text-[15px] font-bold text-ink">
            {character.name}
          </p>
          <p className="text-[12px] uppercase tracking-wide text-sage">
            {character.role}
          </p>
        </div>
        <span className="ml-auto text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          rehearsal room
        </span>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="scroll-thin flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {empty ? (
          <div className="flex h-full flex-col justify-center gap-5 py-6">
            <div className="max-w-sm">
              <p className="font-mono text-[15px] leading-relaxed text-ink">
                You&rsquo;re alone with {character.name}.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                Ask anything. They&rsquo;ll answer from what the page knows —
                and when you reach for what you haven&rsquo;t written yet,
                they&rsquo;ll hand the choice back to you.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Try
              </p>
              {character.openers.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-line bg-bone px-3.5 py-1.5 text-left text-[13px] text-ink-soft transition-colors hover:border-canopy hover:text-ink"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.role === "user";
            return (
              <div
                key={m.id}
                className={`rise flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                    mine
                      ? "rounded-br-md bg-ink text-bone"
                      : "rounded-bl-md border border-line bg-bone font-mono text-ink",
                  ].join(" ")}
                >
                  {textOf(m)}
                </div>
              </div>
            );
          })
        )}

        {status === "submitted" && (
          <div className="rise flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-bone px-4 py-3">
              <span className="dot h-1.5 w-1.5 rounded-full bg-sage" />
              <span className="dot h-1.5 w-1.5 rounded-full bg-sage" />
              <span className="dot h-1.5 w-1.5 rounded-full bg-sage" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-line bg-bone px-3 py-2 focus-within:border-canopy">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={`Ask ${character.name} something…`}
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-flame hover:text-flame"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 rounded-lg bg-canopy px-3.5 py-1.5 text-[13px] font-semibold text-bone transition-opacity disabled:opacity-30"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

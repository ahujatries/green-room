"use client";

// INTERIM voice controller for the Call / Video screens.
// It deliberately mirrors the contract of the real `useVoiceCall` hook being
// built on the `feat/voice-pipeline` branch (Vercel AI Gateway whisper + tts),
// so swapping it in later is a one-line import change. Until then this drives
// the screens with the already-working /api/chat endpoint + the browser's
// Web Speech APIs (SpeechSynthesis for TTS, webkitSpeechRecognition for STT).

import { useCallback, useEffect, useRef, useState } from "react";

export type CallStatus = "idle" | "listening" | "thinking" | "speaking";
export type Turn = { role: "author" | "character"; text: string };

export type VoiceCall = {
  status: CallStatus;
  caption: string;
  transcript: Turn[];
  micOn: boolean;
  toggleMic: () => void;
  start: () => void;
  end: () => void;
  sendText: (text: string) => void;
};

// Read the /api/chat SSE stream and resolve the full assistant text.
async function streamReply(
  characterId: string,
  messages: { role: "user" | "assistant"; text: string }[],
  onDelta: (full: string) => void,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      characterId,
      messages: messages.map((m, i) => ({
        id: String(i),
        role: m.role,
        parts: [{ type: "text", text: m.text }],
      })),
    }),
  });
  if (!res.body) return "";
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith("data:")) continue;
      const payload = s.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "text-delta" && typeof ev.delta === "string") {
          full += ev.delta;
          onDelta(full);
        }
      } catch {
        /* ignore keep-alive / non-JSON lines */
      }
    }
  }
  return full;
}

// Strip stage directions / asterisks so spoken captions read clean.
function speakable(text: string): string {
  return text
    .replace(/\*[^*]*\*/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useInterimCall({
  characterId,
  characterName,
}: {
  characterId: string;
  characterName: string;
}): VoiceCall {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [caption, setCaption] = useState("");
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [micOn, setMicOn] = useState(false);

  const histRef = useRef<{ role: "user" | "assistant"; text: string }[]>([]);
  const recogRef = useRef<unknown>(null);
  const busyRef = useRef(false);

  const speak = useCallback((text: string) => {
    const clean = speakable(text);
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.98;
    u.pitch = 1;
    u.onstart = () => setStatus("speaking");
    u.onend = () => setStatus("idle");
    window.speechSynthesis.speak(u);
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || busyRef.current) return;
      busyRef.current = true;
      setTranscript((x) => [...x, { role: "author", text: t }]);
      histRef.current = [...histRef.current, { role: "user", text: t }];
      setStatus("thinking");
      setCaption("");
      try {
        const full = await streamReply(characterId, histRef.current, (live) =>
          setCaption(speakable(live)),
        );
        histRef.current = [
          ...histRef.current,
          { role: "assistant", text: full },
        ];
        setTranscript((x) => [...x, { role: "character", text: full }]);
        setCaption(speakable(full));
        speak(full);
      } catch {
        setCaption("— the line dropped. try again —");
        setStatus("idle");
      } finally {
        busyRef.current = false;
      }
    },
    [characterId, speak],
  );

  // Lazily wire browser speech recognition if available (Chrome/Edge).
  const ensureRecog = useCallback(() => {
    if (recogRef.current) return recogRef.current;
    if (typeof window === "undefined") return null;
    const Ctor =
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    if (!Ctor) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new (Ctor as any)();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => setStatus("listening");
    r.onerror = () => {
      setMicOn(false);
      setStatus("idle");
    };
    r.onend = () => setMicOn(false);
    r.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      setMicOn(false);
      if (said) sendText(said);
    };
    recogRef.current = r;
    return r;
  }, [sendText]);

  const toggleMic = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = ensureRecog();
    if (!r) {
      setCaption(
        "— voice input isn't available in this browser; type a line instead —",
      );
      return;
    }
    if (micOn) {
      try {
        r.stop();
      } catch {
        /* noop */
      }
      setMicOn(false);
    } else {
      try {
        r.start();
        setMicOn(true);
      } catch {
        /* already started */
      }
    }
  }, [ensureRecog, micOn]);

  const start = useCallback(() => {
    setStatus("idle");
    setCaption("");
  }, []);

  const end = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = recogRef.current;
    if (r) {
      try {
        r.stop();
      } catch {
        /* noop */
      }
    }
    setMicOn(false);
    setStatus("idle");
  }, []);

  useEffect(() => end, [end]);

  // characterName currently only documents intent; kept for parity with the
  // real hook signature.
  void characterName;

  return {
    status,
    caption,
    transcript,
    micOn,
    toggleMic,
    start,
    end,
    sendText,
  };
}

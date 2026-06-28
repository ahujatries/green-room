"use client";

// useVoiceCall — the client-side state machine behind both Voice Call and Video
// Call modes in The Green Room.
//
// OpenAI-advanced-voice-style: once the call starts the mic stays open for the
// whole call and never mutes. You just talk; a natural pause (~1.1s) ends your
// turn, the character replies and speaks, then it's listening again. You can
// also cut in WHILE the character is speaking — sustained speech barges in,
// stops their playback, and starts your turn. The only control is End call.
//
//   start() ─▶ listening ─(you pause)─▶ thinking ─▶ speaking ─(ends)─▶ listening
//                  ▲                                    │
//                  └──────────(you barge in)───────────┘
//
// Barge-in relies on the browser's echo cancellation so the character's own
// voice (through the speakers) doesn't trip the mic — we also require sustained,
// louder input before yielding, so leakage can't false-trigger it.
//
// Browser APIs only: getUserMedia, MediaRecorder, AudioContext/AnalyserNode,
// HTMLAudioElement. `level` (0..1) is live input loudness for a reactive orb.

import { useCallback, useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import type { Character, WorkScript } from "@/lib/characters";
import { ttsHintsFor, playVaderFx, playPlain, type FxPlayback } from "@/lib/voice-fx";

function reportVoiceError(stage: string, err: unknown) {
  Sentry.captureException(err, { tags: { surface: "voice", voice_stage: stage } });
  // eslint-disable-next-line no-console
  console.error(`[useVoiceCall] ${stage} error:`, err);
}

// --- VAD tuning -----------------------------------------------------------
// Normalized RMS (0..1) above which a frame counts as speech while listening.
const SPEECH_THRESHOLD = 0.018;
// How long the input must stay quiet, after speech, before we end the turn.
const SILENCE_HANGOVER_MS = 1100;
// Ignore blips: a turn must contain at least this much detected speech.
const MIN_SPEECH_MS = 250;
// Barge-in needs a louder, more sustained signal than a normal turn so the
// character's echo-cancelled voice can't accidentally interrupt itself.
const BARGE_IN_THRESHOLD = 0.05;
const BARGE_IN_MS = 320;

export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";
export type VoiceTurn = { role: "user" | "assistant"; text: string };

export type UseVoiceCall = {
  /** Current phase of the loop. Drive your orb / labels off this. */
  status: VoiceStatus;
  /** The line currently on screen — your interim text, or the character's reply. */
  caption: string;
  /** Full ordered conversation, newest last. Render as a transcript. */
  transcript: VoiceTurn[];
  /** Live input loudness, 0..1 — for a reactive orb / waveform. */
  level: number;
  /** Begin the call: request mic permission and start listening. */
  start: () => void;
  /** End the call: stop mic + any playback, reset to idle. Releases the mic. */
  end: () => void;
  /** Feed a typed line through the reply+speech path, skipping transcription. */
  sendText: (text: string) => void;
};

export type UseVoiceCallOptions = {
  character: Character;
  script: WorkScript;
  /** Optional TTS voice override passed to /api/speech (defaults server-side). */
  voice?: string;
};

export function useVoiceCall({
  character,
  script,
  voice,
}: UseVoiceCallOptions): UseVoiceCall {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [caption, setCaption] = useState<string>("");
  const [transcript, setTranscript] = useState<VoiceTurn[]>([]);
  const [level, setLevel] = useState<number>(0);

  // Live machinery (never re-rendered).
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  // Active Web Audio processing graph (e.g. Vader), when the character uses fx.
  const fxRef = useRef<FxPlayback | null>(null);

  // Web Audio analysis.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // VAD bookkeeping.
  const speechMsRef = useRef<number>(0); // total speech detected this turn
  const silenceMsRef = useRef<number>(0); // trailing silence after speech
  const bargeMsRef = useRef<number>(0); // sustained speech while char speaks
  const lastFrameRef = useRef<number>(0); // perf.now() of previous frame
  const turnEndingRef = useRef<boolean>(false); // guard against double-stop

  // The call is live (between start() and end()). Drives auto-resume.
  const activeRef = useRef<boolean>(false);
  const statusRef = useRef<VoiceStatus>("idle");

  const transcriptRef = useRef<VoiceTurn[]>([]);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const setPhase = useCallback((s: VoiceStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // pushTurn must update the ref synchronously: respondAndSpeak() runs in the
  // same tick and posts transcriptRef.current to /api/voice-reply.
  const pushTurn = useCallback((turn: VoiceTurn) => {
    transcriptRef.current = [...transcriptRef.current, turn];
    setTranscript(transcriptRef.current);
  }, []);

  // --- teardown helpers (idempotent) ---------------------------------------
  const stopPlayback = useCallback(() => {
    if (fxRef.current) {
      fxRef.current.stop();
      fxRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const teardownAudioGraph = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // Create (or reuse) the playback/analysis AudioContext and unlock it. MUST be
  // called inside a user gesture (start()): Safari only lets audio play later if
  // the context was created/resumed during a click, and a one-sample silent tick
  // marks output as user-initiated. Returns the live context, or null if the
  // browser has no AudioContext at all.
  const ensureAudioContext = useCallback((): AudioContext | null => {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      type WindowWithWebkit = Window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx =
        window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
      audioCtxRef.current = ctx;
      try {
        const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
        const tick = ctx.createBufferSource();
        tick.buffer = silent;
        tick.connect(ctx.destination);
        tick.start(0);
      } catch {
        /* priming is best-effort */
      }
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  }, []);

  const stopStream = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Listening: (re)arm a recorder + VAD pass over the open mic stream.
  // -------------------------------------------------------------------------
  const armRecorder = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream || !mountedRef.current || !activeRef.current) return;

    chunksRef.current = [];
    speechMsRef.current = 0;
    silenceMsRef.current = 0;
    bargeMsRef.current = 0;
    turnEndingRef.current = false;

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const hadSpeech = speechMsRef.current >= MIN_SPEECH_MS;
      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      if (!hadSpeech) return; // nothing said (e.g. ended) — don't transcribe
      void transcribeAndRespond(blob);
    };
    recorder.start();
    setPhase("listening");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPhase]);

  // End the current listening turn → triggers onstop → transcription.
  const endTurn = useCallback(() => {
    if (turnEndingRef.current) return;
    turnEndingRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  // Barge-in: the user spoke over the character. Cut the playback and hand the
  // floor straight back to them (start capturing now; we lose only the ~320ms
  // of onset it took to confirm they meant it).
  const bargeIn = useCallback(() => {
    stopPlayback();
    if (activeRef.current) armRecorder();
  }, [stopPlayback, armRecorder]);

  // The continuous analysis loop — runs the whole call. Ends turns on silence
  // while listening, and detects barge-in while the character is speaking.
  const runVadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (!mountedRef.current || !analyserRef.current) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);

      const now = performance.now();
      const dt = lastFrameRef.current ? now - lastFrameRef.current : 16;
      lastFrameRef.current = now;

      const cur = statusRef.current;
      if (cur === "listening") {
        setLevel(Math.min(1, rms * 6));
        if (rms >= SPEECH_THRESHOLD) {
          speechMsRef.current += dt;
          silenceMsRef.current = 0;
        } else if (speechMsRef.current >= MIN_SPEECH_MS) {
          silenceMsRef.current += dt;
          if (silenceMsRef.current >= SILENCE_HANGOVER_MS) endTurn();
        }
      } else if (cur === "speaking") {
        // Show the user's own level so they can see they're being heard, and
        // watch for a deliberate cut-in.
        setLevel(Math.min(1, rms * 6));
        if (rms >= BARGE_IN_THRESHOLD) {
          bargeMsRef.current += dt;
          if (bargeMsRef.current >= BARGE_IN_MS) {
            bargeMsRef.current = 0;
            bargeIn();
          }
        } else {
          bargeMsRef.current = 0;
        }
      } else {
        setLevel(0);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [endTurn, bargeIn]);

  // -------------------------------------------------------------------------
  // Speak a line: synthesize it, play it (Vader fx or plain), resume listening.
  // -------------------------------------------------------------------------
  const speak = useCallback(
    async (text: string) => {
      try {
        const hints = ttsHintsFor(character.voiceFx);
        const speechRes = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice,
            ...(hints
              ? { modelId: hints.modelId, voiceSettings: hints.voiceSettings }
              : {}),
          }),
        });
        if (!speechRes.ok) throw new Error(`speech failed (${speechRes.status})`);
        if (!mountedRef.current) return;

        const resume = () => {
          if (!mountedRef.current) return;
          stopPlayback();
          if (activeRef.current) armRecorder();
          else setPhase("idle");
        };

        // All playback runs through Web Audio on the live AudioContext — the fx
        // chain for Vader, a straight buffer source for everyone else. Web Audio
        // is what actually sounds on Safari (HTMLAudio.play() this far past the
        // click is blocked by autoplay policy). HTMLAudio stays only as a
        // last-resort fallback if there's no context or the decode fails.
        const buf = await speechRes.arrayBuffer();
        if (!mountedRef.current) return;
        stopPlayback();
        setPhase("speaking");
        bargeMsRef.current = 0;

        const ctx = audioCtxRef.current;
        if (ctx) {
          if (ctx.state === "suspended") await ctx.resume().catch(() => {});
          try {
            fxRef.current = character.voiceFx
              ? await playVaderFx(ctx, buf, resume)
              : await playPlain(ctx, buf, resume);
            return;
          } catch {
            // Decode failed — fall through to HTMLAudio on the same bytes.
          }
        }

        if (!mountedRef.current) return;
        const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = resume;
        audio.onerror = resume;
        await audio.play();
      } catch (err) {
        if (!mountedRef.current) return;
        reportVoiceError("speech", err);
        if (activeRef.current) armRecorder();
        else setPhase("idle");
      }
    },
    [character, voice, stopPlayback, armRecorder, setPhase],
  );

  // -------------------------------------------------------------------------
  // Reply + speak, then auto-resume listening.
  // -------------------------------------------------------------------------
  const respondAndSpeak = useCallback(async () => {
    if (!mountedRef.current) return;
    setPhase("thinking");

    let replyText = "";
    try {
      const res = await fetch("/api/voice-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character,
          script,
          messages: transcriptRef.current.map((t) => ({
            role: t.role,
            content: t.text,
          })),
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || `voice-reply failed (${res.status})`);
      }
      replyText = data.text;
    } catch (err) {
      if (!mountedRef.current) return;
      setCaption("Something went wrong reaching the character. Still listening.");
      reportVoiceError("reply", err);
      armRecorder();
      return;
    }

    if (!mountedRef.current) return;
    pushTurn({ role: "assistant", text: replyText });
    setCaption(replyText);
    await speak(replyText);
  }, [character, script, pushTurn, speak, armRecorder, setPhase]);

  // -------------------------------------------------------------------------
  // Greeting: the character "answers" on connect — a warm hello, or, for a
  // villain, cold suspicion (who is this, how did you get this number).
  // -------------------------------------------------------------------------
  const greet = useCallback(async () => {
    if (!mountedRef.current) return;
    setPhase("thinking");
    try {
      const res = await fetch("/api/voice-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, script, greeting: true }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || `greeting failed (${res.status})`);
      }
      if (!mountedRef.current) return;
      pushTurn({ role: "assistant", text: data.text });
      setCaption(data.text);
      await speak(data.text);
    } catch (err) {
      if (!mountedRef.current) return;
      // Greeting is best-effort — if it fails, just start listening.
      reportVoiceError("greeting", err);
      if (activeRef.current) armRecorder();
      else setPhase("idle");
    }
  }, [character, script, pushTurn, speak, armRecorder, setPhase]);

  const transcribeAndRespond = useCallback(
    async (audioBlob: Blob) => {
      if (!mountedRef.current) return;
      if (audioBlob.size === 0) {
        if (activeRef.current) armRecorder();
        return;
      }
      setPhase("thinking");
      setCaption("");

      let userText = "";
      try {
        const form = new FormData();
        form.append("audio", audioBlob, "speech.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) throw new Error(data.error || `transcribe failed (${res.status})`);
        userText = (data.text ?? "").trim();
      } catch (err) {
        if (!mountedRef.current) return;
        setCaption("I couldn't catch that — go ahead, I'm listening.");
        reportVoiceError("transcribe", err);
        if (activeRef.current) armRecorder();
        return;
      }

      if (!mountedRef.current) return;
      if (!userText) {
        if (activeRef.current) armRecorder();
        return;
      }

      pushTurn({ role: "user", text: userText });
      setCaption(userText);
      await respondAndSpeak();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pushTurn, respondAndSpeak, armRecorder, setPhase],
  );

  // -------------------------------------------------------------------------
  // Open the mic + audio graph and begin the continuous loop.
  // -------------------------------------------------------------------------
  const openMicAndListen = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCaption("This browser can't access the microphone.");
      setPhase("idle");
      activeRef.current = false;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStreamRef.current = stream;

      // Reuse the context unlocked in start() (the mic await above has already
      // dropped us out of the gesture, so a context created here would never
      // unlock on Safari). ensureAudioContext also re-resumes it if suspended.
      const ctx = ensureAudioContext();
      if (!ctx) {
        setCaption("This browser can't play audio.");
        setPhase("idle");
        activeRef.current = false;
        stopStream();
        return;
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;
      lastFrameRef.current = 0;
      runVadLoop();

      setCaption("");
      // On a fresh call the character answers first — a greeting, or a villain's
      // wary "who is this." An in-progress call just resumes listening.
      if (transcriptRef.current.length === 0) void greet();
      else armRecorder();
    } catch (err) {
      setCaption(
        "Microphone access was blocked. Enable it in your browser to talk, or type a line instead.",
      );
      setPhase("idle");
      activeRef.current = false;
      stopStream();
      reportVoiceError("mic", err);
    }
  }, [runVadLoop, armRecorder, greet, stopStream, setPhase, ensureAudioContext]);

  // -------------------------------------------------------------------------
  // Public actions
  // -------------------------------------------------------------------------
  const start = useCallback(() => {
    if (statusRef.current !== "idle") return;
    activeRef.current = true;
    // Unlock audio output NOW, inside the click — before openMicAndListen's
    // getUserMedia await ends the gesture. Without this, Safari plays nothing.
    ensureAudioContext();
    void openMicAndListen();
  }, [openMicAndListen, ensureAudioContext]);

  const end = useCallback(() => {
    activeRef.current = false;
    stopStream();
    stopPlayback();
    teardownAudioGraph();
    setLevel(0);
    setPhase("idle");
    setCaption("");
  }, [stopStream, stopPlayback, teardownAudioGraph, setPhase]);

  const sendText = useCallback(
    (text: string) => {
      const line = text.trim();
      if (!line) return;
      // Don't let a typed line collide with a live capture / playback.
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        try {
          recorder.stop();
        } catch {
          /* ignore */
        }
      }
      stopPlayback();
      pushTurn({ role: "user", text: line });
      setCaption(line);
      void respondAndSpeak();
    },
    [pushTurn, respondAndSpeak, stopPlayback],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current = false;
      stopStream();
      stopPlayback();
      teardownAudioGraph();
    };
  }, [stopStream, stopPlayback, teardownAudioGraph]);

  return { status, caption, transcript, level, start, end, sendText };
}

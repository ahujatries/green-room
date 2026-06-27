"use client";

// useVoiceCall — the single client-side state machine behind both Voice Call and
// Video Call modes in The Green Room.
//
// It owns the whole speech loop so the UI only has to render state and wire a few
// buttons:
//
//   listening ──(stop mic)──▶ thinking ──(reply ready)──▶ speaking ──(audio ends)──▶ idle
//        ▲                                                                      │
//        └──────────────────────────(toggleMic / start again)──────────────────┘
//
// The loop, end to end:
//   1. start()      → opens the mic, begins MediaRecorder, status = "listening".
//   2. toggleMic()  → stops recording; the recorded blob is POSTed to
//                     /api/transcribe (status = "thinking").
//   3. the transcript becomes a user turn; the full turn list is POSTed to
//      /api/voice-reply → the character's spoken-length reply (caption updates).
//   4. the reply is POSTed to /api/speech → MP3 → played back (status =
//      "speaking"); when playback ends we return to "idle".
//   sendText(line) skips step 1-2 (no STT): it feeds a typed line straight into
//   step 3-4 — this powers the design's "feed them a line" transcript input.
//
// Everything is framework-clean: no global state, no external deps. The only
// browser APIs used are MediaRecorder, getUserMedia, and HTMLAudioElement.

import { useCallback, useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";

// The voice loop catches its own failures to keep the UX graceful, which means
// they never bubble to Sentry's global handler. Report them here so a broken
// STT/TTS/Gateway hop is visible, tagged by which stage of the loop failed.
function reportVoiceError(stage: string, err: unknown) {
  Sentry.captureException(err, { tags: { surface: "voice", voice_stage: stage } });
  // eslint-disable-next-line no-console
  console.error(`[useVoiceCall] ${stage} error:`, err);
}

// ---------------------------------------------------------------------------
// Public contract (this is what the UI imports / destructures).
// ---------------------------------------------------------------------------

export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

export type VoiceTurn = { role: "user" | "assistant"; text: string };

export type UseVoiceCall = {
  /** Current phase of the loop. Drive your orb / waveform / labels off this. */
  status: VoiceStatus;
  /** The line currently on screen — the user's interim text while listening,
   *  or the character's latest reply while thinking/speaking. */
  caption: string;
  /** Full ordered conversation, newest last. Render as a transcript. */
  transcript: VoiceTurn[];
  /** Whether the mic is actively capturing (true between start/toggle-on and stop). */
  micOn: boolean;
  /** Toggle mic capture. If on → stops + sends for transcription. If off → starts a new capture. */
  toggleMic: () => void;
  /** Begin a call: request mic permission and start listening. Safe to call once. */
  start: () => void;
  /** End the call: stop mic + any playback, reset to idle. Releases the mic. */
  end: () => void;
  /** Feed a typed line through the same reply+speech path, skipping transcription. */
  sendText: (text: string) => void;
};

export type UseVoiceCallOptions = {
  /** Character to talk to — must match an id in lib/characters.ts. */
  characterId: string;
  /** Optional TTS voice override passed to /api/speech (defaults server-side). */
  voice?: string;
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function useVoiceCall({
  characterId,
  voice,
}: UseVoiceCallOptions): UseVoiceCall {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [caption, setCaption] = useState<string>("");
  const [transcript, setTranscript] = useState<VoiceTurn[]>([]);
  const [micOn, setMicOn] = useState<boolean>(false);

  // Refs hold the live, non-rendered machinery so re-renders never tear it down.
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  // Mirror the transcript in a ref so async callbacks always send the latest
  // turns to /api/voice-reply without going stale on a captured closure.
  const transcriptRef = useRef<VoiceTurn[]>([]);
  // Guards against state updates after the component unmounts mid-request.
  const mountedRef = useRef<boolean>(true);

  // Keep the transcript ref in lockstep with state.
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Append a turn to both the rendered transcript and the ref snapshot.
  // The ref MUST update synchronously: respondAndSpeak() runs in the same tick
  // as the pushTurn() in sendText()/transcribe, and React runs setState
  // updaters asynchronously — so relying on the updater to fill the ref would
  // post an empty `messages` list to /api/voice-reply (a 400) on the first turn.
  const pushTurn = useCallback((turn: VoiceTurn) => {
    transcriptRef.current = [...transcriptRef.current, turn];
    setTranscript(transcriptRef.current);
  }, []);

  // --- Mic teardown helper (idempotent). -----------------------------------
  const stopStream = useCallback(() => {
    recorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // --- Audio playback teardown helper (idempotent). ------------------------
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Step 3-4: given a fresh user line, get the reply and speak it.
  // Shared by both the STT path and sendText().
  // -------------------------------------------------------------------------
  const respondAndSpeak = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus("thinking");

    // 1. Ask the character for a spoken-length reply.
    let replyText = "";
    try {
      const res = await fetch("/api/voice-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
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
      setCaption(
        "Something went wrong reaching the character. Try again in a moment.",
      );
      setStatus("idle");
      reportVoiceError("reply", err);
      return;
    }

    if (!mountedRef.current) return;
    // Show the reply immediately, even before audio is ready.
    pushTurn({ role: "assistant", text: replyText });
    setCaption(replyText);

    // 2. Synthesize + play it.
    try {
      const speechRes = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText, voice }),
      });
      if (!speechRes.ok) {
        // Reply text already shown; just skip audio gracefully.
        throw new Error(`speech failed (${speechRes.status})`);
      }
      const blob = await speechRes.blob();
      if (!mountedRef.current) return;

      stopPlayback(); // clear any prior audio first
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        if (!mountedRef.current) return;
        stopPlayback();
        setStatus("idle");
      };
      audio.onerror = () => {
        if (!mountedRef.current) return;
        stopPlayback();
        setStatus("idle");
      };

      setStatus("speaking");
      await audio.play();
    } catch (err) {
      if (!mountedRef.current) return;
      // The text reply is already on screen; degrade to idle silently-ish.
      setStatus("idle");
      reportVoiceError("speech", err);
    }
  }, [characterId, voice, pushTurn, stopPlayback]);

  // -------------------------------------------------------------------------
  // Step 2: stop recording, transcribe, then hand off to respondAndSpeak.
  // -------------------------------------------------------------------------
  const transcribeAndRespond = useCallback(
    async (audioBlob: Blob) => {
      if (!mountedRef.current) return;
      if (audioBlob.size === 0) {
        // Nothing captured (e.g. instant toggle). Just return to idle.
        setStatus("idle");
        return;
      }
      setStatus("thinking");
      setCaption("");

      let userText = "";
      try {
        const form = new FormData();
        // Filename hints the container; type is read server-side from the blob.
        form.append("audio", audioBlob, "speech.webm");
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `transcribe failed (${res.status})`);
        }
        userText = (data.text ?? "").trim();
      } catch (err) {
        if (!mountedRef.current) return;
        setCaption("I couldn't catch that. Want to try again?");
        setStatus("idle");
        reportVoiceError("transcribe", err);
        return;
      }

      if (!mountedRef.current) return;
      if (!userText) {
        // Silence / no speech detected.
        setCaption("I didn't hear anything. Tap the mic and try again.");
        setStatus("idle");
        return;
      }

      pushTurn({ role: "user", text: userText });
      setCaption(userText);
      await respondAndSpeak();
    },
    [pushTurn, respondAndSpeak],
  );

  // -------------------------------------------------------------------------
  // Step 1: open the mic and start a recording.
  // -------------------------------------------------------------------------
  const beginRecording = useCallback(async () => {
    // Any prior playback should stop the moment the user starts talking.
    stopPlayback();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCaption("This browser can't access the microphone.");
      setStatus("idle");
      setMicOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // Release the mic as soon as we have the data.
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        stopStream();
        void transcribeAndRespond(blob);
      };

      recorder.start();
      setMicOn(true);
      setCaption("");
      setStatus("listening");
    } catch (err) {
      // Most commonly: permission denied.
      setCaption(
        "Microphone access was blocked. Enable it in your browser to talk, or type a line instead.",
      );
      setStatus("idle");
      setMicOn(false);
      stopStream();
      reportVoiceError("mic", err);
    }
  }, [stopPlayback, stopStream, transcribeAndRespond]);

  // Stop the active recording (triggers recorder.onstop → transcription).
  const stopRecording = useCallback(() => {
    setMicOn(false);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // fires onstop, which does the rest
    } else {
      stopStream();
    }
  }, [stopStream]);

  // -------------------------------------------------------------------------
  // Public actions
  // -------------------------------------------------------------------------

  const start = useCallback(() => {
    // Only meaningful from idle; ignore if already in a call.
    if (status !== "idle") return;
    void beginRecording();
  }, [status, beginRecording]);

  const toggleMic = useCallback(() => {
    if (micOn) {
      stopRecording();
    } else {
      // Don't interrupt an in-flight reply; only re-arm from idle/listening-off.
      if (status === "thinking" || status === "speaking") return;
      void beginRecording();
    }
  }, [micOn, status, stopRecording, beginRecording]);

  const end = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      // Detach onstop so ending doesn't kick off a transcription.
      recorderRef.current.onstop = null;
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    chunksRef.current = [];
    stopStream();
    stopPlayback();
    setMicOn(false);
    setStatus("idle");
    setCaption("");
  }, [stopStream, stopPlayback]);

  const sendText = useCallback(
    (text: string) => {
      const line = text.trim();
      if (!line) return;
      // Typed lines shouldn't fight with the mic; stop any capture first.
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        try {
          recorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      stopStream();
      setMicOn(false);
      pushTurn({ role: "user", text: line });
      setCaption(line);
      void respondAndSpeak();
    },
    [stopStream, pushTurn, respondAndSpeak],
  );

  // Clean up everything on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        try {
          recorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      stopStream();
      stopPlayback();
    };
  }, [stopStream, stopPlayback]);

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

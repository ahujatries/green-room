// Voice processing — the part that makes a deep TTS voice read as the man in
// the mask. James Earl Jones on set wasn't Vader until Ben Burtt layered the
// respirator, a low-pass "mask" muffle, and chest resonance over the take. We
// do the same in the browser with Web Audio: it runs on the existing playback
// AudioContext, so there's no server-side ffmpeg (Vercel can't run one) and no
// licensed breath sample (the respirator is synthesised from shaped noise).
//
// The base voice still matters — an original deep "Sith lord" voice designed in
// ElevenLabs (see lib/voices.ts). This chain is what turns that into Vader.

export type VoiceFxKind = "vader";

// Per-fx hints sent to /api/speech, picking a richer model and steadier prosody
// for the base voice before we process it. Kept here so the voice's whole
// character — base settings + playback fx — lives in one place.
export const VADER_TTS = {
  // Fuller low end than the turbo default; worth the latency for the hinge voice.
  modelId: "eleven_multilingual_v2",
  voiceSettings: {
    stability: 0.6, // steady, unhurried — "never hurried, never loud"
    similarity_boost: 0.85,
    style: 0.1, // almost no theatrical swing; the menace is in the stillness
    use_speaker_boost: true,
  },
} as const;

/** TTS hints for a character's fx kind, or null for the default voice path. */
export function ttsHintsFor(kind: VoiceFxKind | undefined) {
  return kind === "vader" ? VADER_TTS : null;
}

export type FxPlayback = { stop: () => void };

/**
 * Play `mp3` straight through `ctx` (no fx), calling `onended` when it finishes.
 * Returns a handle whose stop() cuts playback (barge-in / teardown). Throws if
 * decode fails — the caller drops to plain HTMLAudio.
 *
 * Why Web Audio and not `new Audio()`: Safari's autoplay policy blocks an
 * HTMLAudioElement.play() that fires long after the click (our audio arrives
 * only after transcribe→reply→speech). A buffer source on an AudioContext that
 * was unlocked inside the start() gesture is exempt, so it actually sounds.
 */
export async function playPlain(
  ctx: AudioContext,
  mp3: ArrayBuffer,
  onended: () => void,
): Promise<FxPlayback> {
  // decodeAudioData detaches its input; hand it a copy so a retry stays valid.
  const buf = await ctx.decodeAudioData(mp3.slice(0));
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
    src.disconnect();
  };
  src.onended = () => {
    if (stopped) return;
    stop();
    onended();
  };
  src.start();
  return { stop };
}

// The respirator is the real reference clip (one in/out cycle), fired only into
// the pauses between phrases — not a continuous bed under the words. Fetched
// once; decoded per AudioContext and cached.
const BREATH_URL = "/sfx/vader-breath.mp3";
let breathBytesPromise: Promise<ArrayBuffer | null> | null = null;
const breathBufByCtx = new WeakMap<AudioContext, AudioBuffer>();

async function loadBreathBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  const cached = breathBufByCtx.get(ctx);
  if (cached) return cached;
  if (!breathBytesPromise) {
    breathBytesPromise = fetch(BREATH_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
  }
  const bytes = await breathBytesPromise;
  if (!bytes) return null;
  try {
    const buf = await ctx.decodeAudioData(bytes.slice(0));
    breathBufByCtx.set(ctx, buf);
    return buf;
  } catch {
    return null;
  }
}

// Silent gaps (≥ minGapSec) in a speech buffer — the pauses Vader breathes into.
// Returns [start, end] times in seconds (buffer time, before playback-rate scaling).
function findPauses(buf: AudioBuffer, minGapSec = 0.4): Array<[number, number]> {
  const data = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const win = Math.floor(0.02 * sr);
  const hop = Math.floor(0.01 * sr);
  const env: number[] = [];
  let peak = 1e-9;
  for (let i = 0; i + win < data.length; i += hop) {
    let s = 0;
    for (let k = 0; k < win; k++) s += data[i + k] * data[i + k];
    const rms = Math.sqrt(s / win);
    env.push(rms);
    if (rms > peak) peak = rms;
  }
  const thr = 0.06 * peak;
  const gaps: Array<[number, number]> = [];
  let i = 0;
  while (i < env.length) {
    if (env[i] < thr) {
      let j = i;
      while (j < env.length && env[j] < thr) j++;
      const gs = (i * hop) / sr;
      const ge = (j * hop) / sr;
      if (ge - gs >= minGapSec) gaps.push([gs, ge]);
      i = j;
    } else {
      i++;
    }
  }
  return gaps;
}

// tanh soft-clip curve for the WaveShaper — adds the harmonic grit of a
// processed/mechanical voice without hard digital clipping.
function makeGritCurve(drive: number) {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  const k = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / k;
  }
  return curve;
}

// Cadence: a breath fits only into pauses ≥ MIN_PAUSE_SEC, with a beat of
// silence before (LEAD) and after (TRAIL) so it never butts against the words.
// The pause is lengthened to host the breath — the deliberate Vader rhythm:
// speech → gap → breath → gap → speech.
const MIN_PAUSE_SEC = 0.85; // only longer pauses earn a breath — natural cadence
const BREATH_LEAD_SEC = 0.35;
const BREATH_TRAIL_SEC = 0.3;
const BREATH_GAIN = 0.6;

// Rebuild the speech buffer with silence inserted at each pause (and a lead-in)
// to host a breath. Returns the new buffer plus the breath onset times (seconds,
// in buffer time) where one-shot breaths should be scheduled.
function buildCadenceBuffer(
  ctx: AudioContext,
  speechBuf: AudioBuffer,
  breathDurSec: number,
  pauses: Array<[number, number]>,
): { buffer: AudioBuffer; breathStarts: number[] } {
  const sr = speechBuf.sampleRate;
  const src = speechBuf.getChannelData(0);
  type Chunk = { from: number; to: number } | { silence: number };
  const chunks: Chunk[] = [];
  const breathStarts: number[] = [];
  let total = 0;
  const addSpeech = (from: number, to: number) => {
    if (to > from) {
      chunks.push({ from, to });
      total += to - from;
    }
  };
  const addSilence = (sec: number) => {
    const n = Math.floor(sec * sr);
    chunks.push({ silence: n });
    total += n;
  };
  const addBreathBlock = (leadSec: number) => {
    addSilence(leadSec);
    breathStarts.push(total / sr);
    addSilence(breathDurSec);
    addSilence(BREATH_TRAIL_SEC);
  };

  addBreathBlock(0); // lead-in breath before the first word
  let pos = 0;
  for (const [gs, ge] of pauses) {
    addSpeech(pos, Math.floor(gs * sr));
    addBreathBlock(BREATH_LEAD_SEC);
    pos = Math.floor(ge * sr);
  }
  addSpeech(pos, src.length);

  const out = ctx.createBuffer(1, Math.max(1, total), sr);
  const od = out.getChannelData(0);
  let w = 0;
  for (const c of chunks) {
    if ("silence" in c) {
      w += c.silence;
    } else {
      od.set(src.subarray(c.from, c.to), w);
      w += c.to - c.from;
    }
  }
  return { buffer: out, breathStarts };
}

/**
 * Play `mp3` through the Vader chain on `ctx`, calling `onended` when the line
 * finishes naturally. Returns a handle whose stop() cuts playback immediately
 * (used for barge-in and teardown). Throws if decode fails — the caller drops
 * to plain playback.
 *
 * The EQ/muffle is tuned to match a real Vader reference (voice spectrum:
 * centroid ~1450Hz, rolloff ~2.7kHz, mid-forward). The designed base voice is
 * already deeper than the reference (~91Hz vs ~122Hz), so we barely pitch it
 * down — which also keeps the pace up. The respirator is the real reference
 * clip, fired only into the pauses (see buildCadenceBuffer), never under speech.
 */
export async function playVaderFx(
  ctx: AudioContext,
  mp3: ArrayBuffer,
  onended: () => void,
): Promise<FxPlayback> {
  // decodeAudioData detaches its input; hand it a copy so the caller's buffer
  // (and any retry) stays intact.
  const audioBuf = await ctx.decodeAudioData(mp3.slice(0));
  const breathBuf = await loadBreathBuffer(ctx);
  const t0 = ctx.currentTime;

  // Lengthen the pauses to host breaths (only if we have the breath clip).
  let playBuf = audioBuf;
  let breathStarts: number[] = [];
  if (breathBuf) {
    const pauses = findPauses(audioBuf, MIN_PAUSE_SEC);
    const built = buildCadenceBuffer(ctx, audioBuf, breathBuf.duration, pauses);
    playBuf = built.buffer;
    breathStarts = built.breathStarts;
  }

  // --- speech chain: slight pitch, chest, mechanical mid, grit, mask muffle --
  const src = ctx.createBufferSource();
  src.buffer = playBuf;
  src.detune.value = -35; // base is already deep; just enough, stays brisk

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 70;

  const chest = ctx.createBiquadFilter();
  chest.type = "peaking";
  chest.frequency.value = 150;
  chest.Q.value = 1.0;
  chest.gain.value = 5;

  const honk = ctx.createBiquadFilter(); // mid-forward "mechanical" presence
  honk.type = "peaking";
  honk.frequency.value = 1450;
  honk.Q.value = 1.1;
  honk.gain.value = 3;

  const grit = ctx.createWaveShaper();
  grit.curve = makeGritCurve(2.0);
  grit.oversample = "2x";

  const muffle = ctx.createBiquadFilter();
  muffle.type = "lowpass";
  muffle.frequency.value = 3000; // pulls centroid to ~1450, like the reference
  muffle.Q.value = 0.7;

  const speechGain = ctx.createGain();
  speechGain.gain.value = 1.0;

  src.connect(hp);
  hp.connect(chest);
  chest.connect(honk);
  honk.connect(grit);
  grit.connect(muffle);
  muffle.connect(speechGain);
  speechGain.connect(ctx.destination);

  // --- respirator: the real clip, scheduled one-shot into the inserted gaps --
  // The buffer plays at `rate` (detune), so buffer-time onsets map to real time
  // by dividing by it. Breaths play at normal rate inside the lengthened gaps.
  const rate = Math.pow(2, src.detune.value / 1200);
  const breathNodes: AudioBufferSourceNode[] = [];
  const breathGains: GainNode[] = [];
  if (breathBuf) {
    for (const start of breathStarts) {
      const b = ctx.createBufferSource();
      b.buffer = breathBuf;
      const g = ctx.createGain();
      g.gain.value = BREATH_GAIN;
      b.connect(g);
      g.connect(ctx.destination);
      b.start(t0 + start / rate);
      breathNodes.push(b);
      breathGains.push(g);
    }
  }

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
    src.disconnect();
    speechGain.disconnect();
    for (const b of breathNodes) {
      try {
        b.stop();
      } catch {
        /* already stopped */
      }
      b.disconnect();
    }
    for (const g of breathGains) g.disconnect();
  };

  src.onended = () => {
    if (stopped) return;
    stop();
    onended();
  };

  src.start(t0);
  return { stop };
}

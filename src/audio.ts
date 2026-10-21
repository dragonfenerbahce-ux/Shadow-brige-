/**
 * Music and sound effects, synthesized with the Web Audio API (no sound files).
 * Browsers only allow sound after the player touches the page, so nothing plays
 * until `unlockAudio` runs from a tap.
 */

const MUTE_KEY = "shadowbridge.muted";
const MUSIC_VOLUME = 0.1;
const CHORD_SECONDS = 4;

type Store = Pick<Storage, "getItem" | "setItem">;

/** A calm sunset progression: Fmaj7, Am7, Dm7, Cmaj7 (frequencies in Hz). */
const CHORDS = [
  [174.61, 220.0, 261.63, 329.63],
  [220.0, 261.63, 329.63, 392.0],
  [146.83, 174.61, 220.0, 261.63],
  [130.81, 164.81, 196.0, 246.94],
];
/** C major pentatonic, for the soft bell notes over the chords. */
const BELLS = [523.25, 587.33, 659.25, 783.99, 880.0];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let muted = false;
let store: Store | null = null;
let chordIndex = 0;

export function initAudio(s: Store | null) {
  store = s;
  try {
    muted = s?.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): boolean {
  muted = !muted;
  try {
    store?.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // The choice then lasts only until the page reloads.
  }
  if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
  return muted;
}

/** Call from a tap. Creates the audio engine on the first call and starts the music. */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  try {
    // Lets iPhones play sound even when the ringer switch is on silent (Safari 16.4+).
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    ctx = new AudioContext();
  } catch {
    return;
  }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  musicBus = ctx.createGain();
  musicBus.gain.value = MUSIC_VOLUME;
  musicBus.connect(filter);
  filter.connect(master);

  playChord();
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

function playChord() {
  if (!ctx || !musicBus) return;
  const start = ctx.currentTime + 0.05;
  const end = start + CHORD_SECONDS + 1.5;
  for (const freq of CHORDS[chordIndex % CHORDS.length]) {
    for (const [type, detune] of [["sine", 0], ["triangle", 6]] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 1.2);
      gain.gain.linearRampToValueAtTime(0.2, start + CHORD_SECONDS);
      gain.gain.linearRampToValueAtTime(0, end);
      osc.connect(gain).connect(musicBus);
      osc.start(start);
      osc.stop(end);
    }
  }
  // Two soft bell notes per chord.
  for (const offset of [0.8, 2.6]) {
    const bell = BELLS[Math.floor(Math.random() * BELLS.length)];
    tone(bell, start + offset, 1.6, "sine", 0.35, undefined, musicBus);
  }
  chordIndex++;
  window.setTimeout(playChord, CHORD_SECONDS * 1000);
}

/** One short note with a quick attack and an exponential fade. */
function tone(
  freq: number,
  at: number,
  seconds: number,
  type: OscillatorType,
  volume: number,
  endFreq?: number,
  out: AudioNode | null = master,
) {
  if (!ctx || !out) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, at + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + seconds + 0.05);
}

function now(): number | null {
  return ctx && ctx.state === "running" ? ctx.currentTime : null;
}

/** The sun clicks into a new direction. */
export function playTick() {
  const t = now();
  if (t !== null) tone(1320, t, 0.05, "sine", 0.05);
}

/** Pip takes a step. */
export function playStep() {
  const t = now();
  if (t !== null) tone(260, t, 0.08, "triangle", 0.06, 200);
}

/** Pip starts glowing in the sun. */
export function playHot() {
  const t = now();
  if (t === null) return;
  tone(160, t, 0.25, "sawtooth", 0.04, 150);
  tone(160, t + 0.3, 0.25, "sawtooth", 0.04, 150);
}

/** Pip melts. */
export function playMelt() {
  const t = now();
  if (t !== null) tone(620, t, 0.8, "sine", 0.12, 110);
}

/** Pip reaches the exit. */
export function playWin() {
  const t = now();
  if (t === null) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.1, 0.9, "triangle", 0.1));
}

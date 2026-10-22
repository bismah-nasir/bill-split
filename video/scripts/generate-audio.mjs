/**
 * Synthesizes the walkthrough's audio into public/ so there are no licensing questions:
 *   music.wav  a calm ambient loop (pad, soft bass, sparse bell arpeggio, light reverb)
 *   click.wav  a mouse click (desktop scenes)
 *   tap.wav    a soft tap (phone scenes)
 *
 * Usage: node scripts/generate-audio.mjs [durationSeconds]   (defaults to the video's length)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 44100;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const DURATION = Number(process.argv[2] ?? 76.4);

// Deterministic randomness so every run produces the same audio.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

function writeWav(file, left, right = left) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(path.join(OUT, file), buf);
  console.log(`wrote public/${file} (${(n / RATE).toFixed(2)}s)`);
}

function normalize(channels, peak) {
  let max = 0;
  for (const ch of channels) for (const v of ch) max = Math.max(max, Math.abs(v));
  const g = max > 0 ? peak / max : 1;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= g;
}

// ─── Music ──────────────────────────────────────────────────────────────────

function music() {
  const n = Math.round(DURATION * RATE);
  const L = new Float32Array(n);
  const R = new Float32Array(n);

  const BPM = 84;
  const beat = 60 / BPM;
  const bar = beat * 4;

  // Cmaj9 → Am9 → Fmaj9 → G6/9: warm, unresolved, loops smoothly.
  const chords = [
    { root: 36, pad: [52, 55, 59, 62] },
    { root: 33, pad: [52, 55, 59, 60] },
    { root: 29, pad: [53, 57, 60, 64] },
    { root: 31, pad: [50, 55, 59, 64] },
  ];
  const bells = [
    [72, 76, 79, 74],
    [72, 76, 79, 71],
    [69, 72, 76, 77],
    [71, 74, 79, 76],
  ];

  /** Adds one note; `voice(t)` returns the raw waveform at time t (seconds since note start). */
  function addNote(start, length, gain, pan, env, voice) {
    const s0 = Math.max(0, Math.round(start * RATE));
    const s1 = Math.min(n, Math.round((start + length) * RATE));
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = s0; i < s1; i++) {
      const t = i / RATE - start;
      const v = voice(t) * env(t);
      L[i] += v * gl;
      R[i] += v * gr;
    }
  }

  const bars = Math.ceil(DURATION / bar) + 1;
  for (let b = 0; b < bars; b++) {
    const chord = chords[b % 4];
    const t0 = b * bar;

    // Pad: three slightly detuned sines per note, slow swell, overlapping release.
    const padLen = bar + 1.6;
    const padEnv = (t) => Math.min(1, t / 1.1) * Math.min(1, Math.max(0, (padLen - t) / 1.6));
    chord.pad.forEach((m, k) => {
      const f = midiToHz(m);
      const detune = [0.9977, 1, 1.0023];
      addNote(t0, padLen, 0.05, k % 2 ? 0.35 : -0.35, padEnv, (t) => {
        let v = 0;
        for (const d of detune) v += Math.sin(2 * Math.PI * f * d * t);
        return v / 3 + 0.12 * Math.sin(4 * Math.PI * f * t);
      });
    });

    // Bass: a soft sine on the root, twice a bar.
    for (const offset of [0, beat * 2.5]) {
      const f = midiToHz(chord.root + 12);
      addNote(t0 + offset, 2.2, offset === 0 ? 0.16 : 0.09, 0, (t) => Math.min(1, t / 0.02) * Math.exp(-t * 1.6), (t) =>
        Math.sin(2 * Math.PI * f * t) + 0.15 * Math.sin(4 * Math.PI * f * t),
      );
    }

    // Bells: sparse arpeggio, enters after the intro, rests in the last bars.
    if (b >= 1 && t0 < DURATION - bar * 1.5) {
      const steps = [0, 1.5, 2, 3];
      steps.forEach((s, k) => {
        if (b % 2 === 1 && k === 2) return;
        const f = midiToHz(bells[b % 4][k]);
        const vel = 0.05 + rand() * 0.025;
        addNote(t0 + s * beat, 2.4, vel, k % 2 ? 0.45 : -0.45, (t) => Math.min(1, t / 0.004) * Math.exp(-t * 2.6), (t) =>
          Math.sin(2 * Math.PI * f * t) + 0.28 * Math.sin(2 * Math.PI * f * 2.01 * t) * Math.exp(-t * 4) + 0.08 * Math.sin(2 * Math.PI * f * 3 * t) * Math.exp(-t * 7),
        );
      });
    }
  }

  // Gentle low-pass to keep everything soft.
  for (const ch of [L, R]) {
    let y = 0;
    const a = 1 - Math.exp((-2 * Math.PI * 5200) / RATE);
    for (let i = 0; i < n; i++) ch[i] = y += a * (ch[i] - y);
  }

  // Small Schroeder reverb, different delays per side for width.
  const reverb = (input, delays) => {
    const out = new Float32Array(n);
    for (const d of delays) {
      const len = Math.round(d * RATE);
      const buf = new Float32Array(len);
      let idx = 0;
      for (let i = 0; i < n; i++) {
        const y = buf[idx];
        buf[idx] = input[i] + y * 0.78;
        idx = (idx + 1) % len;
        out[i] += y / delays.length;
      }
    }
    for (const d of [0.005, 0.0017]) {
      const len = Math.round(d * RATE);
      const buf = new Float32Array(len);
      let idx = 0;
      for (let i = 0; i < n; i++) {
        const b = buf[idx];
        const y = -0.7 * out[i] + b;
        buf[idx] = out[i] + 0.7 * y;
        idx = (idx + 1) % len;
        out[i] = y;
      }
    }
    return out;
  };
  const wetL = reverb(L, [0.0297, 0.0371, 0.0411, 0.0437]);
  const wetR = reverb(R, [0.0311, 0.0359, 0.0423, 0.0449]);
  for (let i = 0; i < n; i++) {
    L[i] = L[i] * 0.78 + wetL[i] * 0.42;
    R[i] = R[i] * 0.78 + wetR[i] * 0.42;
  }

  // Fade in and out with the video.
  const fadeIn = 1.5 * RATE;
  const fadeOut = 3.5 * RATE;
  for (let i = 0; i < n; i++) {
    const g = Math.min(1, i / fadeIn, (n - i) / fadeOut);
    L[i] *= g;
    R[i] *= g;
  }
  normalize([L, R], 0.8);
  writeWav("music.wav", L, R);
}

// ─── Clicks ─────────────────────────────────────────────────────────────────

function click() {
  const n = Math.round(0.09 * RATE);
  const out = new Float32Array(n);
  // Press and release: a bright tick, a body knock, and a smaller release tick.
  for (const [at, gain] of [[0, 1], [0.045, 0.45]]) {
    const s0 = Math.round(at * RATE);
    let prev = 0;
    for (let i = s0; i < n; i++) {
      const t = (i - s0) / RATE;
      const noise = rand() * 2 - 1;
      const hp = noise - prev;
      prev = noise;
      out[i] +=
        gain *
        (0.5 * hp * Math.exp(-t / 0.0025) +
          0.6 * Math.sin(2 * Math.PI * 3100 * t) * Math.exp(-t / 0.004) +
          0.5 * Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.012));
    }
  }
  normalize([out], 0.7);
  writeWav("click.wav", out);
}

function tap() {
  const n = Math.round(0.08 * RATE);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = 380 + 700 * Math.exp(-t / 0.008);
    phase += (2 * Math.PI * f) / RATE;
    out[i] = Math.sin(phase) * Math.min(1, t / 0.001) * Math.exp(-t / 0.016) + 0.15 * (rand() * 2 - 1) * Math.exp(-t / 0.002);
  }
  normalize([out], 0.6);
  writeWav("tap.wav", out);
}

mkdirSync(OUT, { recursive: true });
music();
click();
tap();

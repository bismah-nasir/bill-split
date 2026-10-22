import { Easing, interpolate, spring } from "remotion";

import { FPS } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 between two frames, eased. */
export function progress(frame: number, start: number, duration = 15, easing = Easing.bezier(0.2, 0, 0, 1)) {
  return interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing });
}

/** A soft spring that starts at `start`. */
export function pop(frame: number, start: number, damping = 18) {
  return spring({ frame: frame - start, fps: FPS, config: { damping, mass: 0.6 } });
}

/** Fade + rise in, as the app's `animate-fade-in` / `toast-in`. */
export function enter(frame: number, start: number, distance = 16) {
  const p = progress(frame, start, 14);
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
}

/** The visible part of `text` while it's being typed from `start`. */
export function typed(text: string, frame: number, start: number, framesPerChar = 2) {
  if (frame < start) return "";
  return text.slice(0, Math.floor((frame - start) / framesPerChar) + 1);
}

/** The frame on which `typed(text, …, start, fpc)` finishes. */
export function typedEnd(text: string, start: number, framesPerChar = 2) {
  return start + text.length * framesPerChar;
}

/** Piecewise-eased value through keyframes: [[frame, value], …]. */
export function keyframes(frame: number, points: [number, number][]) {
  return interpolate(
    frame,
    points.map((p) => p[0]),
    points.map((p) => p[1]),
    { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) },
  );
}

/** Counts up a paisa amount for the money tiles. */
export function countUp(frame: number, start: number, target: number, duration = 30) {
  return Math.round(target * progress(frame, start, duration, Easing.out(Easing.cubic)));
}

export function formatPaisa(paisa: number) {
  const rupees = Math.floor(paisa / 100);
  const rest = String(paisa % 100).padStart(2, "0");
  return `Rs. ${rupees.toLocaleString("en-US")}.${rest}`;
}

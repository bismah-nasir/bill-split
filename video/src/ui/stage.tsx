import type { ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Lock } from "lucide-react";

import { enter, keyframes } from "../anim";
import { C, FONT_BODY, FONT_HEADING, SHADOW } from "../theme";

/** Soft branded backdrop shared by every scene. */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 85% 10%, ${C.primarySoft} 0%, rgba(213,242,236,0) 60%),
                     radial-gradient(900px 600px at 0% 100%, #e6f3f0 0%, rgba(230,243,240,0) 60%), ${C.background}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** Step label, headline and short explanation on the left of each scene. */
export function Caption({
  step,
  title,
  body,
  width = 520,
}: {
  step: string;
  title: string;
  body: string;
  width?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 22 }}>
      <span
        style={{
          ...enter(frame, 4),
          alignSelf: "flex-start",
          fontFamily: FONT_HEADING,
          fontWeight: 600,
          fontSize: 22,
          color: C.primary,
          background: C.primarySoft,
          padding: "8px 18px",
          borderRadius: 999,
        }}
      >
        {step}
      </span>
      <h1
        style={{
          ...enter(frame, 8, 24),
          margin: 0,
          fontFamily: FONT_HEADING,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: "70px",
          letterSpacing: -1.2,
          color: C.ink,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          ...enter(frame, 14, 24),
          margin: 0,
          fontFamily: FONT_BODY,
          fontSize: 27,
          lineHeight: "40px",
          color: C.inkSecondary,
        }}
      >
        {body}
      </p>
    </div>
  );
}

/** Caption on the left, device on the right. */
export function SceneLayout({ caption, children, captionWidth }: { caption: ReactNode; children: ReactNode; captionWidth?: number }) {
  return (
    <Backdrop>
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 64px", gap: 56 }}>
        <div style={{ width: captionWidth, flexShrink: 0 }}>{caption}</div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>{children}</div>
      </AbsoluteFill>
    </Backdrop>
  );
}

/** Device enters with a gentle rise. */
function useDeviceEnter() {
  const frame = useCurrentFrame();
  const y = keyframes(frame, [[0, 40], [18, 0]]);
  const o = keyframes(frame, [[0, 0], [12, 1]]);
  return { transform: `translateY(${y}px)`, opacity: o };
}

/** A desktop browser window; `children` is the 1280×(height) viewport in CSS px. */
export function BrowserFrame({
  url,
  children,
  width = 1180,
  height = 800,
  scale = 1,
}: {
  url: string;
  children: ReactNode;
  width?: number;
  height?: number;
  scale?: number;
}) {
  const style = useDeviceEnter();
  return (
    <div style={{ ...style }}>
      <div
        style={{
          width: width * scale,
          height: (height + 44) * scale,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(11,43,39,0.18), 0 8px 24px rgba(11,43,39,0.08)",
          background: C.surface,
          border: `1px solid ${C.lineStrong}`,
        }}
      >
        <div
          style={{
            height: 44 * scale,
            background: "#eef2f1",
            display: "flex",
            alignItems: "center",
            gap: 8 * scale,
            padding: `0 ${16 * scale}px`,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 12 * scale, height: 12 * scale, borderRadius: 99, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 24 * scale,
              flex: 1,
              maxWidth: 560 * scale,
              height: 28 * scale,
              borderRadius: 99,
              background: C.surface,
              display: "flex",
              alignItems: "center",
              gap: 8 * scale,
              padding: `0 ${14 * scale}px`,
              fontFamily: FONT_BODY,
              fontSize: 14 * scale,
              color: C.inkSecondary,
            }}
          >
            <Lock size={12 * scale} />
            {url}
          </div>
        </div>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** A phone; `children` is the 390×800 viewport in CSS px. */
export function PhoneFrame({ children, scale = 1.2 }: { children: ReactNode; scale?: number }) {
  const style = useDeviceEnter();
  const W = 390;
  const H = 800;
  return (
    <div style={{ ...style }}>
      <div
        style={{
          width: (W + 24) * scale,
          height: (H + 24 + 34) * scale,
          borderRadius: 58 * scale,
          background: "#101716",
          padding: 12 * scale,
          boxSizing: "border-box",
          boxShadow: "0 40px 80px rgba(11,43,39,0.25), 0 8px 24px rgba(11,43,39,0.1)",
        }}
      >
        <div style={{ width: W * scale, height: (H + 34) * scale, borderRadius: 46 * scale, overflow: "hidden", background: C.background }}>
          <div style={{ width: W, height: H + 34, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
            <div
              style={{
                height: 34,
                background: C.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 28px",
                fontFamily: FONT_HEADING,
                fontWeight: 600,
                fontSize: 15,
                color: C.ink,
              }}
            >
              <span>9:41</span>
              <span style={{ width: 110, height: 24, borderRadius: 14, background: "#101716" }} />
              <span style={{ letterSpacing: 1 }}>●●●</span>
            </div>
            <div style={{ width: W, height: H, position: "relative", overflow: "hidden" }}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** App page area: fixed header, scrollable content, optional fixed bottom parts. */
export function Screen({
  header,
  footer,
  scrollY = 0,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  scrollY?: number;
  children: ReactNode;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: C.background }}>
      {header}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ transform: `translateY(${-scrollY}px)` }}>{children}</div>
      </div>
      {footer}
    </div>
  );
}

/** The pointer (desktop) or a fingertip (phone), moving through keyframes with click ripples. */
export function Cursor({
  path,
  clicks = [],
  touch = false,
  hideAt,
}: {
  path: [number, number, number][];
  clicks?: number[];
  touch?: boolean;
  /** Fades the pointer out from this frame. */
  hideAt?: number;
}) {
  const frame = useCurrentFrame();
  const x = keyframes(frame, path.map(([f, px]) => [f, px]));
  const y = keyframes(frame, path.map(([f, , py]) => [f, py]));
  const appear =
    keyframes(frame, [[path[0][0] - 8, 0], [path[0][0], 1]]) *
    (hideAt === undefined ? 1 : keyframes(frame, [[hideAt, 1], [hideAt + 8, 0]]));
  const ripples = clicks
    .map((c) => frame - c)
    .filter((d) => d >= 0 && d < 18)
    .map((d) => d / 18);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${x}px, ${y}px)`, opacity: appear, zIndex: 100, pointerEvents: "none" }}>
      {clicks.map((c) => (
        <Sequence key={c} from={c} durationInFrames={6} layout="none">
          <Audio src={staticFile(touch ? "tap.wav" : "click.wav")} volume={touch ? 0.55 : 0.5} />
        </Sequence>
      ))}
      {ripples.map((r, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: -24 * (0.4 + r),
            top: -24 * (0.4 + r),
            width: 48 * (0.4 + r),
            height: 48 * (0.4 + r),
            borderRadius: 999,
            background: C.primary,
            opacity: 0.35 * (1 - r),
          }}
        />
      ))}
      {touch ? (
        <span
          style={{
            position: "absolute",
            left: -18,
            top: -18,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "rgba(15, 29, 27, 0.22)",
            border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: SHADOW.card,
          }}
        />
      ) : (
        <svg width="26" height="30" viewBox="0 0 26 30" style={{ position: "absolute", left: -3, top: -2, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}>
          <path d="M3 2 L3 24 L9 18.5 L13 27.5 L17 25.8 L13 17 L21 17 Z" fill="#0f1d1b" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

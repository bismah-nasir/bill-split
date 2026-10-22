import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import type { CSSProperties } from "react";

/** Mirrors design/tokens.css so the video looks exactly like the app. */
const outfit = loadOutfit("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const jakarta = loadJakarta("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const FONT_HEADING = `${outfit.fontFamily}, sans-serif`;
export const FONT_BODY = `${jakarta.fontFamily}, sans-serif`;

export const C = {
  background: "#f5f8f7",
  surface: "#ffffff",
  surfaceSubtle: "#edf6f4",
  surfaceMuted: "#e2ecea",
  primary: "#0f766e",
  primaryPressed: "#115e59",
  primarySoft: "#d5f2ec",
  ink: "#0f1d1b",
  inkSecondary: "#44524f",
  inkMuted: "#5e6d68",
  inkInverse: "#ffffff",
  success: "#047857",
  successSoft: "#d1fae5",
  error: "#b91c1c",
  errorSoft: "#fee2e2",
  warning: "#b45309",
  warningSoft: "#fef3c7",
  line: "rgba(15, 29, 27, 0.08)",
  lineStrong: "rgba(15, 29, 27, 0.14)",
  lineControl: "#858c8b",
  overlay: "rgba(15, 29, 27, 0.55)",
} as const;

export const SHADOW = {
  subtle: "0 1px 4px rgba(11, 43, 39, 0.04)",
  card: "0 6px 16px rgba(11, 43, 39, 0.08)",
  floating: "0 10px 22px rgba(15, 118, 110, 0.22)",
  raised: "0 -4px 14px rgba(11, 43, 39, 0.06)",
} as const;

export const RADIUS = { sm: 8, md: 14, lg: 20, pill: 9999 } as const;

export const T: Record<string, CSSProperties> = {
  displaySm: { fontFamily: FONT_HEADING, fontSize: 40, lineHeight: "44px", letterSpacing: -0.48, fontWeight: 700 },
  h1: { fontFamily: FONT_HEADING, fontSize: 28, lineHeight: "34px", letterSpacing: -0.32, fontWeight: 700 },
  h2: { fontFamily: FONT_HEADING, fontSize: 22, lineHeight: "28px", letterSpacing: -0.16, fontWeight: 700 },
  h3: { fontFamily: FONT_HEADING, fontSize: 18, lineHeight: "24px", fontWeight: 600 },
  body: { fontFamily: FONT_BODY, fontSize: 16, lineHeight: "24px", fontWeight: 400 },
  bodyMedium: { fontFamily: FONT_BODY, fontSize: 16, lineHeight: "24px", fontWeight: 500 },
  bodySm: { fontFamily: FONT_BODY, fontSize: 14, lineHeight: "20px", fontWeight: 400 },
  caption: { fontFamily: FONT_BODY, fontSize: 12, lineHeight: "16px", letterSpacing: 0.3, fontWeight: 500 },
  button: { fontFamily: FONT_HEADING, fontSize: 16, lineHeight: "24px", fontWeight: 600 },
  buttonSm: { fontFamily: FONT_HEADING, fontSize: 14, lineHeight: "20px", fontWeight: 600 },
  numeric: { fontFamily: FONT_HEADING, fontSize: 48, lineHeight: "52px", fontWeight: 700 },
};

export const FPS = 30;

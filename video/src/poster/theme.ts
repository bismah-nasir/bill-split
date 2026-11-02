import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

export const { fontFamily: headingFont } = loadOutfit("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export const { fontFamily: bodyFont } = loadJakarta("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

// Matches the BillSplit app's design tokens (design/tokens.css).
export const colors = {
  bg: "#f5f8f7",
  surface: "#ffffff",
  subtle: "#edf6f4",
  primary: "#0f766e",
  primarySoft: "#d5f2ec",
  ink: "#0f1d1b",
  inkSecondary: "#44524f",
  muted: "#5e6d68",
  line: "rgba(15,29,27,0.10)",
  shadow: "rgba(11,43,39,0.18)",
};

export const links = {
  live: "the-bill-split.vercel.app",
  github: "github.com/bismah-nasir/bill-split",
};

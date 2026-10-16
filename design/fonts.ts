import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Font faces for the design system. Each exposes a CSS variable that
 * Outfit gives headings a modern, distinctive tech feel,
 * while Plus Jakarta Sans keeps body text clean and readable.
 */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

/** Apply to <html> so every font variable is defined app-wide. */
export const fontVariables = `${outfit.variable} ${plusJakartaSans.variable}`;

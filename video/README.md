# BillSplit walkthrough video

A ~76-second, 1920×1080 product walkthrough of BillSplit, built with [Remotion](https://www.remotion.dev). Every screen is rebuilt in React with the app's design tokens (`design/tokens.css`) and the same demo data as the README screenshots.

## Flow

| # | Scene | Device |
|---|---|---|
| — | Intro | — |
| 01 | Landing page → **Get started** | Desktop |
| 02 | Sign up as Ayesha Khan | Desktop |
| 03 | Choose the username `@ayesha` | Desktop |
| 04 | Dashboard: Your share Rs. 14,108.34 · Bills you created Rs. 20,820.00 | Desktop |
| 05 | New bill: Weekly Groceries at Imtiaz, adding Hamza and Sara | Phone |
| 06 | Items: Cooking Oil (Dalda, 1 litre) split three ways, then rice, milk and eggs | Phone |
| 07 | Review the split and save | Phone |
| 08 | The saved bill: split summary, items, and each person's shares | Phone |
| 09 | Invite Hamza by username; Hamza accepts and sees the bill | Phone |
| 10 | Bill History: search "oil", filter Created by me | Desktop |
| 11 | Price History: Cooking Oil Rs. 520 → 540 → 560 with a chart | Desktop |
| — | Outro | — |

## Commands

```bash
cd video
npm install
npm run studio   # preview and scrub in Remotion Studio
npm run render   # writes out/billsplit-walkthrough.mp4
```

## Layout

```text
src/
  index.ts         registerRoot
  Root.tsx         the BillSplitWalkthrough composition (30 fps, 1920×1080)
  Video.tsx        scene order, durations and transitions
  theme.ts         colours, fonts, radii and type ramp from design/tokens.css
  anim.ts          typing, easing and count-up helpers
  data.ts          demo bills, items, shares and price records
  ui/              app primitives, device frames, cursor and captions
  scenes/          onboarding.tsx, desktop.tsx, mobile.tsx
```

This folder is a separate npm package. The app's `tsconfig.json` and ESLint config ignore it.

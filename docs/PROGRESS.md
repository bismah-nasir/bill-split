# Progress

## Phase 0 — Project setup and design-system foundation ✅ (2026-10-16)

**Done**
- Next.js 16.4.2 (App Router, `src/`, Turbopack) + Tailwind v4 scaffolded into the repo root; demo page and SVGs removed.
- `tsconfig.json`: strict, aliases `@/*` and `@design/*`, includes `design/**/*.ts`.
- `globals.css` imports `design/tokens.css` only; fonts via `fontVariables` on `<html>`.
- shadcn/ui initialised (Radix base); its theme variables, dark variant and Geist font removed. `Button` rewritten to token variants (`primary|secondary|ghost|danger`, sizes `lg|md|sm|icon`, `asChild`).
- ESLint guardrails: no inline style / hex / colour functions / arbitrary values; Convex only in `src/lib/db`, Convex Auth only in `src/lib/auth`; `src/domain` stays pure. Verified each rule fires.
- Vitest (`unit` project); scripts `typecheck`, `lint`, `test`, `check`.
- `src/domain/format.ts` (`formatPaisa`, `todayIsoDate`, `formatTripDate`) + 13 unit tests.
- `PageContainer`, landing page at `src/app/(public)/page.tsx`.
- `.gitignore` keeps `.env.example`; `.env.example` and `README.md` added.
- Verified: `npm run check` and `next build` pass.

**Decisions**
- No git, by user choice: no `git init` and no commits per phase.
- `cn` uses shadcn's `cn` package (tailwind-merge replacement), with the `type-*` text styles registered as one conflict group.
- Removed `shadcn` and `tw-animate-css` packages; re-add `tw-animate-css` when dialogs arrive.
- `@types/node` bumped to ^24 (matches Node 24, required by Vitest 5).
- Root layout types `children` explicitly; Next's generated `LayoutProps` would break `tsc` on a fresh clone.
- `formatTripDate` uses a fixed month-name list after a UTC validity check, not `Intl`, so output is always "16 Oct 2026" style (some ICU versions print "Sept").
- `formatPaisa` shows negatives as `−Rs. x`.

**Not yet done:** visual checks at 360 px and 1280 px (manual, in a browser).

## Change (2026-10-17): Clerk replaced by Convex Auth
By user decision, auth is now email + password through Convex Auth (sign-up: Name, Email, Password, Confirm password). No email/phone verification, no phone numbers, no webhook. `docs/BUILD_PLAN.md` updated; `PRD.md` is no longer used. Phase 0 files cleaned up: ESLint service rule now guards `@convex-dev/auth` (and `src/domain` bans `@convex-dev/*`), `.env.example` lists the Convex Auth deployment variables, README prerequisites updated.

## Change (2026-10-17): smaller controls
Buttons looked too large in the browser. Tokens changed: `control-lg/md/sm` 60/52/40px → 48/44/36px; `type-button` 18px bold uppercase → 16px semibold, normal case (`type-button-sm` 14px semibold, normal case).

## Change (2026-10-17): Deep Teal colour theme
Brand moved from indigo to Deep Teal (`primary` #0f766e, pressed #115e59, soft #d5f2ec) with green-grey neutrals. Contrast fixes: `ink-muted` #64746f (4.92:1), `success` #047857, `error` #b91c1c, `warning` #b45309, so all pass AA as text on white.

## Next: Phase 1 — Sign-up, sign-in, app shell and username onboarding
Needs from you first: a Convex project (`npx convex dev`, log in, create the project). After the packages are installed: `npx @convex-dev/auth` with site URL `http://localhost:3000`.

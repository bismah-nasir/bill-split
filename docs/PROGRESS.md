# Progress

## Phase 0 — Project setup and design-system foundation ✅ (2026-10-16)

**Done**
- Next.js 16.4.2 (App Router, `src/`, Turbopack) + Tailwind v4 scaffolded into the repo root; demo page and SVGs removed.
- `tsconfig.json`: strict, aliases `@/*` and `@design/*`, includes `design/**/*.ts`.
- `globals.css` imports `design/tokens.css` only; fonts via `fontVariables` on `<html>`.
- shadcn/ui initialised (Radix base); its theme variables, dark variant and Geist font removed. `Button` rewritten to token variants (`primary|secondary|ghost|danger`, sizes `lg|md|sm|icon`, `asChild`).
- ESLint guardrails: no inline style / hex / colour functions / arbitrary values; Convex only in `src/lib/db`, Clerk only in `src/lib/auth`; `src/domain` stays pure. Verified each rule fires.
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

## Next: Phase 1 — Sign-up, sign-in, app shell and username onboarding
Needs from you first: a Clerk app and keys, a Convex project (`npx convex dev`) and `CLERK_JWT_ISSUER_DOMAIN`.

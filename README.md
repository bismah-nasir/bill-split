# BillSplit & Price History

A private, account-based web app for recording bills, splitting them fairly by item, sharing them only with the people involved, and comparing item prices over time. Currency: PKR.

The full build plan is in [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md); progress is tracked in [docs/PROGRESS.md](docs/PROGRESS.md). Coding rules for contributors and agents are in [RULES.md](RULES.md).

## Prerequisites

- Node.js 20+ (developed on Node 24) and npm
- Later phases: a Clerk account and a Convex account

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values as phases require them
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint, including the design-token and service-boundary guardrails |
| `npm test` | Vitest (unit tests in `tests/unit`) |
| `npm run check` | typecheck + lint + test; must pass at the end of every phase |

## Project layout

- `design/` — `tokens.css` (every styling value) and `fonts.ts`. The only source of colours, sizes, spacing, radii, shadows, fonts and motion.
- `src/app/` — Next.js App Router routes.
- `src/components/` — shared UI (`ui/`, `layout/`, feature folders).
- `src/domain/` — pure TypeScript business logic (money, formatting, validation), shared by UI and backend.
- `tests/unit/` — domain unit tests.

## Styling rules (enforced by ESLint)

`design/tokens.css` resets Tailwind's default theme (`--*: initial`), so default classes like `bg-white` or `p-3` produce nothing. Use token classes only (`bg-primary`, `p-16`, `type-body`, `rounded-md`, …). Inline `style`, hex/rgb colours and arbitrary values like `p-[13px]` fail lint.

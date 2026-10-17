# BillSplit & Price History

A private, account-based web app for recording bills, splitting them fairly by item, sharing them only with the people involved, and comparing item prices over time. Currency: PKR.

The full build plan is in [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md); progress is tracked in [docs/PROGRESS.md](docs/PROGRESS.md). Coding rules for contributors and agents are in [RULES.md](RULES.md).

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 with design tokens · shadcn/ui · Convex (database and backend) · Convex Auth (email and password) · Vitest.

## Prerequisites

- Node.js 22.12+ or 24 (required by Vitest), and npm
- A Convex account (free). Sign-up and sign-in use email and password through Convex Auth, so no other service is needed.

## Getting started

```bash
npm install

# 1. Connect to Convex. Log in, then create or choose a project.
#    This writes CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL to .env.local.
#    Keep it running while you develop.
npx convex dev

# 2. One time per Convex deployment, in a second terminal:
#    sets SITE_URL, JWT_PRIVATE_KEY and JWKS on the deployment.
npx @convex-dev/auth --web-server-url http://localhost:3000

# 3. Start the app (http://localhost:3000)
npm run dev
```

See [.env.example](.env.example) for the variables. Auth keys live on the Convex deployment, never in `.env.local` or the repo.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint, including the design-token and service-boundary guardrails |
| `npm test` | Run the tests once (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run check` | typecheck + lint + test; must pass at the end of every phase |

## Project layout

- `design/` — `tokens.css` (every styling value) and `fonts.ts`. The only source of colours, sizes, spacing, radii, shadows, fonts and motion.
- `convex/` — the backend: schema, queries, mutations and Convex Auth setup. `convex/_generated/` is written by the Convex CLI; never edit it.
- `src/app/` — Next.js App Router routes.
- `src/components/` — shared UI (`ui/`, `layout/`, feature folders).
- `src/domain/` — pure TypeScript business logic (money, formatting, validation), shared by UI and backend.
- `tests/unit/` — domain unit tests.
- `docs/` — build plan and progress log.

## Styling rules (enforced by ESLint)

`design/tokens.css` resets Tailwind's default theme (`--*: initial`), so default classes like `bg-white` or `p-3` produce nothing. Use token classes only (`bg-primary`, `p-16`, `type-body`, `rounded-md`, …). Inline `style`, hex/rgb colours and arbitrary values like `p-[13px]` fail lint.

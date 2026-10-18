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
| `npm run typecheck` | TypeScript check of the app and of `convex/` (`tsc --noEmit && tsc --noEmit -p convex`) |
| `npm run lint` | ESLint, including the design-token and service-boundary guardrails |
| `npm test` | Run the tests once (Vitest: `unit` domain tests and `convex` backend tests via convex-test) |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run check` | typecheck + lint + test; must pass at the end of every phase |

## Project layout

- `design/` — `tokens.css` (every styling value) and `fonts.ts`. The only source of colours, sizes, spacing, radii, shadows, fonts and motion.
- `convex/` — the backend: schema, queries, mutations and Convex Auth setup. `convex/_generated/` is written by the Convex CLI; never edit it.
- `src/app/` — Next.js App Router routes.
- `src/components/` — shared UI (`ui/`, `layout/`, feature folders).
- `src/domain/` — pure TypeScript business logic (money, formatting, validation), shared by UI and backend.
- `src/lib/db/` — the only frontend code that talks to Convex (hooks returning plain app types).
- `src/lib/auth/` — the only frontend code that talks to Convex Auth (providers, hooks, error mapping, route proxy).
- `src/proxy.ts` — Next.js proxy (formerly "middleware"): Convex Auth's session handling and route redirects.
- `tests/unit/` — domain unit tests.
- `tests/convex/` — backend tests (convex-test), including permission checks.
- `docs/` — build plan and progress log.

## Authentication

Email and password through Convex Auth's Password provider, configured in `convex/auth.ts`. Sessions live in httpOnly cookies (30 days). `src/proxy.ts` redirects signed-out visitors away from app pages and signed-in users from `/`, `/sign-in` and `/sign-up` to the dashboard, but that is only a convenience: every Convex function checks the caller itself.

`convex/auth.ts` wraps the Password provider so that signing up with an existing email always fails (Convex Auth would otherwise sign the caller in when the password matches), and so that sign-in/sign-up failures reach the UI as coded `ConvexError`s, which production deployments don't redact.

## Styling rules (enforced by ESLint)

`design/tokens.css` resets Tailwind's default theme (`--*: initial`), so default classes like `bg-white` or `p-3` produce nothing. Use token classes only (`bg-primary`, `p-16`, `type-body`, `rounded-md`, …). Inline `style`, hex/rgb colours and arbitrary values like `p-[13px]` fail lint.

## Money

All amounts are integer **paisa** (Rs. 1 = 100 paisa) and quantities are integer thousandths, so there is no floating-point money anywhere. Line totals round half-up to the nearest paisa. Shared items split equally; leftover paisa go to the people earliest on the bill (the owner first), so the shares always add up to the bill total exactly. The rules live in `src/domain/money.ts` and are used by both the form preview and the server, which re-parses and recomputes everything it saves.

## Known MVP limits

Every read is bounded. The caps live in `convex/lib/access.ts` (item and people limits in `src/domain/trip-validation.ts`):

| Limit | Value | Applies to |
|---|---|---|
| `ACCESSIBLE_TRIPS_CAP` | 1000 | Bills considered for the dashboard, history, price history and summaries |
| `PRODUCT_SEARCH_TRIPS_CAP` | 300 | Bills searched for products and item suggestions |
| `RECENT_TRIPS_LIMIT` | 5 | Dashboard "Recent bills" |
| `HISTORY_PAGE_SIZE` | 20 | Bill History "Load more" step |
| `MAX_HISTORY_LIMIT` | 200 | Bills Bill History shows at most for one search (narrow the filters to find others); in `src/domain/bill-history.ts` |
| `MAX_HISTORY_SEARCH_LENGTH` | 80 | Characters in a Bill History search; in `src/domain/bill-history.ts` |
| `MAX_ITEMS_PER_TRIP` | 200 | Items on one bill |
| `MAX_PEOPLE_PER_TRIP` | 20 | People on one bill, including the owner |
| `INVITATION_LIST_LIMIT` | 50 | Invitations shown on Invitations → Received and Sent (the nav badge shows "50+"); in `convex/invitations.ts` |

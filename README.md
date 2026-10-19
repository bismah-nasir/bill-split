# BillSplit & Price History

A private, account-based web app for recording bills, splitting them fairly by item, sharing them only with the people involved, and comparing item prices over time. Currency: PKR.

- **Bills:** record a shopping trip or meal with its items, quantities and prices. Add anyone to a bill by typing a name (no account needed), assign each item to one or more people, and get exact per-person shares plus a split summary sized for one phone screenshot.
- **Sharing:** the owner can link a person on the bill to a registered account by username or email. The invitee accepts or declines; once accepted they can view the bill read-only. Names are never matched to accounts automatically, and linking never changes the split.
- **History:** search and filter saved bills, see what you paid for an item across your bills (with price changes between comparable entries), get item suggestions while typing, and see a monthly spending summary.
- **Privacy:** everything is private to the bill's owner and the accounts they linked. Account names and emails are never shown to other users.

The full build plan is in [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md); progress is tracked in [docs/PROGRESS.md](docs/PROGRESS.md). Coding rules for contributors and agents are in [RULES.md](RULES.md).

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 with design tokens · shadcn/ui · Convex (database and backend) · Convex Auth (email and password) · Vitest.

## Architecture

- **Client-rendered app pages.** Pages under `src/app/(app)/` render on the client once the signed-in user has loaded, and read live data through Convex's reactive queries, so changes (an accepted invitation, an edited bill) appear without a reload. There are no API routes.
- **Convex is the backend and the only authority.** Every exported query and mutation in `convex/*.ts` starts with an auth helper from `convex/lib/auth.ts` (`getCurrentUser`, `requireCurrentUser`, `requireOnboardedUser`, `requireTripOwner`). Access to a bill comes only from a `tripPeople` row linking the caller to it (the owner, or an accepted invitation). Inaccessible bills look exactly like missing ones (`null` / `NOT_FOUND`). No function takes a user ID as the caller's identity.
- **Bounded reads.** Every query reads through an index with `.take(cap)`, `.first()` or `.unique()`; see the limits below.
- **Shared domain logic.** `src/domain/` holds pure TypeScript (money, validation, normalization, price changes) used by both the form preview and the server, which re-validates and recomputes everything it saves.
- **Service boundaries.** Only `src/lib/db/` talks to Convex and only `src/lib/auth/` talks to Convex Auth. They return plain app types and map every error to a friendly message (`toAppError`, `toAuthError`), so the UI never shows technical details. ESLint enforces the boundaries.

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

## Environment variables

| Variable | Where | Set by |
|---|---|---|
| `CONVEX_DEPLOYMENT` | `.env.local` | `npx convex dev` |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` (dev); injected by `npx convex deploy` in Vercel | `npx convex dev` / `npx convex deploy` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `.env.local` | `npx convex dev` |
| `SITE_URL` | Convex deployment | `npx @convex-dev/auth` (dev), `npx convex env set --prod SITE_URL …` (prod) |
| `JWT_PRIVATE_KEY`, `JWKS` | Convex deployment | `npx @convex-dev/auth` (generated; separate keys per deployment) |
| `CONVEX_DEPLOY_KEY` | Vercel (production) | Copied from the Convex dashboard |

The two `NEXT_PUBLIC_` values are public URLs, not secrets. No secret is ever exposed to the browser. Only `src/lib/db/client.ts` reads an environment variable in the app.

## Test accounts

There's no email verification, so test accounts are created by signing up in the app. For manual testing use **Alice** (`alice@example.com`, the bill owner), **Bob** (`bob@example.com`, an invitee) and **Carol** (`carol@example.com`, unrelated), each with a development-only password such as `testpass123`, in separate browser profiles or private windows. People without accounts are just names typed on a bill (e.g. Ben, Sara); for "linked later" checks sign up **Ben Doe** with the username `ben_doe`. Never reuse these passwords on production data you care about.

## Deploying to production

1. In the Convex dashboard, create the production deployment, then generate its own auth keys (never reuse the dev keys):
   ```bash
   npx @convex-dev/auth --prod
   ```
2. In Vercel, import the repository and:
   - set the **Build Command** to `npx convex deploy --cmd 'npm run build'`;
   - add `CONVEX_DEPLOY_KEY` (a production deploy key from the Convex dashboard). `convex deploy` pushes the functions and injects `NEXT_PUBLIC_CONVEX_URL` into the build. No auth variables go in Vercel.
3. Deploy, then point Convex Auth at the live URL:
   ```bash
   npx convex env set --prod SITE_URL https://<app>.vercel.app
   ```

Check the current [Convex + Vercel guide](https://docs.convex.dev/production/hosting/vercel) and [Convex Auth production docs](https://labs.convex.dev/auth/production) if any step differs.

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
| `PRODUCT_RESULTS_LIMIT` | 20 | Products one Price History search returns; in `src/domain/price-history.ts` |
| `ITEM_SUGGESTIONS_LIMIT` | 8 | Item name suggestions shown while entering an item; in `src/domain/price-history.ts` |
| `MAX_PRODUCT_SEARCH_LENGTH` | 80 | Characters in a Price History search (at least 2 to search); in `src/domain/price-history.ts` |
| `MAX_OBSERVATIONS` | 200 | Price records shown for one product, newest first (changes are still computed over all of them); in `src/domain/price-history.ts` |
| `MAX_ITEMS_PER_TRIP` | 200 | Items on one bill |
| `MAX_PEOPLE_PER_TRIP` | 20 | People on one bill, including the owner |
| `INVITATION_LIST_LIMIT` | 50 | Invitations shown on Invitations → Received and Sent (the nav badge shows "50+"); in `convex/invitations.ts` |

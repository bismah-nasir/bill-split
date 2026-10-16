# BillSplit & Price History — Build Plan

This is the complete, self-contained build plan for **BillSplit & Price History**. An implementing agent should be able to build the whole application from this file alone. It replaces `PRD.md` for implementation purposes. The repository's own `RULES.md`, `design/tokens.css` and `design/fonts.ts` stay binding and are summarised in [§6](#6-repository-rules-binding).

The plan is split into **phases**. Each phase is a **vertical slice**: it delivers one user-visible capability end-to-end (UI + Convex backend + authorization + tests). At the end of every phase the app runs, the new capability works for real users against the real backend, and everything built earlier still works. Do not start a phase until the previous phase's verification checklist passes.

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [Scope](#2-scope)
3. [Terminology](#3-terminology)
4. [Functional requirements](#4-functional-requirements)
5. [Non-functional requirements (privacy, security, quality)](#5-non-functional-requirements)
6. [Repository rules (binding)](#6-repository-rules-binding)
7. [Tech stack](#7-tech-stack)
8. [Technical architecture](#8-technical-architecture)
9. [Data model (Convex schema)](#9-data-model-convex-schema)
10. [Domain rules: money, normalization, validation](#10-domain-rules)
11. [Backend API (Convex functions)](#11-backend-api-convex-functions)
12. [Screens and UX](#12-screens-and-ux)
13. [Testing strategy](#13-testing-strategy)
14. [How to execute this plan (instructions for the agent)](#14-how-to-execute-this-plan)
15. [Build phases](#15-build-phases)
    - [Phase 0 — Project setup and design-system foundation](#phase-0--project-setup-and-design-system-foundation)
    - [Phase 1 — Sign-up, sign-in, app shell and username onboarding](#phase-1--sign-up-sign-in-app-shell-and-username-onboarding)
    - [Phase 2 — Profile and settings with verified contact sync](#phase-2--profile-and-settings-with-verified-contact-sync)
    - [Phase 3 — Create and view a private bill; dashboard recent bills](#phase-3--create-and-view-a-private-bill-dashboard-recent-bills)
    - [Phase 4 — Edit and delete a saved bill](#phase-4--edit-and-delete-a-saved-bill)
    - [Phase 5 — Invitations and shared read access](#phase-5--invitations-and-shared-read-access)
    - [Phase 6 — Splitting items between participants](#phase-6--splitting-items-between-participants)
    - [Phase 7 — Bill History: search, filter, sort](#phase-7--bill-history-search-filter-sort)
    - [Phase 8 — Item Price History](#phase-8--item-price-history)
    - [Phase 9 — Item suggestions while entering items](#phase-9--item-suggestions-while-entering-items)
    - [Phase 10 — Dashboard spending summary](#phase-10--dashboard-spending-summary)
    - [Phase 11 — Hardening, full acceptance pass, production deployment](#phase-11--hardening-full-acceptance-pass-production-deployment)
    - [Phase 12 (optional, P1) — Price chart and printable bill](#phase-12-optional-p1--price-chart-and-printable-bill)
16. [Final acceptance criteria (MVP)](#16-final-acceptance-criteria-mvp)

---

## 1. Product overview

**BillSplit & Price History** is a private, account-based web application where people can:

1. **Record a bill.** Every shopping trip, grocery run or restaurant order is saved as its own independent **trip/bill**, with a date, store, category, items and prices.
2. **Split it fairly by item.** Each item is assigned to one person, who pays all of it, or shared **equally** between several people. The app calculates each person's share exactly, to the paisa.
3. **Share a bill only with the people involved.** The owner invites friends who already have accounts, by username, registered email or verified phone. A friend sees the bill only after accepting the invitation. Solo bills stay private.
4. **Search past bills.** A searchable, filterable history of the bills you own and the bills shared with you.
5. **Compare item prices over time.** Every saved item price is kept as a dated observation, so users can see how the price of, for example, a 1-litre cooking oil changed across dates and stores. Only bills the user is allowed to see are used.

**Problem it solves:** working out who owes what after a shared trip is error-prone, and an equal split is often unfair. Paper receipts and chat messages are also hard to search later, so people can't easily tell whether prices have gone up.

**Goals**

1. Creating and saving a bill (date, store, items, prices, participants) is quick.
2. Each participant's share is calculated automatically and exactly.
3. A bill can be shared with invited friends without exposing any other private bill.
4. Separate bills stay separate historical records.
5. Old bills are easy to find, and item prices can be compared over time.
6. The app is simple to understand and works well on mobile.

**Currency:** Pakistani rupees only (PKR, displayed as `Rs. 1,234.56`).

**Main scenarios**

- *Solo shopper:* Maryam buys groceries alone and records the bill. Only Maryam can see it.
- *Friends shopping together:* Bismah creates an "Imtiaz Grocery Shopping" trip and invites Maryam. After Maryam accepts, Bismah assigns some items to herself, some to Maryam, and some to both. Both can see the full breakdown. Neither can see the other's unrelated bills.
- *Restaurant order:* a Rs. 5,000 pizza shared by three people is split Rs. 1,666.67 / Rs. 1,666.67 / Rs. 1,666.66. A Rs. 900 drink assigned only to Maryam adds Rs. 900 to Maryam's share alone.
- *Price comparison:* a user opens Price History, searches "cooking oil", picks "Cooking Oil · Dalda · 1 l", and sees every recorded price with its date and store, plus the change from the previous entry.

---

## 2. Scope

### 2.1 In scope (MVP, P0)

- Authentication and account identity (Clerk), unique app username, verified email/phone lookup.
- Private trips with owner-based access control.
- Trip creation and item entry.
- Item assignment and an exact equal-split calculation.
- Accurate bill and participant totals.
- Invitations: send, accept, decline, cancel, remove participant, and shared **read-only** access.
- Bill History with search, filters, sort and bounded pagination.
- Basic Item Price History from accessible saved bills.
- Backend-enforced authorization and core automated tests.

### 2.2 Included P1 items (after P0 works, in this plan as later phases)

- Item-name suggestions while entering items (Phase 9).
- A dashboard spending summary with clearly defined meanings (Phase 10).
- Optional: a price-over-time chart and a printable bill summary (Phase 12).

### 2.3 Out of scope (do not build)

- Payments, bank connections, reimbursements or settlement tracking.
- Separate tax, tip, service-charge, delivery-fee or discount lines. Item prices are final and include tax.
- Unequal or percentage splits. A shared item is always split equally.
- Several receipts bundled into one trip. One trip is one bill.
- Public bills, public profiles or a public user directory.
- Inventory, budgeting, recurring purchases, receipt scanning/OCR.
- Global price sharing between unrelated accounts.
- Multi-currency.
- Editing by participants. Only the owner edits.
- Email or SMS invitation notifications. Invitations are in-app only, and the UI must never claim an email or SMS was sent.
- **AI features.** The product has none. Do not add any LLM integration. (RULES.md §4 covers AI failure handling and applies only if an AI feature is approved later.)

---

## 3. Terminology

Use **"Bill"** as the main word in the UI, with "trip" only where it reads naturally (for example "Imtiaz Grocery trip"). Pick one consistent label per screen: navigation says **Bills**, the button says **New bill**, the page title says **Bill details**. In code, the entity is `trip`.

| Term | Meaning |
|---|---|
| User | A person with an authenticated account. |
| Trip / Bill | One independent purchase event with exactly one bill. |
| Owner | The user who created the trip. Only the owner manages contents and participants. |
| Participant | A user whose invitation to the trip is **accepted**. The owner is always a participant. |
| Invitee | A user with a **pending** invitation. They have no access to the trip's contents. |
| Item | One line on the bill. |
| Assignees | The one or more participants responsible for an item. |
| Allocation / share | The exact paisa amount of an item charged to one assignee. A participant's share is the sum of their allocations. |
| Price observation | One saved item record (unit price on a dated bill), used in Price History. |
| Product match key | A deterministic key built from the normalized name, brand, variant, pack size and unit. It identifies "the same product" for price comparison. |

---

## 4. Functional requirements

### 4.1 Accounts and profile

- Every app screen and data request requires sign-in. Only the landing, sign-in and sign-up pages are public.
- Sign-up/sign-in is handled by Clerk with email, plus an optional phone number. Clerk verifies the email and phone.
- After first sign-in, the user picks a **unique app username** (onboarding). The app can't be used without one.
- Users can view and edit their username in **Settings**, and see their verified email and verified phone. Email and phone are managed through Clerk's account UI.
- Users can sign out.

### 4.2 Dashboard

- A prominent **New bill** action.
- **Recent bills:** the 5 most recent bills by bill date that the user owns or has accepted. Each card shows the title, store, date, category, total, participant usernames and an **Owned / Shared with you** badge.
- Links to Bill History and Price History.
- (Phase 10) A spending summary for a selected month that shows two separately labelled figures: **"Your share"** (the sum of the user's allocations) and **"Bills you created"** (the sum of totals of bills the user owns). The two are never mixed.
- Never shows anything from bills the user can't access.

### 4.3 Create a bill

Fields:

| Field | Rule |
|---|---|
| Title | Required, 1–80 characters (trimmed). |
| Store / merchant | Optional, up to 60 characters. |
| Date | Required, `YYYY-MM-DD`. Defaults to today in the browser's local timezone. Editable. |
| Category | Required: Grocery, Restaurant, Shopping or Other. Default: Grocery. |
| Items | 1–200 rows (see 4.4). |
| Participants | The owner is added automatically. Friends are invited after saving, from the bill page (Phase 5). |

Before saving, the owner reviews a **summary** (4.6), then saves.

### 4.4 Items

| Field | Rule |
|---|---|
| Name | Required, 1–80 characters. |
| Brand | Optional, up to 40 characters. |
| Variant | Optional, up to 40 characters (for example "Extra virgin"). |
| Pack size | Optional, up to 40 characters (for example "1 litre", "500 g"). |
| Unit | Optional, up to 40 characters (for example item, kg, litre, pack). |
| Quantity | Required, default `1`, > 0, ≤ 100,000, at most 3 decimal places. |
| Unit price (Rs.) | Required, ≥ 0, ≤ 10,000,000.00, at most 2 decimal places. Commas allowed in input. A price of 0 is allowed and shown with a "Free" badge. |
| Line total | Calculated: quantity × unit price, rounded to the nearest paisa (half-up). Shown on every row. |
| Assignees | At least 1. Each must be an **eligible participant** (the owner or an accepted participant). One assignee pays the full line total; several split it equally. |

The owner can add, edit and remove rows before saving and when editing. A user who only knows an item's final total enters quantity `1` and that total as the unit price; the UI says so in a hint. Saving is blocked while any field is invalid, and every invalid field shows an inline message.

### 4.5 Splitting rules (authoritative)

1. The owner is always a participant.
2. Each item has ≥ 1 assignee, and every assignee is an eligible participant of **that** trip.
3. One assignee → that person is charged the whole line total.
4. Several assignees → the line total is divided equally.
5. Nobody outside the trip's eligible participants can be assigned.
6. A participant's share = the sum of their allocations across all items.
7. Trip total = the sum of all line totals.
8. The sum of all shares **equals** the trip total exactly.
9. All money is integer **paisa** (Rs. 1 = 100 paisa). Never use floating-point arithmetic for money.
10. Uneven division: `base = floor(lineTotal / n)` and `remainder = lineTotal − base × n`. Sort the assignee user IDs ascending (string order). The first `remainder` assignees get `base + 1` and the rest get `base`. This rule is documented in code.
11. Saving or editing one trip never changes any other trip's data.

Worked example: a pizza at Rs. 5,000.00 (500,000 paisa) split between 3 people gives base 166,666 and remainder 2, so the shares are 166,667 / 166,667 / 166,666, which is Rs. 1,666.67 / 1,666.67 / 1,666.66 and sums to Rs. 5,000.00.

### 4.6 Bill summary (review before save) and bill details

Both views show:

- The title, store, date, category and participants (usernames).
- Every item: name and details, quantity, unit price, line total and assignees (with each assignee's amount).
- The **total bill amount**.
- **Each participant's share**, expandable to the items that make it up (for example "Pizza: Rs. 1,666.67 (split 3 ways)").
- A reconciliation indicator: ✓ "Shares add up to the bill total". If they ever don't, show an error. This should never happen.

On the saved bill page, an accepted participant sees everything except the owner-only controls, and their own share is highlighted ("Your share").

### 4.7 Invitations and access

- The owner invites a person by **username**, **registered (verified) email** or **verified phone number**, from the bill page.
- The identifier is normalized and matched **exactly** against an indexed field. No partial matching, no user directory, no listing of users.
- A successful invitation creates a **pending** participant record tied to that one trip. The response contains only the invitee's username. It never contains their email or phone.
- An unmatched lookup returns one generic message: "No account matches that {username/email/phone}. Ask your friend to sign up and finish setting up their account." Accounts without a username, deleted accounts and unverified contacts count as no match.
- Duplicate handling:
  - Already pending → error "Already invited".
  - Already accepted → error "Already a participant".
  - Previously declined, cancelled or removed → the same record is reset to **pending** (one record per trip and user, always).
  - Inviting yourself → error.
- Invitees see pending invitations on the **Invitations** page (trip title, store, date and owner username only) and can **Accept** or **Decline**.
- Access is granted **only** after accepting. Pending, declined, cancelled and removed users get no access to the trip, its items, its shares or its price observations.
- The owner sees each invitation's state (pending / accepted / declined) on the bill page and in **Invitations → Sent**. The owner can **cancel** a pending invitation and **remove** an accepted participant after confirming.
- Removing a participant revokes their access immediately. Their allocations are reassigned atomically: they are taken off shared items, and items assigned only to them are reassigned to the owner (the confirmation dialog says so).
- At most 20 participants (including the owner) plus pending invitations per trip.

**Permission model:** the owner can create, edit and delete the trip, its items and its participants. Accepted participants have read-only access. Participants can't edit, delete or invite.

### 4.8 Bill History

- Lists every trip the user owns or has accepted.
- **Search** (case-insensitive substring) across the title, store and item names.
- **Filters:** a date range (from/to), a category, and ownership (All / Created by me / Shared with me).
- **Sort:** newest date (default), oldest date, highest total, lowest total.
- Bounded pagination: 20 per page with **Load more**.
- Each row shows the same information as a dashboard card, including the Owned/Shared badge.
- Empty states:
  - No bills at all: "No bills yet", with a **New bill** button.
  - No results: "No bills match your search", with **Clear filters**.
- Filters are kept in the URL query string, so back navigation and reloads keep them.

### 4.9 Item Price History

- The user searches by item name (case-insensitive substring) and gets a list of distinct **products** (match keys) from accessible bills only. Each result shows the name, brand, variant, pack size, unit, number of observations and the latest price and date.
- Products with the same name but a different brand, variant, pack size or unit are **listed separately** and never merged. For example "Cooking Oil · 1 l" and "Cooking Oil · 5 l" are two products.
- After the user selects a product, the page lists its observations newest first. Each shows the date, item details, unit price, quantity and unit, store, trip title, a link to the bill, and the **change from the previous (older) observation**: difference in rupees and percent. Positive is an increase (↑), negative a decrease (↓), and zero is shown as "Unchanged". The oldest observation shows "First record".
- Under the list, the page shows "Other variants of '{name}'" (same normalized name, different key) with the note "Different pack size, unit or variant, so not compared directly".
- Price history is derived from saved item records. There is no "current price" field.
- Records from inaccessible trips must not affect any result, count or comparison.

### 4.10 Edit and delete

- The owner can edit the details and items of a saved trip. Changes affect only that trip, and its price observations update with it.
- The owner can delete a trip after confirming. Deletion removes the trip, its items, assignments and participant records in one transaction. Access is revoked, and the trip disappears from history, dashboards and price history for everyone.
- Participants see no edit or delete controls, and the backend rejects any attempt.

---

## 5. Non-functional requirements

### 5.1 Privacy and security (core requirements)

- Authentication is required for every private page **and** every Convex query and mutation.
- **Authorization is enforced in Convex functions**, never only in the UI. Route protection in Next.js is for convenience only.
- Every public Convex function derives the caller from `ctx.auth.getUserIdentity()` and never trusts a client-supplied user ID.
- A trip is readable only by its owner and its **accepted** participants. Guessed or modified IDs fail safely. "Not found" and "no access" return the **same** response (`null` for queries, `NOT_FOUND` for mutations), so the API doesn't reveal whether a record exists.
- Assignments are validated server-side against the trip's eligible participants.
- Emails and phone numbers are never shown to other users. Participants see each other's usernames only.
- No API returns a list of users, another user's trip list, item catalogue or price history.
- Secrets (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, deploy keys) are never in client code. Only `NEXT_PUBLIC_*` variables reach the browser.
- Error messages are friendly. No stack traces, tokens or internal IDs are shown to users.
- The Clerk webhook signature is verified before any processing.

### 5.2 Quality

- TypeScript `strict`. `npm run typecheck`, `npm run lint` and `npm test` must pass at the end of every phase.
- Responsive and mobile-first: test at 360 px, 768 px and 1280 px widths. No horizontal scroll.
- Accessible: every input has a label, errors are linked with `aria-describedby`, focus states are visible, dialogs are keyboard-operable with focus trapping (Radix), live totals use `aria-live="polite"`, colour is never the only signal (pair icons/text with colour), and tap targets are ≥ `size-tap`.
- Every data view has loading, empty and error states.
- When a save fails because of the network or server, the form keeps its data and shows a retry message.
- List queries are bounded. No unbounded `.collect()` over a table.
- Motion is intentional and subtle: dialogs, row add/remove and toasts only, using the duration/ease tokens, wrapped in `motion-safe:`.

---

## 6. Repository rules (binding)

These come from `RULES.md` at the repo root. Re-read that file if anything here seems unclear. The design files are the source of truth for values.

### 6.1 No hard-coded styling values

- Every colour, size, spacing step, radius, shadow, font and motion value comes from `design/tokens.css`. **No** arbitrary Tailwind values (`p-[13px]`), **no** hex/rgb/hsl literals, **no** inline `style` attributes. If a token is missing, add it to `design/tokens.css`.
- `tokens.css` uses `@theme static { --*: initial; ... }`. This **removes all Tailwind default theme values**, so default classes like `bg-white`, `text-gray-500`, `p-3`, `rounded-md`, `shadow-md` or `animate-spin` silently produce nothing. Use only the token classes:
  - **Text styles:** `type-display`, `type-display-sm`, `type-h1`, `type-h2`, `type-h3`, `type-body`, `type-body-medium`, `type-body-sm`, `type-caption`, `type-overline`, `type-button`, `type-button-sm`, `type-numeric`, `type-numeric-lg`. Colour isn't baked in: add `text-ink-secondary` for `body-sm`, and `text-ink-muted` for captions and overlines.
  - **Spacing** uses point keys: `p-16` = 1rem, `gap-8` = 0.5rem. The available keys are `0 2 4 6 8 10 12 14 16 20 24 28 32 40 48 56 72 96`.
  - **Component sizes:** `h-control-lg|md|sm`, `size-tap-sm|tap|tap-lg`, `size-bubble`, `size-avatar-xl`, `size-icon-xs|sm|md|lg|xl|xxl`.
  - **Colours:** `bg-background`, `bg-surface`, `bg-surface-elevated`, `bg-surface-subtle`, `bg-surface-muted`, `bg-primary`, `bg-primary-pressed`, `bg-primary-soft`, `accent-*` and `accent-*-soft` (cyan, blue, purple, violet, green, yellow, red, pink, navy), `text-ink`, `text-ink-secondary`, `text-ink-muted`, `text-ink-inverse`, `success`/`error`/`warning` and their `-soft` variants, `border-line`, `border-line-strong`, `bg-overlay`.
  - **Radius:** `rounded-xs|sm|md|lg|xl|pill`. **Shadow:** `shadow-subtle|card|floating|raised`.
  - **Fonts:** `font-display`, `font-heading`, `font-body`, `font-numeric`. **Weights:** `font-regular|medium|semibold|bold`.
  - **Breakpoints:** `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem. **Max content width:** `max-w-content` (48rem).
  - **Motion:** `duration-fast|base|slow|xslow`, `ease-standard|emphasized|bounce-out`.
  - Built-in static utilities still work: `flex`, `grid`, `w-full`, `min-h-dvh`, `bg-transparent`, `border`, `sr-only`, `z-10`, `opacity-50` and so on.
- Fonts are loaded in `design/fonts.ts`. Apply `fontVariables` to `<html>`.
- ESLint enforces this (configured in Phase 0).

### 6.2 Reusable components

- Any UI that appears more than once (or clearly will) becomes a component. Check for an existing component before creating one, and extend it with props (`variant`, `size`, …) rather than making near-duplicates.
- Shared components live in `src/components/`. A component used by a single route lives next to it in `src/app/<route>/_components/`.

### 6.3 External services in one place

- All code that talks to an external service lives in **one folder per service**:
  - `src/lib/db/` is the **only** frontend code that imports `convex/react`, `convex/react-clerk` or `convex/_generated/*`. It exports hooks such as `useRecentTrips()` and `useCreateTrip()` that return **plain app types** (IDs as `string`).
  - `src/lib/auth/` is the **only** frontend code that imports `@clerk/*`. It exports the provider, components (`SignInView`, `SignUpView`, `AccountProfile`, `UserMenu`), hooks and the middleware factory.
  - `convex/` is the backend for the Convex service. Clerk webhook parsing lives in `convex/lib/clerkWebhook.ts`.
- Pages and components never import an SDK directly and never contain queries.
- Environment variables are read only inside these folders.
- ESLint `no-restricted-imports` enforces this (Phase 0/1).

### 6.4 Other principles

- Use animation intentionally. Don't add unnecessary UI elements.
- **Keep business logic separate from UI.** Money, splitting, normalization, validation and price-change logic live in `src/domain/` as pure TypeScript (no React, Next, Convex or Clerk imports). Both the UI (for live previews) and Convex (authoritative) import them. The PRD's suggested location of `convex/lib/money.ts` is replaced by `src/domain/money.ts` to satisfy RULES §3 and §5. Convex functions import domain code with **relative** paths (for example `../src/domain/money`).

---

## 7. Tech stack

Use the **current stable** versions at implementation time, and follow the official integration guides rather than old tutorials. Don't pin versions copied from examples.

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (`strict: true`) | Shared types across UI, domain and backend. |
| Web framework | Next.js (App Router, `src/` dir) | Server Components by default, Client Components for interactivity. |
| Styling | Tailwind CSS v4 + `design/tokens.css` | Tokens only (see §6.1). |
| UI primitives | shadcn/ui, **added selectively**: `button`, `dialog`, `alert-dialog`, `select`, `dropdown-menu`, `popover`, `command` | Generated code must be rewritten to use token classes. |
| Icons | `lucide-react` | Sized with `size-icon-*`. |
| Auth | Clerk (`@clerk/nextjs`) | Sign-up/in, sessions, email/phone verification, account UI. |
| Backend + DB | Convex | Schema, queries, mutations, HTTP action for the Clerk webhook, reactive updates. |
| Webhook verification | `svix` | Verifies Clerk webhook signatures inside the Convex HTTP action. |
| Testing | Vitest, `convex-test`, `@edge-runtime/vm` | Unit tests for the domain, backend tests for functions and permissions. |
| Hosting | Vercel (Next.js) + Convex cloud (backend) | Separate dev and prod Clerk/Convex instances. |

**Do not add:** PostgreSQL, Prisma, Express, Next.js API routes for CRUD, Redux/Zustand, Redis, queues, a search service, a second auth system, form libraries, zod (Convex validators plus domain validators are enough), date libraries, chart libraries (except optionally in Phase 12), or any AI SDK.

---

## 8. Technical architecture

### 8.1 Overview

```text
Browser (Next.js client components)
   │  useQuery / useMutation (via src/lib/db hooks)          Clerk UI (via src/lib/auth)
   ▼                                                              │
Convex (queries, mutations)  ◄── JWT from Clerk (ctx.auth) ───────┘
   │  convex/lib/auth.ts  → requireCurrentUser / requireTripViewer / requireTripOwner
   │  src/domain/*        → money, normalization, validation (pure, shared)
   ▼
Convex database (users, trips, tripParticipants, items, itemAssignments)
   ▲
Clerk webhook ─► convex/http.ts (svix-verified) ─► internal mutation users.upsertFromClerk
```

- **Convex is the whole backend.** All reads are Convex queries and all writes are Convex mutations. There are no Next.js route handlers (`src/app/api/` must not exist).
- **Mutations are transactions.** A save writes the trip, items and assignments atomically. Convex mutations are serializable, so "check, then insert" uniqueness checks (usernames, invitations) are race-safe. Concurrent conflicting writes are retried by Convex automatically.
- **Next.js middleware/proxy** (Clerk) redirects signed-out users away from app routes. It is **not** the security boundary.
- **Reactivity:** Convex subscriptions keep the dashboard, a bill page and the invitations inbox live without polling.

### 8.2 Frontend architecture

- `src/app/layout.tsx` (Server Component) sets fonts and global CSS and wraps the app in `AuthProvider` (Clerk) and then `DbProvider` (Convex with Clerk).
- Route groups:
  - `(public)`: landing.
  - `(auth)`: sign-in and sign-up.
  - `(onboarding)`: username setup.
  - `(app)`: everything behind the app shell.
- `(app)/layout.tsx` renders `AppShell` (header, desktop nav, mobile bottom nav, user menu) and `AccountGate`. `AccountGate` makes sure the Convex user row exists and redirects to `/onboarding` if the user has no username.
- Pages are thin Server Components that read `params`/`searchParams` (both are Promises in current Next.js, so `await` them) and render a client component that calls `src/lib/db` hooks.
- Form state is local `useState`/`useReducer` in the form component. There is no global store.
- Client-side calculations exist only for **preview**. The server always re-parses, re-validates and recomputes.

### 8.3 Backend architecture

- Functions are organised by feature: `users.ts`, `trips.ts`, `invitations.ts`, `items.ts`, `priceHistory.ts`, `http.ts`.
- Shared backend helpers live in `convex/lib/`:
  - `auth.ts`:
    - `getCurrentUser(ctx)` returns the user row or `null`.
    - `requireCurrentUser(ctx)` throws `UNAUTHENTICATED`.
    - `requireOnboardedUser(ctx)` throws `ONBOARDING_REQUIRED` if there is no username.
    - `getTripAccess(ctx, tripId, userId)` returns `{ trip, role: "owner" | "participant" } | null`.
    - `requireTripViewer(ctx, tripId)` and `requireTripOwner(ctx, tripId)` throw `NOT_FOUND` for missing **or** inaccessible trips. `requireTripOwner` throws `FORBIDDEN` only when the caller is an accepted participant but not the owner.
  - `access.ts`: `listAccessibleTrips(ctx, userId, cap)` reads the `tripParticipants` rows with `by_user_status = [userId, "accepted"]` (newest first, `take(cap)`), loads their trips and sorts them by `tripDate` desc then `createdAt` desc. Because the owner always has an accepted `owner` row, this covers owned **and** shared trips.
  - `tripWrite.ts`: shared create/update logic. It parses, validates, computes and writes items and assignments, recomputes `totalPaisa`, `itemCount` and `searchText`, and handles reassignment on participant removal.
  - `readModels.ts`: builds `TripCard` and `TripDetail` response objects and returns only the fields the screen needs.
  - `errors.ts`: `appError(code, message, fieldErrors?)` returns a `ConvexError`.
  - `clerkWebhook.ts`: maps a Clerk user payload to `{ clerkUserId, verifiedEmailNormalized?, verifiedPhoneE164? }`.
- Every public function validates `args` with Convex validators **and** domain rules.
- Trip IDs arriving from URLs are accepted as `v.string()` and converted with `ctx.db.normalizeId("trips", id)`. A malformed ID returns `null` or `NOT_FOUND`, never a crash.

**Bounded-read constants** (defined in `convex/lib/access.ts` and documented in the README as MVP limits):

| Constant | Value | Used by |
|---|---|---|
| `ACCESSIBLE_TRIPS_CAP` | 1000 | Dashboard, history, price observations, summary |
| `PRODUCT_SEARCH_TRIPS_CAP` | 300 | Product search and suggestions (items of the 300 most recent accessible trips) |
| `RECENT_TRIPS_LIMIT` | 5 | Dashboard |
| `HISTORY_PAGE_SIZE` | 20 | Bill History "Load more" step |
| `MAX_ITEMS_PER_TRIP` | 200 | Validation |
| `MAX_PARTICIPANTS_PER_TRIP` | 20 | Invitations (owner + accepted + pending) |

**Why there is no global item index scan:** price history and product search read items only through the user's accessible trips (index `by_trip_productMatchKey` / `by_trip`). Other users' records are never touched, so they can't influence results. If real data volume makes this slow, a user-scoped materialized index can be added later, after measuring.

### 8.4 Error contract

Backend errors are `ConvexError({ code, message, fieldErrors? })`. The codes live in `src/domain/errors.ts`:

| Code | When | UI behaviour |
|---|---|---|
| `UNAUTHENTICATED` | No identity | Redirect to sign-in |
| `ONBOARDING_REQUIRED` | No username yet | Redirect to `/onboarding` |
| `NOT_FOUND` | Missing **or** inaccessible record | "This bill doesn't exist or you don't have access." |
| `FORBIDDEN` | A participant tries an owner-only action | "Only the bill owner can do that." |
| `VALIDATION` | Domain validation failed; `fieldErrors` keyed like `title`, `items.3.unitPrice`, `items.3.assignees` | Show inline errors and keep form data |
| `USERNAME_TAKEN`, `USERNAME_INVALID` | Username rules | Inline under the field |
| `INVITE_NO_MATCH`, `INVITE_ALREADY_PENDING`, `INVITE_ALREADY_PARTICIPANT`, `INVITE_SELF`, `TRIP_PARTICIPANT_LIMIT` | Invitations | Inline in the invite dialog |
| `INVITATION_NOT_PENDING` | Responding to or cancelling a non-pending invitation | Toast/inline + list refresh |

`src/lib/db/errors.ts` exports `toAppError(error)`. It returns `{ code, message, fieldErrors }`, and for unknown errors falls back to `{ code: "UNKNOWN", message: "Something went wrong. Please try again." }`.

### 8.5 Folder structure (target)

```text
project-root/
├── design/
│   ├── tokens.css                  # existing — single source of styling values
│   └── fonts.ts                    # existing — next/font setup
├── docs/BUILD_PLAN.md
├── convex/
│   ├── schema.ts
│   ├── auth.config.ts
│   ├── http.ts                     # Clerk webhook (svix-verified)
│   ├── users.ts
│   ├── trips.ts
│   ├── invitations.ts
│   ├── items.ts                    # item suggestions
│   ├── priceHistory.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── access.ts
│   │   ├── tripWrite.ts
│   │   ├── readModels.ts
│   │   ├── errors.ts
│   │   └── clerkWebhook.ts
│   └── _generated/                 # Convex CLI output — never edit
├── src/
│   ├── proxy.ts                    # or middleware.ts, per installed Next.js major
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── (public)/page.tsx
│   │   ├── (auth)/sign-in/[[...sign-in]]/page.tsx
│   │   ├── (auth)/sign-up/[[...sign-up]]/page.tsx
│   │   ├── (onboarding)/onboarding/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx
│   │       ├── error.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── trips/page.tsx                 # Bill History
│   │       ├── trips/new/page.tsx
│   │       ├── trips/[tripId]/page.tsx
│   │       ├── trips/[tripId]/edit/page.tsx
│   │       ├── invitations/page.tsx
│   │       ├── price-history/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── ui/          # button, text-field, select, dialog, confirm-dialog, badge, card,
│   │   │                # empty-state, error-state, loading-state, alert, segmented-control,
│   │   │                # search-input, money-text
│   │   ├── layout/      # app-shell, nav-link, page-header, page-container
│   │   ├── trips/       # trip-form, item-editor, item-row, participant-picker,
│   │   │                # trip-summary, participant-shares, trip-card, participant-list,
│   │   │                # invite-dialog, item-name-combobox
│   │   ├── bills/       # bill-history-filters
│   │   ├── invitations/ # invitation-list
│   │   ├── price-history/ # product-search, price-history-list, price-change
│   │   └── dashboard/   # spending-summary
│   ├── domain/          # PURE TS — no react/next/convex/clerk imports
│   │   ├── money.ts
│   │   ├── format.ts
│   │   ├── normalization.ts
│   │   ├── trip-validation.ts
│   │   ├── price-change.ts
│   │   ├── categories.ts
│   │   ├── errors.ts
│   │   └── types.ts
│   └── lib/
│       ├── utils.ts                 # cn()
│       ├── db/                      # ONLY place importing convex client/_generated
│       │   ├── client.ts            # ConvexReactClient + env check
│       │   ├── provider.tsx         # ConvexProviderWithClerk
│       │   ├── ids.ts               # string <-> Id<> casts
│       │   ├── errors.ts            # toAppError
│       │   ├── users.ts
│       │   ├── trips.ts
│       │   ├── invitations.ts
│       │   └── price-history.ts
│       └── auth/                    # ONLY place importing @clerk/*
│           ├── provider.tsx
│           ├── components.tsx
│           ├── hooks.ts
│           ├── server.ts
│           └── middleware.ts
├── tests/
│   ├── unit/            # domain tests (node env)
│   └── convex/          # convex-test backend tests (edge-runtime env)
│       └── helpers.ts
├── .env.example
├── eslint.config.mjs
├── vitest.config.mts
├── tsconfig.json
├── package.json
└── README.md
```

### 8.6 Environment variables

`.env.local` (never committed) and `.env.example` (placeholders, committed):

```dotenv
# Convex (written by `npx convex dev`; keep as the CLI writes it)
CONVEX_DEPLOYMENT=dev:<generated>
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<from-clerk>
CLERK_SECRET_KEY=sk_test_<from-clerk>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

Convex deployment environment (set with `npx convex env set NAME value`, **never** in `.env.local`):

```dotenv
CLERK_JWT_ISSUER_DOMAIN=https://<your-clerk-frontend-api-domain>   # Phase 1
CLERK_WEBHOOK_SECRET=whsec_<from-clerk-webhook-endpoint>            # Phase 2
```

`src/lib/db/client.ts` throws a clear error naming the variable (`"NEXT_PUBLIC_CONVEX_URL is not set. Run npx convex dev."`) if a required value is missing. It never prints the values themselves. Production uses separate Clerk and Convex instances (Phase 11).

---

## 9. Data model (Convex schema)

This is the **final** schema. Each phase adds the tables it needs (marked). All timestamps are `Date.now()` milliseconds. Money is integer paisa. Quantity is an integer number of **thousandths** (`quantityMilli`, so 1.5 kg is 1500).

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const categoryValidator = v.union(
  v.literal("grocery"), v.literal("restaurant"), v.literal("shopping"), v.literal("other"),
);
export const participantStatusValidator = v.union(
  v.literal("pending"), v.literal("accepted"), v.literal("declined"),
  v.literal("cancelled"), v.literal("removed"),
);

export default defineSchema({
  // Phase 1 (lookup fields filled in Phase 2)
  users: defineTable({
    clerkUserId: v.string(),
    username: v.optional(v.string()),              // as typed by the user
    usernameNormalized: v.optional(v.string()),    // lowercase, used for uniqueness/lookup
    verifiedEmailNormalized: v.optional(v.string()),
    verifiedPhoneE164: v.optional(v.string()),     // only stored when verified in Clerk
    deletedAt: v.optional(v.number()),             // set by user.deleted webhook
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_usernameNormalized", ["usernameNormalized"])
    .index("by_verifiedEmail", ["verifiedEmailNormalized"])
    .index("by_verifiedPhone", ["verifiedPhoneE164"]),

  // Phase 3
  trips: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    storeName: v.optional(v.string()),
    tripDate: v.string(),                          // "YYYY-MM-DD", date-only, never timezone-converted
    category: categoryValidator,
    currency: v.literal("PKR"),
    totalPaisa: v.number(),                        // kept consistent with items in the same mutation
    itemCount: v.number(),
    searchText: v.string(),                        // normalized "title store item1 item2 …" for history search
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_date", ["ownerId", "tripDate"]),

  // Phase 3 (owner row), Phase 5 (invitations)
  tripParticipants: defineTable({
    tripId: v.id("trips"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("participant")),
    status: participantStatusValidator,
    invitedByUserId: v.id("users"),
    invitedVia: v.optional(v.union(v.literal("username"), v.literal("email"), v.literal("phone"))),
    // NOTE: the raw identifier typed by the inviter is NOT stored (data minimisation).
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_trip_user", ["tripId", "userId"])        // exactly one row per (trip, user) — enforced in mutations
    .index("by_trip_status", ["tripId", "status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_invitedBy_status", ["invitedByUserId", "status"]),

  // Phase 3
  items: defineTable({
    tripId: v.id("trips"),
    position: v.number(),                          // display order 0..n-1
    name: v.string(),
    normalizedName: v.string(),
    brand: v.optional(v.string()),
    variant: v.optional(v.string()),
    packSize: v.optional(v.string()),
    unit: v.optional(v.string()),
    productMatchKey: v.string(),
    quantityMilli: v.number(),
    unitPricePaisa: v.number(),
    lineTotalPaisa: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trip", ["tripId", "position"])
    .index("by_trip_productMatchKey", ["tripId", "productMatchKey"]),

  // Phase 3
  itemAssignments: defineTable({
    tripId: v.id("trips"),
    itemId: v.id("items"),
    userId: v.id("users"),
    allocatedAmountPaisa: v.number(),
  })
    .index("by_item", ["itemId"])
    .index("by_trip_user", ["tripId", "userId"]),  // prefix [tripId] = all assignments of a trip
});
```

**Invariants (enforced in mutations, covered by tests):**

1. Each trip has exactly one `tripParticipants` row with `role: "owner"`, `status: "accepted"` and `userId = trip.ownerId`.
2. There is at most one `tripParticipants` row per `(tripId, userId)`. Re-invites reuse the row.
3. `trip.totalPaisa = Σ items.lineTotalPaisa`.
4. For each item, `Σ itemAssignments.allocatedAmountPaisa = item.lineTotalPaisa`, with ≥ 1 assignment.
5. Every assignment's `userId` has an accepted participant row on the same trip.
6. `usernameNormalized`, `verifiedEmailNormalized` and `verifiedPhoneE164` are unique across non-deleted users. Usernames are checked in `setUsername`. Email and phone come from Clerk, which guarantees uniqueness per instance. On a conflict the webhook clears the field from the older row.
7. Deleting a trip deletes all of its participants, items and assignments in the same mutation, leaving no orphans.

---

## 10. Domain rules

All of this lives in `src/domain/` as pure functions with unit tests. Both the UI and Convex import them.

### 10.1 `money.ts`

```ts
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** "1,250.5" -> 125050. Accepts digits with optional commas and up to 2 decimals. */
export function parseRupeesToPaisa(input: string): Result<number>;
// Rules: trim; remove commas; must match /^\d{1,8}(\.\d{1,2})?$/; value <= 1_000_000_000 paisa (Rs. 10,000,000.00).
// Build paisa from the integer and fraction parts as strings (no float math). Errors:
// "Enter a price", "Enter a valid amount, e.g. 250 or 250.50", "Price is too large".

/** "1.5" -> 1500. Up to 3 decimals, > 0, <= 100000. */
export function parseQuantityToMilli(input: string): Result<number>;
// Errors: "Enter a quantity", "Quantity must be greater than 0", "Use up to 3 decimal places", "Quantity is too large".

/** Line total in paisa, rounded half-up. Uses BigInt (construct with BigInt(n) — no `n` literals,
 *  so it compiles under the project's TS target). */
export function lineTotalPaisa(quantityMilli: number, unitPricePaisa: number): number;
// = Number((BigInt(q) * BigInt(p) + BigInt(500)) / BigInt(1000))

/**
 * Deterministic equal allocation. Sort userIds ascending (localeCompare is NOT used; plain < compare),
 * give floor(total/n) to each, and +1 paisa to the first (total % n) ids.
 * Throws if userIds is empty or contains duplicates.
 */
export function allocateEqually(totalPaisa: number, userIds: string[]): { userId: string; amountPaisa: number }[];

export type BillItemInput = { quantityMilli: number; unitPricePaisa: number; assigneeIds: string[] };
export type ComputedBill = {
  items: { lineTotalPaisa: number; allocations: { userId: string; amountPaisa: number }[] }[];
  totalPaisa: number;
  shares: { userId: string; totalPaisa: number; contributions: { itemIndex: number; amountPaisa: number; splitCount: number }[] }[];
  reconciled: boolean;   // Σ shares === totalPaisa
};
export function computeBill(items: BillItemInput[]): ComputedBill;
```

### 10.2 `format.ts`

- `formatPaisa(p)` returns `"Rs. 1,234.56"`, built from integer division (`Math.trunc(p / 100)`, `p % 100` padded to 2 digits). The rupee part uses `Intl.NumberFormat("en-US")` on the integer, for western grouping.
- `paisaToInput(p)` returns `"1234.56"` for edit forms. `milliToInput(q)` returns `"1.5"` (no trailing zeros).
- `formatQuantity(q, unit?)` returns `"1.5 kg"` or `"2"`.
- `todayIsoDate()` returns the local date as `YYYY-MM-DD`, from `getFullYear` / `getMonth` / `getDate`. It never uses `toISOString()`, which shifts the date to UTC.
- `formatTripDate("2026-10-16")` returns `"16 Oct 2026"`. Split the string into parts and format `new Date(Date.UTC(y, m - 1, d))` with `timeZone: "UTC"`, so the date can never shift.
- `formatPercent(x)` returns `"+12.5%"`, `"−3.0%"` or `"0%"`.

### 10.3 `normalization.ts`

- `normalizeText(s)`: NFKC, lowercase, trim, collapse internal whitespace to a single space.
- `normalizeUsername(s)` is `normalizeText` with no spaces. `isValidUsername(s)` checks `/^[a-z][a-z0-9_]{2,19}$/` on the normalized value (3–20 characters, starts with a letter).
- `normalizeEmail(s)`: trim + lowercase.
- `normalizePhone(s): string | null`:
  1. Strip spaces, `-`, `(` and `)`.
  2. A leading `00` becomes `+`.
  3. A leading `0` followed by 10 digits (Pakistan local, for example `03001234567`) becomes `+92` + the last 10 digits.
  4. A bare 10-digit number starting with `3` becomes `+92` + the number.
  5. The result must match `/^\+[1-9]\d{7,14}$/`, otherwise return `null`.
- `normalizeUnit(s)` maps synonyms after `normalizeText`:
  - `l, ltr, litre, liter, litres, liters` → `l`
  - `ml, millilitre, milliliter` → `ml`
  - `kg, kgs, kilo, kilogram, kilograms` → `kg`
  - `g, gm, gms, gram, grams` → `g`
  - `pc, pcs, piece, pieces, item, items` → `item`
  - `pack, packs, pk, packet` → `pack`
  - `dozen, dz` → `dozen`
  - anything else unchanged
- `normalizePackSize(s)`: `normalizeText`, then rewrite every `<number> <unit word>` / `<number><unit word>` token as `<number><normalizedUnit>`. For example `"1 Litre"` → `"1l"`, `"500 gm"` → `"500g"`, `"5 ltr"` → `"5l"`.
- `buildProductMatchKey({ name, brand?, variant?, packSize?, unit? })` returns `[normalizeText(name), normalizeText(brand ?? ""), normalizeText(variant ?? ""), normalizePackSize(packSize ?? ""), normalizeUnit(unit ?? "")].join("|")`. Empty fields stay as empty segments, so "Cooking Oil" with no pack size and "Cooking Oil · 1 l" are **different** keys. Ambiguous records are never merged.
- `buildTripSearchText(title, storeName, itemNames[])` returns the `normalizeText` of all of them joined by spaces.

### 10.4 `trip-validation.ts`

```ts
export type TripDetailsInput = { title: string; storeName: string; tripDate: string; category: Category };
export type ItemInput = {
  itemId?: string; name: string; brand: string; variant: string; packSize: string; unit: string;
  quantity: string; unitPrice: string; assigneeIds: string[];
};
export type ValidatedTrip = {
  details: { title: string; storeName?: string; tripDate: string; category: Category };
  items: (Omit<ItemInput, "quantity" | "unitPrice"> & { quantityMilli: number; unitPricePaisa: number })[];
};
export function validateTripInput(
  details: TripDetailsInput, items: ItemInput[], eligibleUserIds: Set<string>,
): { ok: true; value: ValidatedTrip } | { ok: false; fieldErrors: Record<string, string> };
```

Rules: the field limits in §4.3/§4.4. `tripDate` must be a real calendar date matching `/^\d{4}-\d{2}-\d{2}$/` and no later than 1 year in the future. Items must number 1–200. Each item's `assigneeIds` must be non-empty and deduplicated, and every ID must be in `eligibleUserIds` (otherwise `items.i.assignees` gets "Choose who pays for this item" or "Only participants of this bill can be assigned"). Optional strings are trimmed, and empty strings become `undefined`.

### 10.5 `price-change.ts`

```ts
export type PriceChange =
  | { kind: "first" }
  | { kind: "unchanged" }
  | { kind: "up" | "down"; diffPaisa: number; percent: number | null }; // percent null when previous = 0
/** observations sorted oldest→newest; returns a change for each vs the previous one. */
export function computePriceChanges(pricesPaisa: number[]): PriceChange[];
// percent = Math.round((diff * 1000) / previous) / 10  (one decimal)
```

### 10.6 `categories.ts`, `errors.ts`, `types.ts`

- `CATEGORIES = [{ value: "grocery", label: "Grocery" }, { value: "restaurant", label: "Restaurant" }, { value: "shopping", label: "Shopping" }, { value: "other", label: "Other" }] as const`.
- `ERROR_CODES` (§8.4).
- App types such as `CurrentUser`, `TripCard`, `TripDetail`, `InvitationReceived`, `InvitationSent`, `ProductResult`, `PriceObservation` and `SpendingSummary`, with IDs as `string`. The response shapes are in §11.

---

## 11. Backend API (Convex functions)

Every public function starts with an auth helper. "Viewer" means owner or accepted participant.

### 11.1 `users.ts`

| Function | Type | Args | Returns / behaviour |
|---|---|---|---|
| `getCurrent` | query | — | `null` if unauthenticated or there is no row yet. Otherwise `{ id, username: string \| null, verifiedEmail: string \| null, verifiedPhone: string \| null }`. Only the caller's own data. |
| `ensureCurrent` | mutation | — | Creates the row for `identity.subject` if missing. Idempotent. Returns `id`. |
| `isUsernameAvailable` | query | `{ username: string }` | `{ valid: boolean, available: boolean }`. Reveals nothing else. |
| `setUsername` | mutation | `{ username: string }` | Validates and normalizes, checks `by_usernameNormalized` (ignoring the caller's own row), patches. Errors: `USERNAME_INVALID`, `USERNAME_TAKEN`. |
| `upsertFromClerk` | **internal** mutation | `{ clerkUserId, verifiedEmailNormalized?, verifiedPhoneE164? }` | Upserts by `clerkUserId`, sets or clears the lookup fields, and clears the same email/phone from any other row (conflict rule). |
| `markDeletedFromClerk` | **internal** mutation | `{ clerkUserId }` | Sets `deletedAt` and clears the email, phone and username lookup fields, so the user can't be invited. Trips stay; their username shows as "Deleted user". |

### 11.2 `http.ts`

- `POST /clerk-users-webhook`:
  1. Read the raw body and the `svix-id`, `svix-timestamp` and `svix-signature` headers.
  2. Verify with `new Webhook(process.env.CLERK_WEBHOOK_SECRET).verify(body, headers)`. On failure, return 400 and process nothing.
  3. Handle `user.created` and `user.updated` by running `clerkWebhook.ts`'s mapping (the primary email if its `verification.status === "verified"`, else the first verified email; the same for phone), then `internal.users.upsertFromClerk`.
  4. Handle `user.deleted` with `internal.users.markDeletedFromClerk`.
  5. Ignore other event types and return 200.
- If `svix` doesn't work in the default Convex runtime, move verification into an `internalAction` in a `"use node"` file and call it from the HTTP action.

### 11.3 `trips.ts`

| Function | Type | Args | Returns / behaviour |
|---|---|---|---|
| `create` | mutation | `{ details: {title, storeName, tripDate, category}, items: ItemInputValidator[] }` | `requireOnboardedUser`. Eligible = {owner}. `validateTripInput`, then `computeBill`. Inserts the trip, the owner participant row, items (`position`, `normalizedName`, `productMatchKey`, `lineTotalPaisa`) and assignments. Sets `totalPaisa`, `itemCount` and `searchText`. Returns `{ tripId }`. |
| `update` | mutation | `{ tripId: v.string(), details, items }` | `requireTripOwner`. Eligible = accepted participant user IDs. Items with an `itemId` must belong to this trip (otherwise `VALIDATION`). Patches existing items, inserts new ones, deletes removed ones. Deletes all of the trip's assignments and reinserts them from `computeBill`. Patches the trip totals, `searchText` and `updatedAt`. |
| `remove` | mutation | `{ tripId: v.string() }` | `requireTripOwner`. Deletes assignments, then items, then participants, then the trip. |
| `get` | query | `{ tripId: v.string() }` | `null` unless the caller is a viewer. Otherwise returns `TripDetail` (below). |
| `listRecent` | query | — | The first `RECENT_TRIPS_LIMIT` of `listAccessibleTrips`, as `TripCard[]`. |
| `listHistory` | query | `{ search?, category?, from?, to?, ownership: "all"\|"owned"\|"shared", sort: "date_desc"\|"date_asc"\|"total_desc"\|"total_asc", limit: number }` | Filters `listAccessibleTrips` in memory (search = `normalizeText(search)` substring of `searchText`; date range = string comparison on `tripDate`). Sorts, then slices to `min(limit, 200)`. Returns `{ trips: TripCard[], hasMore: boolean, totalAccessible: number }`. |
| `spendingSummary` | query | `{ month: "YYYY-MM" }` | Phase 10 (see there). |

`ItemInputValidator` = `v.object({ itemId: v.optional(v.id("items")), name: v.string(), brand: v.string(), variant: v.string(), packSize: v.string(), unit: v.string(), quantity: v.string(), unitPrice: v.string(), assigneeIds: v.array(v.id("users")) })`. Quantity and price arrive as **strings** and are parsed on the server by the same domain functions the UI uses.

```ts
type TripCard = {
  id: string; title: string; storeName: string | null; tripDate: string; category: Category;
  totalPaisa: number; itemCount: number; participantNames: string[]; // accepted, owner first
  isOwner: boolean;
};
type TripDetail = {
  id: string; title: string; storeName: string | null; tripDate: string; category: Category; currency: "PKR";
  totalPaisa: number; viewerRole: "owner" | "participant"; viewerUserId: string;
  owner: { userId: string; username: string };
  participants: { userId: string; username: string; role: "owner" | "participant" }[]; // accepted only
  invitations: { participantId: string; username: string; status: "pending" | "declined"; invitedAt: number; respondedAt: number | null }[]; // owner only; [] for participants
  items: {
    id: string; name: string; brand: string | null; variant: string | null; packSize: string | null; unit: string | null;
    quantityMilli: number; unitPricePaisa: number; lineTotalPaisa: number;
    assignees: { userId: string; username: string; amountPaisa: number }[];
  }[];
  shares: { userId: string; username: string; totalPaisa: number;
            items: { itemId: string; name: string; amountPaisa: number; splitCount: number }[] }[];
  reconciled: boolean;
};
```

### 11.4 `invitations.ts` (Phase 5–6)

| Function | Type | Args | Behaviour |
|---|---|---|---|
| `invite` | mutation | `{ tripId: v.string(), via: "username"\|"email"\|"phone", identifier: v.string() }` | `requireTripOwner`. Normalize by type (an invalid format gives `INVITE_NO_MATCH` with no format hint for email; a phone that doesn't normalize gives `VALIDATION` "Enter a valid phone number"). Exact index lookup on `by_usernameNormalized`, `by_verifiedEmail` or `by_verifiedPhone`. No match, `deletedAt` set or no username → `INVITE_NO_MATCH`. Self → `INVITE_SELF`. Existing row: pending → `INVITE_ALREADY_PENDING`; accepted → `INVITE_ALREADY_PARTICIPANT`; declined/cancelled/removed → patch to `pending` (new `createdAt`, clear `respondedAt`, set `invitedVia`). Otherwise check the limit (`TRIP_PARTICIPANT_LIMIT`) and insert a `participant`/`pending` row. Returns `{ participantId, username }` only. |
| `listReceived` | query | — | The caller's `by_user_status = pending` rows (take 50) → `{ participantId, tripTitle, storeName, tripDate, ownerUsername, invitedAt }[]`. No items or totals. |
| `pendingCount` | query | — | Number of pending received invitations (take 51; the UI shows "50+"). Used by the nav badge. |
| `listSent` | query | — | Rows where `invitedByUserId = me`, status pending, accepted or declined, newest first, take 50 → `{ participantId, tripId, tripTitle, username, status, invitedAt, respondedAt }[]`. Excludes the owner's own rows. |
| `respond` | mutation | `{ participantId: v.string(), accept: v.boolean() }` | The row must exist, `row.userId === me` and the status must be `pending`. Otherwise `NOT_FOUND` / `INVITATION_NOT_PENDING`. Sets `accepted` or `declined` and `respondedAt`. |
| `cancel` | mutation | `{ participantId: v.string() }` | Caller = trip owner, status `pending` → `cancelled`. |
| `removeParticipant` | mutation | `{ participantId: v.string() }` | Caller = trip owner, row role `participant`, status `accepted` → `removed`. In the same mutation: for each item the user was assigned, drop them. If no assignees remain, assign the owner. Recompute the allocations for affected items with `allocateEqually`. Returns `{ reassignedItemCount }`. |

### 11.5 `priceHistory.ts` and `items.ts` (Phase 8–9)

| Function | Type | Args | Behaviour |
|---|---|---|---|
| `priceHistory.searchProducts` | query | `{ term: string }` | Term is normalized; fewer than 2 characters returns `[]`. Read items (via `by_trip`) of the `PRODUCT_SEARCH_TRIPS_CAP` most recent accessible trips. Keep items whose `normalizedName` contains the term. Group by `productMatchKey` and return up to 20 `ProductResult` = `{ productMatchKey, name, brand, variant, packSize, unit, observationCount, latestPricePaisa, latestTripDate }`, sorted by latest date desc. Display fields come from the most recent item. |
| `priceHistory.getObservations` | query | `{ productMatchKey: string }` | For each accessible trip (cap 1000), look up items via `by_trip_productMatchKey`. Sort by `tripDate` asc (ties by `createdAt`), run `computePriceChanges`, then return newest first (max 200): `{ product, observations: { itemId, tripId, tripTitle, storeName, tripDate, quantityMilli, unit, unitPricePaisa, change }[], otherVariants: ProductResult[] }`. `otherVariants` come from the same accessible items with an equal `normalizedName` and a different key. |
| `items.suggest` | query | `{ term: string }` | Same helper as `searchProducts`, max 8 results, plus `lastStoreName`. Used by the item editor. |

Both functions share one internal helper, `collectAccessibleItems(ctx, userId, cap)`, defined in `convex/lib/access.ts`.

---

## 12. Screens and UX

### 12.1 Navigation

- **Mobile (< md):** a sticky top header (app name, user menu) and a fixed bottom nav: **Home**, **Bills**, **Prices** and **Invites** (with a pending-count badge). Each item is ≥ `size-tap`. Add `pb` space so content clears the nav.
- **Desktop (≥ md):** a top header with the logo, inline nav links and the user menu (username, Settings, Sign out). Content is centred with `max-w-content` (forms and details), or wider (`lg`) for history tables if needed.
- Nav entries are added only in the phase that ships their page.

### 12.2 Screen list

| Route | Screen | Key content |
|---|---|---|
| `/` | Landing | Short value proposition (3 bullets), Sign up / Sign in. Signed-in users are redirected to `/dashboard`. |
| `/sign-in`, `/sign-up` | Clerk components | Centred card, app styling via `appearance` with `var(--color-…)` values. |
| `/onboarding` | Choose username | A single field with a live availability check (debounced 400 ms), rules hint and Continue. |
| `/dashboard` | Dashboard | Greeting `Hi, @username`, a **New bill** button, recent bills (5), links to Bill History and Price History, and (Phase 10) the spending summary. |
| `/trips/new` | New bill | Details section, items editor, sticky footer with running total and **Review**. The review screen shows the summary with **Back to edit** and **Save bill**. |
| `/trips/[tripId]` | Bill details | Header (title, store, date, category, Owned/Shared badge). Owner actions: Edit, Delete, Invite. Items list, total, participant shares with breakdown, reconciliation badge. Participants section (owner sees invitation states and actions). |
| `/trips/[tripId]/edit` | Edit bill | The same form as new, prefilled. Save goes straight to an update after review. |
| `/invitations` | Invitations | Two tabs: **Received** (Accept/Decline) and **Sent** (status badges, Cancel for pending). |
| `/trips` | Bill History | Search, filter bar (collapsible on mobile), sort, result list, Load more. |
| `/price-history` | Price History | Product search, results, selected product observations, other variants. |
| `/settings` | Settings | Username (edit), verified email, verified phone (or "No verified phone"), **Manage email & phone** (Clerk `UserProfile` in a dialog or section, `routing="hash"`), Sign out. |

### 12.3 Item editor UX (mobile-first)

- Each item is a card:
  - Row 1: **Name** (full width).
  - Row 2: **Qty** (narrow, `inputMode="decimal"`), **Unit price** (`inputMode="decimal"`, `Rs.` prefix), and the **line total** right-aligned.
  - Row 3: assignee chips (Phase 6. Before Phase 6 this shows "Paid by you").
  - A **More details** disclosure for brand, variant, pack size and unit.
  - A remove (trash) icon button with an `aria-label`.
- Prices and quantities are `type="text"` with `inputMode="decimal"`, never `type="number"`.
- **Add item** appends a row and focuses its name field. Enter in the price field adds a new row.
- A sticky footer shows "N items · Total Rs. X" and a primary **Review** button.
- Validation messages appear on blur and on Review. Review scrolls to the first error.
- The hint under the first row says: "Only know the total? Leave quantity as 1 and enter the total as the price."

### 12.4 States

- **Loading:** skeleton cards and rows, built from `bg-surface-muted` blocks with `motion-safe:animate-pulse`. The pulse keyframes must be added as a token (`--animate-pulse`) if they don't exist.
- **Empty:** an icon, a one-line explanation and one primary action.
- **Error:** a friendly message and **Try again**. On the bill page, `null` shows "This bill doesn't exist or you don't have access" with **Back to dashboard**.
- **Save failure:** an inline `Alert` above the footer reads "Couldn't save your bill. Your changes are still here. Try again." The form state is never cleared.

---

## 13. Testing strategy

### 13.1 Tooling

- **Vitest** with two projects in `vitest.config.mts`:
  - `unit`: `environment: "node"`, `include: ["tests/unit/**/*.test.ts"]`.
  - `convex`: `environment: "edge-runtime"`, `include: ["tests/convex/**/*.test.ts"]`, `server: { deps: { inline: ["convex-test"] } }`.
- **convex-test**: `tests/convex/helpers.ts` exports `modules = import.meta.glob("../../convex/**/!(*.*.*)*.*s")` and helpers:
  - `setupTest()` returns `convexTest(schema, modules)`.
  - `createUser(t, username, { email?, phone? })` calls `ensureCurrent` and `setUsername` under `t.withIdentity({ subject: "clerk_" + username })`, then `internal.users.upsertFromClerk` for the contacts. It returns `{ id, as }`, where `as` is the identity-bound accessor.
  - `createTrip(as, overrides)` builds valid input.
  - Use the current convex-test docs if the glob or config syntax has changed.
- Scripts in `package.json`:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"typecheck": "tsc --noEmit && tsc --noEmit -p convex"`
  - `"lint": "eslint ."`
  - `"check": "npm run typecheck && npm run lint && npm test"`

### 13.2 Test accounts for manual testing

Use Clerk's **test mode** in the development instance:

- Emails containing `+clerk_test` receive no real mail and accept code `424242`. For example `alice+clerk_test@example.com`, `bob+clerk_test@example.com` and `carol+clerk_test@example.com`.
- Clerk test phone numbers `+1 201-555-0100` to `0199` accept code `424242`.
- Roles used in checklists: **Alice** (owner), **Bob** (invitee/participant), **Carol** (unrelated user). Use separate browser profiles or a private window for each.

### 13.3 Mandatory test coverage (accumulates per phase)

- Money: every case in §4.5, uneven paisa splits, rounding, parsing, and a randomised reconciliation property test (500 random bills from a seeded generator: Σ shares === total).
- Permissions matrix: owner, accepted, pending, declined, cancelled, removed, unrelated and unauthenticated, against `trips.get`, `update`, `remove`, `listRecent`, `listHistory`, `invitations.*`, `priceHistory.*` and `items.suggest`.
- Invitations by username, email and phone; an unverified phone is not matched; duplicates; re-invites; self-invites; responding to another user's invitation.
- Isolation: editing or deleting one trip doesn't change another trip's item with the same product.
- Product variants and units are not merged.
- Deletion removes the trip from history and price history and revokes access.
- Invitation responses contain no `email`/`phone` keys (assert on the object keys).

---

## 14. How to execute this plan

Instructions for the implementing agent:

1. **Work one phase at a time, in order.** Within a phase, implement the backend, domain, UI and tests together. Don't mock data the backend can provide.
2. **Before writing code that touches Next.js, Clerk, Convex, Tailwind, shadcn or convex-test, check the current official docs.** APIs change: for example `proxy.ts` vs `middleware.ts`, Clerk's Convex integration, async `params`, and Vitest `projects`.
   - Convex + Next.js App Router: https://docs.convex.dev/client/nextjs/app-router/
   - Convex + Clerk: https://docs.convex.dev/auth/clerk
   - Convex indexes: https://docs.convex.dev/database/reading-data/indexes/
   - convex-test: https://docs.convex.dev/testing/convex-test
   - Clerk Next.js quickstart: https://clerk.com/docs/quickstarts/nextjs
   - Clerk webhooks: https://clerk.com/docs/webhooks/sync-data
3. Steps marked **🧑 HUMAN** need the user (creating accounts, copying keys, signing in to CLIs). Stop and ask the user to do them, then continue.
4. **Keep two dev processes running:** `npx convex dev` (it pushes schema and functions and regenerates `convex/_generated`) and `npm run dev`.
5. **At the end of each phase:**
   - `npm run check` passes with zero errors.
   - Every item in the phase's **Verification checklist** is confirmed (automated plus manual).
   - Every earlier phase's features still work (quick regression on the main flows).
   - Update `README.md` (setup, scripts, known MVP limits) when something changes.
   - Commit: `git add -A && git commit -m "Phase N: <title>"`.
6. Never weaken an authorization check to make a UI work. If the UI needs data, add a properly authorized query.
7. Never hard-code style values. Never import an SDK outside its service folder. The lint rules will fail the phase.
8. If a requirement here conflicts with an official API, keep the requirement and adapt the implementation. Note the deviation in the commit message.

---

## 15. Build phases

Every phase lists: **Goal**, **Backend**, **Domain**, **UI**, **Tests**, **Verification checklist**.

---

### Phase 0 — Project setup and design-system foundation

**Goal:** a running Next.js app with the token-based design system, guarded lint rules, a test runner and a styled landing page. There is no backend yet.

**Steps**

1. **Initialise git:** run `git init`. The repo root already contains `PRD.md`, `RULES.md`, `design/` and `docs/`. Keep them.
2. **Scaffold Next.js.** `create-next-app` refuses a non-empty folder, so scaffold into a temp folder and move the files up:
   ```bash
   npx create-next-app@latest _scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install
   ```
   Move every file and folder from `_scaffold/`, **including dotfiles**, into the repo root without overwriting `design/`, `docs/`, `PRD.md` or `RULES.md`. Then delete `_scaffold/` and run `npm install`. Delete the boilerplate page content and the demo SVGs in `public/`.
3. **TypeScript:**
   - Confirm `"strict": true` in `tsconfig.json`.
   - Add paths `"@/*": ["./src/*"]` and `"@design/*": ["./design/*"]`.
   - Make sure `include` covers `design/**/*.ts`.
4. **Tailwind tokens.** Replace `src/app/globals.css` with:
   ```css
   @import "tailwindcss";
   @import "../../design/tokens.css";

   @layer base {
     html { @apply bg-background; }
     body { @apply bg-background text-ink type-body antialiased min-h-dvh; }
     :focus-visible { @apply outline-2 outline-offset-2 outline-primary; }
   }
   ```
   If `outline-2` or `outline-offset-2` don't resolve under `--*: initial`, add the needed tokens to `design/tokens.css`. Never use arbitrary values.
5. **Fonts:** in `src/app/layout.tsx`, `import { fontVariables } from "@design/fonts"` and put it on `<html lang="en" className={fontVariables}>`. Set `metadata` (title "BillSplit", description).
6. **shadcn/ui:**
   - Run `npx shadcn@latest init` and choose the `src/components/ui` path. Then **remove** everything shadcn added to `globals.css`: its `:root`/`.dark` colour variables, `@theme inline` mapping, `@custom-variant dark` and base layer. Keep `@import "tw-animate-css";` (dialog animations) **only** if it's needed by the components you add. Keep `src/lib/utils.ts` (`cn`).
   - Add `button`: `npx shadcn@latest add button`. Rewrite its variants to tokens:
     - `primary`: `bg-primary text-ink-inverse hover:bg-primary-pressed shadow-floating`
     - `secondary`: `bg-surface border border-line-strong text-ink hover:bg-surface-subtle`
     - `ghost`: `bg-transparent text-ink hover:bg-surface-subtle`
     - `danger`: `bg-error text-ink-inverse`
   - Sizes: `lg` = `h-control-lg px-24 type-button rounded-lg`, `md` = `h-control-md px-20 type-button-sm rounded-md`, `sm` = `h-control-sm px-16 type-button-sm rounded-sm`, `icon` = `size-tap rounded-md`. Disabled: `opacity-50 pointer-events-none`. Keep `asChild` (Radix Slot) so it can wrap `next/link`.
7. **Icons:** `npm i lucide-react`.
8. **ESLint guardrails.** Append to `eslint.config.mjs` (adapt to the generated flat config's shape):
   ```js
   const noHardcodedStyle = [
     { selector: "JSXAttribute[name.name='style']", message: "RULES §1: no inline styles. Use design tokens." },
     { selector: "Literal[value=/#(?:[0-9a-fA-F]{3}){1,2}\\b|#[0-9a-fA-F]{8}\\b/]", message: "RULES §1: no hex colours. Use a token class." },
     { selector: "Literal[value=/\\b(?:rgba?|hsla?|oklch|oklab)\\(/]", message: "RULES §1: no colour functions. Use a token class." },
     { selector: "Literal[value=/-\\[[^\\]]+\\](?!:)/]", message: "RULES §1: no arbitrary Tailwind values. Add a token in design/tokens.css." },
     { selector: "TemplateElement[value.raw=/-\\[[^\\]]+\\](?!:)/]", message: "RULES §1: no arbitrary Tailwind values." },
   ];
   export default [
     ...existingConfig,
     { files: ["src/**/*.{ts,tsx}"], rules: { "no-restricted-syntax": ["error", ...noHardcodedStyle] } },
     {
       files: ["src/**/*.{ts,tsx}"],
       ignores: ["src/lib/db/**", "src/lib/auth/**"],
       rules: { "no-restricted-imports": ["error", { patterns: [
         { group: ["convex/*", "convex", "**/convex/_generated/*"], message: "RULES §3: import Convex only in src/lib/db." },
         { group: ["@clerk/*"], message: "RULES §3: import Clerk only in src/lib/auth." },
       ] }] },
     },
     {
       files: ["src/domain/**/*.ts"],
       rules: { "no-restricted-imports": ["error", { patterns: [
         { group: ["react", "react/*", "next", "next/*", "convex", "convex/*", "@clerk/*", "@/lib/*", "@/components/*"], message: "src/domain must stay pure TypeScript." },
       ] }] },
     },
     { ignores: ["convex/_generated/**", ".next/**", "node_modules/**"] },
   ];
   ```
   Arbitrary **variants** such as `data-[state=open]:` remain allowed because the pattern excludes `]:`. Radix CSS-variable shorthands like `origin-(--radix-…)` are runtime values, not styling values, and are allowed.
9. **Vitest:**
   - `npm i -D vitest`.
   - Create `vitest.config.mts` with the `unit` project only for now. It gets the `convex` project in Phase 1.
   - Add the scripts from §13.1. `typecheck` is just `tsc --noEmit` until the `convex/` folder exists.
10. **Domain seed:** create `src/domain/format.ts` with `formatPaisa`, `todayIsoDate` and `formatTripDate`, and `tests/unit/format.test.ts`. Cover `formatPaisa(0) = "Rs. 0.00"`, `123456 → "Rs. 1,234.56"`, `5 → "Rs. 0.05"` and `100000000 → "Rs. 1,000,000.00"`, and check that `formatTripDate("2026-01-01")` gives "1 Jan 2026" whatever the `TZ` is.
11. **Layout primitives:** `src/components/layout/page-container.tsx` (`mx-auto w-full max-w-content px-16 md:px-24`).
12. **Landing page** `src/app/(public)/page.tsx`: app name (`type-display-sm`), tagline, 3 benefit bullets (Split by item, Share privately, Track prices) with lucide icons, and two buttons (**Get started** → `/sign-up`, **Sign in** → `/sign-in`). The links can 404 until Phase 1. Remove the default `src/app/page.tsx` so the route-group page owns `/`.
13. **Housekeeping:**
    - `.gitignore` includes `.env*.local` and `.env` but not `.env.example`.
    - Create `.env.example` (empty placeholders from §8.6).
    - Write a `README.md` skeleton (what the app is, prerequisites, scripts).

**Verification checklist**

- [ ] `npm run dev` → `http://localhost:3000` shows the landing page in Outfit/Plus Jakarta Sans with token colours, at 360 px and 1280 px.
- [ ] Adding `className="p-[13px]"`, `style={{}}` or `"#ff0000"` to a component makes `npm run lint` fail (then revert).
- [ ] `npm run check` passes, and the format tests pass.
- [ ] Git has an initial commit.

---

### Phase 1 — Sign-up, sign-in, app shell and username onboarding

**Goal:** a person can sign up, choose a unique username, land on the (empty) dashboard inside the app shell, and sign out. A signed-out visitor can't reach app pages.

**🧑 HUMAN steps**

1. Create a Clerk application (development instance) with **Email** as a sign-in identifier and email verification on, plus **Phone number** as optional with verification on. **Disable Clerk usernames**, because the app manages usernames itself.
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into `.env.local`.
3. In Clerk, enable the **Convex integration** (or create the JWT template named `convex`, per the current Convex + Clerk guide) and copy the **Frontend API URL / issuer**.
4. Run `npx convex dev`, log in, and create a project. This writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.
5. Run `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<issuer>`.

**Backend**

- `npm i convex @clerk/nextjs`, and `npm i -D convex-test @edge-runtime/vm`.
- `convex/auth.config.ts`: `providers: [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" }]`.
- `convex/schema.ts`: the `users` table (§9).
- `convex/lib/errors.ts` and `convex/lib/auth.ts` (`getCurrentUser`, `requireCurrentUser`, `requireOnboardedUser`). Look up the user by `by_clerkUserId` = `identity.subject`, ignoring rows with `deletedAt`.
- `convex/users.ts`: `getCurrent`, `ensureCurrent`, `isUsernameAvailable`, `setUsername` (§11.1).

**Domain**

- `src/domain/normalization.ts`: `normalizeText`, `normalizeUsername`, `isValidUsername`. The rest comes later.
- `src/domain/errors.ts` (codes) and `src/domain/types.ts` (`CurrentUser`).

**Frontend service folders**

- `src/lib/auth/`:
  - `provider.tsx`: `ClerkProvider` with an `appearance` theme that uses `var(--color-primary)` etc. If unsupported, leave Clerk defaults rather than hard-coding values.
  - `components.tsx`: `SignInView`, `SignUpView`, `UserMenu` (wrapping Clerk's `UserButton` or a custom dropdown with Settings and Sign out) and `SignOutButton`.
  - `hooks.ts`: `useClerkAuthForConvex` (re-exported `useAuth`).
  - `server.ts`: `getSignedInUserId()` (wraps `auth()`).
  - `middleware.ts`: `createAuthMiddleware()` returns `clerkMiddleware` that calls `auth.protect()` for `/dashboard(.*)`, `/trips(.*)`, `/invitations(.*)`, `/price-history(.*)`, `/settings(.*)` and `/onboarding(.*)`.
- `src/proxy.ts` (or `src/middleware.ts` for the installed Next.js version): `export default createAuthMiddleware();` plus the matcher config from the Clerk docs.
- `src/lib/db/`:
  - `client.ts`: the env check and a single `ConvexReactClient`.
  - `provider.tsx`: `ConvexProviderWithClerk client={client} useAuth={useClerkAuthForConvex}`.
  - `ids.ts`: `toId<T>(s: string): Id<T>` and `fromId(id): string`.
  - `errors.ts`: `toAppError`.
  - `users.ts`: `useCurrentUser()` returns `CurrentUser | null | undefined`; also `useEnsureCurrentUser()`, `useUsernameAvailability(name)`, `useSetUsername()`; and `useAuthStatus()` (wraps `useConvexAuth`).
- Root layout: `<AuthProvider><DbProvider>{children}</DbProvider></AuthProvider>`.

**UI**

- `(auth)/sign-in/[[...sign-in]]/page.tsx` and `(auth)/sign-up/[[...sign-up]]/page.tsx`: a centred card using `SignInView`/`SignUpView`.
- Landing: if `getSignedInUserId()` returns an ID, `redirect("/dashboard")`.
- Components:
  - `components/ui/text-field.tsx`: label, input, hint and error with `aria-describedby`; `h-control-md`, `rounded-md`, `border-line-strong`, `focus:border-primary`; error state `border-error text-error`.
  - `components/ui/card.tsx`, `components/ui/loading-state.tsx` (skeleton blocks), `components/ui/empty-state.tsx`, `components/ui/error-state.tsx`.
  - `components/layout/app-shell.tsx`, `nav-link.tsx` (active state via `usePathname`) and `page-header.tsx`.
- `(onboarding)/onboarding/page.tsx`:
  1. Call `ensureCurrent` on mount (once authenticated).
  2. Show the username field with a live availability check ("@alice is available" ✓ or "That username is taken" ✗) and the rules hint "3–20 characters: letters, numbers, underscore; start with a letter".
  3. Continue calls `setUsername` and then `router.replace("/dashboard")`.
  4. If the user already has a username, redirect to the dashboard.
- `(app)/layout.tsx`: `AppShell` + `AccountGate`.
  - `AccountGate` (client): while auth is loading, show a full-page loading state. Once authenticated, call `ensureCurrent` once. If the user row has no username, `router.replace("/onboarding")`. Otherwise render the children.
  - Nav in this phase: **Home** only, plus the user menu with **Sign out**.
- `(app)/dashboard/page.tsx`: "Hi, @username" and an `EmptyState` ("Your bills will appear here."). There's no button yet, because creating bills arrives in Phase 3.
- `(app)/error.tsx`: friendly error with **Try again** (`reset()`).
- `src/app/not-found.tsx`.

**Tests**

- Extend `vitest.config.mts` with the `convex` project, and create `tests/convex/helpers.ts`.
- `tests/convex/users.test.ts`:
  - `ensureCurrent` is idempotent (calling it twice gives one row).
  - `setUsername` rejects invalid names (`"ab"`, `"1abc"`, `"has space"`).
  - Uniqueness is case-insensitive (`Alice` then `alice` → `USERNAME_TAKEN`).
  - A user can re-save their own username.
  - Unauthenticated calls to `getCurrent` return `null`, and to `setUsername` throw `UNAUTHENTICATED`.
- `tests/unit/normalization.test.ts`: username normalization and validity.

**Verification checklist**

- [ ] Signing up as `alice+clerk_test@example.com` (code 424242) leads to `/onboarding`. Choosing `alice` leads to the dashboard showing "Hi, @alice".
- [ ] A second account trying `Alice` sees "That username is taken".
- [ ] Signing out leads to `/`. Visiting `/dashboard` while signed out redirects to sign-in.
- [ ] Signing in again goes straight to the dashboard, not onboarding.
- [ ] The Convex dashboard shows exactly one `users` row per account.
- [ ] `npm run check` passes.

---

### Phase 2 — Profile and settings with verified contact sync

**Goal:** users manage their username, email and phone. Verified email and phone values are synced securely from Clerk to Convex through a signed webhook, so they can later be used for invitations.

**🧑 HUMAN steps**

1. In Clerk → Webhooks, add the endpoint `https://<deployment>.convex.site/clerk-users-webhook`. Take the `.convex.site` URL from the Convex dashboard. Subscribe to `user.created`, `user.updated` and `user.deleted`.
2. Run `npx convex env set CLERK_WEBHOOK_SECRET whsec_...`.

**Backend**

- `npm i svix`.
- `convex/lib/clerkWebhook.ts`: `extractVerifiedContacts(payload)` returns `{ clerkUserId, verifiedEmailNormalized?, verifiedPhoneE164? }`. Only addresses and numbers with `verification.status === "verified"` count. Prefer the primary one.
- `convex/http.ts`: the route from §11.2.
- `convex/users.ts`: add the internal `upsertFromClerk` and `markDeletedFromClerk`. `getCurrent` now returns `verifiedEmail` and `verifiedPhone`.

**Domain**

- `normalizeEmail` and `normalizePhone`, with tests.

**UI**

- Nav: add **Settings** to the user menu.
- `(app)/settings/page.tsx`, with sections in `settings/_components/`:
  - **Username:** shows `@username` with **Change**. The inline edit uses the same availability check and `setUsername`.
  - **Contact details:**
    - Email shows its value and a "Verified" badge (`components/ui/badge.tsx`, variants `neutral | success | warning | error | primary`).
    - Phone shows "+92… · Verified", or "No verified phone. Add one so friends can invite you by phone."
    - A note below says: "Friends can invite you by username, verified email, or verified phone. Your email and phone are never shown to other users."
  - **Manage email & phone:** a button that opens a `Dialog` (`npx shadcn@latest add dialog`, restyled with tokens) containing `AccountProfile` (Clerk `UserProfile`, `routing="hash"`). Updates reach Convex through the webhook and the Settings page refreshes reactively.
  - **Sign out.**

**Tests**

- `tests/unit/normalization.test.ts`: phone cases (`0300-1234567` → `+923001234567`, `+92 300 1234567` → `+923001234567`, `0092300…` → `+92300…`, `12345` → `null`) and email lowercasing.
- `tests/convex/webhook.test.ts`:
  - Set `process.env.CLERK_WEBHOOK_SECRET` to a test secret and sign payloads with `new Webhook(secret).sign(id, timestamp, body)`.
  - `t.fetch("/clerk-users-webhook", …)` with a valid signature upserts the verified email and phone.
  - An **unverified** phone isn't stored.
  - An invalid signature returns 400 and nothing changes.
  - `user.deleted` sets `deletedAt` and clears the lookup fields.
  - A webhook that arrives before `ensureCurrent` still ends with one row.
- `clerkWebhook.ts` mapping: unit tests with sample payloads.

**Verification checklist**

- [ ] After signing up, the Settings page shows the verified email within a few seconds (webhook).
- [ ] Adding a Clerk test phone (`+1 201 555 0100`, code 424242) in Manage email & phone makes the phone appear as Verified. Removing it shows "No verified phone".
- [ ] Changing the username works, and a taken name is rejected.
- [ ] Clerk's webhook dashboard shows 200 responses. A manually sent request with a bad signature gets 400.
- [ ] `npm run check` passes.

---

### Phase 3 — Create and view a private bill; dashboard recent bills

**Goal:** a signed-in user creates a bill with items (all paid by themselves), reviews the summary, saves it, sees it on the dashboard and opens its details page. Nobody else can see it.

**Backend**

- Schema: add `trips`, `tripParticipants`, `items` and `itemAssignments` (§9).
- `convex/lib/auth.ts`: add `getTripAccess`, `requireTripViewer` and `requireTripOwner`.
- `convex/lib/access.ts`: `listAccessibleTrips` and the constants.
- `convex/lib/tripWrite.ts`:
  - `writeNewTrip(ctx, owner, validated)`: insert the trip, the owner participant row, items and assignments, all from `computeBill`.
  - `buildItemDoc(validatedItem, position)`: computes `normalizedName`, `productMatchKey` and `lineTotalPaisa`.
- `convex/lib/readModels.ts`: `toTripCard(ctx, trip, viewerId)` and `toTripDetail(ctx, trip, viewerId)`. Load items with `by_trip`, assignments with the `by_trip_user` prefix, accepted participants with `by_trip_status`, and usernames with `db.get`.
- `convex/trips.ts`: `create`, `get` and `listRecent` (§11.3).

**Domain**

- `money.ts` (complete, §10.1), `normalization.ts` (add `normalizeUnit`, `normalizePackSize`, `buildProductMatchKey` and `buildTripSearchText`), `trip-validation.ts`, `categories.ts`, and the types `TripCard` and `TripDetail`.

**Frontend service**

- `src/lib/db/trips.ts`: `useRecentTrips()`, `useTrip(tripId)` (returns `undefined` while loading, `null` when not found or no access) and `useCreateTrip()` (returns `{ create, isSaving, error }` where `error` is `toAppError`'d).

**UI**

- shadcn: `npx shadcn@latest add select`, restyled to tokens. Wrap it in `components/ui/select.tsx` with label and error support, consistent with `TextField`.
- `components/ui/money-text.tsx`: `<MoneyText paisa={…} size="body|h3|numeric" />`, using `font-numeric` and `tabular-nums`.
- `components/ui/alert.tsx`: variants `error | warning | success | info`, with an optional action button.
- `components/trips/`:
  - `trip-form.tsx`: owns the form state (`useReducer`) with fields from §10.4 as strings. Steps: `edit` → `review`. Props: `mode: "create" | "edit"`, `initialValue`, `eligibleParticipants: {userId, username}[]`, `onSubmit(value): Promise<void>`.
  - `item-editor.tsx` and `item-row.tsx` (§12.3). In this phase each row shows "Paid by you", and `assigneeIds` is fixed to `[ownerId]`. The owner ID comes from `useCurrentUser()`.
  - `trip-summary.tsx`: the review view (§4.6), built from `computeBill` on parsed values.
  - `participant-shares.tsx`: a list of participants with their totals, expandable to item contributions, plus the reconciliation badge.
  - `trip-card.tsx`: title, store · date, category badge, total, participant names. Links to `/trips/{id}`.
- Live preview: each row shows its line total once quantity and price parse (otherwise "—"). The footer total is the sum of valid rows. Mark the total `aria-live="polite"`.
- `/trips/new`:
  - Header "New bill".
  - **Details** section: title, store (optional), date (`type="date"`, default `todayIsoDate()`), category select.
  - **Items** section: starts with 1 empty row.
  - The footer has **Review**, which runs full client validation. On errors it shows inline messages and focuses the first one. Otherwise it shows the review screen.
  - The review screen has **Back to edit** and **Save bill**. Save calls `create`:
    - On success: `router.push("/trips/{id}")`.
    - On `VALIDATION`: map `fieldErrors` back onto the fields and return to edit.
    - On other errors: show the Alert with **Try again**, keeping all state.
  - The note "You can invite friends after saving." sits under Details.
- `/trips/[tripId]`:
  - The server page awaits `params` and renders a client `TripDetailView`.
  - It shows the header (title, store · date, category), the items list (name and details line, qty × unit price, line total, assignee names), the **Total**, the **Shares** section (`participant-shares`) and a reconciliation badge.
  - Loading shows a skeleton. `null` shows the "doesn't exist or no access" state.
  - No edit/delete buttons in this phase.
- `/dashboard`: **New bill** primary button, a "Recent bills" list of `TripCard`s (`useRecentTrips`), and an empty state with **Create your first bill**.

**Tests**

- `tests/unit/money.test.ts`:
  - Parsing:
    - Valid: `"250"` → 25000, `"1,250.50"` → 125050, `"0"` → 0, `"0.5"` → 50.
    - Invalid: `""`, `"abc"`, `"-1"`, `"1.234"`, `"1e3"`, and anything over the max.
  - Quantity: `"1"` → 1000 and `"1.5"` → 1500; `"0"`, `"-1"` and `"1.2345"` are invalid.
  - `lineTotalPaisa`:
    - `(1500, 3333)` = 4999.5 → **5000** (half-up)
    - `(2000, 12550)` = 25100
    - `(1000, 0)` = 0
    - a huge-value case that fits BigInt
  - `allocateEqually`:
    - `(500000, ["c","a","b"])` → a:166667, b:166667, c:166666
    - `(100, ["x"])` → 100
    - `(1, ["a","b"])` → a:1, b:0
    - empty list and duplicates throw
  - `computeBill` covers the PRD scenarios: one item and one participant; several individually assigned items; a shared item split 2 and 3 ways; a mix of personal and shared; and an uneven paisa total. Reconciliation always holds.
  - A property test: 500 seeded random bills with Σ shares === total.
- `tests/unit/normalization.test.ts`: `buildProductMatchKey` (`"Cooking  Oil"` = `"cooking oil"`; `"1 Litre"` and `"1l"` give the same pack; `"1 l"` ≠ `"5 l"`; empty vs non-empty pack size gives different keys).
- `tests/unit/trip-validation.test.ts`: required title, item count bounds, invalid price or quantity message keys, empty assignees, an ineligible assignee, and future dates beyond 1 year.
- `tests/convex/trips.test.ts`:
  - `create` stores the correct `totalPaisa`, line totals, allocations, owner participant row, `productMatchKey` and `searchText`.
  - The server recomputes even when the client sends odd strings (`" 1,000.5 "`).
  - Invalid input → `VALIDATION` with `fieldErrors`.
  - Assigning a random other user → `VALIDATION`.
- `tests/convex/permissions.test.ts` (starts here): the owner can `get`; an unrelated user's `get` returns `null`; an unauthenticated `get` returns `null`; a malformed ID string returns `null`; `listRecent` for the unrelated user doesn't contain the trip.

**Verification checklist**

- [ ] Alice creates "Imtiaz Grocery" with 3 items (one with quantity 1.5 and price 333.33). The line totals and total match a hand calculation, the review shows the shares reconciled, and saving opens the details page.
- [ ] Saving with an empty title, an item without a price or a quantity of 0 is blocked with inline messages.
- [ ] Turning the network off (DevTools → Offline) and pressing Save shows the retry Alert, and the form keeps all values. Going back online and retrying succeeds.
- [ ] The dashboard lists the bill, newest first, max 5.
- [ ] Carol (a different account) opening Alice's `/trips/<id>` URL sees "doesn't exist or you don't have access". Her dashboard is empty.
- [ ] The layout works at 360 px (item cards stack, sticky footer visible).
- [ ] `npm run check` passes.

---

### Phase 4 — Edit and delete a saved bill

**Goal:** the owner can edit any part of a saved bill and delete it with confirmation. Other bills are never affected.

**Backend**

- `convex/lib/tripWrite.ts`: `writeTripUpdate(ctx, trip, validated)`.
  - Patch items that have an `itemId`, after verifying `item.tripId === trip._id`.
  - Insert new items and delete omitted ones.
  - Delete and recreate all assignments of the trip.
  - Recompute `totalPaisa`, `itemCount`, `searchText` and `updatedAt`, and reorder `position`.
- `convex/trips.ts`: `update` and `remove` (§11.3).

**Frontend service**

- `src/lib/db/trips.ts`: `useUpdateTrip()` and `useDeleteTrip()`.

**UI**

- shadcn: `npx shadcn@latest add alert-dialog`. `components/ui/confirm-dialog.tsx`: title, description, confirm label, `variant="danger"` and a pending state.
- Bill details (owner only, `viewerRole === "owner"`): **Edit** links to `/trips/{id}/edit`. **Delete** opens the confirm dialog: "Delete this bill? This permanently removes it and its price records for everyone it's shared with." On confirm, call `remove`, show a toast or inline success, and go to `/dashboard`.
- `/trips/[tripId]/edit`:
  - Loads `useTrip`. A non-owner or `null` shows the no-access state.
  - Prefill `TripForm` using `paisaToInput` and `milliToInput`, keeping `itemId`s.
  - After review, **Save changes** calls `update` and returns to the details page.
  - **Cancel** asks to discard changes if the form is dirty.
- Add a minimal toast/feedback component (`components/ui/toast.tsx`, a simple `aria-live` region with an enter animation using `duration-base ease-standard`), or reuse `Alert`. Keep it to one mechanism app-wide.

**Tests**

- `tests/convex/trips.test.ts`:
  - **Isolation:** trips A and B both contain "Cooking Oil · 1 l" at Rs. 500. Updating A's price to Rs. 550 leaves B's item at 50000 paisa, and B's total and assignments unchanged.
  - Updating with an `itemId` from another trip → `VALIDATION`.
  - Removing an item deletes its assignments.
  - `remove` leaves zero rows in `items`, `itemAssignments` and `tripParticipants` for that trip.
- `tests/convex/permissions.test.ts`: an unrelated user's `update` and `remove` → `NOT_FOUND`. Unauthenticated → `UNAUTHENTICATED`.

**Verification checklist**

- [ ] Alice edits a bill (changes a price, adds one item, removes another), saves, and the details page shows the new values and the reconciled shares.
- [ ] A second bill with the same item keeps its original price.
- [ ] Deleting asks for confirmation, then the bill disappears from the dashboard. Its URL now shows the no-access state.
- [ ] Carol calling the `update` or `remove` mutations directly (for example from the Convex dashboard's function runner, acting as Carol, or with a temporary test button) fails.
- [ ] `npm run check` passes.

---

### Phase 5 — Invitations and shared read access

**Goal:** Alice invites Bob by username, email or phone. Bob sees the pending invitation and accepts or declines. After accepting, Bob can view the bill read-only. Alice can cancel pending invitations and remove participants. All access states are enforced by the backend.

**Backend**

- `convex/invitations.ts`: `invite`, `listReceived`, `pendingCount`, `listSent`, `respond`, `cancel` (§11.4). `removeParticipant` comes in this phase **without** reassignment. In this phase only the owner is ever assigned items, so there's nothing to reassign. Phase 6 adds it.
- `readModels.toTripDetail`:
  - `participants` = accepted rows.
  - For the owner, `invitations` = pending and declined rows (with usernames).
  - For participants, `invitations` = `[]`.
- `readModels.toTripCard` sets `isOwner` and puts accepted `participantNames` with the owner first.
- Confirm `getTripAccess` grants `participant` only for `status === "accepted"`.

**Frontend service**

- `src/lib/db/invitations.ts`: `useInvite()`, `useReceivedInvitations()`, `usePendingInvitationCount()`, `useSentInvitations()`, `useRespondToInvitation()`, `useCancelInvitation()` and `useRemoveParticipant()`.

**UI**

- `components/ui/segmented-control.tsx`: an accessible radio group styled as pills. It's reused in Phase 7.
- `components/trips/invite-dialog.tsx`: segmented **Username / Email / Phone**, then an input whose `inputMode` and `type` follow the choice (prefix "@" for username), then **Send invite**.
  - Success: "Invitation sent to @bob. They'll see it under Invitations in the app." It never says an email or SMS was sent.
  - Errors map from the codes in §8.4.
  - The dialog stays open to invite another person.
- `components/trips/participant-list.tsx` on the bill details page:
  - **Participants:** accepted usernames, the owner labelled "Owner", and the viewer labelled "You".
  - **Owner only:**
    - Pending rows with a "Pending" badge and **Cancel** (confirm: "Cancel the invitation to @bob?").
    - Declined rows with a "Declined" badge.
    - Accepted rows with **Remove** (confirm: "Remove @bob from this bill? They'll lose access immediately.").
    - An **Invite** button that opens the invite dialog.
  - Participants see no invite or remove controls and no Edit/Delete.
- Bill details header badge: **Owned** (`primary`) or **Shared by @alice** (`neutral`). The trip card shows **Owned** / **Shared**.
- `/invitations` page with `components/invitations/invitation-list.tsx`:
  - **Received** tab: cards showing "@alice invited you to **Imtiaz Grocery** · Imtiaz · 16 Oct 2026" with **Accept** / **Decline**. Accept leads to `/trips/{id}`.
  - **Sent** tab: "@bob · Imtiaz Grocery" with a status badge (Pending/Accepted/Declined) and **Cancel** for pending ones.
  - Empty states: "No pending invitations" and "You haven't invited anyone yet".
- Nav: add **Invites**, with the badge from `usePendingInvitationCount`.
- Edit form: `eligibleParticipants` = accepted participants. In this phase rows still show "Paid by you"; multi-assign arrives in Phase 6.

**Tests**

- `tests/convex/invitations.test.ts`:
  - Invite by username (case-insensitive), by verified email (case-insensitive), and by verified phone in a local format (`0300…` matching `+92300…`).
  - A phone that exists only unverified, which the webhook never stored, → `INVITE_NO_MATCH`.
  - A user with no username → `INVITE_NO_MATCH`. A deleted user → `INVITE_NO_MATCH`.
  - Self → `INVITE_SELF`. Pending duplicate → `INVITE_ALREADY_PENDING`. Accepted duplicate → `INVITE_ALREADY_PARTICIPANT`.
  - Re-invite after decline, cancel or remove: still **one row** for (trip, user), now pending.
  - A non-owner (an accepted participant) inviting → `FORBIDDEN`. An unrelated user inviting → `NOT_FOUND`.
  - The `invite` response keys are exactly `["participantId","username"]`.
  - `listReceived` has no items or totals.
  - Bob responding to Carol's invitation → `NOT_FOUND`. Responding twice → `INVITATION_NOT_PENDING`.
  - `cancel` by a non-owner fails, and `cancel` on an accepted row fails.
  - The participant limit is enforced.
- `tests/convex/permissions.test.ts`, the full **access matrix** for `trips.get`, `trips.listRecent`, `trips.update` and `trips.remove`:

  | Actor | get | listRecent contains | update/remove |
  |---|---|---|---|
  | owner | ✓ detail | ✓ | ✓ |
  | accepted | ✓ detail (`viewerRole: participant`, `invitations: []`) | ✓ | `FORBIDDEN` |
  | pending | `null` | ✗ | `NOT_FOUND` |
  | declined | `null` | ✗ | `NOT_FOUND` |
  | cancelled | `null` | ✗ | `NOT_FOUND` |
  | removed | `null` | ✗ | `NOT_FOUND` |
  | unrelated | `null` | ✗ | `NOT_FOUND` |
  | unauthenticated | `null` | `[]` | `UNAUTHENTICATED` |

- Accepted participants' `TripDetail` contains no email or phone fields anywhere (deep key scan).

**Verification checklist (three accounts: Alice, Bob, Carol)**

- [ ] Alice invites `@bob`. Bob's Invites badge shows 1 without a reload (reactive).
- [ ] Before accepting, Bob opening the bill URL gets the no-access state.
- [ ] Bob accepts and lands on the bill. He sees the items, total and shares, no Edit/Delete/Invite, and the header "Shared by @alice". Bob's dashboard shows it with a **Shared** badge.
- [ ] Alice sees Bob as a participant, and Sent shows "Accepted".
- [ ] Alice invites Carol by email, and Carol declines. Alice sees "Declined", and Carol has no access.
- [ ] Alice re-invites Carol, then cancels. Carol's pending invitation disappears.
- [ ] Alice removes Bob after confirming. Bob's open bill page switches to the no-access state live, and the bill leaves his dashboard.
- [ ] Inviting by phone works for an account with a verified test phone, and fails with the generic message for one without.
- [ ] `npm run check` passes.

---

### Phase 6 — Splitting items between participants

**Goal:** the owner assigns each item to one or more accepted participants. Shared items split equally to the paisa, and everyone sees an understandable per-person breakdown. Removing a participant reassigns their items safely.

**Backend**

- `trips.update`: eligible = accepted participants (already passed from Phase 5). Confirm that pending and other non-accepted users are rejected.
- `invitations.removeParticipant`: add atomic reassignment (§11.4) through `tripWrite.reassignAfterRemoval(ctx, trip, userId)`. It recomputes the allocations of the affected items with `allocateEqually` and patches nothing else. The trip total is unchanged.
- `readModels`: `shares` include `splitCount` per contribution. Participant ordering: the owner first, then usernames alphabetically.

**UI**

- `components/trips/participant-picker.tsx`: a row of toggle chips (`role="group"`, each chip a `button` with `aria-pressed`) for the eligible participants, plus an **Everyone** chip. Selected chips use `bg-primary-soft text-primary border-primary`. With none selected, the error "Choose who pays for this item" appears.
- `item-row.tsx`: replace "Paid by you" with the picker whenever there are 2 or more eligible participants. With only the owner, keep "Paid by you" (no unnecessary UI). Under the picker show the preview from `allocateEqually`: "Split 3 ways: Rs. 1,666.67 / Rs. 1,666.67 / Rs. 1,666.66", or "@maryam pays Rs. 900.00".
- Default assignee for new rows: the owner. Add a small "Same as previous" convenience only if it doesn't add clutter; it's optional.
- Edit page hint when pending invitations exist: "@carol hasn't accepted yet. Invited people can be assigned items after they accept."
- `trip-summary.tsx` / `participant-shares.tsx`: one card per participant with the total and an expandable list "Pizza: Rs. 1,666.67 (1/3 of Rs. 5,000.00)". The viewer's own card is labelled "Your share" and expanded by default.
- Remove-participant confirm text (when they have items): "@bob is assigned 3 items. Removing them will drop them from shared items, and items only @bob pays for will be assigned to you."

**Tests**

- `tests/convex/trips.test.ts`:
  - The PRD scenario: pizza Rs. 5,000 for [alice, bob, carol] plus Rs. 900 for bob only. The shares are exact, deterministic by ID order, and Σ = Rs. 5,900.
  - Assigning a pending, declined or unrelated user → `VALIDATION` (`items.i.assignees`).
  - Duplicate assignee IDs are deduplicated.
- `tests/convex/invitations.test.ts`, removal reassignment:
  - An item shared by Alice and Bob becomes Alice-only (full amount).
  - A Bob-only item becomes Alice-only.
  - Carol's shares are unaffected.
  - The totals reconcile, and Bob loses access.
- `tests/unit/money.test.ts`: a three-way uneven split and a mixed trip, if not already covered.

**Verification checklist**

- [ ] Alice, with Bob and Carol accepted, edits the bill: Pizza Rs. 5,000 → Everyone; Drink Rs. 900 → Bob; Rice Rs. 1,200 → Alice and Carol. The preview, review and saved details all show Alice 2,266.67, Bob 2,566.67 and Carol 2,266.66, or the same values in deterministic ID order. Σ = Rs. 7,100.00 ✓.
- [ ] Bob's view highlights "Your share" with the breakdown, and he can't edit.
- [ ] Removing Carol leaves Rice fully on Alice and splits Pizza between Alice and Bob. The totals still reconcile.
- [ ] A solo bill still shows "Paid by you" with no picker.
- [ ] `npm run check` passes.

---

### Phase 7 — Bill History: search, filter, sort

**Goal:** users browse, search and filter every bill they own or that is shared with them, and open any of them.

**Backend**

- `trips.listHistory` (§11.3), with arg validation:
  - `limit` 1–200, default 20.
  - `from`/`to` are optional `YYYY-MM-DD`. If `from > to`, swap them or reject with `VALIDATION`; pick one and document it.
  - `search` max 80 characters.
- Make sure `searchText` includes the item names (already written in Phases 3–4).

**Frontend service**

- `src/lib/db/trips.ts`: `useBillHistory(filters, limit)`.

**UI**

- Nav: add **Bills** → `/trips`. The dashboard gets a "View all bills" link.
- `components/ui/search-input.tsx`: a search icon, a clear button, and a 300 ms debounce exposed through `onDebouncedChange`.
- `components/bills/bill-history-filters.tsx`:
  - The search input, plus a **Filters** button that toggles a panel on mobile and is inline on desktop.
  - The panel holds: date from/to (`type="date"`), the category select (All + categories), the ownership `SegmentedControl` (All / Created by me / Shared with me), the sort select, and **Clear filters**.
  - Filters sync to URL params with `router.replace` (`?q=&cat=&from=&to=&own=&sort=`).
- `/trips` page:
  - A header with the **New bill** button, the filters, and a result count ("12 bills").
  - The `TripCard` list with Owned/Shared badges.
  - **Load more** (increments `limit` by 20) while `hasMore` is true.
  - Empty states (§4.8). Loading shows skeleton cards.

**Tests**

- `tests/convex/history.test.ts`:
  - The history for Bob includes his own bills plus accepted shared bills, and excludes pending, declined and removed bills and Carol's.
  - Search "oil" matches a bill whose item is "Cooking Oil" but whose title doesn't mention it. Search on the store name works. The search is case-insensitive.
  - Category, date range and ownership filters work. All four sorts are ordered correctly.
  - `limit`/`hasMore` behave correctly.
  - Carol searching for a term that only exists in Alice's bill gets nothing, and `totalAccessible` reflects only Carol's bills.

**Verification checklist**

- [ ] With around 8 bills across categories and dates (some shared), every filter, combination and sort gives the expected list.
- [ ] Reloading or using back navigation keeps the filters (URL).
- [ ] Opening a result shows the full bill. A shared one is read-only.
- [ ] The empty states show correctly (a new account vs. no matches).
- [ ] `npm run check` passes.

---

### Phase 8 — Item Price History

**Goal:** users search for an item, pick the exact product or variant, and see its dated prices from accessible bills, with the change between consecutive records.

**Backend**

- `convex/lib/access.ts`: `collectAccessibleItems` (by trip, capped).
- `convex/priceHistory.ts`: `searchProducts` and `getObservations` (§11.5). Load trip metadata (title, store, date) from the accessible trips already in memory, so no extra authorization path is needed.

**Domain**

- `price-change.ts` (§10.5) and `formatPercent`.

**Frontend service**

- `src/lib/db/price-history.ts`: `useProductSearch(term)` and `usePriceObservations(productMatchKey | null)`.

**UI**

- Nav: add **Prices** → `/price-history`. The dashboard gets a "Compare prices" link.
- `components/price-history/product-search.tsx`:
  - A debounced search box.
  - Results as selectable rows: **Cooking Oil**, then a details line ("Dalda · 1l · item"), then "5 records · latest Rs. 560.00 on 12 Oct 2026".
  - Fewer than 2 characters shows the hint "Type at least 2 letters".
  - No results: "No items found in your bills. Prices appear here after you save bills with that item."
- `components/price-history/price-change.tsx`: an icon plus text, never colour alone:
  - ↑ "Rs. 40.00 (+7.7%)" in `text-error`
  - ↓ "Rs. 20.00 (−3.4%)" in `text-success`
  - "Unchanged" in `text-ink-secondary`
  - "First record" in `text-ink-muted`
- `components/price-history/price-history-list.tsx`:
  - Mobile: one card per observation (date, unit price large, change, "Qty 2 item · Imtiaz · *Imtiaz Grocery*", with the trip title linking to the bill).
  - ≥ md: a table with columns Date, Unit price, Change, Qty/Unit, Store, Bill.
  - Newest first.
- An **Other variants** section listing `otherVariants` with the "not compared directly" note. Clicking one selects it.
- The selected product is in the URL (`?product=<encodeURIComponent(key)>`).

**Tests**

- `tests/unit/price-change.test.ts`: first, up, down, unchanged, previous = 0 (`percent: null`) and a percent rounding check.
- `tests/convex/priceHistory.test.ts`:
  - Alice's 3 bills with "Cooking Oil · 1 l" at 500, 540 and 540 give the changes first / +40 (+8.0%) / unchanged.
  - A "Cooking Oil · 5 l" bill is a separate product, shown in `otherVariants` and not in the comparison.
  - Bob (accepted on one of Alice's bills) sees only that bill's observation plus his own.
  - Carol has the same product in her own bill: Alice's results **don't include it**, and the counts aren't affected.
  - A pending invitee sees nothing from that bill.
  - After `trips.remove`, the observation disappears.
  - After editing a price in one bill, only that observation changes.
  - Unauthenticated → `[]` / `null`.

**Verification checklist**

- [ ] Alice records the same product across 3 bills on different dates and stores. Price History shows all 3 in date order with correct changes and links that open the bills.
- [ ] A different pack size appears as a separate product under "Other variants".
- [ ] Bob only sees observations from bills shared with him and his own. Carol sees none of Alice's.
- [ ] Deleting a bill removes its observation live.
- [ ] `npm run check` passes.

---

### Phase 9 — Item suggestions while entering items

**Goal:** typing an item name suggests products the user has recorded before, so the same product gets recorded consistently. The user can always keep a new, distinct entry.

**Backend**

- `items.suggest` (§11.5), reusing `collectAccessibleItems`.

**Frontend service**

- `src/lib/db/price-history.ts`: `useItemSuggestions(term)`.

**UI**

- shadcn: `npx shadcn@latest add popover command`, restyled to tokens.
- `components/trips/item-name-combobox.tsx` replaces the plain name field in `item-row`. It's ARIA combobox-compliant and works with the keyboard (↑/↓/Enter/Esc).
  - After 2 or more characters (debounced 250 ms) it shows up to 8 suggestions: "Cooking Oil · Dalda · 1l · last Rs. 560.00 at Imtiaz".
  - The first option is always **Use "<typed text>" as a new item**.
  - Choosing a suggestion fills name, brand, variant, pack size and unit, and opens **More details** so the user sees them. It does **not** fill the price; it shows "Last price Rs. 560.00" as the price field's hint.
  - Typing freely and ignoring suggestions works exactly as before.
- On mobile the suggestion list shows below the field without covering the price row.

**Tests**

- `tests/convex/items.test.ts`: suggestions only come from accessible bills; Carol's items never appear; results are deduplicated by match key; and the cap is respected.
- Manual keyboard and screen-reader checks (listed below).

**Verification checklist**

- [ ] Typing "coo" in a new bill suggests "Cooking Oil · Dalda · 1l". Selecting it fills the details, and the price stays empty with the last-price hint.
- [ ] Choosing "Use as new item" keeps only the typed name.
- [ ] Recording via a suggestion makes that bill appear in the **same** Price History product.
- [ ] The combobox works with the keyboard only.
- [ ] `npm run check` passes.

---

### Phase 10 — Dashboard spending summary

**Goal:** the dashboard shows two clearly separate monthly figures computed from accessible bills: what the user owes in total, and what they created.

**Backend**

- `trips.spendingSummary({ month: "YYYY-MM" })` returns `{ month, yourSharePaisa, yourShareBillCount, createdTotalPaisa, createdBillCount }`.
  - `yourSharePaisa` = Σ `allocatedAmountPaisa` of the caller's assignments (`by_trip_user` index) over accessible trips with `tripDate` starting with `month`.
  - `createdTotalPaisa` = Σ `totalPaisa` of trips the caller owns in that month (`by_owner_date` range `[month-01, month-31]`).
  - Validate `month` with `/^\d{4}-(0[1-9]|1[0-2])$/`.

**UI**

- `components/dashboard/spending-summary.tsx`:
  - A month switcher (‹ Oct 2026 ›, defaulting to the current local month, with the future disabled).
  - Two stat tiles: **Your share**, Rs. X ("Your portion of N bills dated in October") and **Bills you created**, Rs. Y ("Total of N bills you created in October"). Use `type-numeric` for the amounts.
  - An info hint explains the difference.
  - It renders the tiles even when the values are 0 (Rs. 0.00).
- Placed above Recent bills.

**Tests**

- `tests/convex/summary.test.ts`:
  - A solo bill counts in both figures.
  - A shared bill Alice created counts in Alice's created total (full bill) and in her share (only her allocation).
  - For Bob, the bill counts only in his share.
  - Bills in other months are excluded.
  - A removed participant's former bill is excluded.
  - Carol's figures are unaffected by Alice's bills.

**Verification checklist**

- [ ] The figures match a manual sum for October with mixed solo and shared bills, for both Alice and Bob.
- [ ] Switching months updates both tiles. The labels never mix meanings.
- [ ] `npm run check` passes.

---

### Phase 11 — Hardening, full acceptance pass, production deployment

**Goal:** the MVP is production-ready. Every acceptance criterion passes, the app is polished on mobile and desktop, and it's deployed to Vercel and Convex production.

**Hardening tasks**

1. **States audit:** every page has loading, empty and error states, and the friendly `(app)/error.tsx` and `not-found.tsx` work.
2. **Unsaved changes:** `TripForm` warns on `beforeunload` and on in-app navigation away (Cancel) when it's dirty.
3. **Accessibility pass:**
   - Labels and `aria-describedby` on all fields.
   - Visible focus everywhere.
   - Dialogs trap and return focus.
   - Chips use `aria-pressed`.
   - Totals use `aria-live`.
   - Colour contrast is checked against the tokens (ink on surfaces, ink-inverse on primary).
   - Every icon-only button has an `aria-label`.
4. **Responsive pass at 360, 768 and 1280 px:** no overflow, the bottom nav doesn't cover content, and tables collapse into cards on mobile.
5. **Motion:** only dialogs, toasts, row add/remove and skeleton pulse are animated, all with `motion-safe:` and the duration/ease tokens.
6. **Security sweep:**
   - Every exported `query`/`mutation` in `convex/*.ts` calls an auth helper first. Grep for `export const` and review each one. Internal functions use `internalMutation`/`internalQuery`.
   - No function accepts a `userId` argument as the caller's identity.
   - Grep `src/` for `process.env` (it must appear only in `src/lib/db/client.ts`, `src/lib/auth/*` and Next config) and confirm that no secret uses `NEXT_PUBLIC_`.
   - `src/app/api/` doesn't exist.
   - No `.collect()` on an unbounded query. Grep and justify each `.collect()`; they should only appear on per-trip indexes.
   - Error messages shown to users come from `toAppError` only.
7. **Run the full test suite** and add any missing case from §13.3 (concurrent duplicate invitations: two `invite` calls via `Promise.all` give one row and one `INVITE_ALREADY_PENDING`).
8. **README:** product summary, architecture summary, setup (Clerk, Convex and webhook steps), env vars, scripts, test accounts, known MVP limits (the caps in §8.3), and the money rounding/allocation rule.

**🧑 HUMAN steps: production**

1. Create a Clerk **production** instance (domain required) with the same settings as dev, and enable the Convex integration.
2. In Convex, create the production deployment and set `CLERK_JWT_ISSUER_DOMAIN` (prod issuer) and `CLERK_WEBHOOK_SECRET` (from the prod webhook endpoint `https://<prod>.convex.site/clerk-users-webhook`).
3. In Vercel, import the repo.
   - Set the build command to `npx convex deploy --cmd 'npm run build'`.
   - Set env vars: `CONVEX_DEPLOY_KEY` (production deploy key), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (prod), and the `NEXT_PUBLIC_CLERK_*_URL` vars. `NEXT_PUBLIC_CONVEX_URL` is injected by `convex deploy`; follow the current Convex Vercel guide.
4. Deploy, then add the Vercel domain to Clerk's allowed origins/redirects as required.

**Final acceptance pass:** run every checklist from Phases 1–10 again **on production** with three fresh accounts, then tick §16.

**Verification checklist**

- [ ] `npm run check` passes, and `npm run build` succeeds locally.
- [ ] All §16 criteria are ticked on production.
- [ ] Direct-request privacy test on production: as Carol, call `trips.get` with Alice's trip ID (for example from the browser console through a temporary dev-only hook, or the Convex dashboard "act as user") and get `null`. Do the same as a pending, declined and removed invitee.
- [ ] Lighthouse accessibility score ≥ 90 on dashboard, new bill and bill details.

---

### Phase 12 (optional, P1) — Price chart and printable bill

Do this only if the user approves it after Phase 11.

- **Price-over-time chart** on Price History: a lightweight inline SVG line chart component (`components/price-history/price-chart.tsx`) using token colours through `stroke-primary` and `fill-primary-soft` classes. No chart library unless the user agrees.
  - It uses only the returned observations (already authorized).
  - It shows only with 2 or more observations, and has an accessible text alternative (the table stays).
- **Printable bill:** a **Print** button on bill details. Add a `@media print` block in `globals.css` that hides the nav and actions and shows the full breakdown, and call `window.print()`. Values come from tokens only.
- Tests: chart data mapping as a unit test; manual print preview.

---

## 16. Final acceptance criteria (MVP)

The MVP is accepted when all of these are verified with at least two test accounts (an owner and an invited participant), plus an unrelated third account:

1. [ ] A user can register, sign in, choose a username and create a private bill.
2. [ ] A private bill is visible to its owner and not visible to an unrelated signed-in user (UI **and** direct query).
3. [ ] A user can share a bill with several participants by inviting registered users by username, verified email or verified phone.
4. [ ] An invitation stays pending until the invitee accepts or declines it.
5. [ ] An accepted participant can view the bill. Pending, declined, cancelled and removed invitees can't.
6. [ ] The owner can add, edit and delete items and assign each item to one or more eligible participants.
7. [ ] An item assigned to one person is charged fully to them. An item assigned to several is split equally.
8. [ ] The bill total and all participant shares reconcile exactly after rounding (including uneven paisa).
9. [ ] A new bill containing the same item doesn't change the price stored in an older bill.
10. [ ] Users can search and filter saved bills and reopen accessible ones.
11. [ ] Users can view item price observations from accessible bills and see price changes between comparable entries. Different variants or units aren't compared.
12. [ ] Price history never reveals records from unrelated users' bills.
13. [ ] Editing or deleting a bill affects only that bill and its own history and access records.
14. [ ] The interface works on mobile and desktop with clear validation, empty, loading and error states.
15. [ ] Authorization is enforced by Convex functions, verified by the automated permission-matrix tests and by direct requests.
16. [ ] Bills and price records persist across sessions. `npm run check` passes. No hard-coded style values or out-of-folder SDK imports (lint passes).

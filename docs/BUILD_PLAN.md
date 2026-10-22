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
    - [Phase 2 — Profile and settings](#phase-2--profile-and-settings)
    - [Phase 3 — Create and view a private bill; dashboard recent bills](#phase-3--create-and-view-a-private-bill-dashboard-recent-bills)
    - [Phase 4 — Edit and delete a saved bill](#phase-4--edit-and-delete-a-saved-bill)
    - [Phase 5 — People and splitting](#phase-5--people-and-splitting)
    - [Phase 6 — Linking people to accounts and shared read access](#phase-6--linking-people-to-accounts-and-shared-read-access)
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
2. **Split it fairly by item, with anyone.** The owner adds the people on the bill just by typing their names. Nobody needs an account. Each item is assigned to one person, who pays all of it, or shared **equally** between several people. The app calculates each person's share exactly, to the paisa, and the bill page is laid out so the owner can screenshot it and send it in any chat app.
3. **Optionally connect people to their accounts.** If a person on the bill has (or later creates) an account, the owner can link that person to the account by inviting them by username or registered email. After accepting, they can open the bill in the app, read-only. Linking never changes the split. Solo bills stay private.
4. **Search past bills.** A searchable, filterable history of the bills you own and the bills shared with you.
5. **Compare item prices over time.** Every saved item price is kept as a dated observation, so users can see how the price of, for example, a 1-litre cooking oil changed across dates and stores. Only bills the user is allowed to see are used.

**Problem it solves:** working out who owes what after a shared trip is error-prone, and an equal split is often unfair. Paper receipts and chat messages are also hard to search later, so people can't easily tell whether prices have gone up.

**Goals**

1. Creating and saving a bill (date, store, items, prices, people) is quick.
2. Each person's share is calculated automatically and exactly, whether or not they have an account.
3. A bill can be shared with linked friends without exposing any other private bill.
4. Separate bills stay separate historical records.
5. Old bills are easy to find, and item prices can be compared over time.
6. The app is simple to understand and works well on mobile.

**Currency:** Pakistani rupees only (PKR, displayed as `Rs. 1,234.56`).

**Main scenarios**

- *Solo shopper:* Maryam buys groceries alone and records the bill. Only Maryam can see it.
- *Friends shopping together:* Bismah creates an "Imtiaz Grocery Shopping" bill and adds "Maryam" by name. She assigns some items to herself, some to Maryam and some to both, saves, and sends a screenshot of the shares to Maryam on WhatsApp. Maryam doesn't need an account.
- *Linking later:* Maryam signs up as @maryam_n. Bismah invites @maryam_n for the person "Maryam" on that bill. After Maryam accepts, she can open the bill in the app and her share is highlighted. The amounts are exactly what they were before. Neither can see the other's unrelated bills.
- *Restaurant order:* a Rs. 5,000 pizza shared by three people is split Rs. 1,666.67 / Rs. 1,666.67 / Rs. 1,666.66. A Rs. 900 drink assigned only to Maryam adds Rs. 900 to Maryam's share alone.
- *Price comparison:* a user opens Price History, searches "cooking oil", picks "Cooking Oil · Dalda · 1 l", and sees every recorded price with its date and store, plus the change from the previous entry.

---

## 2. Scope

### 2.1 In scope (MVP, P0)

- Email-and-password authentication (Convex Auth Password provider) with Name, Email, Password and Confirm password at sign-up, a unique app username, and exact email lookup for invitations.
- Private trips with owner-based access control.
- Trip creation and item entry.
- People on a bill, added by name with no account needed.
- Item assignment and an exact equal-split calculation.
- Accurate bill and per-person totals, laid out to be screenshot and shared.
- Invitations that link a person on the bill to an account: send, accept, decline, cancel, unlink, and shared **read-only** access.
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
- Public bills, public profiles or a public user directory. There are no share links or generated images; people share a bill by taking a screenshot.
- Matching people to accounts automatically (by name or anything else). Only the owner links a person to an account, through an invitation the account holder accepts.
- Inventory, budgeting, recurring purchases, receipt scanning/OCR.
- Global price sharing between unrelated accounts.
- Multi-currency.
- Editing by participants. Only the owner edits.
- Email or SMS invitation notifications. Invitations are in-app only, and the UI must never claim an email or SMS was sent.
- Email verification, password reset ("forgot password"), changing the account email, phone numbers, social/OAuth sign-in and two-factor authentication. The app never sends email.
- **AI features.** The product has none. Do not add any LLM integration. (RULES.md §4 covers AI failure handling and applies only if an AI feature is approved later.)

---

## 3. Terminology

Use **"Bill"** as the main word in the UI, with "trip" only where it reads naturally (for example "Imtiaz Grocery trip"). Pick one consistent label per screen: navigation says **Bills**, the button says **New bill**, the page title says **Bill details**. In code, the entity is `trip`.

| Term | Meaning |
|---|---|
| User | A person with an authenticated account. |
| Trip / Bill | One independent purchase event with exactly one bill. |
| Owner | The user who created the trip. Only the owner manages its contents and people. |
| Person (on a bill) | Someone the bill is split between: the owner, or a **name the owner typed** (for example "Ben"). A person doesn't need an account. Each bill has its own people; "Ben" on one bill has nothing to do with "Ben" on another. |
| Linked person | A person connected to a user account, after the owner invited that account and the user accepted. The owner is always linked to their own account. |
| Participant | A user who is a linked person on a trip, other than the owner. They can view the trip, read-only. |
| Invitation | The owner's request to connect one person on the bill to one user account. **Pending** until the user accepts or declines. A pending invitee has no access to the trip's contents. |
| Item | One line on the bill. |
| Assignees | The one or more people on the bill responsible for an item. |
| Allocation / share | The exact paisa amount of an item charged to one assignee. A person's share is the sum of their allocations. |
| Price observation | One saved item record (unit price on a dated bill), used in Price History. |
| Product match key | A deterministic key built from the normalized name, brand, variant, pack size and unit. It identifies "the same product" for price comparison. |

---

## 4. Functional requirements

### 4.1 Accounts and profile

- Every app screen and data request requires sign-in. Only the landing, sign-in and sign-up pages are public.
- Authentication is **email and password**, handled by Convex Auth's Password provider inside Convex. There is no third-party auth service, no email verification and no phone number.
- **Sign-up** form (all fields required):

  | Field | Rule |
  |---|---|
  | Name | 1–60 characters (trimmed). Shown only to the user themself (greeting, user menu, Settings), never to other users. |
  | Email | A valid email address, stored trimmed and lowercase. If it already belongs to an account: "An account with this email already exists. Sign in instead." |
  | Password | 8–128 characters. Hint: "At least 8 characters". |
  | Confirm password | Must equal Password, otherwise "Passwords don't match". Checked in the browser only and never sent to the server. |

- **Sign-in** form: Email and Password. A wrong email or password gives one generic message, "Email or password is incorrect.", which doesn't reveal whether the account exists.
- Passwords are hashed by Convex Auth. App code never stores, logs or returns a password.
- After sign-up, the user picks a **unique app username** (onboarding). The app can't be used without one. Friends invite them by username or email.
- In **Settings**, users can edit their name and username and see their email (read-only).
- Users can sign out.

### 4.2 Dashboard

- A prominent **New bill** action.
- **Recent bills:** the 5 most recent bills by bill date that the user owns or has accepted. Each card shows the title, store, date, category, total, the people on the bill and an **Owned / Shared with you** badge.
- Links to Bill History and Price History.
- (Phase 10) A spending summary for a selected month that shows two separately labelled figures: **"Your share"** (the sum of the allocations of the person the user is linked to on each bill) and **"Bills you created"** (the sum of totals of bills the user owns). The two are never mixed.
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
| People | The owner is always on the bill, shown as "You". The owner adds anyone else by typing a name (Phase 5). Linking a person to an account happens after saving, from the bill page (Phase 6). |

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
| Assignees | At least 1. Each must be a **person on this bill** (the owner or a name on the bill); accounts don't matter. One assignee pays the full line total; several split it equally. |

The owner can add, edit and remove rows before saving and when editing. A user who only knows an item's final total enters quantity `1` and that total as the unit price; the UI says so in a hint. Saving is blocked while any field is invalid, and every invalid field shows an inline message.

**People on the bill** (Phase 5):

| Field | Rule |
|---|---|
| Name | Required, 1–40 characters (trimmed). Unique within the bill, ignoring letter case and extra spaces ("ben" and "Ben " clash). It's only a label the owner chose and is never matched to any account. |
| Count | At most 20 people per bill, including the owner. |

- The owner can add, rename and remove people while creating or editing a bill.
- Removing a person who is assigned items takes them off shared items, and items only they pay for move to the owner. The form asks first: "Ben is on 3 items. Removing Ben takes them off shared items, and items only Ben pays for move to you."
- Removing a **linked** person also ends that account's access to the bill, and the confirmation says so.

### 4.5 Splitting rules (authoritative)

1. The owner is always a person on the bill.
2. Each item has ≥ 1 assignee, and every assignee is a person on **that** trip.
3. One assignee → that person is charged the whole line total.
4. Several assignees → the line total is divided equally.
5. Nobody outside the trip's people can be assigned. Whether a person has an account, a pending invitation or no account at all makes **no** difference to the split.
6. A person's share = the sum of their allocations across all items.
7. Trip total = the sum of all line totals.
8. The sum of all shares **equals** the trip total exactly.
9. All money is integer **paisa** (Rs. 1 = 100 paisa). Never use floating-point arithmetic for money.
10. Uneven division: `base = floor(lineTotal / n)` and `remainder = lineTotal − base × n`. Order the assignees by their **position on the bill**: the owner is 0, and each added person gets the next number, which never changes. The first `remainder` assignees get `base + 1` and the rest get `base`. This rule is documented in code. Because positions never change, linking, unlinking or renaming a person never moves a single paisa, and the form's live preview always matches what the server saves.
11. Saving or editing one trip never changes any other trip's data.

Worked example: a pizza at Rs. 5,000.00 (500,000 paisa) split between Alice (the owner, position 0), Ben (1) and Sara (2) gives base 166,666 and remainder 2, so the shares are Alice 166,667 / Ben 166,667 / Sara 166,666, which is Rs. 1,666.67 / 1,666.67 / 1,666.66 and sums to Rs. 5,000.00.

### 4.6 Bill summary (review before save) and bill details

Both views show:

- The title, store, date, category and the people on the bill. A person is shown by the name the owner typed, and a linked person also shows their username ("Ben (@ben_doe)"). The owner appears as "You" to themself and as "@alice" to everyone else.
- Every item: name and details, quantity, unit price, line total and assignees (with each assignee's amount).
- The **total bill amount**.
- **Each person's share**, expandable to the items that make it up (for example "Pizza: Rs. 1,666.67 (split 3 ways)").
- A reconciliation indicator: ✓ "Shares add up to the bill total". If they ever don't, show an error. This should never happen.

The saved bill page opens with a compact **split summary** (title, store · date, total, and one line per person with their amount) that fits on a 360 px phone screen, so the owner can take one screenshot and send it in any chat app. The full breakdown follows below it.

On the saved bill page, a participant sees everything except the owner-only controls, and the share of the person they're linked to is highlighted ("Your share").

### 4.7 Linking people to accounts (invitations) and access

People on a bill don't need accounts. An invitation only **connects one person on the bill to one user account**, so that user can open the bill in the app.

- **Names are never matched to accounts automatically.** Say Alice adds "Ben" to a bill, and the real Ben later signs up with the name "Ben Doe" and the username @ben_doe. Nothing happens by itself: the bill doesn't appear in his account, and the app never compares names. The person "Ben" is connected to @ben_doe only when Alice invites @ben_doe **for that person** and Ben accepts. Ben's account name ("Ben Doe") is never shown to Alice. The bill keeps the name Alice typed, plus his username: "Ben (@ben_doe)". Alice can rename the person at any time.
- The owner invites from the bill page. They pick the person ("Who is this?": any person not yet linked, or **Someone new**, which adds a new person by name), then enter a **username** or **registered email**. Emails aren't verified, so the success message always names the matched `@username`. The owner can cancel if it's the wrong account.
- The identifier is normalized and matched **exactly** against an indexed field. No partial matching, no user directory, no listing of users.
- A successful invitation creates a **pending** invitation for that one person on that one trip. The response contains only the invitee's username. It never contains their email or name.
- An unmatched lookup returns one generic message: "No account matches that {username/email}. Ask your friend to sign up and finish setting up their account." Accounts that haven't chosen a username yet count as no match.
- Rules:
  - The person is already linked → error "Ben is already connected to an account".
  - The person already has a pending invitation, or this account already has a pending invitation on this bill → error "Already invited".
  - The account is already linked to a person on this bill → error "Already on this bill".
  - Inviting yourself → error.
  - Previously declined, cancelled or unlinked → the same invitation record is reset to **pending**, for whichever person it's now for (one record per trip and account, always).
- Invitees see pending invitations on the **Invitations** page (trip title, store, date, owner username, and the name they'd appear as, for example "as Ben") and can **Accept** or **Decline**. They see no items, totals or other people.
- **Accept** links the person to the account, and only then is access granted. **Decline** leaves the person on the bill as a plain name. Either way, the split doesn't change.
- Pending, declined, cancelled and unlinked accounts get no access to the trip, its items, its shares or its price observations.
- The owner sees each person's link state (not linked / pending / declined / linked) on the bill page and in **Invitations → Sent**. The owner can **cancel** a pending invitation and **unlink** a linked person after confirming. Unlinking ends that account's access immediately; the person stays on the bill with the same share.
- To take a person off the bill entirely, the owner edits the bill (§4.4). If that person was linked, the account loses access.
- At most 20 people per trip, including the owner (§4.4). Invitations attach to people who are already on the bill, so they don't add to the count; **Someone new** does.

**Permission model:** the owner can create, edit and delete the trip, its items, its people and their links. Participants have read-only access. Participants can't edit, delete, invite or unlink.

### 4.8 Bill History

- Lists every trip the user owns or is a linked person on.
- **Search** (case-insensitive substring) across the title, store and item names.
- **Filters:** a date range (from/to), a category, and ownership (All / Created by me / Shared with me, meaning bills where the user is a linked person but not the owner).
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
- Every public Convex function derives the caller from Convex Auth's `getAuthUserId(ctx)` (which reads the verified `ctx.auth` identity) and never trusts a client-supplied user ID.
- A trip is readable only by its owner and the accounts **linked** to a person on it. Guessed or modified IDs fail safely. "Not found" and "no access" return the **same** response (`null` for queries, `NOT_FOUND` for mutations), so the API doesn't reveal whether a record exists.
- Assignments are validated server-side against the trip's own people.
- Account emails and account names are never shown to other users. People on a bill are shown by the name the owner typed, plus the username of a linked person. Those typed names are visible only to the owner, the bill's participants, and (just their own one) the invitee of a pending invitation.
- No API returns a list of users, another user's trip list, item catalogue or price history.
- Secrets (`JWT_PRIVATE_KEY`, deploy keys) live only in the Convex deployment and Vercel settings, never in client code or the repo. Only `NEXT_PUBLIC_*` variables reach the browser.
- Error messages are friendly. No stack traces, tokens or internal IDs are shown to users.
- Passwords are handled only by Convex Auth (hashed, stored in its `authAccounts` table). Confirm password never leaves the browser. Convex Auth's built-in limit on failed sign-in attempts stays enabled.
- Session tokens are kept in httpOnly cookies by Convex Auth's Next.js integration, not in `localStorage`.

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
  - `src/lib/db/` is the **only** frontend code that imports `convex/react` or `convex/_generated/*`. It exports hooks such as `useRecentTrips()` and `useCreateTrip()` that return **plain app types** (IDs as `string`). The one exception: `src/lib/auth/hooks.ts` may use `useConvexAuth` from `convex/react` to read the sign-in status.
  - `src/lib/auth/` is the **only** frontend code that imports `@convex-dev/auth/*`. It exports the providers, hooks (`useSignUp`, `useSignIn`, `useSignOut`, `useAuthStatus`), `toAuthError`, the server helper `isSignedIn()` and the middleware factory. The sign-in/sign-up **forms** are ordinary app components in `src/components/auth/` that use these hooks.
  - `convex/` is the backend for the Convex service. Convex Auth is configured in `convex/auth.ts`.
- Pages and components never import an SDK directly and never contain queries.
- Environment variables are read only inside these folders.
- ESLint `no-restricted-imports` enforces this (Phase 0/1).

### 6.4 Other principles

- Use animation intentionally. Don't add unnecessary UI elements.
- **Keep business logic separate from UI.** Money, splitting, normalization, validation and price-change logic live in `src/domain/` as pure TypeScript (no React, Next, Convex or Convex Auth imports). Both the UI (for live previews) and Convex (authoritative) import them. The PRD's suggested location of `convex/lib/money.ts` is replaced by `src/domain/money.ts` to satisfy RULES §3 and §5. Convex functions import domain code with **relative** paths (for example `../src/domain/money`).

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
| Auth | Convex Auth (`@convex-dev/auth`, Password provider, plus its `@auth/core` peer dependency) | Email + password sign-up/sign-in, password hashing, sessions (httpOnly cookies via its Next.js integration). Runs inside Convex: no extra service, keys or webhook. Custom forms built from our components. |
| Backend + DB | Convex | Schema, queries, mutations, Convex Auth's HTTP routes, reactive updates. |
| Testing | Vitest, `convex-test`, `@edge-runtime/vm` | Unit tests for the domain, backend tests for functions and permissions. |
| Hosting | Vercel (Next.js) + Convex cloud (backend) | Separate dev and prod Convex deployments, each with its own auth keys. |

**Do not add:** PostgreSQL, Prisma, Express, Next.js API routes for CRUD, Redux/Zustand, Redis, queues, a search service, any other auth provider or auth library (Clerk, Auth0, NextAuth, Lucia, …), an email-sending service, form libraries, zod (Convex validators plus domain validators are enough), date libraries, chart libraries (except optionally in Phase 12), or any AI SDK.

---

## 8. Technical architecture

### 8.1 Overview

```text
Browser (Next.js client components)
   │  useQuery / useMutation (via src/lib/db hooks)
   │  sign-up / sign-in / sign-out (via src/lib/auth hooks; session in httpOnly cookies)
   ▼
Next.js middleware/proxy (convexAuthNextjsMiddleware: route redirects + auth request proxy)
   ▼
Convex (queries, mutations, Convex Auth)
   │  convex/auth.ts      → Password provider: hashing, sessions, JWT (ctx.auth)
   │  convex/lib/auth.ts  → requireCurrentUser / requireTripViewer / requireTripOwner
   │  src/domain/*        → money, normalization, validation (pure, shared)
   ▼
Convex database (Convex Auth tables, users, trips, tripPeople, tripInvitations, items, itemAssignments)
```

- **Convex is the whole backend**, including authentication. All reads are Convex queries and all writes are Convex mutations. There are no Next.js route handlers (`src/app/api/` must not exist). Convex Auth registers its own HTTP routes in `convex/http.ts`.
- **Mutations are transactions.** A save writes the trip, items and assignments atomically. Convex mutations are serializable, so "check, then insert" uniqueness checks (usernames, invitations) are race-safe. Concurrent conflicting writes are retried by Convex automatically.
- **Next.js middleware/proxy** (Convex Auth's `convexAuthNextjsMiddleware`) redirects signed-out users away from app routes, and signed-in users away from the sign-in/sign-up pages. It is **not** the security boundary.
- **Reactivity:** Convex subscriptions keep the dashboard, a bill page and the invitations inbox live without polling.

### 8.2 Frontend architecture

- `src/app/layout.tsx` (Server Component) sets fonts and global CSS. `AuthServerProvider` (Convex Auth's `ConvexAuthNextjsServerProvider`) wraps `<html>`, and `AuthClientProvider` (`ConvexAuthNextjsProvider` with the single shared client from `src/lib/db/client.ts`) wraps the body content. This one provider gives both Convex data and auth, so there is no separate `DbProvider`.
- Route groups:
  - `(public)`: landing.
  - `(auth)`: sign-in and sign-up.
  - `(onboarding)`: username setup.
  - `(app)`: everything behind the app shell.
- `(app)/layout.tsx` renders `AppShell` (header, desktop nav, mobile bottom nav, user menu) and `AccountGate`. `AccountGate` waits for the current user (the row is created by Convex Auth at sign-up) and redirects to `/onboarding` if the user has no username.
- Pages are thin Server Components that read `params`/`searchParams` (both are Promises in current Next.js, so `await` them) and render a client component that calls `src/lib/db` hooks.
- Form state is local `useState`/`useReducer` in the form component. There is no global store.
- Client-side calculations exist only for **preview**. The server always re-parses, re-validates and recomputes.

### 8.3 Backend architecture

- Functions are organised by feature: `auth.ts` (Convex Auth config), `users.ts`, `trips.ts`, `invitations.ts`, `items.ts`, `priceHistory.ts`, `http.ts` (Convex Auth routes only).
- Shared backend helpers live in `convex/lib/`:
  - `auth.ts`:
    - `getCurrentUser(ctx)` returns the user row or `null`, using `getAuthUserId(ctx)` then `ctx.db.get`.
    - `requireCurrentUser(ctx)` throws `UNAUTHENTICATED`.
    - `requireOnboardedUser(ctx)` throws `ONBOARDING_REQUIRED` if there is no username.
    - `getTripAccess(ctx, tripId, userId)` returns `{ trip, role: "owner" | "participant", personId } | null`, where `personId` is the caller's own person on the trip. It reads the `tripPeople` row with `by_trip_user = [tripId, userId]`: such a row exists only for the owner and for **linked** people.
    - `requireTripViewer(ctx, tripId)` and `requireTripOwner(ctx, tripId)` throw `NOT_FOUND` for missing **or** inaccessible trips. `requireTripOwner` throws `FORBIDDEN` only when the caller is a participant but not the owner.
  - `access.ts`: `listAccessibleTrips(ctx, userId, cap)` reads the `tripPeople` rows with `by_user = [userId]` (newest first, `take(cap)`), loads their trips and sorts them by `tripDate` desc then `createdAt` desc. Because the owner is always linked to their own `owner` row, this covers owned **and** shared trips. People without accounts have no `userId`, so they never appear here.
  - `tripWrite.ts`: shared create/update logic. It parses, validates, computes and writes people, items and assignments, and recomputes `totalPaisa`, `itemCount` and `searchText`. Removing a person (an update that leaves them out) also deletes their invitations, which ends a linked account's access.
  - `readModels.ts`: builds `TripCard` and `TripDetail` response objects and returns only the fields the screen needs.
  - `errors.ts`: `appError(code, message, fieldErrors?)` returns a `ConvexError`.
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
| `MAX_PEOPLE_PER_TRIP` | 20 | Trip validation and "Someone new" invitations (the owner + everyone named on the bill, linked or not) |

**Why there is no global item index scan:** price history and product search read items only through the user's accessible trips (index `by_trip_productMatchKey` / `by_trip`). Other users' records are never touched, so they can't influence results. If real data volume makes this slow, a user-scoped materialized index can be added later, after measuring.

### 8.4 Error contract

Backend errors are `ConvexError({ code, message, fieldErrors? })`. The codes live in `src/domain/errors.ts`:

| Code | When | UI behaviour |
|---|---|---|
| `UNAUTHENTICATED` | No identity | Redirect to sign-in |
| `ONBOARDING_REQUIRED` | No username yet | Redirect to `/onboarding` |
| `NOT_FOUND` | Missing **or** inaccessible record | "This bill doesn't exist or you don't have access." |
| `FORBIDDEN` | A participant tries an owner-only action | "Only the bill owner can do that." |
| `VALIDATION` | Domain validation failed; `fieldErrors` keyed like `title`, `people.2.name`, `items.3.unitPrice`, `items.3.assignees` | Show inline errors and keep form data |
| `USERNAME_TAKEN`, `USERNAME_INVALID` | Username rules | Inline under the field |
| `INVITE_NO_MATCH`, `INVITE_ALREADY_PENDING`, `INVITE_ALREADY_PARTICIPANT`, `INVITE_PERSON_LINKED`, `INVITE_SELF`, `TRIP_PEOPLE_LIMIT` | Invitations | Inline in the invite dialog |
| `INVITATION_NOT_PENDING` | Responding to or cancelling a non-pending invitation | Toast/inline + list refresh |

`src/lib/db/errors.ts` exports `toAppError(error)`. It returns `{ code, message, fieldErrors }`, and for unknown errors falls back to `{ code: "UNKNOWN", message: "Something went wrong. Please try again." }`.

Sign-up and sign-in errors come from Convex Auth, not from our functions. `src/lib/auth/errors.ts` exports `toAuthError(error, flow)`, which maps them to the messages in §4.1 (see Phase 1).

### 8.5 Folder structure (target)

```text
project-root/
├── design/
│   ├── tokens.css                  # existing — single source of styling values
│   └── fonts.ts                    # existing — next/font setup
├── docs/BUILD_PLAN.md
├── convex/
│   ├── schema.ts
│   ├── auth.ts                     # Convex Auth: Password provider
│   ├── auth.config.ts
│   ├── http.ts                     # Convex Auth HTTP routes only
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
│   │   └── errors.ts
│   └── _generated/                 # Convex CLI output — never edit
├── src/
│   ├── proxy.ts                    # or middleware.ts, per installed Next.js major
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── (public)/page.tsx
│   │   ├── (auth)/sign-in/page.tsx
│   │   ├── (auth)/sign-up/page.tsx
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
│   │   ├── layout/      # app-shell, nav-link, page-header, page-container, user-menu
│   │   ├── auth/        # sign-up-form, sign-in-form
│   │   ├── trips/       # trip-form, people-editor, item-editor, item-row, participant-picker,
│   │   │                # split-summary, trip-summary, participant-shares, trip-card,
│   │   │                # people-list, invite-dialog, item-name-combobox
│   │   ├── bills/       # bill-history-filters
│   │   ├── invitations/ # invitation-list
│   │   ├── price-history/ # product-search, price-history-list, price-change
│   │   └── dashboard/   # spending-summary
│   ├── domain/          # PURE TS — no react/next/convex/auth imports
│   │   ├── money.ts
│   │   ├── format.ts
│   │   ├── normalization.ts
│   │   ├── auth-validation.ts
│   │   ├── trip-validation.ts
│   │   ├── people.ts                # personLabel, removePersonFromItems
│   │   ├── price-change.ts
│   │   ├── categories.ts
│   │   ├── errors.ts
│   │   └── types.ts
│   └── lib/
│       ├── utils.ts                 # cn()
│       ├── db/                      # ONLY place importing convex client/_generated
│       │   ├── client.ts            # ConvexReactClient + env check
│       │   ├── ids.ts               # string <-> Id<> casts
│       │   ├── errors.ts            # toAppError
│       │   ├── users.ts
│       │   ├── trips.ts
│       │   ├── invitations.ts
│       │   └── price-history.ts
│       └── auth/                    # ONLY place importing @convex-dev/auth/*
│           ├── provider.tsx         # AuthServerProvider, AuthClientProvider
│           ├── hooks.ts             # useSignUp, useSignIn, useSignOut, useAuthStatus
│           ├── errors.ts            # toAuthError
│           ├── server.ts            # isSignedIn()
│           └── middleware.ts        # createAuthMiddleware()
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
```

There are no auth variables in `.env.local`.

Convex deployment environment (set by `npx @convex-dev/auth` or `npx convex env set NAME value`, **never** in `.env.local` or the repo):

```dotenv
SITE_URL=http://localhost:3000        # Phase 1; the app's URL (production URL in Phase 11)
JWT_PRIVATE_KEY=<generated>           # Phase 1; generated by `npx @convex-dev/auth`
JWKS=<generated>                      # Phase 1; generated by `npx @convex-dev/auth`
```

`CONVEX_SITE_URL`, used in `convex/auth.config.ts`, is built into Convex and doesn't need setting.

`src/lib/db/client.ts` throws a clear error naming the variable (`"NEXT_PUBLIC_CONVEX_URL is not set. Run npx convex dev."`) if a required value is missing. It never prints the values themselves. Production uses a separate Convex deployment with its own auth keys (Phase 11).

---

## 9. Data model (Convex schema)

This is the **final** schema. Each phase adds the tables it needs (marked). All timestamps are `Date.now()` milliseconds. Money is integer paisa. Quantity is an integer number of **thousandths** (`quantityMilli`, so 1.5 kg is 1500).

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const categoryValidator = v.union(
  v.literal("grocery"), v.literal("restaurant"), v.literal("shopping"), v.literal("other"),
);
export const invitationStatusValidator = v.union(
  v.literal("pending"), v.literal("accepted"), v.literal("declined"),
  v.literal("cancelled"), v.literal("unlinked"),
);

export default defineSchema({
  // Phase 1. Convex Auth's own tables (authAccounts holds the password hash, plus sessions,
  // refresh tokens, rate limits). App code never reads or writes them directly.
  ...authTables,

  // Phase 1. Replaces Convex Auth's default `users` table. The row is created by Convex Auth at sign-up
  // from the Password provider's profile(). Keep the optional fields Convex Auth writes; check the current
  // Convex Auth schema docs. Row creation time is the built-in `_creationTime`.
  users: defineTable({
    name: v.optional(v.string()),                  // from sign-up, 1–60 chars; always set in practice
    email: v.optional(v.string()),                 // trimmed + lowercase (normalized in profile()); always set in practice
    emailVerificationTime: v.optional(v.number()), // Convex Auth field; unused (no verification)
    image: v.optional(v.string()),                 // Convex Auth field; unused
    isAnonymous: v.optional(v.boolean()),          // Convex Auth field; unused
    username: v.optional(v.string()),              // as typed by the user (onboarding)
    usernameNormalized: v.optional(v.string()),    // lowercase, used for uniqueness/lookup
  })
    .index("email", ["email"])                     // name required by Convex Auth; also used for invite-by-email
    .index("by_usernameNormalized", ["usernameNormalized"]),

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

  // Phase 3 (owner row), Phase 5 (named people), Phase 6 (linking).
  // Everyone the bill is split between. A person needs no account; `userId` is set only for the owner
  // and for people whose invitation was accepted.
  tripPeople: defineTable({
    tripId: v.id("trips"),
    role: v.union(v.literal("owner"), v.literal("person")),
    name: v.optional(v.string()),                  // typed by the owner, 1–40 chars; absent on the owner row
    nameNormalized: v.optional(v.string()),        // normalizeText(name); unique per trip (checked in mutations)
    position: v.number(),                          // bill order: owner 0, then 1, 2, … in the order added; never changes
    userId: v.optional(v.id("users")),             // linked account; always the owner on the owner row
    linkedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trip", ["tripId", "position"])
    .index("by_trip_user", ["tripId", "userId"])   // the caller's own person on a trip; at most one per (trip, user)
    .index("by_user", ["userId"]),                 // every trip a user can see (owner or linked)

  // Phase 6. One record per (trip, invitee account), reused on re-invite.
  // NOTE: the raw identifier typed by the inviter is NOT stored (data minimisation).
  tripInvitations: defineTable({
    tripId: v.id("trips"),
    personId: v.id("tripPeople"),                  // the person this account would be linked to
    inviteeUserId: v.id("users"),
    invitedByUserId: v.id("users"),
    invitedVia: v.union(v.literal("username"), v.literal("email")),
    status: invitationStatusValidator,
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_trip_invitee", ["tripId", "inviteeUserId"])
    .index("by_person_status", ["personId", "status"])
    .index("by_trip", ["tripId"])
    .index("by_invitee_status", ["inviteeUserId", "status"])
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
    personId: v.id("tripPeople"),                  // a person on the bill, not an account
    allocatedAmountPaisa: v.number(),
  })
    .index("by_item", ["itemId"])
    .index("by_trip_person", ["tripId", "personId"]),  // prefix [tripId] = all assignments of a trip
});
```

**Invariants (enforced in mutations, covered by tests):**

1. Each trip has exactly one `tripPeople` row with `role: "owner"`, `position: 0` and `userId = trip.ownerId`.
2. Every other `tripPeople` row has `role: "person"` and a `name`. Names are unique per trip by `nameNormalized`. A trip has at most `MAX_PEOPLE_PER_TRIP` rows. Positions are unique per trip and never change.
3. A user is linked to at most one person per trip (`by_trip_user`). A person's `userId` is set only by accepting an invitation, and cleared only by unlinking.
4. There is at most one `tripInvitations` row per `(tripId, inviteeUserId)`, and at most one **pending** invitation per person. An `accepted` invitation exists exactly when its person is linked to its invitee. Re-invites reuse the row.
5. `trip.totalPaisa = Σ items.lineTotalPaisa`.
6. For each item, `Σ itemAssignments.allocatedAmountPaisa = item.lineTotalPaisa`, with ≥ 1 assignment.
7. Every assignment's `personId` is a `tripPeople` row on the same trip. Linking, unlinking or renaming a person never touches assignments.
8. `usernameNormalized` and `email` are unique across users. Usernames are checked in `setUsername`. Email uniqueness is enforced by Convex Auth: the Password provider uses the normalized email as the account ID, so a second sign-up with the same email (in any letter case) fails.
9. Deleting a trip deletes all of its people, invitations, items and assignments in the same mutation, leaving no orphans. Removing a person deletes their invitations too.

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
 * Deterministic equal allocation. `personKeys` must already be in bill order (by position).
 * Gives floor(total/n) to each, and +1 paisa to the first (total % n) keys in that order.
 * Throws if personKeys is empty or contains duplicates.
 */
export function allocateEqually(totalPaisa: number, personKeys: string[]): { personKey: string; amountPaisa: number }[];

export type BillItemInput = { quantityMilli: number; unitPricePaisa: number; assigneeKeys: string[] };
export type ComputedBill = {
  items: { lineTotalPaisa: number; allocations: { personKey: string; amountPaisa: number }[] }[];
  totalPaisa: number;
  shares: { personKey: string; totalPaisa: number; contributions: { itemIndex: number; amountPaisa: number; splitCount: number }[] }[];
  reconciled: boolean;   // Σ shares === totalPaisa
};
/** `peopleOrder` lists every person key in bill order; each item's assignees are sorted by it before allocating.
 *  `shares` has one entry per person in `peopleOrder`, including people with Rs. 0. */
export function computeBill(items: BillItemInput[], peopleOrder: string[]): ComputedBill;
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
- `isValidEmail(s)`: the normalized value is at most 254 characters and matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. This is deliberately simple; there is no verification.
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
- People's names are compared with `normalizeText` (so "Ben", " ben " and "BEN" clash). They are never compared with usernames, emails or account names.

### 10.4 `trip-validation.ts`

```ts
export type TripDetailsInput = { title: string; storeName: string; tripDate: string; category: Category };
/** Everyone on the bill except the owner, in bill order. `key` is the existing person's ID, or a
 *  temporary client key such as "new:1" for a person added in this form. */
export type PersonInput = { key: string; personId?: string; name: string };
export const OWNER_KEY = "owner";
export type ItemInput = {
  itemId?: string; name: string; brand: string; variant: string; packSize: string; unit: string;
  quantity: string; unitPrice: string; assigneeKeys: string[];   // OWNER_KEY or PersonInput keys
};
export type ValidatedTrip = {
  details: { title: string; storeName?: string; tripDate: string; category: Category };
  people: { key: string; personId?: string; name: string; nameNormalized: string }[];
  items: (Omit<ItemInput, "quantity" | "unitPrice"> & { quantityMilli: number; unitPricePaisa: number })[];
};
export function validateTripInput(
  details: TripDetailsInput, people: PersonInput[], items: ItemInput[],
): { ok: true; value: ValidatedTrip } | { ok: false; fieldErrors: Record<string, string> };
export function validatePersonName(input: string): Result<string>;   // trimmed, 1–40 chars
```

Rules: the field limits in §4.3/§4.4. `tripDate` must be a real calendar date matching `/^\d{4}-\d{2}-\d{2}$/` and no later than 1 year in the future. Items must number 1–200. People must number at most 19 (plus the owner). Each person's name passes `validatePersonName` ("Enter a name", "Name must be 40 characters or fewer") and is unique by `normalizeText` ("Someone on this bill already has that name", on the later duplicate under `people.i.name`). Keys must be unique and must not be `OWNER_KEY`. Each item's `assigneeKeys` must be non-empty and deduplicated, and every key must be `OWNER_KEY` or a key in `people` (otherwise `items.i.assignees` gets "Choose who pays for this item" or "Choose people from this bill"). Optional strings are trimmed, and empty strings become `undefined`.

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
- App types such as `CurrentUser` (`{ id, name, email, username: string | null }`), `TripCard`, `TripDetail`, `BillPerson`, `InvitationReceived`, `InvitationSent`, `ProductResult`, `PriceObservation` and `SpendingSummary`, with IDs as `string`. The response shapes are in §11.
- `personLabel(person, viewerPersonId)` builds the display text used everywhere: "You" for the viewer's own person, "@alice" for the owner, "Ben" for an unlinked person and "Ben (@ben_doe)" for a linked one.

### 10.7 `auth-validation.ts`

Used by the sign-up/sign-in forms (instant inline errors) and by `convex/auth.ts` (authoritative server checks).

```ts
export type SignUpInput = { name: string; email: string; password: string; confirmPassword: string };
export type SignInInput = { email: string; password: string };
type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validateName(input: string): Result<string>;      // trimmed, 1–60 chars
export function isValidPassword(input: string): boolean;          // 8–128 chars, not trimmed
export function validateSignUp(input: SignUpInput):
  | { ok: true; value: { name: string; email: string; password: string } } // email normalized; no confirmPassword
  | { ok: false; fieldErrors: FieldErrors<SignUpInput> };
export function validateSignIn(input: SignInInput):
  | { ok: true; value: { email: string; password: string } }
  | { ok: false; fieldErrors: FieldErrors<SignInInput> };
```

| Field | Messages |
|---|---|
| `name` | "Enter your name", "Name must be 60 characters or fewer" |
| `email` | "Enter your email", "Enter a valid email address" |
| `password` (sign-up) | "Enter a password", "Password must be at least 8 characters", "Password must be 128 characters or fewer" |
| `confirmPassword` | "Confirm your password", "Passwords don't match" |
| sign-in | Presence checks only: "Enter your email", "Enter your password". Sign-in never shows password rules. |

---

## 11. Backend API (Convex functions)

Every public function starts with an auth helper. "Viewer" means the owner or a participant (an account linked to a person on the trip).

### 11.1 `users.ts`

| Function | Type | Args | Returns / behaviour |
|---|---|---|---|
| `getCurrent` | query | — | `null` if unauthenticated. Otherwise `{ id, name, email, username: string \| null }`. Only the caller's own data. |
| `isUsernameAvailable` | query | `{ username: string }` | `{ valid: boolean, available: boolean }`. Reveals nothing else. |
| `setUsername` | mutation | `{ username: string }` | Validates and normalizes, checks `by_usernameNormalized` (ignoring the caller's own row), patches. Errors: `USERNAME_INVALID`, `USERNAME_TAKEN`. |
| `updateName` | mutation | `{ name: string }` | Phase 2. `requireCurrentUser`, `validateName`, patch. Error: `VALIDATION` with `fieldErrors.name`. |

There is no "create user" function: Convex Auth creates the `users` row at sign-up.

### 11.2 `auth.ts`, `auth.config.ts` and `http.ts` (Convex Auth)

- `convex/auth.ts`:
  ```ts
  export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [Password({ profile, validatePasswordRequirements })],
  });
  ```
  - `profile(params)`: `email = normalizeEmail(params.email)`, which must pass `isValidEmail`. For the `signUp` flow, `validateName(params.name)` must pass and it returns `{ email, name }`. For other flows it returns `{ email }`. On failure it throws `appError("VALIDATION", …, { email | name: message })`. Any other params (there shouldn't be any) are ignored.
  - `validatePasswordRequirements(password)`: throws `appError("VALIDATION", …, { password: … })` unless `isValidPassword(password)`.
  - Keep Convex Auth's default limit on failed sign-in attempts.
  - Follow the current Convex Auth docs for the exact option names and import paths (`@convex-dev/auth/server`, `@convex-dev/auth/providers/Password`).
- `convex/auth.config.ts`: `providers: [{ domain: process.env.CONVEX_SITE_URL, applicationID: "convex" }]`.
- `convex/http.ts`: `const http = httpRouter(); auth.addHttpRoutes(http); export default http;`. There are no other routes.

### 11.3 `trips.ts`

| Function | Type | Args | Returns / behaviour |
|---|---|---|---|
| `create` | mutation | `{ details: {title, storeName, tripDate, category}, people: PersonInputValidator[], items: ItemInputValidator[] }` | `requireOnboardedUser`. `validateTripInput` (no `personId`s allowed), then `computeBill` with the bill order (owner, then `people` as listed). Inserts the trip, the owner row (`position` 0), one `tripPeople` row per person (`position` 1, 2, …), items (`position`, `normalizedName`, `productMatchKey`, `lineTotalPaisa`) and assignments (keys mapped to the new person IDs). Sets `totalPaisa`, `itemCount` and `searchText`. Returns `{ tripId }`. |
| `update` | mutation | `{ tripId: v.string(), details, people, items }` | `requireTripOwner`. People with a `personId` must be non-owner people of this trip, and items with an `itemId` must belong to this trip (otherwise `VALIDATION`). Existing people keep their `position` and get their name patched; new people get the next positions in the order listed; people left out are deleted along with their invitations (a linked account loses access). The bill order is the people sorted by `position`. Patches existing items, inserts new ones, deletes removed ones. Deletes all of the trip's assignments and reinserts them from `computeBill`. Patches the trip totals, `searchText` and `updatedAt`. |
| `remove` | mutation | `{ tripId: v.string() }` | `requireTripOwner`. Deletes assignments, then items, then invitations, then people, then the trip. |
| `get` | query | `{ tripId: v.string() }` | `null` unless the caller is a viewer. Otherwise returns `TripDetail` (below). |
| `listRecent` | query | — | The first `RECENT_TRIPS_LIMIT` of `listAccessibleTrips`, as `TripCard[]`. |
| `listHistory` | query | `{ search?, category?, from?, to?, ownership: "all"\|"owned"\|"shared", sort: "date_desc"\|"date_asc"\|"total_desc"\|"total_asc", limit: number }` | Filters `listAccessibleTrips` in memory (search = `normalizeText(search)` substring of `searchText`; date range = string comparison on `tripDate`). Sorts, then slices to `min(limit, 200)`. Returns `{ trips: TripCard[], hasMore: boolean, totalAccessible: number }`. |
| `spendingSummary` | query | `{ month: "YYYY-MM" }` | Phase 10 (see there). |

`PersonInputValidator` = `v.object({ key: v.string(), personId: v.optional(v.string()), name: v.string() })`. `ItemInputValidator` = `v.object({ itemId: v.optional(v.string()), name: v.string(), brand: v.string(), variant: v.string(), packSize: v.string(), unit: v.string(), quantity: v.string(), unitPrice: v.string(), assigneeKeys: v.array(v.string()) })`. IDs arrive as strings and are checked with `ctx.db.normalizeId`. Quantity and price arrive as **strings** and are parsed on the server by the same domain functions the UI uses.

```ts
type TripCard = {
  id: string; title: string; storeName: string | null; tripDate: string; category: Category;
  totalPaisa: number; itemCount: number;
  peopleLabels: string[];   // personLabel() for each person, in bill order (the viewer's own is "You")
  isOwner: boolean;
};
type BillPerson = {
  personId: string; isOwner: boolean; isViewer: boolean;
  name: string | null;          // the name the owner typed; null for the owner row
  username: string | null;      // the owner's, or a linked person's; null when not linked
  // Owner viewers only (null for everyone else): the person's link state.
  link: null | { state: "none" } | { state: "linked" }
      | { state: "pending" | "declined"; invitationId: string; username: string; invitedAt: number; respondedAt: number | null };
};
type TripDetail = {
  id: string; title: string; storeName: string | null; tripDate: string; category: Category; currency: "PKR";
  totalPaisa: number; viewerRole: "owner" | "participant"; viewerPersonId: string;
  owner: { username: string };
  people: BillPerson[];          // bill order (position)
  items: {
    id: string; name: string; brand: string | null; variant: string | null; packSize: string | null; unit: string | null;
    quantityMilli: number; unitPricePaisa: number; lineTotalPaisa: number;
    assignees: { personId: string; amountPaisa: number }[];
  }[];
  shares: { personId: string; totalPaisa: number;
            items: { itemId: string; name: string; amountPaisa: number; splitCount: number }[] }[];   // bill order, every person
  reconciled: boolean;
};
```

### 11.4 `invitations.ts` (Phase 6)

| Function | Type | Args | Behaviour |
|---|---|---|---|
| `invite` | mutation | `{ tripId: v.string(), personId: v.optional(v.string()), newPersonName: v.optional(v.string()), via: "username"\|"email", identifier: v.string() }` | `requireTripOwner`. Exactly one of `personId` / `newPersonName` (otherwise `VALIDATION`). **Person:** `personId` must be a non-owner person of this trip; already linked → `INVITE_PERSON_LINKED`; has a pending invitation → `INVITE_ALREADY_PENDING`. **Account:** normalize by type (`normalizeUsername` / `normalizeEmail`; an invalid format gives `INVITE_NO_MATCH` with no format hint), then an exact index lookup on `by_usernameNormalized` or `email`. No match or no username → `INVITE_NO_MATCH`. Self → `INVITE_SELF`. Already linked to a person on this trip → `INVITE_ALREADY_PARTICIPANT`. Existing `(trip, invitee)` row: pending → `INVITE_ALREADY_PENDING`; declined/cancelled/unlinked → patch to `pending` for this person (new `createdAt`, clear `respondedAt`, set `invitedVia`). **New person:** only after all of the above pass, validate `newPersonName` (`validatePersonName`, unique on the trip → `VALIDATION` `fieldErrors.newPersonName`), check `MAX_PEOPLE_PER_TRIP` (`TRIP_PEOPLE_LIMIT`), and insert the person at the next position, with no items. Otherwise insert a `pending` row. Returns `{ invitationId, username }` only. |
| `listReceived` | query | — | The caller's `by_invitee_status = pending` rows (take 50) → `{ invitationId, tripTitle, storeName, tripDate, ownerUsername, personName, invitedAt }[]`. No items, totals or other people. |
| `pendingCount` | query | — | Number of pending received invitations (take 51; the UI shows "50+"). Used by the nav badge. |
| `listSent` | query | — | Rows where `invitedByUserId = me`, status pending, accepted or declined, newest first, take 50 → `{ invitationId, tripId, tripTitle, personName, username, status, invitedAt, respondedAt }[]`. |
| `respond` | mutation | `{ invitationId: v.string(), accept: v.boolean() }` | The row must exist, `row.inviteeUserId === me` and the status must be `pending`. Otherwise `NOT_FOUND` / `INVITATION_NOT_PENDING`. Decline → `declined`. Accept → re-check that the person still exists and isn't linked, and that the caller isn't linked to another person on this trip (otherwise mark the row `cancelled` and throw `INVITATION_NOT_PENDING`); then set `person.userId` and `linkedAt`, and the row to `accepted`. Sets `respondedAt`. Never touches assignments. Returns `{ tripId }` on accept. |
| `cancel` | mutation | `{ invitationId: v.string() }` | Caller = trip owner, status `pending` → `cancelled`. |
| `unlink` | mutation | `{ personId: v.string() }` | Caller = trip owner. The person must be a linked non-owner person of this trip. Clears `userId` and `linkedAt` and sets their `accepted` invitation to `unlinked`. Access ends immediately. Never touches assignments, so every share stays the same. |

Removing a person from the bill is not an invitations function: it's an edit of the bill (`trips.update` leaves them out).

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
- **Desktop (≥ md):** a top header with the logo, inline nav links and the user menu (name and @username, Settings, Sign out). Content is centred with `max-w-content` (forms and details), or wider (`lg`) for history tables if needed.
- Nav entries are added only in the phase that ships their page.

### 12.2 Screen list

| Route | Screen | Key content |
|---|---|---|
| `/` | Landing | Short value proposition (3 bullets), Sign up / Sign in. Signed-in users are redirected to `/dashboard`. |
| `/sign-up` | Sign up | Centred card: **Name**, **Email**, **Password**, **Confirm password**, a **Create account** button, and "Already have an account? Sign in". |
| `/sign-in` | Sign in | Centred card: **Email**, **Password**, a **Sign in** button, and "New here? Create an account". |
| `/onboarding` | Choose username | A single field with a live availability check (debounced 400 ms), rules hint and Continue. |
| `/dashboard` | Dashboard | Greeting `Hi, {name}`, a **New bill** button, recent bills (5), links to Bill History and Price History, and (Phase 10) the spending summary. |
| `/trips/new` | New bill | Details section, **People** section (Phase 5), items editor, sticky footer with running total and **Review**. The review screen shows the summary with **Back to edit** and **Save bill**. |
| `/trips/[tripId]` | Bill details | Header (title, store, date, category, Owned/Shared badge). Split summary card sized for one phone screenshot. Owner actions: Edit, Delete, Invite. Items list, total, per-person shares with breakdown, reconciliation badge. People section (the owner sees each person's link state and actions). |
| `/trips/[tripId]/edit` | Edit bill | The same form as new, prefilled. Save goes straight to an update after review. |
| `/invitations` | Invitations | Two tabs: **Received** ("as Ben", Accept/Decline) and **Sent** (status badges, Cancel for pending). |
| `/trips` | Bill History | Search, filter bar (collapsible on mobile), sort, result list, Load more. |
| `/price-history` | Price History | Product search, results, selected product observations, other variants. |
| `/settings` | Settings | Name (edit), username (edit), email (read-only), Sign out. |

### 12.3 Item editor UX (mobile-first)

- Each item is a card:
  - Row 1: **Name** (full width).
  - Row 2: **Qty** (narrow, `inputMode="decimal"`), **Unit price** (`inputMode="decimal"`, `Rs.` prefix), and the **line total** right-aligned.
  - Row 3: assignee chips for the people on the bill (Phase 5; before Phase 5, and on bills with only the owner, this shows "Paid by you").
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
  - `createUser(t, username, { name?, email?, skipUsername? })`:
    1. Insert a `users` row with `t.run` (`name` defaults to the username, `email` to `${username}@example.com`).
    2. Build `as = t.withIdentity({ subject: \`${userId}|test-session\` })`. Convex Auth's `getAuthUserId` reads the user ID before the `|`.
    3. Call `setUsername` as that user, unless `skipUsername` is set (for "no username yet" cases).
    It returns `{ id, as }`, where `as` is the identity-bound accessor. Check the subject format against the current Convex Auth docs/source if `getAuthUserId` returns `null` in tests.
  - The Password sign-up/sign-in flow itself isn't run in `convex-test`. Its rules are covered by `auth-validation` unit tests and the manual checklist.
  - `createTrip(as, overrides)` builds valid input (`people` defaults to `[]`, every item assigned to `OWNER_KEY`).
  - Use the current convex-test docs if the glob or config syntax has changed.
- Scripts in `package.json`:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"typecheck": "tsc --noEmit && tsc --noEmit -p convex"`
  - `"lint": "eslint ."`
  - `"check": "npm run typecheck && npm run lint && npm test"`

### 13.2 Test accounts for manual testing

There is no email verification, so no codes or real inboxes are needed. Sign up in the app:

- **Alice** / `alice@example.com`, **Bob** / `bob@example.com`, **Carol** / `carol@example.com`, each with a password such as `testpass123` (development only).
- Roles used in checklists: **Alice** (owner), **Bob** (invitee/participant), **Carol** (unrelated user). Use separate browser profiles or a private window for each.
- People without accounts are just names typed on a bill, for example **Ben** and **Sara**. For the "links later" checks, sign up a fourth account as Ben Doe with the username `ben_doe`.

### 13.3 Mandatory test coverage (accumulates per phase)

- Money: every case in §4.5, uneven paisa splits, rounding, parsing, and a randomised reconciliation property test (500 random bills from a seeded generator: Σ shares === total).
- Permissions matrix: owner, linked participant, pending, declined, cancelled, unlinked, removed from the bill, unrelated and unauthenticated, against `trips.get`, `update`, `remove`, `listRecent`, `listHistory`, `invitations.*`, `priceHistory.*` and `items.suggest`.
- People: names unique per bill (ignoring case), the 20-person limit, and that linking, unlinking, declining and renaming never change any allocation.
- Sign-up and sign-in validation rules and messages (§10.7).
- Invitations by username and email (both case-insensitive); users without a username are not matched; a person's name is never used for matching; duplicates; re-invites; self-invites; responding to another user's invitation.
- Isolation: editing or deleting one trip doesn't change another trip's item with the same product.
- Product variants and units are not merged.
- Deletion removes the trip from history and price history and revokes access.
- Invitation and trip responses contain no account `email` or account `name` for other users (assert on the object keys; a person's `name` is the owner-typed label and must never equal data read from a `users` row).

---

## 14. How to execute this plan

Instructions for the implementing agent:

1. **Work one phase at a time, in order.** Within a phase, implement the backend, domain, UI and tests together. Don't mock data the backend can provide.
2. **Before writing code that touches Next.js, Convex, Convex Auth, Tailwind, shadcn or convex-test, check the current official docs.** APIs change: for example `proxy.ts` vs `middleware.ts`, Convex Auth's Next.js middleware and server provider, async `params`, and Vitest `projects`.
   - Convex + Next.js App Router: https://docs.convex.dev/client/nextjs/app-router/
   - Convex Auth: https://labs.convex.dev/auth
   - Convex Auth with Next.js: https://labs.convex.dev/auth/authz/nextjs
   - Convex Auth passwords: https://labs.convex.dev/auth/config/passwords
   - Convex indexes: https://docs.convex.dev/database/reading-data/indexes/
   - convex-test: https://docs.convex.dev/testing/convex-test
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
   - Sizes (all pill-shaped): `lg` = `h-control-lg px-28 type-button rounded-pill`, `md` = `h-control-md px-24 type-button-sm rounded-pill`, `sm` = `h-control-sm px-16 type-button-sm rounded-pill`, `icon` = `size-tap rounded-pill`. Disabled: `opacity-50 pointer-events-none`. Keep `asChild` (Radix Slot) so it can wrap `next/link`.
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
         { group: ["@convex-dev/auth", "@convex-dev/auth/*"], message: "RULES §3: import Convex Auth only in src/lib/auth." },
       ] }] },
     },
     {
       files: ["src/domain/**/*.ts"],
       rules: { "no-restricted-imports": ["error", { patterns: [
         { group: ["react", "react/*", "next", "next/*", "convex", "convex/*", "@convex-dev/*", "@/lib/*", "@/components/*"], message: "src/domain must stay pure TypeScript." },
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

- [x] `npm run dev` → `http://localhost:3000` shows the landing page in Outfit/Plus Jakarta Sans with token colours, at 360 px and 1280 px.
- [x] Adding `className="p-[13px]"`, `style={{}}` or `"#ff0000"` to a component makes `npm run lint` fail (then revert).
- [x] `npm run check` passes, and the format tests pass.
- [x] Git has an initial commit.

---

### Phase 1 — Sign-up, sign-in, app shell and username onboarding

**Goal:** a person signs up with **Name, Email, Password and Confirm password**, chooses a unique username, lands on the (empty) dashboard inside the app shell, and signs out. They can sign in again with email and password. A signed-out visitor can't reach app pages.

**🧑 HUMAN steps** (no third-party auth account or keys are needed)

1. Run `npx convex dev`, log in, and create a project. This writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.
2. After the packages below are installed, run `npx @convex-dev/auth` and accept its prompts, using `http://localhost:3000` as the site URL. It sets `SITE_URL`, `JWT_PRIVATE_KEY` and `JWKS` on the Convex dev deployment. If it offers to write files that this plan also defines (`convex/auth.ts`, `convex/http.ts`, `convex/auth.config.ts`), let it, then adjust them to match §11.2.

**Backend**

- `npm i convex @convex-dev/auth @auth/core` (use the `@auth/core` version the Convex Auth docs specify), and `npm i -D convex-test @edge-runtime/vm`.
- `convex/schema.ts`: `...authTables` and the `users` table (§9).
- `convex/auth.ts`, `convex/auth.config.ts` and `convex/http.ts` (§11.2).
- `convex/lib/errors.ts` and `convex/lib/auth.ts` (`getCurrentUser`, `requireCurrentUser`, `requireOnboardedUser`), using `getAuthUserId(ctx)` then `ctx.db.get`.
- `convex/users.ts`: `getCurrent`, `isUsernameAvailable`, `setUsername` (§11.1).

**Domain**

- `src/domain/normalization.ts`: `normalizeText`, `normalizeUsername`, `isValidUsername`, `normalizeEmail` and `isValidEmail`. The rest comes later.
- `src/domain/auth-validation.ts` (§10.7).
- `src/domain/errors.ts` (codes) and `src/domain/types.ts` (`CurrentUser`).

**Frontend service folders**

- `src/lib/auth/`:
  - `provider.tsx`:
    - `AuthServerProvider` wraps `ConvexAuthNextjsServerProvider`.
    - `AuthClientProvider` is a client component wrapping `ConvexAuthNextjsProvider` with the shared client from `src/lib/db/client.ts`.
  - `hooks.ts`:
    - `useSignUp()` returns `{ signUp({ name, email, password }), isPending, error }`. It calls `useAuthActions().signIn("password", { flow: "signUp", name, email, password })`. `confirmPassword` is never passed.
    - `useSignIn()` has the same shape, with `flow: "signIn"` and `{ email, password }`.
    - `useSignOut()`.
    - `useAuthStatus()` returns `{ isLoading, isAuthenticated }` (wraps `useConvexAuth`).
  - `errors.ts`: `toAuthError(error, flow)` returns `{ message?, fieldErrors? }`:
    - A sign-in failure (unknown email or wrong password) → "Email or password is incorrect."
    - Sign-up with an email that already has an account → `fieldErrors.email` = "An account with this email already exists. Sign in instead."
    - Too many failed attempts → "Too many attempts. Wait a few minutes and try again."
    - Our `VALIDATION` errors from `profile()`/`validatePasswordRequirements` → their `fieldErrors`.
    - Anything else → "Something went wrong. Please try again."
    - Match on what the installed Convex Auth version actually throws: trigger each case once and confirm.
  - `server.ts`: `isSignedIn()` wraps `isAuthenticatedNextjs()`.
  - `middleware.ts`: `createAuthMiddleware()` returns `convexAuthNextjsMiddleware`, which:
    - redirects signed-out visitors on `/dashboard(.*)`, `/trips(.*)`, `/invitations(.*)`, `/price-history(.*)`, `/settings(.*)` and `/onboarding(.*)` to `/sign-in` (`nextjsMiddlewareRedirect`);
    - redirects signed-in users on `/sign-in` and `/sign-up` to `/dashboard`.
- `src/proxy.ts` (or `src/middleware.ts` for the installed Next.js version): `export default createAuthMiddleware();` plus the matcher config from the Convex Auth Next.js docs.
- `src/lib/db/`:
  - `client.ts`: the env check and a single `ConvexReactClient`.
  - `ids.ts`: `toId<T>(s: string): Id<T>` and `fromId(id): string`.
  - `errors.ts`: `toAppError`.
  - `users.ts`: `useCurrentUser()` returns `CurrentUser | null | undefined`; also `useUsernameAvailability(name)` and `useSetUsername()`.
- Root layout: `<AuthServerProvider><html …><body><AuthClientProvider>{children}</AuthClientProvider></body></html></AuthServerProvider>`.

**UI**

- Components:
  - `components/ui/text-field.tsx`: label, input, hint and error with `aria-describedby`; `h-control-md`, `rounded-md`, `border-line-strong`, `focus:border-primary`; error state `border-error text-error`. It passes `type` and `autoComplete` through.
  - `components/ui/card.tsx`, `components/ui/loading-state.tsx` (skeleton blocks), `components/ui/empty-state.tsx`, `components/ui/error-state.tsx`.
  - `components/layout/app-shell.tsx`, `nav-link.tsx` (active state via `usePathname`) and `page-header.tsx`.
  - `components/layout/user-menu.tsx`: a button showing the user's name that opens a dropdown (`npx shadcn@latest add dropdown-menu`, restyled with tokens). In this phase it shows the name, `@username` and **Sign out**.
- `components/auth/sign-up-form.tsx`:
  - Fields: **Name** (`autoComplete="name"`), **Email** (`type="email"`, `autoComplete="email"`), **Password** (`type="password"`, `autoComplete="new-password"`, hint "At least 8 characters") and **Confirm password** (`type="password"`, `autoComplete="new-password"`).
  - Validates with `validateSignUp` on blur and on submit, with inline errors. The server isn't called while the form is invalid.
  - **Create account** calls `useSignUp` and shows a pending state. On success it does `router.replace("/onboarding")`. On failure it shows `toAuthError` messages inline (field errors) or above the button (`role="alert"`), and keeps everything the user typed.
  - Footer link: "Already have an account? Sign in".
- `components/auth/sign-in-form.tsx`:
  - Fields: **Email** and **Password** (`autoComplete="current-password"`). It uses `validateSignIn`.
  - **Sign in** calls `useSignIn`. On success it does `router.replace("/dashboard")`, and `AccountGate` sends a user without a username to onboarding. On failure it shows the generic message above the button (`role="alert"`) and keeps the email.
  - Footer link: "New here? Create an account".
- `(auth)/sign-up/page.tsx` and `(auth)/sign-in/page.tsx`: a centred card with the app name and the form.
- Landing: if `await isSignedIn()`, `redirect("/dashboard")`.
- `(onboarding)/onboarding/page.tsx`:
  1. Show the username field with a live availability check ("@alice is available" ✓ or "That username is taken" ✗) and the rules hint "3–20 characters: letters, numbers, underscore; start with a letter".
  2. Continue calls `setUsername` and then `router.replace("/dashboard")`.
  3. If the user already has a username, redirect to the dashboard.
- `(app)/layout.tsx`: `AppShell` + `AccountGate`.
  - `AccountGate` (client): while auth or the current user is loading, show a full-page loading state. If the user has no username, `router.replace("/onboarding")`. Otherwise render the children.
  - Nav in this phase: **Home** only, plus the user menu.
- `(app)/dashboard/page.tsx`: "Hi, {name}" and an `EmptyState` ("Your bills will appear here."). There's no button yet, because creating bills arrives in Phase 3.
- `(app)/error.tsx`: friendly error with **Try again** (`reset()`).
- `src/app/not-found.tsx`.

**Tests**

- Extend `vitest.config.mts` with the `convex` project, and create `tests/convex/helpers.ts`.
- `tests/convex/users.test.ts`:
  - `getCurrent` returns exactly the keys `id`, `name`, `email` and `username` for the caller.
  - `setUsername` rejects invalid names (`"ab"`, `"1abc"`, `"has space"`).
  - Uniqueness is case-insensitive (`Alice` then `alice` → `USERNAME_TAKEN`).
  - A user can re-save their own username.
  - Unauthenticated calls to `getCurrent` return `null`, and to `setUsername` throw `UNAUTHENTICATED`.
- `tests/unit/normalization.test.ts`: username normalization and validity; `normalizeEmail` (`" Alice@Example.COM "` → `"alice@example.com"`) and `isValidEmail`.
- `tests/unit/auth-validation.test.ts`: every message in §10.7, including an empty form, a 61-character name, `"alice@"`, a 7-character password (rejected), an 8-character one (accepted), 129 characters (rejected), a confirm mismatch, a trimmed name and email, and sign-in presence checks only.

**Verification checklist**

- [x] Signing up as Alice / `alice@example.com` / `testpass123` (confirmed) leads to `/onboarding`. Choosing `alice` leads to the dashboard showing "Hi, Alice".
- [x] The sign-up form blocks an empty field, an invalid email, a 7-character password and a mismatched confirm password with inline messages, without a network request.
- [x] Signing up again with `ALICE@example.com` shows "An account with this email already exists. Sign in instead."
- [x] A second account trying the username `Alice` sees "That username is taken".
- [x] Signing out leads to `/`. Visiting `/dashboard` while signed out redirects to `/sign-in`. Visiting `/sign-in` while signed in redirects to `/dashboard`.
- [x] Signing in with `Alice@Example.com` and the right password goes straight to the dashboard, not onboarding. A wrong password shows "Email or password is incorrect."
- [x] Reloading the page keeps the user signed in.
- [x] The Convex dashboard shows exactly one `users` row per account with `name` and lowercase `email`. No plain-text password appears in any table.
- [x] `npm run check` passes.

---

### Phase 2 — Profile and settings

**Goal:** users see their account details on a Settings page and can change their name and username.

**Backend**

- `convex/users.ts`: add `updateName` (§11.1).

**Domain**

- Nothing new: `validateName` exists since Phase 1.

**UI**

- Nav: add **Settings** to the user menu.
- `components/ui/badge.tsx` (variants `neutral | success | warning | error | primary`). It's introduced here for the Settings page and reused for category, Owned/Shared and invitation-status badges in later phases.
- `(app)/settings/page.tsx`, with sections in `settings/_components/`:
  - **Name:** shows the name with **Change**. The inline edit uses `TextField`, `validateName` and `updateName`. The dashboard greeting and user menu update reactively.
  - **Username:** shows `@username` with **Change**. The inline edit uses the same availability check and `setUsername`.
  - **Email:** shows the email, read-only, with the note "Your email can't be changed in this version." Below it: "Friends can invite you by username or email. Your name and email are never shown to other users."
  - **Sign out.**

**Tests**

- `tests/convex/users.test.ts`:
  - `updateName` trims the value, rejects empty and 61-character names with `VALIDATION` (`fieldErrors.name`), and changes only the caller's row.
  - Unauthenticated `updateName` → `UNAUTHENTICATED`.

**Verification checklist**

- [x] Changing the name updates Settings, the dashboard greeting and the user menu without a reload.
- [x] Changing the username works, and a taken name is rejected.
- [x] The email is shown read-only.
- [x] `npm run check` passes.

---

### Phase 3 — Create and view a private bill; dashboard recent bills

**Goal:** a signed-in user creates a bill with items (all paid by themselves), reviews the summary, saves it, sees it on the dashboard and opens its details page. Nobody else can see it.

**Backend**

- Schema: add `trips`, `tripPeople`, `items` and `itemAssignments` (§9). `tripInvitations` comes in Phase 6.
- `convex/lib/auth.ts`: add `getTripAccess`, `requireTripViewer` and `requireTripOwner`.
- `convex/lib/access.ts`: `listAccessibleTrips` and the constants.
- `convex/lib/tripWrite.ts`:
  - `writeNewTrip(ctx, owner, validated)`: insert the trip, the owner's `tripPeople` row (`position` 0, `userId` = owner), the other people (none in this phase), items and assignments, all from `computeBill`.
  - `buildItemDoc(validatedItem, position)`: computes `normalizedName`, `productMatchKey` and `lineTotalPaisa`.
- `convex/lib/readModels.ts`: `toTripCard(ctx, trip, viewerId)` and `toTripDetail(ctx, trip, viewerId)`. Load people with `by_trip`, items with `by_trip`, assignments with the `by_trip_person` prefix `[tripId]`, and the usernames of linked people with `db.get`.
- `convex/trips.ts`: `create`, `get` and `listRecent` (§11.3).

**Domain**

- `money.ts` (complete, §10.1), `normalization.ts` (add `normalizeUnit`, `normalizePackSize`, `buildProductMatchKey` and `buildTripSearchText`), `trip-validation.ts` (complete, including the people rules, even though this phase's UI sends `people: []`), `people.ts` (`personLabel`), `categories.ts`, and the types `TripCard`, `TripDetail` and `BillPerson`.

**Frontend service**

- `src/lib/db/trips.ts`: `useRecentTrips()`, `useTrip(tripId)` (returns `undefined` while loading, `null` when not found or no access) and `useCreateTrip()` (returns `{ create, isSaving, error }` where `error` is `toAppError`'d).

**UI**

- shadcn: `npx shadcn@latest add select`, restyled to tokens. Wrap it in `components/ui/select.tsx` with label and error support, consistent with `TextField`.
- `components/ui/money-text.tsx`: `<MoneyText paisa={…} size="body|h3|numeric" />`, using `font-numeric` and `tabular-nums`.
- `components/ui/alert.tsx`: variants `error | warning | success | info`, with an optional action button.
- `components/trips/`:
  - `trip-form.tsx`: owns the form state (`useReducer`) with fields from §10.4 as strings. Steps: `edit` → `review`. Props: `mode: "create" | "edit"`, `initialValue` (details, people, items), `onSubmit(value): Promise<void>`. In this phase `people` stays `[]` and there is no People section (Phase 5 adds it).
  - `item-editor.tsx` and `item-row.tsx` (§12.3). In this phase each row shows "Paid by you", and `assigneeKeys` is fixed to `[OWNER_KEY]`.
  - `trip-summary.tsx`: the review view (§4.6), built from `computeBill` on parsed values.
  - `participant-shares.tsx`: a list of the people on the bill with their totals, expandable to item contributions, plus the reconciliation badge.
  - `trip-card.tsx`: title, store · date, category badge, total, `peopleLabels`. Links to `/trips/{id}`.
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
  - `allocateEqually` (keys are already in bill order and are **not** re-sorted):
    - `(500000, ["a","b","c"])` → a:166667, b:166667, c:166666
    - `(500000, ["c","a","b"])` → c:166667, a:166667, b:166666
    - `(100, ["x"])` → 100
    - `(1, ["a","b"])` → a:1, b:0
    - empty list and duplicates throw
  - `computeBill` covers the PRD scenarios: one item and one person; several individually assigned items; a shared item split 2 and 3 ways; a mix of personal and shared; an uneven paisa total; and assignees listed out of bill order (they're sorted by `peopleOrder`). Reconciliation always holds, and every person in `peopleOrder` has a share entry.
  - A property test: 500 seeded random bills with Σ shares === total.
- `tests/unit/normalization.test.ts`: `buildProductMatchKey` (`"Cooking  Oil"` = `"cooking oil"`; `"1 Litre"` and `"1l"` give the same pack; `"1 l"` ≠ `"5 l"`; empty vs non-empty pack size gives different keys).
- `tests/unit/trip-validation.test.ts`: required title, item count bounds, invalid price or quantity message keys, empty assignees, an assignee key that isn't on the bill, and future dates beyond 1 year.
- `tests/convex/trips.test.ts`:
  - `create` stores the correct `totalPaisa`, line totals, allocations, the owner's `tripPeople` row, `productMatchKey` and `searchText`.
  - The server recomputes even when the client sends odd strings (`" 1,000.5 "`).
  - Invalid input → `VALIDATION` with `fieldErrors`.
  - An assignee key that isn't on the bill, or another trip's person ID → `VALIDATION`.
- `tests/convex/permissions.test.ts` (starts here): the owner can `get`; an unrelated user's `get` returns `null`; an unauthenticated `get` returns `null`; a malformed ID string returns `null`; `listRecent` for the unrelated user doesn't contain the trip.

**Verification checklist**

- [x] Alice creates "Imtiaz Grocery" with 3 items (one with quantity 1.5 and price 333.33). The line totals and total match a hand calculation, the review shows the shares reconciled, and saving opens the details page.
- [x] Saving with an empty title, an item without a price or a quantity of 0 is blocked with inline messages.
- [x] Turning the network off (DevTools → Offline) and pressing Save shows the retry Alert, and the form keeps all values. Going back online and retrying succeeds.
- [x] The dashboard lists the bill, newest first, max 5.
- [x] Carol (a different account) opening Alice's `/trips/<id>` URL sees "doesn't exist or you don't have access". Her dashboard is empty.
- [x] The layout works at 360 px (item cards stack, sticky footer visible).
- [x] `npm run check` passes.

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
  - Prefill `TripForm` using `paisaToInput` and `milliToInput`, keeping `itemId`s and `personId`s (each existing person's key is its `personId`).
  - After review, **Save changes** calls `update` and returns to the details page.
  - **Cancel** asks to discard changes if the form is dirty.
- Add a minimal toast/feedback component (`components/ui/toast.tsx`, a simple `aria-live` region with an enter animation using `duration-base ease-standard`), or reuse `Alert`. Keep it to one mechanism app-wide.

**Tests**

- `tests/convex/trips.test.ts`:
  - **Isolation:** trips A and B both contain "Cooking Oil · 1 l" at Rs. 500. Updating A's price to Rs. 550 leaves B's item at 50000 paisa, and B's total and assignments unchanged.
  - Updating with an `itemId` from another trip → `VALIDATION`.
  - Removing an item deletes its assignments.
  - `remove` leaves zero rows in `items`, `itemAssignments` and `tripPeople` for that trip.
- `tests/convex/permissions.test.ts`: an unrelated user's `update` and `remove` → `NOT_FOUND`. Unauthenticated → `UNAUTHENTICATED`.

**Verification checklist**

- [x] Alice edits a bill (changes a price, adds one item, removes another), saves, and the details page shows the new values and the reconciled shares.
- [x] A second bill with the same item keeps its original price.
- [x] Deleting asks for confirmation, then the bill disappears from the dashboard. Its URL now shows the no-access state.
- [x] Carol calling the `update` or `remove` mutations directly (for example from the Convex dashboard's function runner, acting as Carol, or with a temporary test button) fails.
- [x] `npm run check` passes.

---

### Phase 5 — People and splitting

**Goal:** the owner adds people to a bill by name (no accounts needed) and assigns each item to one or more of them. Shared items split equally to the paisa, everyone's share is clear, and the top of the bill page makes a clean screenshot to send in any chat app.

**Backend**

- `convex/lib/tripWrite.ts`: `create` and `update` handle `people` (§11.3). Insert new people at the next positions, patch names, and delete people who were left out (assignments are rebuilt from the items anyway). Phase 6 adds deleting their invitations.
- `readModels`:
  - `people` in bill order, with `name`, and `username` for the owner (linked people arrive in Phase 6). `link` is `null` until Phase 6.
  - `shares` for every person, including Rs. 0, with `splitCount` per contribution.
  - `TripCard.peopleLabels`.
- No new public functions.

**Domain**

- `people.ts`:
  - `personLabel` (§10.6).
  - `removePersonFromItems(items, key)`: drops the key from every item's assignees. Items left with nobody get `[OWNER_KEY]`. It's used by the form when a person is removed, so the rule lives outside the UI.
- `trip-validation.ts`: the people rules are exercised for real from now on.

**UI**

- `components/trips/people-editor.tsx`, the **People** section of `TripForm` (create and edit), placed between Details and Items:
  - "You" first, not removable.
  - One row per person: the name (editable in place), and a remove icon button (`aria-label="Remove Ben"`).
  - **Add person**: a name field with an **Add** button; Enter also adds. Errors show inline: empty, too long, or "Someone on this bill already has that name".
  - Hint: "Add anyone, with or without an account. You can connect people to their accounts after saving."
  - Removing someone who is on items opens the `ConfirmDialog` (Phase 4) with the §4.4 text, then applies `removePersonFromItems`.
- `components/trips/participant-picker.tsx`: a row of toggle chips (`role="group"`, each chip a `button` with `aria-pressed`), one per person in bill order and labelled with `personLabel` ("You", "Ben"), plus an **Everyone** chip. Selected chips use `bg-primary-soft text-primary border-primary`. With none selected, the error "Choose who pays for this item" appears.
- `item-row.tsx`: replace "Paid by you" with the picker whenever the bill has 2 or more people. With only the owner, keep "Paid by you" (no unnecessary UI). Under the picker show the preview from `allocateEqually`: "Split 3 ways: Rs. 1,666.67 / Rs. 1,666.67 / Rs. 1,666.66", or "Ben pays Rs. 900.00".
- Default assignee for new rows: the owner. Add a small "Same as previous" convenience only if it doesn't add clutter; it's optional.
- `trip-summary.tsx` / `participant-shares.tsx`: one card per person with the total and an expandable list "Pizza: Rs. 1,666.67 (1/3 of Rs. 5,000.00)". The viewer's own card is labelled "Your share" and expanded by default.
- `components/trips/split-summary.tsx`, at the top of the bill details page:
  - Contents: title, store · date, the total, one line per person ("Ben — Rs. 2,566.67") and the reconciliation tick.
  - It's a plain card with no buttons inside. With up to 8 people it fits a 360 × 640 screen without scrolling, so one screenshot captures it.
  - There's no share button. People take a screenshot (§2.3).
- `trip-card.tsx`: `peopleLabels`, truncated as "You, Ben, Sara +2".

**Tests**

- `tests/unit/people.test.ts`: `personLabel` for each case; `removePersonFromItems` drops the person from shared items and moves their solo items to the owner.
- `tests/unit/trip-validation.test.ts`: duplicate names (case- and space-insensitive), 19 vs 20 other people, empty and 41-character names, duplicate or `OWNER_KEY` person keys.
- `tests/convex/trips.test.ts`:
  - The PRD scenario with people who have **no accounts**: Alice (owner) with Ben and Sara. Pizza Rs. 5,000 → everyone; Drink Rs. 900 → Ben; Rice Rs. 1,200 → Alice and Sara. Shares are Alice 2,266.67, Ben 2,566.67, Sara 2,266.66, and Σ = Rs. 7,100.00.
  - Duplicate names → `VALIDATION` (`people.i.name`). Too many people → `VALIDATION`. Duplicate assignee keys are deduplicated.
  - `update`: renaming a person keeps their position and every allocation. A new person gets the next position and doesn't change the remainder order of existing people. Removing a person deletes their row and assignments, and leaves the others' positions alone. A `personId` from another trip → `VALIDATION`.
- `tests/convex/permissions.test.ts`: an unrelated user still gets `null` for a bill with named people, so the names never leak.

**Verification checklist**

- [x] Alice creates "Dinner" with Ben and Sara (no accounts): Pizza Rs. 5,000 → Everyone; Drink Rs. 900 → Ben; Rice Rs. 1,200 → Alice and Sara. The preview, review and saved bill all show Alice 2,266.67, Ben 2,566.67, Sara 2,266.66, Σ = Rs. 7,100.00 ✓.
- [x] At 360 px, the split summary at the top of the saved bill fits on one screen and reads clearly as a screenshot.
- [x] Adding "ben" when "Ben" is already on the bill is rejected inline.
- [x] Editing: removing Sara asks for confirmation first. Then Rice is fully on Alice and Pizza splits between Alice and Ben. The totals still reconcile.
- [x] Renaming Ben to "Ben D." changes no amount.
- [x] A solo bill still shows "Paid by you" with no People rows and no picker.
- [x] `npm run check` passes.

---

### Phase 6 — Linking people to accounts and shared read access

**Goal:** the owner connects a person on the bill to a registered account by username or email. The invitee sees the pending invitation and accepts or declines. After accepting, they can view the bill read-only with their share highlighted. The owner can cancel pending invitations and unlink people. The split never changes in any of this. All access states are enforced by the backend.

**Backend**

- Schema: add `tripInvitations` (§9).
- `convex/invitations.ts`: `invite`, `listReceived`, `pendingCount`, `listSent`, `respond`, `cancel` and `unlink` (§11.4).
- `trips.update`: removing a person deletes their invitations too, so a linked account loses access. `trips.remove` deletes the trip's invitations.
- Confirm that `getTripAccess` grants `participant` only through a linked person (`by_trip_user`). A pending or declined invitation grants nothing.
- `readModels.toTripDetail`:
  - `username` on linked people.
  - For the owner, each person's `link` state: their pending or declined invitation (with the invitee's username), `linked`, or `none`. For participants, `link` is `null`.
- `readModels.toTripCard` sets `isOwner`.

**Frontend service**

- `src/lib/db/invitations.ts`: `useInvite()`, `useReceivedInvitations()`, `usePendingInvitationCount()`, `useSentInvitations()`, `useRespondToInvitation()`, `useCancelInvitation()` and `useUnlinkPerson()`.

**UI**

- `components/ui/segmented-control.tsx`: an accessible radio group styled as pills. It's reused in Phase 7.
- shadcn: `npx shadcn@latest add dialog`, restyled with tokens.
- `components/trips/invite-dialog.tsx`:
  - **Who is this?** A select of the people who aren't linked and have no pending invitation, plus **Someone new**, which shows a Name field.
  - Then a segmented **Username / Email** control, an input whose `type` follows the choice (prefix "@" for username, `type="email"` for email), and **Send invite**.
  - It opens from the People section's **Invite** button, or preselected from a person's own **Invite** action.
  - The dialog says: "Inviting doesn't change the split."
  - Success: "Invitation sent to @ben_doe. Once they accept, they'll see this bill as Ben." It never says an email or SMS was sent.
  - Errors map from the codes in §8.4. The dialog stays open to invite another person.
- `components/trips/people-list.tsx` on the bill details page. Every person in bill order, by `personLabel`, with "Owner" and "You" labels. **Owner only**, per person:
  - Not linked: an **Invite** action.
  - Pending: a `warning` badge "Invited @ben_doe" and **Cancel** (confirm: "Cancel the invitation to @ben_doe?").
  - Declined: a `neutral` badge "Declined" and **Invite**.
  - Linked: their username and **Unlink** (confirm: "Unlink @ben_doe from Ben? They'll lose access to this bill. Ben stays on the bill and the shares don't change.").
  - Participants see the people and usernames but no actions, and no Edit/Delete.
- Bill details header badge: **Owned** (`primary`) or **Shared by @alice** (`neutral`). The trip card shows **Owned** / **Shared**.
- `/invitations` page with `components/invitations/invitation-list.tsx`:
  - **Received** tab: cards showing "@alice invited you to **Imtiaz Grocery** as **Ben** · Imtiaz · 16 Oct 2026" with **Accept** / **Decline**. Accept leads to `/trips/{id}`.
  - **Sent** tab: "@ben_doe as Ben · Imtiaz Grocery" with a status badge (Pending/Accepted/Declined) and **Cancel** for pending ones.
  - Empty states: "No pending invitations" and "You haven't invited anyone yet".
- Nav: add **Invites**, with the badge from `usePendingInvitationCount`.
- Edit form: removing a linked person adds "@ben_doe will lose access to this bill." to the confirmation (§4.4).

**Tests**

- `tests/convex/invitations.test.ts`:
  - Invite by username (case-insensitive) and by email (case-insensitive and trimmed: `" Bob@Example.com "` matches `bob@example.com`) for an existing person. With `newPersonName`, the person is created at the next position with a Rs. 0 share.
  - Names are never matched: a person named "bob" on the bill and an account @bob stay unconnected until @bob is invited for that person and accepts.
  - A user with no username → `INVITE_NO_MATCH`. An email with no account, or a malformed email → `INVITE_NO_MATCH`.
  - Self → `INVITE_SELF`. The invitee is already linked to another person on the trip → `INVITE_ALREADY_PARTICIPANT`. The person is linked → `INVITE_PERSON_LINKED`. The person already has a pending invitation (to anyone), or the invitee already has one on this trip → `INVITE_ALREADY_PENDING`. The owner's own person can't be invited. Not exactly one of `personId` / `newPersonName` → `VALIDATION`. A duplicate `newPersonName` → `VALIDATION`. The people limit → `TRIP_PEOPLE_LIMIT`.
  - Re-invite after decline, cancel or unlink: still **one row** for (trip, invitee), now pending, possibly for a different person.
  - A participant inviting → `FORBIDDEN`. An unrelated user inviting → `NOT_FOUND`.
  - The `invite` response keys are exactly `["invitationId","username"]`. `listReceived` has no items, totals or other people.
  - **The split never changes:** the bill's `shares` are deep-equal before and after accept, decline, cancel and unlink.
  - Responding to someone else's invitation → `NOT_FOUND`. Responding twice → `INVITATION_NOT_PENDING`. Accepting after the person was removed from the bill or linked to someone else → `INVITATION_NOT_PENDING`, and no access.
  - `cancel` by a non-owner fails, and `cancel` on a non-pending row fails. `unlink` by a non-owner fails, and `unlink` on an unlinked person fails.
  - Removing a linked person through `trips.update` deletes their invitation and ends their access.
- `tests/convex/permissions.test.ts`, the full **access matrix** for `trips.get`, `trips.listRecent`, `trips.update` and `trips.remove`:

  | Actor | get | listRecent contains | update/remove |
  |---|---|---|---|
  | owner | ✓ detail | ✓ | ✓ |
  | linked participant | ✓ detail (`viewerRole: participant`, every `link` is `null`) | ✓ | `FORBIDDEN` |
  | pending | `null` | ✗ | `NOT_FOUND` |
  | declined | `null` | ✗ | `NOT_FOUND` |
  | cancelled | `null` | ✗ | `NOT_FOUND` |
  | unlinked | `null` | ✗ | `NOT_FOUND` |
  | person removed from the bill | `null` | ✗ | `NOT_FOUND` |
  | unrelated | `null` | ✗ | `NOT_FOUND` |
  | unauthenticated | `null` | `[]` | `UNAUTHENTICATED` |

- A participant's `TripDetail` contains no account `email` or account `name` anywhere (deep key scan, plus a check that the invitee's account name string appears nowhere).

**Verification checklist (accounts: Alice, Bob, Carol, and Ben Doe with username `ben_doe`)**

- [x] Alice's "Dinner" bill from Phase 5 has Ben and Sara (no accounts). Ben signs up as "Ben Doe" with the username `ben_doe`. The bill does **not** appear for him by itself.
- [x] Alice invites @ben_doe for "Ben". Ben's Invites badge shows 1 without a reload, and the invitation reads "as Ben". Before accepting, opening the bill URL shows the no-access state.
- [x] Ben accepts and lands on the bill. It shows "Ben (@ben_doe)", and his card is "Your share" with Rs. 2,566.67, exactly as before. He sees no Edit/Delete/Invite, the header says "Shared by @alice", and his dashboard shows the bill with a **Shared** badge. Alice sees "Ben (@ben_doe)" and Sent shows "Accepted". "Ben Doe" appears nowhere on Alice's screens.
- [x] Alice invites Bob by email as **Someone new** named "Bob". Bob declines. Alice sees "Declined", Bob has no access, and "Bob" stays on the bill.
- [x] Alice invites @carol for Sara, then cancels. Carol's pending invitation disappears.
- [x] Alice unlinks Ben after confirming. Ben's open bill page switches to the no-access state live and the bill leaves his dashboard. The shares on Alice's bill are unchanged.
- [x] Inviting `nobody@example.com` (no account) shows the generic "No account matches that email" message.
- [x] `npm run check` passes.

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
  - The history for Bob includes his own bills plus bills he's linked on, and excludes bills where his invitation is pending, declined or unlinked, and Carol's.
  - Search "oil" matches a bill whose item is "Cooking Oil" but whose title doesn't mention it. Search on the store name works. The search is case-insensitive.
  - Category, date range and ownership filters work. All four sorts are ordered correctly.
  - `limit`/`hasMore` behave correctly.
  - Carol searching for a term that only exists in Alice's bill gets nothing, and `totalAccessible` reflects only Carol's bills.

**Verification checklist**

- [x] With around 8 bills across categories and dates (some shared), every filter, combination and sort gives the expected list.
- [x] Reloading or using back navigation keeps the filters (URL).
- [x] Opening a result shows the full bill. A shared one is read-only.
- [x] The empty states show correctly (a new account vs. no matches).
- [x] `npm run check` passes.

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
  - Bob (linked on one of Alice's bills) sees only that bill's observation plus his own.
  - Carol has the same product in her own bill: Alice's results **don't include it**, and the counts aren't affected.
  - A pending invitee sees nothing from that bill.
  - After `trips.remove`, the observation disappears.
  - After editing a price in one bill, only that observation changes.
  - Unauthenticated → `[]` / `null`.

**Verification checklist**

- [x] Alice records the same product across 3 bills on different dates and stores. Price History shows all 3 in date order with correct changes and links that open the bills.
- [x] A different pack size appears as a separate product under "Other variants".
- [x] Bob only sees observations from bills shared with him and his own. Carol sees none of Alice's.
- [x] Deleting a bill removes its observation live.
- [x] `npm run check` passes.

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

- [x] Typing "coo" in a new bill suggests "Cooking Oil · Dalda · 1l". Selecting it fills the details, and the price stays empty with the last-price hint.
- [x] Choosing "Use as new item" keeps only the typed name.
- [x] Recording via a suggestion makes that bill appear in the **same** Price History product.
- [x] The combobox works with the keyboard only.
- [x] `npm run check` passes.

---

### Phase 10 — Dashboard spending summary

**Goal:** the dashboard shows two clearly separate monthly figures computed from accessible bills: what the user owes in total, and what they created.

**Backend**

- `trips.spendingSummary({ month: "YYYY-MM" })` returns `{ month, yourSharePaisa, yourShareBillCount, createdTotalPaisa, createdBillCount }`.
  - `yourSharePaisa` = Σ `allocatedAmountPaisa` of the assignments of the caller's own person on each accessible trip with `tripDate` starting with `month` (the `personId` comes from the caller's `by_user` rows; assignments from `by_trip_person`).
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
  - A bill the caller was unlinked from is excluded. Shares of people without accounts count toward nobody's summary.
  - Carol's figures are unaffected by Alice's bills.

**Verification checklist**

- [x] The figures match a manual sum for October with mixed solo and shared bills, for both Alice and Bob.
- [x] Switching months updates both tiles. The labels never mix meanings.
- [x] `npm run check` passes.

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
8. **README:** product summary, architecture summary, setup (Convex and `npx @convex-dev/auth` steps), env vars, scripts, test accounts, known MVP limits (the caps in §8.3), and the money rounding/allocation rule.

**🧑 HUMAN steps: production**

1. In Convex, create the production deployment. Run `npx @convex-dev/auth --prod` (or follow the Convex Auth production docs) to generate its own `JWT_PRIVATE_KEY` and `JWKS`. Never reuse the dev keys.
2. In Vercel, import the repo.
   - Set the build command to `npx convex deploy --cmd 'npm run build'`.
   - Set the env var `CONVEX_DEPLOY_KEY` (production deploy key). `NEXT_PUBLIC_CONVEX_URL` is injected by `convex deploy`; follow the current Convex Vercel guide. There are no auth env vars in Vercel.
3. Deploy, then set `SITE_URL` on the production Convex deployment to the live URL (`npx convex env set --prod SITE_URL https://<app>.vercel.app`, or through the dashboard).

**Final acceptance pass:** run every checklist from Phases 1–10 again **on production** with three fresh accounts, then tick §16.

**Verification checklist**

- [x] `npm run check` passes, and `npm run build` succeeds locally.
- [x] All §16 criteria are ticked on production.
- [x] Direct-request privacy test on production: as Carol, call `trips.get` with Alice's trip ID (for example from the browser console through a temporary dev-only hook, or the Convex dashboard "act as user") and get `null`. Do the same as a pending, declined and unlinked invitee.
- [x] Lighthouse accessibility score ≥ 90 on dashboard, new bill and bill details.

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

1. [x] A user can register with name, email, password and confirm password, sign in with email and password, choose a username and create a private bill.
2. [x] A private bill is visible to its owner and not visible to an unrelated signed-in user (UI **and** direct query).
3. [x] The owner can add people to a bill by name, with no account needed, and split items between them. The bill's split summary fits one phone screenshot.
4. [x] The owner can link a person on the bill to a registered user by username or email. Names are never matched to accounts automatically. An invitation stays pending until the invitee accepts or declines it, and accepting, declining, cancelling or unlinking never changes any share.
5. [x] A linked participant can view the bill. Pending, declined, cancelled and unlinked invitees, and accounts whose person was removed from the bill, can't.
6. [x] The owner can add, edit and delete items and people, and assign each item to one or more people on the bill.
7. [x] An item assigned to one person is charged fully to them. An item assigned to several is split equally.
8. [x] The bill total and every person's share reconcile exactly after rounding (including uneven paisa).
9. [x] A new bill containing the same item doesn't change the price stored in an older bill.
10. [x] Users can search and filter saved bills and reopen accessible ones.
11. [x] Users can view item price observations from accessible bills and see price changes between comparable entries. Different variants or units aren't compared.
12. [x] Price history never reveals records from unrelated users' bills.
13. [x] Editing or deleting a bill affects only that bill and its own history and access records.
14. [x] The interface works on mobile and desktop with clear validation, empty, loading and error states.
15. [x] Authorization is enforced by Convex functions, verified by the automated permission-matrix tests and by direct requests.
16. [x] Bills and price records persist across sessions. `npm run check` passes. No hard-coded style values or out-of-folder SDK imports (lint passes).

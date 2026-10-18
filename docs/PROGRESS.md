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

**Visual checks** at 360, 768 and 1280 px done in a headless Chrome on 2026-10-17 (see Phase 1): Outfit / Plus Jakarta Sans loaded, token colours, no horizontal scroll.

## Change (2026-10-17): Clerk replaced by Convex Auth
By user decision, auth is now email + password through Convex Auth (sign-up: Name, Email, Password, Confirm password). No email/phone verification, no phone numbers, no webhook. `docs/BUILD_PLAN.md` updated; `PRD.md` is no longer used. Phase 0 files cleaned up: ESLint service rule now guards `@convex-dev/auth` (and `src/domain` bans `@convex-dev/*`), `.env.example` lists the Convex Auth deployment variables, README prerequisites updated.

## Change (2026-10-17): smaller controls
Buttons looked too large in the browser. Tokens changed: `control-lg/md/sm` 60/52/40px → 48/44/36px; `type-button` 18px bold uppercase → 16px semibold, normal case (`type-button-sm` 14px semibold, normal case).

## Change (2026-10-17): Deep Teal colour theme
Brand moved from indigo to Deep Teal (`primary` #0f766e, pressed #115e59, soft #d5f2ec) with green-grey neutrals. Contrast fixes: `ink-muted` #64746f (4.92:1), `success` #047857, `error` #b91c1c, `warning` #b45309, so all pass AA as text on white.

## Phase 1 — Sign-up, sign-in, app shell and username onboarding ✅ (2026-10-17)

**Done**
- Backend: `convex/schema.ts` (`authTables` + `users`), `convex/auth.ts` (Password provider with `profile` / `validatePasswordRequirements`), `auth.config.ts`, `http.ts`, `convex/lib/errors.ts` (`appError`), `convex/lib/auth.ts` (`getCurrentUser`, `requireCurrentUser`, `requireOnboardedUser`), `convex/users.ts` (`getCurrent`, `isUsernameAvailable`, `setUsername`), `convex/tsconfig.json`. Pushed to the dev deployment.
- Domain: `normalization.ts` (`normalizeText`, `normalizeUsername`, `isValidUsername`, `normalizeEmail`, `isValidEmail`, `USERNAME_RULES`), `auth-validation.ts` (§10.7, plus `validateEmail` / `validatePassword`), `errors.ts` (codes, `AppErrorData`, guards), `types.ts` (`Result`, `CurrentUser`).
- `src/lib/db/`: `client.ts`, `ids.ts`, `errors.ts` (`toAppError`), `users.ts` (`useCurrentUser`, `useUsernameAvailability` with 400 ms debounce, `useSetUsername`).
- `src/lib/auth/`: `provider.tsx` + `client-provider.tsx`, `hooks.ts`, `errors.ts` (`toAuthError`), `middleware.ts` (`createAuthMiddleware`); `src/proxy.ts`.
- UI: `ui/` text-field, card, alert, loading-state (+ `Skeleton`), empty-state, error-state, dropdown-menu (Radix, token-styled, no animation); `layout/` app-shell, nav-link, nav-items, page-header, user-menu, account-gate, form-page; `account/username-field`; `auth/` sign-up-form, sign-in-form, use-validated-form.
- Routes: `(auth)/sign-up`, `(auth)/sign-in`, `(onboarding)/onboarding`, `(app)/layout` (AccountGate + AppShell), `(app)/dashboard` ("Hi, {name}" + empty state), `(app)/error.tsx`, `not-found.tsx`; the proxy redirects signed-in users from `/`, `/sign-in` and `/sign-up` to `/dashboard`.
- Tokens added: `--container-form` (26rem), `--container-menu` (14rem), `--animate-pulse` + keyframes.
- Tests (82 passing): `tests/convex/users.test.ts`, `tests/unit/normalization.test.ts`, `tests/unit/auth-validation.test.ts`, `tests/unit/auth-errors.test.ts`; Vitest `convex` project + `tests/convex/helpers.ts`.
- Verified: `npm run check` (typecheck of app + `convex/`, lint, tests) and `next build` pass. Lint guardrails re-checked against the new folders.
- Verified against the dev deployment (scripted `auth:signIn` calls, no browser): unknown email and wrong password → "Email or password is incorrect."; duplicate sign-up (any letter case, right or wrong password) → "An account with this email already exists…"; 11th wrong password → "Too many attempts…"; server-side validation errors arrive as field errors; one `users` row per account with `name` and lowercase `email`, password only hashed in `authAccounts`.

**Decisions / deviations from the plan**
- **Duplicate sign-up is blocked in `convex/auth.ts`.** Convex Auth's Password `signUp` with an existing email *signs the caller in* when the password matches (and fails otherwise), which broke the checklist and made sign-up a password-guessing path that skips the failed-attempt limit. The provider's `authorize` is wrapped: on `signUp` it first looks the account up by email only (`retrieveAccount` without a secret, which records no failed attempt) and throws `AUTH_EMAIL_TAKEN`. The wrap relies on Convex Auth reading the real `authorize` from `provider.options` (checked in 0.0.96; re-check on upgrades).
- **Auth error codes.** Convex Auth throws plain `Error`s (`InvalidSecret`, `TooManyFailedAttempts`, …), which production deployments redact to "Server Error". The same wrapper re-throws them as `ConvexError`s with new codes `AUTH_INVALID_CREDENTIALS`, `AUTH_RATE_LIMITED`, `AUTH_EMAIL_TAKEN` (added to `src/domain/errors.ts`). Convex Auth's Next.js proxy forwards only `error.message`, so `toAuthError` parses the `ConvexError: {…}` JSON out of the message.
- **Providers sit inside `<Suspense>` in `<body>`**, not around `<html>`: `cacheComponents` is on, and `ConvexAuthNextjsServerProvider` reads cookies, which must happen inside a Suspense boundary. All routes build as partial prerenders.
- **`AccountGate` wraps `AppShell`** (not the other way round) and provides `useAccount()` → `{ user, signOut }`. It owns sign-out so the "signed out → /sign-in" redirect can't race "sign out → /". It decides from Convex's confirmed `isAuthenticated` (`useAccountStatus()`, shared with onboarding), not from the user query alone.
- `error.tsx` uses `retry()` (stable since Next 16.3), not `reset()`.
- `normalizeUsername` = NFKC + lowercase + trim; internal spaces are kept so "has space" stays invalid instead of becoming "hasspace". The username is stored as typed (trimmed); uniqueness uses the lowercase form.
- `isUsernameAvailable` requires sign-in (§5.1) and counts the caller's own username as available.
- Session cookies get `maxAge` 30 days (Convex Auth's session length) instead of browser-session cookies.
- Auth hooks and `useSetUsername` resolve to the error (or `null`) as well as exposing `error` state, so forms don't sync errors through effects.
- Vitest: `resolve.tsconfigPaths: true` for `@/` imports; the convex-test glob is `["../../convex/**/*.*s", "!../../convex/**/*.*.*s"]` because the `!(*.*.*)` extglob matches nothing under Vite 8.
- The bottom tab bar renders on mobile even with only **Home**, as §12.1 specifies; more tabs arrive with their pages.
- Dropdown menu was hand-written on `radix-ui` (what `shadcn add` generates) rather than running the shadcn CLI, which was removed in Phase 0.

- **Browser verification (2026-10-17):** a scripted headless Chrome (Playwright, kept outside the repo) ran the whole Phase 1 checklist against `next dev` + the dev deployment: 46/46 checks passed and the console was clean apart from the expected 400s (failed sign-in/duplicate sign-up through the auth proxy) and the 404 test. Covered: signed-out redirects; empty and invalid sign-up messages with **zero** auth requests; blur re-validation; `aria-describedby`; sign-up → onboarding ("@name is available") → "Hi, Alice"; reload keeps the session; signed-in `/`, `/sign-in`, `/sign-up`, `/onboarding` → `/dashboard`; user menu (name, @username) → Sign out → `/`; duplicate email in another letter case → "already exists" with the form kept; wrong password → "Email or password is incorrect." with the email kept; mixed-case sign-in → dashboard without passing through onboarding; a second account sees "That username is taken" and isn't saved; 404 page; no horizontal scroll at 360/768/1280 px. Screenshots were reviewed by eye. One `users` row per account, lowercase email, no plain-text password in any table.

**Fixed during browser verification**
- `next dev` reported "`Date.now()` / `Math.random()` while prerendering" on every route: with `partialPrefetching`, cookies are available in runtime prefetches but the current time and randomness aren't, and Convex Auth's server provider stamps `Date.now()`. `AuthServerProvider` now calls `await connection()` first.
- The landing page's `isSignedIn()` check then tripped "uncached data outside `<Suspense>`". The signed-in redirect for `/` moved into the proxy (next to `/sign-in` and `/sign-up`), so the landing page is static; `src/lib/auth/server.ts` (`isSignedIn`) was removed as unused. Deviation from the plan's "Landing: if `await isSignedIn()` …".
- "Could not validate instant navigation" on `/dashboard`: app pages render only after `AccountGate` loads the user on the client, so the server never renders them. **Every `(app)` page sets `export const instant = false`** (the documented opt-out); add it to each new app page in later phases.

**Dev data** on the dev deployment, from verification (all password `testpass123`): `alice@example.com` / `bob@example.com` (usernames `alice`, `bob`), per-run pairs `alice-NNNN@example.com` / `bob-NNNN@example.com` for runs 6429, 7840, 2350, 8748, and `probe-phase1@example.com` (no username; currently rate-limited). Delete them from the Convex dashboard (`users` plus their `authAccounts` / `authSessions` / `authRefreshTokens` / `authRateLimits` rows) or keep `alice`/`bob` for the next phases.

## Phase 2 — Profile and settings ✅ (2026-10-17)

**Done**
- Backend: `users.updateName` (`requireCurrentUser`, `validateName`, patch; `VALIDATION` with `fieldErrors.name`). Pushed to the dev deployment.
- `src/lib/db/users.ts`: `useUpdateName`; it and `useSetUsername` now share a private `useAppMutation` helper (pending + error state, resolves to the error or `null`).
- UI: `ui/badge.tsx` (`neutral | success | warning | error | primary`); **Settings** link in the user menu; `(app)/settings/page.tsx` with `_components/` `settings-view`, `setting-row`, `editable-setting` (value + **Change**, swaps in the editor, returns focus to **Change** on close), `inline-edit-form` (Save / Cancel, Escape cancels, form-level `Alert`), `name-setting`, `username-setting`. Email row shows a neutral "Read-only" badge and both notes; **Sign out** below the card.
- `components/account/use-username-form.ts`: the username submit logic (rule check, "taken", error routing) extracted from onboarding and shared by onboarding and Settings.
- `useValidatedForm` moved from `components/auth/` to `components/forms/` (now used by sign-up, sign-in and the name editor).
- Tests (88 passing): `updateName` trims, accepts 60 characters, rejects `""`, whitespace-only and 61 characters with `VALIDATION` / `fieldErrors.name` without changing the row, changes only the caller's row, and throws `UNAUTHENTICATED` when signed out.
- Verified: `npm run check` (typecheck, lint, tests) and `next build` pass. No browser testing this phase, by user instruction.

**Decisions**
- Name and username update reactively everywhere because `AccountGate`'s `useAccount()` comes from the live `users.getCurrent` query; no manual refresh logic.
- Saving an unchanged value just closes the editor without a request. For the username, a change of letter case only is saved (the username is shown as typed).
- The username editor hides the live "@x is available" status while the value is the user's own username (in any case), since the server counts it as free.
- In edit mode the field's label replaces the row heading, so the label isn't shown twice.

**Change (2026-10-17): red Sign out.** New token `--color-error-soft-hover` (#fecaca; error text on it 4.65:1). `Button` variant `danger-soft` (light red background, red text and red border, `error-soft-hover` on hover) is used by **Sign out** on Settings. `DropdownMenuItem` gained `variant: "default" | "danger"`; the user menu's **Sign out** uses `danger` (red text and icon, light red highlight on hover and keyboard focus). Use these two variants for later destructive actions (e.g. delete bill, cancel invitation).

**Browser verification (2026-10-17):** a scripted headless Chrome (Playwright, kept outside the repo) against the running `next dev` + dev deployment: 49/49 checks passed; the only console error was the expected 400 from a deliberate wrong-password sign-in. Covered: signed-out `/settings` → `/sign-in`; sign-up → onboarding → dashboard (regression); user menu shows @username, **Settings** in ink with a neutral hover, **Sign out** red text and icon with a light red hover; Settings shows name, @username, email with "Read-only" badge and both notes, no email input or Change button; Settings **Sign out** has light red background, red text, 1px red border and `#fecaca` on hover; name editor opens focused and prefilled, empty and 61-character names show inline errors, Escape cancels and returns focus to **Change**, a padded name saves trimmed and updates Settings, the header menu and the dashboard greeting with no page reload; username editor shows no status for the own username, "bob" → "That username is taken" and isn't saved, "1bad" → rules error, a free name saves and updates the menu; no horizontal scroll at 360/768/1280 px (and at 360 px while editing); Sign out from Settings and from the menu → `/`; wrong password → generic message; signing back in keeps the new name; reload keeps the session. Screenshots were reviewed by eye. Test-script note: with `cacheComponents`, Next keeps visited pages in the DOM hidden, so a second hidden `<main>` (e.g. onboarding) can exist; scope scripted locators to `main:visible`.

Dev data added: `carol-4962@example.com`, `carol-9569@example.com`, `carol-9473@example.com` (password `testpass123`).

## Change (2026-10-17): people on a bill don't need accounts
By user decision, splitting no longer depends on invitations. `docs/BUILD_PLAN.md` was rewritten accordingly (§1–§5, §8–§13, Phases 3–11, §16):
- **People on a bill** (`tripPeople`): the owner, plus anyone the owner adds by typing a name (1–40 chars, unique per bill ignoring case, max 20 people including the owner). Items are assigned to people, not accounts (`itemAssignments.personId`).
- **Invitations** (`tripInvitations`) now only *link* one person on the bill to one account. Accept links the person and grants read-only access; decline, cancel and unlink leave the person on the bill as a plain name. **The split never changes** in any of these.
- **No automatic matching:** a typed name ("Ben") is never matched to an account, even if someone signs up with the same name. Only the owner links a person, by inviting a specific username/email for that person, and the account holder must accept. The bill keeps the owner's typed name plus the username: "Ben (@ben_doe)". The account's own name is never shown.
- **Remainder paisa** go by each person's fixed position on the bill (owner 0, then in the order added), not by user ID, so linking/renaming never moves a paisa and the form preview matches the server.
- Removing a person is an edit of the bill (their solo items move to the owner, shared items drop them); unlinking keeps the person and their share.
- Bill details open with a **split summary** card sized for one 360 px phone screenshot, for sharing in any chat app. There's no share link or image generation.
- **Phase order changed:** Phase 5 is now "People and splitting" (no accounts needed), Phase 6 is "Linking people to accounts and shared read access". Phase 3 already uses the people-based data model (owner row only, "Paid by you").

## Phase 3 — Create and view a private bill; dashboard recent bills ✅ (2026-10-17)

**Done**
- Schema: `trips`, `tripPeople`, `items`, `itemAssignments` (§9) and the exported `categoryValidator`. Pushed to the dev deployment.
- `convex/lib/auth.ts`: `getTripAccess`, `findTripAccess` (string ID → `normalizeId` → access, never throws), `requireTripViewer`, `requireTripOwner` (`NOT_FOUND` for missing or inaccessible, `FORBIDDEN` for participants).
- `convex/lib/access.ts`: the bounded-read constants (plus `MAX_ASSIGNMENTS_PER_TRIP`) and `listAccessibleTrips`. `convex/lib/tripWrite.ts`: `validateOrThrow`, `buildItemDoc`, `writeNewTrip`. `convex/lib/readModels.ts`: `toTripCard`, `toTripDetail`.
- `convex/trips.ts`: `create`, `get`, `listRecent`.
- Domain: `money.ts` (complete), `trip-validation.ts` (complete, incl. people rules), `categories.ts`, `people.ts` (`personLabel`), `normalization.ts` (`normalizeUnit`, `normalizePackSize`, `buildProductMatchKey`, `buildTripSearchText`), `format.ts` (`milliToInput`, `formatQuantity`), `types.ts` (`TripCard`, `BillPerson`, `TripDetail`).
- `src/lib/db/`: `trips.ts` (`useRecentTrips`, `useTrip`, `useCreateTrip`); the mutation helper moved to `use-app-mutation.ts` and now resolves to `{ ok, value } | { ok, error }` (users hooks adapted).
- UI: `ui/field.tsx` (label + hint + status wiring, now shared by `TextField` and `Select`), `ui/select.tsx` (Radix), `ui/money-text.tsx` (`sm | body | h3 | numeric`), `ui/alert.tsx` (`error | warning | success | info`, optional `action`), `TextField` `prefix` ("Rs."). `components/trips/`: `trip-form`, `trip-form-state` (reducer), `item-editor`, `item-row`, `trip-summary`, `participant-shares`, `trip-card`, `trip-meta` (meta line, category and ownership badges), `bill-view` (one view model for review and the saved bill).
- Routes: `(app)/trips/new` (Details → Items → sticky footer "N items · Total" + **Review** → review screen with **Back to edit** / **Save bill**), `(app)/trips/[tripId]` (header, category + Owned badge, items, total, shares, reconciliation badge; skeleton; no-access state), dashboard (**New bill**, "Recent bills" cards, empty state with **Create your first bill**). Each new page has `export const instant = false`.
- Token: `--spacing-tab-bar` (3.25rem). The mobile tab bar now has that fixed height, and sticky footers use `bottom-tab-bar` (`md:bottom-16`).
- README: money rules and the MVP limits table.
- Tests (200 passing): `tests/unit/money.test.ts` (parsing, half-up rounding, `allocateEqually`, `computeBill` scenarios, 500 seeded random bills reconcile), `tests/unit/trip-validation.test.ts`, more `normalization` and `format` tests, `tests/convex/trips.test.ts` (stored totals, line totals, owner row, allocations, `productMatchKey`, `searchText`, server re-parsing `" 1,000.5 "`, `VALIDATION` field errors, foreign assignee keys/person IDs, no account name/email in responses, recent ordering), `tests/convex/permissions.test.ts` (owner / unrelated / signed out / malformed and foreign-table IDs / deleted bill; `listRecent` isolation). `tests/convex/helpers.ts`: `tripInput`, `createTrip`.
- Verified: `npm run check` (typecheck, lint, tests) and `next build` pass. No browser testing this phase, by user instruction.

**Decisions / deviations**
- **Offline saves fail fast.** Convex queues mutations while disconnected and sends them on reconnect, so pressing Save offline would hang on "Saving…" (and a retry could later save twice). `useAppMutation` now checks `navigator.onLine` and the Convex socket first and, if either is down, returns a new client-only error code `OFFLINE` without sending. The bill form shows "Couldn't save your bill. Your changes are still here. Try again." with **Try again**. A mutation already sent before the connection drops still completes on reconnect (no duplicate).
- Form errors for items are stored by a stable row key (`items.r3.unitPrice`) and translated from the index-based keys of validation/server errors, so removing a row never moves an error onto another row. The last remaining item row can't be removed (a bill needs one item).
- The server's "no more than a year ahead" date check counts from tomorrow (UTC), so a browser ahead of UTC is never refused for a date its own form allowed.
- `buildItemDoc` computes the line total itself; optional text fields that are empty are left out of documents, not stored as `""`.
- `listAccessibleTrips` breaks same-date ties with `_creationTime` (always distinct) rather than `createdAt` (can repeat within a millisecond).
- `listRecent` returns `[]` when signed out (like `get` returning `null`), so a query still subscribed during sign-out can't throw into the error boundary.
- `BillPerson.link` is `null` for the owner row; for other people (Phase 5+) it's `{ state: "none" | "linked" }` for owner viewers until invitations arrive in Phase 6.
- Unknown parse input gets its own messages: quantity "Enter a valid quantity, e.g. 1 or 1.5"; dates "Enter a date", "Enter a valid date", "The date can't be more than a year from now"; store "Store must be 60 characters or fewer"; items "Add at least one item" / "A bill can have at most 200 items".
- The select was hand-written on `radix-ui` (like the dropdown menu), since the shadcn CLI was removed in Phase 0.
- No split-summary card yet: the plan adds it in Phase 5 with people.

**Browser verification (2026-10-18):** a scripted headless Chrome (Playwright, kept outside the repo) against the running `next dev` + dev deployment: 64/64 checks passed, plus 4 follow-up layout checks, with a clean console. Covered: Alice's empty dashboard ("No bills yet", **Create your first bill**, **New bill**); New bill defaults (today's date, Grocery, one row, the total-only hint, "—" line total, last row not removable); Review blocked by an empty title, a missing price and quantity 0, with inline messages, the title focused, `aria-invalid` + `aria-describedby`, and errors clearing as fields are fixed; the category select; "Imtiaz Grocery" with Cooking Oil 1 × 500 (Dalda · 1 litre), Rice 1.5 × 333.33 = Rs. 500.00 (half-up) and Bread 2 × 125.50 = Rs. 251.00; Enter in the price field and **Add item** each add a row and focus its name; footer "3 items · Total Rs. 1,251.00" above the tab bar at 360 px; the review (details line, qty × price, total, "Paid by you", reconciled shares, expandable share, heading focused); **Back to edit** keeps values; offline **Save bill** → "Couldn't save your bill…" Alert with **Try again**, values kept; back online **Try again** saves and opens the bill; the details page (meta line, Grocery + Owned badges, items, total, reconciled, no edit/delete) survives a reload; with 5 older bills added, the dashboard shows 5 cards, newest first, in date order; Carol's dashboard is empty and Alice's bill URL (and a malformed ID) shows "This bill doesn't exist or you don't have access." with **Back to dashboard**; signed out → `/sign-in`; no horizontal scroll at 360/768/1280 px; at the bottom of the page **Add item** is clear of the sticky footer. Screenshots were reviewed by eye.

**Fixed during browser verification**
- On a phone the save-failure Alert sat below the shares, out of view when Save was tapped near the top. The review screen now scrolls it into view when it appears.

**Noted, not changed:** at 360 px the narrow Qty column wraps "Quantity must be greater than 0" over four lines. It's readable; widening the column would squeeze the price field instead.

Dev data added to Alice's account (`alice@example.com` / `testpass123`): "Imtiaz Grocery" (Rs. 1,251.00) and "Older bill 1"–"Older bill 5" (dated 10 Jan–10 May 2026).

## Phase 4 — Edit and delete a saved bill ✅ (2026-10-18)

**Done**
- Backend: `convex/lib/tripWrite.ts` `writeTripUpdate` (resolves every saved person/item ID first, then rebuilds assignments, deletes left-out people and items, replaces kept items in place, inserts new ones, renumbers `position`, patches the trip's totals, `itemCount`, `searchText`, `updatedAt`) and `deleteTrip` (assignments → items → people → trip). `writeNewTrip` now shares `tripFields` and `insertAssignments` with the update. `convex/trips.ts`: `update` and `remove` (both `requireTripOwner`). Pushed to the dev deployment.
- Domain: `format.ts` `paisaToInput` (`"1234.56"`, `"125.50"`, `"500"`).
- `src/lib/db/trips.ts`: `useUpdateTrip` (`update(tripId, input)`) and `useDeleteTrip` (`remove(tripId)`), both resolving to `{ ok } | { ok: false, error }`.
- UI: `ui/confirm-dialog.tsx` (Radix AlertDialog; title, description, confirm/cancel labels, `variant="primary" | "danger"`, pending label, inline error; stays open and undismissable while pending); `ui/toast.tsx` (`ToastProvider` in `(app)/layout.tsx` + `useToast()`; the app's single feedback mechanism, an always-present `aria-live` region rendering an `Alert` with the `toast-in` animation, 4 s); `trips/trip-unavailable.tsx` (the shared "doesn't exist or no access" state); `layout/use-reset-after-leave.ts` (see decisions).
- `trip-form-state.ts`: `tripToFormValue(trip)` (prefill with `milliToInput` / `paisaToInput`, keeping `itemId`s and `personId`s; a saved person's key is its ID, the owner's is `OWNER_KEY`) and `isFormDirty`. `TripForm` takes a `ref` exposing `isDirty()`.
- Routes: bill details shows **Edit** (link) and **Delete** (`danger-soft`) in the header for the owner only; Delete confirms with "Delete this bill? This permanently removes it and its price records for everyone it's shared with.", then toasts "Bill deleted" and goes to `/dashboard`; a failure shows inside the dialog. `(app)/trips/[tripId]/edit` (`instant = false`): loading state, no-access state for `null` or non-owners, the prefilled `TripForm` (`mode="edit"`, **Save changes** → details page), **Cancel** in the header asks "Discard changes?" (**Keep editing** / **Discard changes**) only when the form is dirty.
- Tokens: `--animate-fade-in`, `--animate-dialog-in`, `--animate-toast-in` + keyframes (`duration-base`, `ease-standard`; used with `motion-safe:`).
- Tests (227 passing): `trips.test.ts` — isolation (A's Cooking Oil · 1 l to Rs. 550 leaves B's rows identical), patch/add/remove items with recomputed totals, `searchText`, positions, cleared store name and brand, kept `createdAt`; a removed item's assignments are deleted; people added/renamed/removed keep positions and split in bill order; another trip's item ID, malformed/repeated/owner/foreign-table IDs and invalid input → `VALIDATION` with nothing changed; `remove` leaves zero `items` / `itemAssignments` / `tripPeople` rows and the trip, other trips untouched, second remove → `NOT_FOUND`. `permissions.test.ts` — unrelated user `update` / `remove` → `NOT_FOUND`, signed out → `UNAUTHENTICATED`, a linked participant → `FORBIDDEN` (row inserted directly, as Phase 6 will), malformed IDs → `NOT_FOUND`, all with nothing changed; access is gone after delete. Unit: `paisaToInput` (incl. round-trip through `parseRupeesToPaisa`), `tripToFormValue`, `isFormDirty`.
- Verified: `npm run check` (typecheck, lint, tests) and `next build` pass. No browser testing this phase, by user instruction.

**Decisions / deviations**
- **Pages reset after they finish.** With `cacheComponents`, Next keeps up to 3 visited pages alive in `<Activity>` and restores their state. After a save, `/trips/new` would come back still showing "Saving…", and the edit page would keep its old draft. `useResetAfterLeave()` gives a React key that changes the next time the page is hidden, once `resetAfterLeave()` was called (after save, cancel or delete). Drafts left without saving are still kept, as Next intends. This fixes the same latent issue on `/trips/new` from Phase 3.
- **Stale or foreign IDs** (an item/person not on this bill, malformed, repeated, or the owner row as a person) give `VALIDATION` with the message "This bill has changed since you opened it. Reload the page and try again." and no `fieldErrors`, so the form shows it on the review screen (there's no field to attach it to). Nothing is written: all IDs are resolved before the first write.
- The edit form is prefilled once; live updates to the bill don't overwrite the draft.
- Kept items are written with `db.replace` (keeping `createdAt`), so optional fields cleared in the form are removed rather than kept; a cleared store name is removed with an explicit `undefined` patch.
- New people on an edit get positions after the highest existing one (removed people's positions aren't reused); people sort by position for the split.
- `update` and `remove` use `requireTripOwner` (sign-in only, no username check), consistent with `get`.
- After a successful delete the details page shows its skeleton instead of flashing "no access" while it navigates (the live query turns `null` before the mutation resolves).
- An open dialog is closed when its page is hidden, so it doesn't greet the user on return.
- `tw-animate-css` was not re-added: the three enter animations are tokens instead.
- No "Changes saved" toast after editing; returning to the updated details page is the feedback.

## Next: Phase 5 — People and splitting
No human steps needed. The backend already handles `people` on `create` and `update` (positions, renames, deletions; tested), and `ConfirmDialog` exists for the remove-person prompt. Phase 6 note: `src/domain/errors.ts` still lists `TRIP_PARTICIPANT_LIMIT` and lacks `INVITE_PERSON_LINKED`; rename it to `TRIP_PEOPLE_LIMIT` and add the missing code (§8.4). `writeTripUpdate` and `deleteTrip` have `Phase 6` comments where invitations must be deleted.

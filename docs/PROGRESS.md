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

## Next: Phase 3 — Create and view a private bill; dashboard recent bills
No human steps needed. Reuse `Badge` for the category and Owned/Shared badges, and add `export const instant = false` to each new `(app)` page.

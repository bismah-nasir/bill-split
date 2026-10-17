# Product Requirements Document (PRD)

## Product Name
**BillSplit & Price History** *(working title)*

## 1. Product Overview

BillSplit & Price History is a private, account-based web application for recording shopping and restaurant bills, fairly splitting item costs among the people who shared a trip, keeping searchable bill history, and comparing item prices over time.

Every shopping or ordering event is saved as its own independent bill/trip. A user can create a bill for a solo trip or invite friends who already have accounts to participate in a shared trip. Only the trip owner and participants whose invitations have been accepted can access a shared trip. A solo trip remains private to its owner.

Users enter item prices as shown on the bill. The application assigns each item to one person or shares it equally among selected people, then calculates each participant's total. Item prices are assumed to already include any applicable tax. The first version will not calculate or distribute separate taxes, service charges, delivery fees, discounts, tips, or other additional charges.

Saved bills also create a useful historical record. Users can revisit old bills and compare the prices of the same or equivalent items across dates and stores, using only bills they are authorized to see.

## 2. Problem Statement

When people shop together or order food together, it can be difficult to remember which items belong to whom and calculate the amount each person should pay. A simple equal split is often unfair because people buy different items or share only some items. In addition, paper receipts and chat messages are difficult to search later, making it hard to remember what an item cost during an earlier shopping trip or identify whether its price has increased.

The product solves these problems by combining item-based bill splitting, controlled bill sharing, searchable bill history, and item price comparison in one application.

## 3. Goals

1. Make it quick to create and save a bill with its date, store, items, prices, and participants.
2. Calculate each participant's share automatically and accurately.
3. Let users share an individual trip with invited friends without exposing unrelated private bills.
4. Preserve separate historical records for separate bills.
5. Let users find previous bills and compare an item's recorded prices over time.
6. Keep the first version understandable and easy to use, especially on mobile screens.

## 4. Non-Goals for the First Version

The MVP will not include:

- Payment processing, bank connections, reimbursements, or settlement tracking.
- Separate tax, tip, service-charge, delivery-fee, or discount calculations.
- Unequal/custom percentage splits for a shared item. A shared item is split equally among its assigned participants.
- Multiple bills bundled into one outing. Each trip has one independent bill; different bills are saved separately.
- Public bills, public profiles, or a public searchable directory of users' purchases.
- Inventory management, stock counts, budgeting, recurring purchases, or automatic receipt scanning/OCR.
- Global price sharing between unrelated accounts. Users only see price-history entries supported by bills they can access.
- Multi-currency support in the MVP. Use Pakistani rupees (PKR / Rs.) initially.
- Email verification, password reset, changing the account email, phone numbers, social sign-in, and two-factor authentication. The app never sends email.

## 5. Target Users and Main Scenarios

### 5.1 Solo shopper
A user goes grocery shopping alone, creates a bill, records the items and prices, and saves it. That bill is visible only to that user unless they explicitly share it in a future supported flow.

### 5.2 Friends shopping together
Bismah and Maryam shop at Imtiaz. Bismah creates a trip, adds Maryam as a participant, and records each item with its price and owner. Some items are assigned to Bismah, some to Maryam, and some are shared equally. After Maryam accepts the invitation, both can view the trip and its complete item breakdown. Neither can see the other person's unrelated private trips.

### 5.3 Restaurant order
A user records the final cost of each item as listed on the receipt. A shared item, such as a pizza, is divided equally among the people selected for that item. An item ordered by one person is assigned entirely to that person. Separate tax or fee lines are outside the MVP scope.

### 5.4 Price comparison
A user wants to know whether cooking oil or another grocery item costs more than it did previously. They open Price History, select the item, and review its saved prices, dates, and stores across accessible bills.

## 6. Core Terminology

- **User:** A person with an authenticated account.
- **Trip / Bill:** One independent shopping, grocery, restaurant, or other purchase event. Each trip contains one bill and is stored separately.
- **Owner / Creator:** The user who creates a trip and manages its contents and invitations.
- **Participant:** A user invited to a trip who has accepted the invitation.
- **Item:** A purchased product or order line recorded on a bill.
- **Assigned participants:** The one or more participants responsible for an item's cost.
- **Price-history entry:** The item price recorded on a particular saved bill, retained as a dated historical observation.

## 7. Functional Requirements

### 7.1 Account and Profile

- Users must sign in to view any bill or price history.
- Users sign up with **Name, Email, Password and Confirm password**, and sign in with email and password.
- Each email address can belong to only one account. Passwords must be at least 8 characters, and Confirm password must match Password.
- After signing up, a user chooses a unique username. Friends can find them by username or email.
- Users can view and edit their name and username, and see their email.
- Users must be able to sign out.
- The application must never expose a user's private trips to unrelated users. Do not build public or anonymous bill access.

### 7.2 Dashboard

The dashboard should show:

- A clear action to create a new trip/bill.
- Recent trips the user owns or can access as an accepted participant.
- Basic details per trip: trip title, store, date, category, total bill amount, and participant names.
- A simple personal spending summary for a selected period may be included if it can be calculated reliably from accessible bill records. It must be clear whether the number represents bills created by the user or the user's allocated shares; do not mix these meanings.
- Links to Bill History and Price History.

The dashboard must not show the contents, names, or totals of unrelated users' bills.

### 7.3 Create a Trip / Bill

The owner must be able to create a new independent bill with:

- **Trip title:** Required (for example, “Imtiaz Grocery Shopping” or “Dinner”).
- **Store / merchant:** Required or optional according to the final UI decision; if omitted, the title still identifies the trip.
- **Date:** Defaults to the current date in the user's local timezone and can be changed.
- **Category:** At minimum Grocery, Restaurant, Shopping, and Other. The user can choose Other if no category fits.
- **Participants:** The owner is included automatically. The owner may invite one or more existing users.
- **Items:** One or more item rows, each with a name, price, quantity, optional unit/variant details, and assigned participant(s).

A trip is a single bill, not a container for multiple separate receipts. Users who make multiple purchases should create separate trips for each bill.

### 7.4 Add and Manage Items

Each item should support these fields:

- **Item name:** Required (for example, “Cooking Oil”).
- **Brand / variant / pack size:** Optional, to distinguish similar products (for example, brand or “1 litre”).
- **Quantity:** Defaults to 1 and must be greater than 0.
- **Unit:** Optional (for example, item, kg, litre, pack). This helps distinguish comparable prices when relevant.
- **Unit price:** Required, non-negative monetary amount in PKR. The entered price is the final per-unit price to use for the split and is assumed to include applicable tax.
- **Line total:** Calculated as quantity × unit price. It should be visible to the owner when editing the bill.
- **Assigned participants:** At least one participant must be selected. One selected participant pays the entire line total; multiple selected participants share the line total equally.

The owner must be able to add, edit, and remove items before saving and when editing a saved trip. The UI should make each item's name, price, and assigned people easy to scan. Saving must be blocked if a required field is invalid or an item has no assigned participant.

If the user prefers to enter a single final item total instead of a unit price for a particular purchase, the UI may use quantity = 1 and that total as the unit price. Do not make users perform unnecessary conversions.

### 7.5 Bill-Splitting Rules

1. The owner is always a participant in the trip.
2. Each item must be assigned to one or more participants in that trip.
3. If one participant is assigned to an item, that participant is responsible for the full line total.
4. If multiple participants are assigned to an item, divide that line total equally among those participants.
5. Do not split an item with people who are not participants in the trip.
6. The amount assigned to each person is the sum of that person's shares across all items.
7. The trip total is the sum of all item line totals.
8. The sum of all participant shares must equal the trip total exactly after rounding.
9. All calculations must use decimal-safe monetary arithmetic (such as integer paisa internally), not imprecise binary floating-point arithmetic.
10. Display monetary totals consistently to two decimal places. Where a line total cannot be divided evenly to the nearest paisa, distribute any remaining paisa deterministically so that the allocated shares still add up exactly to the line total. The allocation rule must be consistent and documented in code.
11. Editing or creating one trip must never overwrite the item price or totals stored in another trip.

**Example:** A Rs. 5,000 pizza assigned equally to three participants produces shares of Rs. 1,666.67, Rs. 1,666.67, and Rs. 1,666.66 (or another deterministic one-paisa allocation), for an exact total of Rs. 5,000. An additional Rs. 900 item assigned only to Maryam adds Rs. 900 to Maryam's amount and does not affect the other participants.

### 7.6 Trip Summary

After entering items, the owner should be able to review a summary before saving. It should show:

- Trip title, store, date, category, and participants.
- All item names, quantities, unit prices, line totals, and assigned participants.
- Total bill amount.
- Each participant's share, with a clear breakdown of which items contribute to that share.
- A validation indicator confirming that participant shares add up to the total bill amount.

The saved trip detail page should show the same information to authorized participants. A participant should be able to understand why their total is what it is without recalculating manually.

### 7.7 Inviting Friends and Trip Access

Users may invite friends who already have accounts using their username or registered email address.

- The owner selects an identifier and the person to invite.
- The application must resolve the identifier to an existing account without exposing unnecessary profile or contact information.
- The invitation must be tied to one specific trip.
- The invited user sees a pending invitation and can accept or decline it.
- The invited user gains access to that trip only after accepting.
- A pending or declined invitation must not grant access to the trip.
- The owner can see pending, accepted, and declined invitation states.
- The owner can cancel a pending invitation and remove a participant from a trip, with a clear confirmation when access will be revoked.
- Removing a participant prevents future access to the trip. The user's other trips remain unaffected.
- In-app invitation status is required. The app does not send email or SMS notifications, and must never claim that one was sent.
- Username and email lookups must not reveal more account information than is necessary to complete the invitation.

**MVP permission model:** The trip owner can create, edit, and delete the trip, its items, and its participant list. Accepted participants can view the trip and its item/share breakdown but cannot edit or delete it. This keeps the first version simple and prevents conflicting edits. Shared editing can be considered later.

### 7.8 Bill History

Users must be able to browse all trips they own and all trips shared with them through an accepted invitation.

Bill History should support:

- Search by trip title, store, and item name where practical.
- Filters for date range, category, and owned/shared status.
- Sorting by newest/oldest date and bill total.
- Opening a saved trip to review its full item list and participant shares.
- A visible distinction between trips created by the user and trips shared with the user.
- Empty states that explain how to create the first bill or what to do when no search results match.

The history list and search results must enforce the same access permissions as the trip detail page. Guessing or manually changing a trip URL/ID must not allow unauthorized access.

### 7.9 Item Price History

The purpose of price history is to help users see how recorded item prices change over time.

- Users can search for an item by name and select a matching product/variant.
- When entering an item, the app should suggest previously used matching item names where feasible, so the user can consistently record the same product over time.
- Matching should consider normalized item name and, where supplied, brand, variant, pack size, and unit. For example, cooking oil in a 1-litre bottle should not automatically be treated as identical to a 5-litre container.
- Do not merge different products automatically when the match is ambiguous. Allow the user to select an existing match or record a distinct item/variant.
- Show historical observations with date, item/variant, recorded unit price, quantity/unit, store, trip title, and link to the source bill if the user still has access to it.
- Where comparable entries exist, show the previous recorded price, difference in rupees, and percentage change. Positive values indicate an increase; negative values indicate a decrease; an unchanged price should be shown as unchanged.
- A simple price-over-time chart is optional; a readable chronological table/list is sufficient for the MVP.
- Price history must be derived from saved bill item records, not from one mutable “current price” field that overwrites previous prices.
- The price-history view must only include records from trips the current user owns or is authorized to access. It must not expose product purchase history from unrelated accounts.
- If quantity/unit/pack size differs, make the difference visible and do not present the prices as directly comparable unless the units can be normalized reliably.

### 7.10 Editing and Deleting Saved Trips

- The owner can edit trip details and items after saving.
- Changes to an existing bill update that bill's own data and its associated price-history observation. They must not affect any other bill.
- The owner can delete a trip after a confirmation step. Deletion revokes participant access and removes that trip from price-history calculations. The implementation should use a consistent deletion strategy and avoid leaving orphaned participant access records.
- Participants cannot edit or delete trips in the MVP.
- If a saved bill is edited, show the updated values when it is next viewed. Do not silently rewrite historical observations in other bills.

## 8. Key User Flows

### Flow A: Create a private bill
1. User signs in.
2. User selects Create Trip.
3. User enters trip title, store, date, and category.
4. The owner is added as the only participant.
5. User adds items, their prices/quantities, and assigns each item to themselves.
6. App calculates totals and displays the summary.
7. User saves the trip.
8. Trip appears in the owner's dashboard and Bill History only.

### Flow B: Create and share a bill
1. User signs in and creates a trip.
2. User invites one or more friends by their username or registered email.
3. The app records each invitation as pending.
4. Each friend accepts or declines from their account.
5. After acceptance, the friend can view the trip and its full breakdown.
6. The owner assigns items to one participant or multiple participants and saves the bill.
7. The owner and accepted participants can reopen the trip later; unrelated users cannot access it.

The UI may allow the owner to prepare the bill before invitations are accepted, but pending invitees must not gain access until they accept.

### Flow C: Review old bills
1. User opens Bill History.
2. User searches or filters by date, store, category, or item.
3. User opens a result and reviews the original saved bill and each participant's share.

### Flow D: Compare an item price
1. User opens Price History.
2. User searches for an item and selects the correct product/variant.
3. App lists matching historical price observations in date order.
4. User compares prices and opens any accessible source bill for more context.

## 9. Main Screens

1. **Sign Up / Sign In** — sign up with name, email, password and confirm password; sign in with email and password; then choose a username.
2. **Dashboard** — create-trip action, recent accessible trips, and clearly defined summary figures.
3. **Create / Edit Trip** — trip details, participant invitations, item-entry list, assignments, and calculated totals.
4. **Trip Details** — saved items, participants, bill total, each person's share, and invitation/access status for the owner.
5. **Invitations** — received pending invitations and sent invitation statuses, with accept/decline/cancel actions as appropriate.
6. **Bill History** — searchable and filterable list of owned and shared trips.
7. **Price History** — product search and dated price observations with change comparisons.
8. **Profile / Account Settings** — name and username (editable) and email (read-only).

Use a responsive, accessible interface with clear forms, readable totals, helpful validation, and useful empty/loading/error states. Avoid making users navigate through unnecessary steps to add items or see the split.

## 10. Data Model (Conceptual)

The final database design may change, but it must support the following logical entities and relationships.

### User
- `id`
- `name`
- `email` (unique, stored lowercase)
- `username` (unique, chosen after sign-up)
- creation time
- The password is held by the authentication system as a hash, never in the app's own user record.

### Trip / Bill
- `id`
- `ownerId` → User
- `title`
- `storeName` (optional if product design allows)
- `date`
- `category`
- `currency` (PKR for MVP)
- `createdAt`, `updatedAt`
- Derived total from item line totals, or a stored total that is transactionally kept consistent with items

### Trip Participant / Invitation
- `id`
- `tripId` → Trip
- `userId` → User, when the identifier is resolved to an account
- `invitedIdentifierType` and `invitedIdentifier` only if needed for invitation workflow; minimize retention of unnecessary contact data
- `status` (pending, accepted, declined, cancelled, or removed as appropriate)
- `invitedByUserId` → User
- `createdAt`, `respondedAt`
- Enforce a unique active participant/invitation relationship per trip and user.

### Bill Item
- `id`
- `tripId` → Trip
- `name`
- `normalizedName` or equivalent safe matching key
- `brand`, `variant`, `packSize`, `unit` (optional)
- `quantity`
- `unitPrice` (decimal-safe PKR amount)
- `lineTotal` (quantity × unit price, decimal-safe)
- `createdAt`, `updatedAt`

### Item Assignment / Share
- `id`
- `itemId` → Bill Item
- `userId` → Trip Participant/User
- `allocatedAmount` (the exact monetary share for that item)
- Enforce that an assigned user is an owner or accepted/eligible participant of the trip according to the trip's assignment policy.

The database may calculate shares on demand or store share rows, but all saved/displayed totals must be consistent. If shares are stored, update them atomically with item changes. Historical price observations should be traceable to a bill item record and must respect bill access permissions.

## 11. Privacy and Security Requirements

Privacy is a core product requirement, not an optional enhancement.

- Require authentication for every private application screen and data request.
- Enforce authorization on the server/database for every trip, item, share, invitation, and price-history query. Client-side hiding alone is insufficient.
- A trip is accessible to its owner and only those users with accepted participant status.
- Pending, declined, cancelled, or removed participants must not access the trip.
- Verify authorization on read, create, update, and delete operations, including requests using guessed IDs or modified URLs.
- Validate that all item assignments reference eligible participants in the same trip.
- Do not expose users' email addresses or names to other users. Trip participants see each other's usernames only.
- Store passwords only as secure hashes managed by the authentication system. Never log, store in app tables, or return a password.
- Do not reveal another user's complete trip list, item catalogue, or item price history.
- Protect authentication secrets and database credentials; never expose server-only secrets in frontend code.
- Use safe input validation and appropriate error messages without returning sensitive backend details.
- If using a backend with row-level security or equivalent rules, test those policies explicitly.

## 12. Validation and Error Handling

- Required fields must be validated before a trip can be saved.
- Quantity must be greater than zero.
- Unit price must be a valid non-negative monetary amount. If zero-price items are permitted, display them clearly; otherwise reject them consistently.
- A bill item must have at least one eligible assigned participant.
- Duplicate invitations to the same user for the same trip should be prevented or handled predictably.
- Users must not be able to accept an invitation for another account.
- Invalid or unauthorized requests must fail safely and must not reveal private record existence unnecessarily.
- Network/server errors should preserve the user's unsaved form data where feasible and show a clear retry message.
- Confirm destructive actions such as deleting a saved trip or removing a participant.

## 13. Acceptance Criteria

The MVP is acceptable when all of the following work:

1. A user can register with name, email, password and confirm password, sign in with email and password, and create a private bill.
2. A private bill is visible to its owner and is not visible to an unrelated signed-in user.
3. A user can create a trip with multiple participants by inviting registered users by username or email.
4. An invitation remains pending until the invited user accepts or declines it.
5. An accepted participant can view the associated trip; a pending, declined, cancelled, or removed invitee cannot.
6. The owner can add, edit, and delete items and assign each item to one or more eligible participants.
7. An item assigned to one person is charged fully to that person; an item assigned to multiple people is split equally.
8. The bill total and all participant shares reconcile exactly after currency rounding.
9. A new bill for the same item does not change the price stored in an older bill.
10. Users can search/filter saved bills and reopen accessible trips.
11. Users can view item price observations from accessible bills and see price changes between comparable entries.
12. Price history does not reveal records from unrelated users' private trips.
13. Editing or deleting a trip affects only that trip and its related history/access records.
14. The interface works on mobile and desktop and provides understandable validation, empty, loading, and error states.
15. Authorization is enforced by the backend/database, not only by frontend navigation.

## 14. Testing Requirements

At minimum, test the following scenarios:

- One user, one item, one participant.
- Multiple participants with items assigned individually.
- A shared item divided between two or three participants.
- A trip containing both personal and shared items.
- A total that does not divide evenly into paisa, confirming shares still add up exactly.
- Editing an item in one trip without changing another trip's record of the same item.
- An owner, an accepted participant, a pending invitee, a declined invitee, a removed participant, and an unrelated user trying to access a trip.
- Invitation by username and by email (both case-insensitive).
- Sign-up validation: missing fields, invalid email, short password, mismatched confirm password, and an email that already has an account.
- Duplicate invitations and invalid participant assignments.
- Searching Bill History and Price History across owned and shared trips.
- Product variants and units that should not be incorrectly compared as identical.
- Deleting a trip and confirming it no longer appears in history or price comparisons and that access is revoked.

## 15. MVP Priorities

### P0 — Required for launch
- Email-and-password authentication and account identity.
- Private trips and owner-based access control.
- Trip creation and item entry.
- Item assignment and equal split calculation.
- Accurate bill and participant totals.
- Invitations, acceptance/decline, and shared read access.
- Saved Bill History.
- Basic Item Price History from accessible saved bills.
- Secure backend authorization and core tests.

### P1 — Useful improvements after the core flow works
- Price-over-time chart.
- More advanced history filters and spending summaries.
- Convenient item suggestions and duplicate-name resolution.
- Email notifications for invitations, if an email provider is configured.
- Export/print a bill summary.

### Explicitly out of scope until separately approved
- Separate taxes and extra charges, custom/unequal item splits, payments/settlements, receipt OCR, public sharing, and shared editing by participants.

## 16. Product Decisions and Implementation Notes

- Use the terms “Trip” and “Bill” consistently in the interface. A trip represents one bill only.
- Use PKR and display values as `Rs. 1,234.56` or an equally clear consistent format.
- Store dates consistently and display them in the user's intended local timezone. Default to Pakistan time where appropriate, but do not convert a date-only shopping record into a different date through timezone handling.
- Preserve each saved bill item as a historical observation. Never keep only the latest price.
- Keep price history scoped to the signed-in user's accessible bills.
- Do not add tax/fee/discount calculations to the MVP. Enter the final prices used for splitting directly as item prices.
- Keep the product implementation simple. Prefer reliable calculations, access control, and understandable screens over speculative features.
- Before coding, inspect the existing repository and its instructions. If the repository already defines a stack or conventions, follow them. If it is a blank project, finalize the stack and technical architecture separately rather than introducing unnecessary services or dependencies silently.

## 17. Definition of Done

The MVP is done when the P0 features are implemented, the acceptance criteria and core privacy tests pass, saved bills and item-price records persist across sessions, and the interface can be used end-to-end by at least two test accounts (for example, an owner and an invited participant). No test account should be able to retrieve another user's private trip data by changing a URL or API request.

## 18. Technical Architecture

### 18.1 Finalized Stack

Use the preferred stack. It fits this product well and avoids operating a separate backend or database.

| Layer | Decision | Responsibility |
|---|---|---|
| Language | TypeScript with strict type checking | Shared type safety across the UI and application logic |
| Web framework | Next.js App Router | Pages, layouts, navigation, server-rendered shell, and deployment integration |
| Styling | Tailwind CSS | Responsive layout and design tokens |
| UI components | shadcn/ui, added selectively | Accessible dialogs, forms, tables, menus, sheets, badges, and other components that the app actually needs |
| Authentication | Convex Auth (Password provider) | Email + password sign-up/sign-in, password hashing, sessions and account identity, running inside Convex |
| Database and application backend | Convex | Persistent data, typed queries and mutations, reactive updates, validation, access control, and backend business logic |
| Hosting | Vercel for Next.js; managed Convex deployment for backend/data | Minimal hosting and deployment infrastructure |
| Optional icons | `lucide-react`, only if useful | Consistent interface icons |

**Architecture decision:** Convex is the primary backend, not merely a database behind a separate API. Implement normal application reads and writes as Convex queries and mutations. Do not build duplicate CRUD endpoints in Next.js Route Handlers. Add a Next.js Route Handler only when a future integration genuinely requires a conventional HTTP endpoint and cannot sensibly be handled by a Convex function or HTTP Action.

Do not add PostgreSQL, Prisma, a separate Express server, Redux, Redis, a message queue, a separate search service, any other authentication provider, or an email-sending service for the MVP. Use the current stable compatible versions of Next.js, Convex, and Convex Auth at implementation time; follow their official integration guides rather than pinning examples copied from an older tutorial.

### 18.2 Frontend Architecture

Use the Next.js **App Router** with TypeScript.

- **Server Components by default:** Use them for route layouts, static page structure, and content that does not need browser interaction.
- **Client Components where needed:** Use them for Convex reactive queries, item-entry forms, participant selection, invitation actions, live bill totals, filters, dialogs, and other interactive controls.
- **Provider setup:** Wrap the application with Convex Auth's Next.js providers, following the current official Convex Auth setup for Next.js. Use one shared Convex client instance.
- **Authentication UI:** Build the sign-up form (Name, Email, Password, Confirm password) and sign-in form (Email, Password) from the app's own components. Password hashing and sessions are handled by Convex Auth; never implement them yourself.
- **Form state:** Keep unsaved form state local to the relevant form. Use Convex query/mutation hooks for persisted data and live updates. Do not introduce a global state library unless a demonstrated requirement appears.
- **Component boundaries:** Keep trip forms, item rows, participant selection, bill summaries, history filters, invitation lists, and price-history presentation in small, focused components. Do not create an abstraction for every individual field.
- **UI library:** Add shadcn/ui components only as required. The generated components are part of the application code and can be customized; do not install a large component framework alongside them.
- **Responsive behavior:** Optimize the item-entry experience for mobile first, while keeping bill details and participant totals readable on desktop.

The UI may show a calculated preview while the user edits a bill, but the backend must validate the inputs and calculate the authoritative saved totals and shares. Never rely on browser calculations for data integrity.

### 18.3 Backend Architecture and Responsibilities

Keep application business logic in Convex. Organize the functions by feature rather than by technical layer.

- **Queries (read-only):** Current-user profile, dashboard/recent trips, paginated accessible bill history, trip detail, received/sent invitations, and authorized item price history.
- **Mutations (writes):** Create/update/delete a trip, add/update/delete items, create/cancel/accept/decline invitations, update a username, and any other operation that changes persisted state.
- **Actions / HTTP Actions:** Use only for genuine external service calls or incoming HTTP integrations. Convex Auth registers its own HTTP routes; the app needs no other HTTP endpoints.
- **Shared backend helpers:** Keep reusable authentication, authorization, item normalization, and money-allocation helpers in `convex/lib/`. Avoid duplicating permission checks across individual functions.

Every public query and mutation must derive the signed-in user from the Convex Auth identity (`getAuthUserId(ctx)`, which reads `ctx.auth`) and load the app's user record. Never accept a caller-supplied `userId` as proof of identity. Validate inputs with Convex argument validators and validate domain rules in the function itself.

Create a small authorization helper such as `requireCurrentUser(ctx)` and reusable checks such as `requireTripViewer(ctx, tripId)` and `requireTripOwner(ctx, tripId)`. The authorization rules are:

1. The owner can read and manage their own trip.
2. A user with an **accepted** participant record can read that specific trip.
3. Pending, declined, cancelled, and removed invitees cannot read the trip or its item/price-history data.
4. Only the owner can change or delete a trip, its items, assignments, or participant list in the MVP.
5. Every path that reads a trip's items or a price-history record must enforce the same access rules, including requests using a guessed ID.

A mutation that changes a trip's items should validate participants and assignments, calculate line totals and allocations, and write the consistent result atomically. Prefer Convex mutations' transaction behavior over multiple independent writes that could leave a partial bill.

#### Identity and invitation lookup

Convex Auth is the source of truth for authentication. Its Password provider creates the `users` row at sign-up with the user's name and normalized (trimmed, lowercase) email, and keeps the password hash in its own tables. The normalized email is the account ID, so one email can have only one account. The `users` table stores only the minimal app profile and lookup fields: name, email, username and normalized username. The app's username is managed by the app and must be checked for uniqueness.

Validate sign-up input on the server as well as in the form: name 1–60 characters, valid email, password 8–128 characters. Confirm password is checked in the form only and never sent to the server. A failed sign-in returns one generic message that doesn't reveal whether the account exists. Keep Convex Auth's limit on failed sign-in attempts enabled.

For an invitation, normalize the supplied username or email, perform an exact indexed lookup, create an invitation tied to the resolved user and one trip, and return only the invitee's username. Prevent duplicates and avoid exposing a complete user directory. Emails aren't verified, so the inviter always sees the matched username and can cancel an invitation sent to the wrong person.

### 18.4 Data Storage and Schema Design

Use Convex as the only application database in the MVP. Define the schema in `convex/schema.ts` with Convex validators. Use IDs and references between records rather than duplicating entire trip documents inside participant or item records.

Recommended tables:

| Table | Main fields | Purpose |
|---|---|---|
| `users` | `name`, `email` (normalized), `username`, `usernameNormalized`, plus the optional fields Convex Auth requires | App profile and exact invitation lookup. Created by Convex Auth at sign-up. Store only necessary account data. |
| `trips` | `ownerId`, `title`, `storeName`, `tripDate`, `category`, `currency`, `createdAt`, `updatedAt` | One independent bill per trip. Store `tripDate` as a date-only value such as `YYYY-MM-DD` to preserve the shopping date; use timestamps for audit fields. |
| `tripParticipants` | `tripId`, `userId`, `role`, `status`, `invitedByUserId`, `createdAt`, `respondedAt` | Owner/participant relationship and pending/accepted/declined/cancelled/removed invitation state. The owner is always included as an accepted participant or otherwise receives equivalent explicit authorization. |
| `items` | `tripId`, `name`, `normalizedName`, `brand`, `variant`, `packSize`, `unit`, `productMatchKey`, `quantity`, `unitPricePaisa`, `lineTotalPaisa`, timestamps | Original item records and their historical prices. An item row belongs to exactly one trip and must not be overwritten by a later purchase. |
| `itemAssignments` | `tripId`, `itemId`, `userId`, `allocatedAmountPaisa` | The people responsible for each item and their exact allocation. Each assigned user must be an eligible participant in that trip. |

#### Money representation

- Store money as **integer paisa** (100 paisa = Rs. 1.00), for example `Rs. 125.50` as `12550`, rather than using binary floating-point values for money.
- Parse and validate user-entered price values at the application boundary. Calculate a line total from the entered unit price and quantity, rounding to the nearest paisa using one documented rule before allocation.
- When a line total does not divide evenly among assigned users, allocate the remaining paisa deterministically (for example, in a stable order of participant IDs) so the allocations add up to the exact line total.
- Store or calculate the allocation rows as part of the same mutation that updates the bill. Never trust client-supplied allocation totals without recomputing them on the server.
- Display values with two decimal places and the `Rs.` prefix. Keep PKR as the only currency in the MVP.

#### Indexes and consistency

Define indexes in `convex/schema.ts` for the app's actual access patterns. At minimum, plan for:

- `users`: by email (index named `email`, required by Convex Auth) and by normalized username.
- `trips`: by owner and trip date (and any additional compound index needed for the dashboard/history ordering).
- `tripParticipants`: by trip + user, by user + status, and by trip + status.
- `items`: by trip, by normalized item name, and by `productMatchKey` for comparable price-history lookups.
- `itemAssignments`: by item and by trip + user.

Convex indexes do not automatically provide unique constraints. Enforce unique usernames/contact lookup keys, one active participant relationship per trip/user, and duplicate-invitation behavior in mutations. Check existing records before inserting and handle concurrent duplicate attempts safely.

Do not introduce a separate mutable `currentPrice` field or a separate price-history table for the MVP. Price history is derived from immutable-in-other-trips item records. If a user edits an old bill, only that bill's item record changes; no other bill is changed.

### 18.5 Data Retrieval Strategy

Use Convex's generated typed API and reactive query hooks (`useQuery`) for data that should refresh when the database changes, and mutations (`useMutation`) for writes. Use `undefined`/loading states deliberately and provide useful loading, empty, and error states.

- **Dashboard:** Query a bounded, newest-first list of trips owned by the user and trips for which the user has an accepted participant record. Merge and deduplicate the results by trip ID. Include a clearly defined limit for recent trips.
- **Trip detail:** Load the trip only after checking that the current user is its owner or an accepted participant. Then load items and assignment rows through trip/item indexes. Return only fields needed by that screen.
- **Bill history:** Retrieve owned/shared trips from indexed owner/participant relationships. Paginate results instead of collecting an unlimited history. Apply date/category/owned-shared filters in the backend where practical. Title/store search can filter the authorized result set; never perform a global search and display unfiltered records.
- **Invitation inbox:** Use the `tripParticipants` user + status index to retrieve invitations for the signed-in user. Use the trip + status index for the owner's sent-invitation view.
- **Friend resolution:** Perform exact, indexed lookups by normalized username or normalized email. Do not return a list of users or disclose the target's contact details.
- **Price history:** Build a deterministic `productMatchKey` from normalized name and the relevant brand/variant/pack-size/unit fields. Retrieve matching item candidates using the index, then check trip authorization on the backend **before returning any observation**. Paginate results and never let inaccessible records influence returned counts, price comparisons, or charts. If later data volume makes this query expensive, add a user-scoped/materialized price-history index only after measuring a real performance issue; do not add that denormalization to the MVP.
- **Search and filtering:** Prefer schema indexes for common filters and exact lookups. Do not query every table with `.collect()` for a dashboard or complete history. Keep result sizes bounded and add pagination for growing histories.
- **Reactive updates:** Convex subscriptions can keep an open trip or invitation inbox current without manual polling or a separate WebSocket service.

A shared bill contributes a price-history observation only for its owner and accepted participants. The app must never expose unrelated users' purchase records, even though matching item names may exist elsewhere in the database.

### 18.6 Folder Structure

Use a straightforward feature-oriented structure. The exact root (`src/` or project-root `app/`) can follow the repository's existing convention; do not move files unnecessarily if a project has already been initialized.

```text
project-root/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── trips/page.tsx
│   │   │   ├── trips/new/page.tsx
│   │   │   ├── trips/[tripId]/page.tsx
│   │   │   ├── trips/[tripId]/edit/page.tsx
│   │   │   ├── invitations/page.tsx
│   │   │   ├── price-history/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── providers/convex-client-provider.tsx
│   │   ├── layout/app-shell.tsx
│   │   ├── trips/trip-form.tsx
│   │   ├── trips/item-editor.tsx
│   │   ├── trips/participant-picker.tsx
│   │   ├── trips/trip-summary.tsx
│   │   ├── bills/bill-history-filters.tsx
│   │   ├── invitations/invitation-list.tsx
│   │   ├── price-history/price-history-list.tsx
│   │   └── ui/                       # shadcn/ui components used by the app
│   └── lib/
│       ├── utils.ts
│       └── money-format.ts            # display/format helpers; backend remains authoritative
├── convex/
│   ├── schema.ts
│   ├── auth.ts                        # Convex Auth: Password provider
│   ├── auth.config.ts
│   ├── http.ts                        # Convex Auth HTTP routes
│   ├── users.ts
│   ├── trips.ts
│   ├── invitations.ts
│   ├── items.ts
│   ├── priceHistory.ts
│   ├── lib/
│   │   ├── auth.ts                    # current-user resolution and access checks
│   │   ├── money.ts                   # authoritative split/rounding calculations
│   │   └── normalization.ts           # username/contact/item matching helpers
│   └── _generated/                    # generated by Convex; do not hand-edit
├── public/
├── tests/
│   ├── money.test.ts
│   └── permissions.test.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

Use the file convention required by the installed Next.js major version for the Convex Auth route middleware/proxy (for example, `proxy.ts` or `middleware.ts` where applicable). Remember that route middleware is a navigation/session convenience, **not** the security boundary; Convex queries and mutations must independently enforce authorization.

`src/app/api/` should not be created unless a real Next.js HTTP endpoint is required. Generated `convex/_generated/` files must be managed by the Convex CLI, not edited manually.

### 18.7 Environment Variables

Keep local secrets in `.env.local` and commit only placeholders in `.env.example`. Never commit real keys. Only variables prefixed with `NEXT_PUBLIC_` should be considered safe for the browser, because Next.js exposes those values in the client bundle.

#### Next.js / local `.env.local`

```dotenv
# Public application configuration
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
```

There are no authentication variables in `.env.local`.

The Convex CLI may add/manage `CONVEX_DEPLOYMENT` during local development. Keep the generated value as the CLI expects; do not invent a deployment URL or expose a deployment secret in client code.

#### Convex deployment environment

Configure these in the relevant Convex deployment's environment settings, not in client-exposed variables:

```dotenv
# The app's URL (http://localhost:3000 in development)
SITE_URL=http://localhost:3000

# Signing keys for Convex Auth sessions, generated by `npx @convex-dev/auth`
JWT_PRIVATE_KEY=<generated>
JWKS=<generated>
```

Use separate development and production Convex deployments, each with its own generated keys. Never reuse development keys in production.

Do not add API keys for services the app does not use. Validate required environment configuration early and provide a clear setup error without printing secret values.

### 18.8 Deployment and Development Workflow

1. Initialize or inspect the repository before changing it. Follow existing project instructions and avoid replacing working configuration without a reason.
2. Set up the Next.js app, Tailwind CSS, and selected shadcn/ui components.
3. Create the Convex project with `npx convex dev`, then run `npx @convex-dev/auth` to set up Convex Auth's keys and site URL.
4. Define the Convex schema and indexes before implementing feature queries and mutations.
5. Implement and test money calculations and access-control helpers before building the full UI.
6. Build the core flow in this order: profile/bootstrap, private trip creation, item assignment and exact splits, invitation acceptance and access rules, bill history, then price history.
7. Run the app locally with the Next.js dev server and `npx convex dev`. Use the Convex CLI's production deploy workflow for release after tests pass.
8. Deploy the Next.js app on Vercel and the backend through Convex. Configure production secrets separately: generate production Convex Auth keys and set `SITE_URL` to the live URL.
9. Test privacy with at least two independent accounts. Try direct URL access and direct query/mutation requests as an unrelated user, pending invitee, declined invitee, and removed participant.

### 18.9 Minimum Quality and Security Gates

Before considering the MVP production-ready:

- Test the bill-splitting and rounding rules with unit tests, including a total that does not divide evenly in paisa.
- Test all trip access states at the backend, not only through visible pages.
- Test that invitation lookup by username or email exposes no email address or name.
- Test duplicate usernames, duplicate invitations, concurrent invitation attempts, invalid assignments, and owner deletion/editing behavior.
- Test that editing or deleting one trip changes only that trip's item observations and participant access.
- Check that list and price-history queries are paginated or bounded and that authorization is checked before data is returned.
- Run TypeScript checks and linting, and fix errors introduced by the implementation. Keep tests for money and permission behavior in the repository.
- Use clear error states and avoid returning stack traces, auth tokens, private contact information, or database internals to users.
- Keep dependencies minimal and update this architecture only when an actual product requirement justifies the added complexity.

### 18.10 Official Implementation References

Use the current documentation during implementation because SDK conventions can change between major releases:

- [Convex with Next.js App Router](https://docs.convex.dev/client/nextjs/app-router/)
- [Convex Auth](https://labs.convex.dev/auth)
- [Convex Auth with Next.js](https://labs.convex.dev/auth/authz/nextjs)
- [Convex Auth passwords](https://labs.convex.dev/auth/config/passwords)
- [Convex database indexes](https://docs.convex.dev/database/reading-data/indexes/)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)

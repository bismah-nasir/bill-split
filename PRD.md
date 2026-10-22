# Product Requirements Document (PRD)

## Product Name
**BillSplit & Price History**

*Last aligned with the built product: 2026-10-22. Live at https://the-bill-split.vercel.app.*

## 1. Product Overview

BillSplit & Price History is a private, account-based web application for recording shopping and restaurant bills, fairly splitting item costs among the people who shared a trip, keeping searchable bill history, and comparing item prices over time.

Every shopping or ordering event is saved as its own independent bill/trip. The owner adds the people a bill is split between by typing their names; those people do not need accounts. Optionally, the owner can link a person on the bill to a registered account by username or email; once that account holder accepts, they can view the bill read-only. Only the owner and linked accounts can access a bill. A bill nobody is linked to remains private to its owner.

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
Bismah and Maryam shop at Imtiaz. Bismah creates a bill, adds Maryam by typing her name, and records each item with its price and who pays for it. Some items are assigned to Bismah, some to Maryam, and some are shared equally. Bismah can send Maryam a screenshot of the split summary straight away. If Maryam has an account, Bismah can also link "Maryam" on the bill to Maryam's username or email; after Maryam accepts, she can view the bill and its complete item breakdown. Linking never changes the split. Neither can see the other person's unrelated private bills.

### 5.3 Restaurant order
A user records the final cost of each item as listed on the receipt. A shared item, such as a pizza, is divided equally among the people selected for that item. An item ordered by one person is assigned entirely to that person. Separate tax or fee lines are outside the MVP scope.

### 5.4 Price comparison
A user wants to know whether cooking oil or another grocery item costs more than it did previously. They open Price History, select the item, and review its saved prices, dates, and stores across accessible bills.

## 6. Core Terminology

- **User:** A person with an authenticated account.
- **Trip / Bill:** One independent shopping, grocery, restaurant, or other purchase event. Each trip contains one bill and is stored separately.
- **Owner / Creator:** The user who creates a trip and manages its contents, people and invitations.
- **Person (on a bill):** Someone the bill is split between: the owner, or a name the owner typed. A person does not need an account.
- **Linked person / Participant:** A person on a bill who has been linked to a registered account, after that account holder accepted an invitation. Participants can view the bill read-only.
- **Invitation:** A request from the owner to link one person on one bill to one account. It can be pending, accepted, declined, cancelled or unlinked.
- **Item:** A purchased product or order line recorded on a bill.
- **Assigned people:** The one or more people on the bill responsible for an item's cost.
- **Price-history entry:** The item price recorded on a particular saved bill, retained as a dated historical observation.

## 7. Functional Requirements

### 7.1 Account and Profile

- Users must sign in to view any bill or price history.
- Users sign up with **Name, Email, Password and Confirm password**, and sign in with email and password.
- Each email address can belong to only one account. Passwords must be at least 8 characters, and Confirm password must match Password.
- After signing up, a user chooses a unique username (onboarding). A bill's owner can link a person on the bill to their account by username or email.
- Users can view and edit their name and username, and see their email.
- Users must be able to sign out.
- The application must never expose a user's private trips to unrelated users. Do not build public or anonymous bill access.

### 7.2 Dashboard

The dashboard should show:

- A clear action to create a new trip/bill.
- Recent bills (the newest 5) the user owns or can access as a linked participant.
- Basic details per bill: title, store, date, category, ownership (owned or shared), total bill amount, and the names of the people on it.
- A monthly spending summary with a month switcher and two separate figures that are never mixed: **Your share** (the sum of the user's own allocated shares across every bill they can access, dated in that month) and **Bills you created** (the full totals of bills the user owns, dated in that month).
- Links to Bill History ("View all bills") and Price History ("Compare prices").

The dashboard must not show the contents, names, or totals of unrelated users' bills.

### 7.3 Create a Trip / Bill

The owner must be able to create a new independent bill with:

- **Trip title:** Required (for example, “Imtiaz Grocery Shopping” or “Dinner”).
- **Store / merchant:** Optional; if omitted, the title still identifies the trip.
- **Date:** Defaults to the current date in the user's local timezone and can be changed (at most one year in the future).
- **Category:** Grocery (the default), Restaurant, Shopping, and Other.
- **People:** The owner is included automatically. The owner adds anyone else by typing a name (1–40 characters, unique on the bill ignoring case; at most 20 people including the owner). No account is needed. Linking a person to an account happens after saving (see 7.7).
- **Items:** One or more item rows (at most 200), each with a name, price, quantity, optional brand/variant/pack size/unit, and the assigned people.

A trip is a single bill, not a container for multiple separate receipts. Users who make multiple purchases should create separate trips for each bill.

### 7.4 Add and Manage Items

Each item should support these fields:

- **Item name:** Required (for example, “Cooking Oil”).
- **Brand / variant / pack size:** Optional, to distinguish similar products (for example, brand or “1 litre”).
- **Quantity:** Defaults to 1 and must be greater than 0. Up to three decimal places are allowed (for example 1.5 kg).
- **Unit:** Optional (for example, item, kg, litre, pack). This helps distinguish comparable prices when relevant.
- **Unit price:** Required, non-negative monetary amount in PKR (zero is allowed). The entered price is the final per-unit price to use for the split and is assumed to include applicable tax.
- **Line total:** Calculated as quantity × unit price, shown live while the owner edits the bill, with the running bill total in a sticky footer.
- **Assigned people:** At least one person must be selected (chips for each person, plus **Everyone**). One selected person pays the entire line total; multiple selected people share the line total equally. A preview under the item shows each person's part.

The owner must be able to add, edit, and remove items before saving and when editing a saved trip. The UI should make each item's name, price, and assigned people easy to scan. Saving must be blocked if a required field is invalid or an item has no assigned participant.

If the user prefers to enter a single final item total instead of a unit price for a particular purchase, the UI may use quantity = 1 and that total as the unit price. Do not make users perform unnecessary conversions.

### 7.5 Bill-Splitting Rules

1. The owner is always a person on the bill.
2. Each item must be assigned to one or more people on that bill.
3. If one person is assigned to an item, that person is responsible for the full line total.
4. If multiple people are assigned to an item, divide that line total equally among them.
5. Do not split an item with people who are not on the bill.
6. The amount assigned to each person is the sum of that person's shares across all items.
7. The trip total is the sum of all item line totals.
8. The sum of all people's shares must equal the trip total exactly after rounding.
9. All calculations use integer paisa (and integer thousandths for quantities), never binary floating-point arithmetic.
10. Display monetary totals consistently to two decimal places. A line total is quantity × unit price rounded half-up to the nearest paisa. Where a line total cannot be divided evenly, the remaining paisa go one each to the assigned people earliest on the bill: the owner first, then people in the order they were added. Each person's position on the bill never changes, so renaming, linking or unlinking someone never moves a paisa.
11. Editing or creating one trip must never overwrite the item price or totals stored in another trip.
12. Linking, unlinking, declining or cancelling an invitation never changes the split.

**Example:** A Rs. 5,000 pizza assigned equally to three people produces shares of Rs. 1,666.67, Rs. 1,666.67, and Rs. 1,666.66, for an exact total of Rs. 5,000. An additional Rs. 900 item assigned only to Maryam adds Rs. 900 to Maryam's amount and does not affect the other people.

### 7.6 Trip Summary

After entering items, the owner reviews a summary (**Review**) before saving. It shows:

- Trip title, store, date, category, and the people on the bill.
- All item names, quantities, unit prices, line totals, and assigned people.
- Total bill amount.
- Each person's share, with a clear breakdown of which items contribute to that share (for example "Pizza (1/3 of Rs. 5,000.00)").
- A validation indicator confirming that the shares add up to the total bill amount.

The saved bill page shows the same information to the owner and linked participants. It opens with a **split summary** card (title, store, date, total, one line per person, and the reconciliation check) sized to fit one phone screenshot, so the owner can send it in any chat app. The split summary never says "You", because it is forwarded to others. A participant should be able to understand why their total is what it is without recalculating manually.

The owner and linked participants can **print** a bill. The printout fits the page's content only (no navigation or management actions) and includes every person's breakdown.

### 7.7 Linking People to Accounts and Trip Access

Splitting never depends on accounts. Separately, the owner may give a person on the bill read-only access by linking them to a registered account, using that account's username or registered email address.

- The owner chooses a person already on the bill (or adds a new one in the same step) and enters a username or email.
- The application resolves the identifier with an exact, case-insensitive match and shows only the matched username. A failed lookup gives one generic message.
- Names are never matched to accounts automatically, even if someone signs up with the same name. Only the owner links a person, and the account holder must accept.
- The invitation is tied to one specific person on one specific bill. A person can have at most one pending invitation, and an account can be linked to at most one person per bill. Inviting yourself is rejected.
- The invited user sees the pending invitation on **Invitations → Received** (with a count badge in the navigation) and can accept or decline it. They see only the bill's title, store, date, the owner's username and the name they would be linked as.
- The invited user gains access to that bill only after accepting. A pending, declined or cancelled invitation grants no access.
- The owner sees each person's link state on the bill (not linked, invited, declined, linked) and all sent invitations on **Invitations → Sent**.
- The owner can cancel a pending invitation, and can **unlink** a linked person, with a confirmation when access will be revoked. Declining, cancelling and unlinking leave the person on the bill as a plain name, with their share unchanged.
- Once linked, the person is shown as "Ben (@ben_doe)": the name the owner typed plus the username. The account's own name is never shown.
- Removing a person from the bill (an edit) also revokes any access they had. The user's other bills remain unaffected.
- In-app invitation status is required. The app does not send email or SMS notifications, and must never claim that one was sent.

**MVP permission model:** The trip owner can create, edit, and delete the trip, its items, its people and their links. Linked participants can view and print the bill and its item/share breakdown but cannot edit or delete it. This keeps the first version simple and prevents conflicting edits. Shared editing can be considered later.

### 7.8 Bill History

Users must be able to browse all trips they own and all trips shared with them through an accepted invitation.

Bill History should support:

- Search by trip title, store, and item name.
- Filters for date range, category, and owned/shared status ("All", "Created by me", "Shared with me"). Search and filters are kept in the URL, so they survive reload and back navigation.
- Sorting by newest/oldest date and highest/lowest bill total.
- A match count and a "Load more" button (20 bills at a time).
- Opening a saved trip to review its full item list and participant shares.
- A visible distinction between trips created by the user and trips shared with the user.
- Empty states that explain how to create the first bill or what to do when no search results match.

The history list and search results must enforce the same access permissions as the trip detail page. Guessing or manually changing a trip URL/ID must not allow unauthorized access.

### 7.9 Item Price History

The purpose of price history is to help users see how recorded item prices change over time.

- Users can search for an item by name (at least 2 characters) and select a matching product/variant.
- When entering an item on a new bill, the app suggests previously recorded products with their brand, pack size and last price. Choosing a suggestion fills in all the product fields, so the item lands in the same Price History product; **Use as new item** keeps what the user typed.
- Matching uses the normalized item name and, where supplied, brand, variant, pack size, and unit. For example, cooking oil in a 1-litre bottle is not treated as identical to a 5-litre container.
- Do not merge different products automatically when the match is ambiguous. The user selects an existing match or records a distinct item/variant.
- Show historical observations, newest first, with date, recorded unit price, change, quantity/unit, store, and a link to the source bill (a table on desktop, cards on phones).
- Show the change from the previous record of the same product in rupees and percent. Positive values indicate an increase; negative values indicate a decrease; an unchanged price is shown as unchanged; the oldest record is marked "First record".
- With two or more records, a **price-over-time chart** shows the unit price by date, with the lowest and highest price labelled and a text alternative for screen readers.
- Price history must be derived from saved bill item records, not from one mutable “current price” field that overwrites previous prices.
- The price-history view must only include records from trips the current user owns or is authorized to access. It must not expose product purchase history from unrelated accounts.
- If quantity/unit/pack size differs, make the difference visible and do not present the prices as directly comparable unless the units can be normalized reliably.

### 7.10 Editing and Deleting Saved Trips

- The owner can edit trip details, people and items after saving. Removing a person moves items only they paid for to the owner and drops them from shared items. Renaming a person never changes any amount.
- Leaving an edited form with unsaved changes asks for confirmation (**Cancel** asks "Discard changes?", and closing or reloading the tab warns).
- Changes to an existing bill update that bill's own data and its associated price-history observation. They must not affect any other bill.
- The owner can delete a trip after a confirmation step. Deletion revokes participant access and removes that trip from price-history calculations. The implementation should use a consistent deletion strategy and avoid leaving orphaned participant access records.
- Participants cannot edit or delete trips in the MVP.
- If a saved bill is edited, show the updated values when it is next viewed. Do not silently rewrite historical observations in other bills.

## 8. Key User Flows

### Flow A: Create a private bill
1. User signs in.
2. User selects Create Trip.
3. User enters trip title, store, date, and category.
4. The owner is the only person on the bill.
5. User adds items, their prices/quantities; every item is paid by the owner ("Paid by you").
6. App calculates totals and displays the review.
7. User saves the trip.
8. Trip appears in the owner's dashboard and Bill History only.

### Flow B: Split a bill and optionally share it
1. User signs in and creates a trip.
2. User adds the other people by typing their names (no accounts needed).
3. User assigns each item to one person, several people, or everyone; the app previews each share live.
4. User reviews and saves. The bill page opens with the split summary, ready to screenshot and send.
5. Optionally, for a person who has an account, the owner invites that account by username or email to link it to the person. The invitation is pending.
6. The account holder accepts or declines from their Invitations page.
7. After acceptance, they can view the bill and its full breakdown, and it appears in their dashboard and Bill History as shared. Unrelated users, and pending, declined, cancelled or unlinked invitees, cannot access it.

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

1. **Landing** — what the app does, with Get started and Sign in.
2. **Sign Up / Sign In / Onboarding** — sign up with name, email, password and confirm password; sign in with email and password; then choose a username.
3. **Dashboard** — New bill action, monthly spending summary, recent accessible bills, and a Compare prices link.
4. **New / Edit Bill** — details, people, item-entry list with assignments and live totals, then Review before saving.
5. **Bill Details** — split summary, people with their link states and invite actions (owner), items, total, each person's share, and Print / Edit / Delete.
6. **Invitations** — Received (pending, with accept/decline) and Sent (statuses, with cancel).
7. **Bills (Bill History)** — searchable and filterable list of owned and shared bills.
8. **Prices (Price History)** — product search, price chart and dated price observations with change comparisons.
9. **Settings** — name and username (editable), email (read-only), and Sign out.

On phones the app uses a bottom tab bar (Home, Bills, Prices, Invites); on larger screens the same links sit in the header.

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

### Person on a Trip
- `id`
- `tripId` → Trip
- `role` (owner or person)
- `name` (typed by the owner; absent on the owner's row) and a normalized form, unique per trip
- `position` (owner 0, then in the order added; never changes; decides remainder paisa)
- `userId` → User, only for the owner and for linked people
- `linkedAt`, `createdAt`, `updatedAt`

### Invitation (link request)
- `id`
- `tripId` → Trip, `personId` → Person on a Trip
- `inviteeUserId` → User, `invitedByUserId` → User
- `invitedVia` (username or email); the identifier the owner typed is not stored
- `status` (pending, accepted, declined, cancelled, unlinked)
- `createdAt`, `respondedAt`, `updatedAt`
- One record per trip and invitee account, reused on re-invite. At most one pending invitation per person.

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
- `personId` → Person on a Trip (not an account)
- `allocatedAmount` (the exact monetary share for that item)
- Enforce that an assigned person belongs to the same trip.

The database may calculate shares on demand or store share rows, but all saved/displayed totals must be consistent. If shares are stored, update them atomically with item changes. Historical price observations should be traceable to a bill item record and must respect bill access permissions.

## 11. Privacy and Security Requirements

Privacy is a core product requirement, not an optional enhancement.

- Require authentication for every private application screen and data request.
- Enforce authorization on the server/database for every trip, item, share, invitation, and price-history query. Client-side hiding alone is insufficient.
- A trip is accessible to its owner and only those accounts linked to a person on it (an accepted invitation).
- Pending, declined, cancelled, unlinked or removed invitees must not access the trip. An inaccessible trip looks exactly like a missing one.
- Verify authorization on read, create, update, and delete operations, including requests using guessed IDs or modified URLs.
- Validate that all item assignments reference people on the same trip.
- Do not expose users' account names or email addresses to other users. Other viewers see the owner as "@username" and linked people as the owner's typed name plus their username ("Ben (@ben_doe)").
- Store passwords only as secure hashes managed by the authentication system. Never log, store in app tables, or return a password.
- Do not reveal another user's complete trip list, item catalogue, or item price history.
- Protect authentication secrets and database credentials; never expose server-only secrets in frontend code.
- Use safe input validation and appropriate error messages without returning sensitive backend details.
- If using a backend with row-level security or equivalent rules, test those policies explicitly.

## 12. Validation and Error Handling

- Required fields must be validated before a trip can be saved.
- Quantity must be greater than zero.
- Unit price must be a valid non-negative monetary amount (at most Rs. 10,000,000.00). Zero-price items are allowed.
- A bill item must have at least one assigned person on the bill.
- Two people on one bill cannot have the same name (ignoring case and spacing).
- Duplicate invitations to the same account for the same trip are rejected with a clear message ("already invited" / "already on this bill"), including concurrent attempts.
- Users must not be able to accept an invitation for another account.
- Invalid or unauthorized requests must fail safely and must not reveal private record existence unnecessarily.
- Network/server errors should preserve the user's unsaved form data where feasible and show a clear retry message.
- Confirm destructive actions such as deleting a saved trip or removing a participant.

## 13. Acceptance Criteria

The MVP is acceptable when all of the following work:

1. A user can register with name, email, password and confirm password, sign in with email and password, and create a private bill.
2. A private bill is visible to its owner and is not visible to an unrelated signed-in user.
3. A user can create a trip with multiple people by typing their names, and can link any of them to a registered account by username or email.
4. An invitation remains pending until the invited user accepts or declines it.
5. A linked participant can view the associated trip; a pending, declined, cancelled, unlinked or removed invitee cannot.
6. The owner can add, edit, and delete items and assign each item to one or more people on the bill.
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
- An owner, a linked participant, a pending invitee, a declined invitee, a cancelled invitee, an unlinked participant, a removed person, an unrelated user and a signed-out visitor trying to access a trip.
- Linking, unlinking and removing people without changing anyone's share.
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
- People on a bill by name, item assignment and equal split calculation.
- Accurate bill and per-person totals.
- Linking people to accounts (invitations, accept/decline, cancel, unlink) and shared read access.
- Saved Bill History.
- Basic Item Price History from accessible saved bills.
- Secure backend authorization and core tests.

All P0 items are done and deployed.

### P1 — Useful improvements after the core flow works
- ✅ Price-over-time chart.
- ✅ Advanced history filters and a monthly spending summary.
- ✅ Item suggestions while entering items, with "Use as new item" for a distinct product.
- ✅ Print a bill.
- Not planned: email notifications for invitations. They conflict with the "the app never sends email" non-goal (§4) and would need an email provider.

### Explicitly out of scope until separately approved
- Separate taxes and extra charges, custom/unequal item splits, payments/settlements, receipt OCR, public sharing, and shared editing by participants.

## 16. Product Decisions and Implementation Notes

- The interface says “bill” everywhere (New bill, Bills, Edit bill). “Trip” remains the internal name in code and in this document; a trip represents one bill only.
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

- **Server Components by default:** Use them for route layouts, static page structure, and content that does not need browser interaction (for example the landing page). The signed-in app pages are client-rendered views that read live data through Convex's reactive queries.
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
2. A user whose account is **linked** to a person on the trip (an accepted invitation) can read that specific trip.
3. Pending, declined, cancelled, unlinked and removed invitees cannot read the trip or its item/price-history data.
4. Only the owner can change or delete a trip, its items, assignments, people or links in the MVP.
5. Every path that reads a trip's items or a price-history record must enforce the same access rules, including requests using a guessed ID.

A mutation that changes a trip's items should validate participants and assignments, calculate line totals and allocations, and write the consistent result atomically. Prefer Convex mutations' transaction behavior over multiple independent writes that could leave a partial bill.

#### Identity and invitation lookup

Convex Auth is the source of truth for authentication. Its Password provider creates the `users` row at sign-up with the user's name and normalized (trimmed, lowercase) email, and keeps the password hash in its own tables. The normalized email is the account ID, so one email can have only one account. The `users` table stores only the minimal app profile and lookup fields: name, email, username and normalized username. The app's username is managed by the app and must be checked for uniqueness.

Validate sign-up input on the server as well as in the form: name 1–60 characters, valid email, password 8–128 characters. Confirm password is checked in the form only and never sent to the server. A failed sign-in returns one generic message that doesn't reveal whether the account exists. Keep Convex Auth's limit on failed sign-in attempts enabled.

For an invitation, normalize the supplied username or email, perform an exact indexed lookup, create an invitation tied to the resolved user and one person on one trip, and return only the invitee's username. Prevent duplicates and avoid exposing a complete user directory. Emails aren't verified, so the inviter always sees the matched username and can cancel an invitation sent to the wrong person.

### 18.4 Data Storage and Schema Design

Use Convex as the only application database in the MVP. Define the schema in `convex/schema.ts` with Convex validators. Use IDs and references between records rather than duplicating entire trip documents inside participant or item records.

Recommended tables:

| Table | Main fields | Purpose |
|---|---|---|
| `users` | `name`, `email` (normalized), `username`, `usernameNormalized`, plus the optional fields Convex Auth requires | App profile and exact invitation lookup. Created by Convex Auth at sign-up. Store only necessary account data. |
| `trips` | `ownerId`, `title`, `storeName`, `tripDate`, `category`, `currency`, `totalPaisa`, `itemCount`, `searchText`, `createdAt`, `updatedAt` | One independent bill per trip. `tripDate` is a date-only `YYYY-MM-DD` value that is never timezone-converted; the total is kept consistent with the items in the same mutation. |
| `tripPeople` | `tripId`, `role`, `name`, `nameNormalized`, `position`, `userId`, `linkedAt`, timestamps | Everyone the bill is split between. The owner's row always carries the owner's `userId`; other people get a `userId` only once linked. These rows are what grant access. |
| `tripInvitations` | `tripId`, `personId`, `inviteeUserId`, `invitedByUserId`, `invitedVia`, `status`, `createdAt`, `respondedAt`, `updatedAt` | Requests to link one person to one account: pending, accepted, declined, cancelled or unlinked. |
| `items` | `tripId`, `position`, `name`, `normalizedName`, `brand`, `variant`, `packSize`, `unit`, `productMatchKey`, `quantityMilli`, `unitPricePaisa`, `lineTotalPaisa`, timestamps | Original item records and their historical prices. An item row belongs to exactly one trip and must not be overwritten by a later purchase. |
| `itemAssignments` | `tripId`, `itemId`, `personId`, `allocatedAmountPaisa` | The people responsible for each item and their exact allocation. Each assigned person must be on that trip. |

#### Money representation

- Store money as **integer paisa** (100 paisa = Rs. 1.00), for example `Rs. 125.50` as `12550`, rather than using binary floating-point values for money.
- Parse and validate user-entered price values at the application boundary. Calculate a line total from the entered unit price and quantity, rounding to the nearest paisa using one documented rule before allocation.
- When a line total does not divide evenly among the assigned people, the remaining paisa go one each to the assigned people with the lowest bill `position` (the owner first), so the allocations add up to the exact line total and the form preview matches the server.
- Store or calculate the allocation rows as part of the same mutation that updates the bill. Never trust client-supplied allocation totals without recomputing them on the server.
- Display values with two decimal places and the `Rs.` prefix. Keep PKR as the only currency in the MVP.

#### Indexes and consistency

Define indexes in `convex/schema.ts` for the app's actual access patterns. At minimum, plan for:

- `users`: by email (index named `email`, required by Convex Auth) and by normalized username.
- `trips`: by owner and trip date.
- `tripPeople`: by trip + position, by trip + user, and by user (every trip a user can see).
- `tripInvitations`: by trip + invitee, by person + status, by trip, by invitee + status, and by inviter + status.
- `items`: by trip + position, and by trip + `productMatchKey` for comparable price-history lookups.
- `itemAssignments`: by item and by trip + person.

Convex indexes do not automatically provide unique constraints. Enforce unique usernames, unique person names per trip, one linked person per trip and account, and duplicate-invitation behavior in mutations. Check existing records before inserting and handle concurrent duplicate attempts safely.

Do not introduce a separate mutable `currentPrice` field or a separate price-history table for the MVP. Price history is derived from immutable-in-other-trips item records. If a user edits an old bill, only that bill's item record changes; no other bill is changed.

### 18.5 Data Retrieval Strategy

Use Convex's generated typed API and reactive query hooks (`useQuery`) for data that should refresh when the database changes, and mutations (`useMutation`) for writes. Use `undefined`/loading states deliberately and provide useful loading, empty, and error states.

- **Dashboard:** Query a bounded, newest-first list of the trips the user can see, through the `tripPeople` user index (owned and linked). Include a clearly defined limit for recent trips (5).
- **Trip detail:** Load the trip only after checking that the current user is its owner or a linked participant. Then load people, items and assignment rows through trip indexes. Return only fields needed by that screen.
- **Bill history:** Retrieve owned/shared trips from the indexed `tripPeople` relationships, capped. Return results in pages ("Load more") instead of an unlimited history. Apply search, date, category and owned/shared filters in the backend over the authorized set only; never perform a global search and display unfiltered records.
- **Invitation inbox:** Use the `tripInvitations` invitee + status index for the signed-in user's received invitations, and the inviter + status index for the owner's sent-invitation view.
- **Friend resolution:** Perform exact, indexed lookups by normalized username or normalized email. Do not return a list of users or disclose the target's contact details.
- **Price history:** Build a deterministic `productMatchKey` from normalized name and the relevant brand/variant/pack-size/unit fields. Retrieve matching item candidates using the index, then check trip authorization on the backend **before returning any observation**. Paginate results and never let inaccessible records influence returned counts, price comparisons, or charts. If later data volume makes this query expensive, add a user-scoped/materialized price-history index only after measuring a real performance issue; do not add that denormalization to the MVP.
- **Search and filtering:** Prefer schema indexes for common filters and exact lookups. Do not query every table with `.collect()` for a dashboard or complete history. Keep result sizes bounded and add pagination for growing histories.
- **Reactive updates:** Convex subscriptions can keep an open trip or invitation inbox current without manual polling or a separate WebSocket service.

A shared bill contributes a price-history observation only for its owner and linked participants. The app must never expose unrelated users' purchase records, even though matching item names may exist elsewhere in the database.

### 18.6 Folder Structure

The project uses a feature-oriented structure. Business rules (money, validation, normalization, price changes) live in `src/domain/` as pure TypeScript shared by the UI and Convex, rather than in `convex/lib/`, so the form preview and the server run the same code.

```text
project-root/
├── design/
│   ├── tokens.css                     # every colour, size, radius, shadow, font and motion value
│   └── fonts.ts
├── src/
│   ├── app/
│   │   ├── (public)/page.tsx          # landing
│   │   ├── (auth)/sign-in, sign-up
│   │   ├── (onboarding)/onboarding    # choose a username
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── trips/                 # Bill History
│   │   │   ├── trips/new/
│   │   │   ├── trips/[tripId]/
│   │   │   ├── trips/[tripId]/edit/
│   │   │   ├── invitations/
│   │   │   ├── price-history/
│   │   │   └── settings/
│   │   ├── layout.tsx, error.tsx, not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/                    # app shell, nav, account gate, page header
│   │   ├── trips/                     # trip form, item editor, people editor, shares, split summary
│   │   ├── bills/, dashboard/, invitations/, price-history/, account/, auth/, forms/
│   │   └── ui/                        # shadcn/ui-style components on Radix
│   ├── domain/                        # money, validation, normalization, formatting, price changes, chart
│   ├── lib/
│   │   ├── db/                        # the only frontend code that talks to Convex
│   │   ├── auth/                      # the only frontend code that talks to Convex Auth
│   │   └── utils.ts
│   └── proxy.ts                       # Convex Auth session handling and route redirects
├── convex/
│   ├── schema.ts
│   ├── auth.ts                        # Convex Auth: Password provider
│   ├── auth.config.ts
│   ├── http.ts                        # Convex Auth HTTP routes
│   ├── users.ts, trips.ts, invitations.ts, items.ts, priceHistory.ts
│   ├── lib/
│   │   ├── auth.ts                    # current-user resolution and access checks
│   │   ├── access.ts                  # bounded-read caps and accessible-trip listing
│   │   ├── tripWrite.ts, readModels.ts, errors.ts
│   └── _generated/                    # generated by Convex; do not hand-edit
├── patches/                           # patch-package fix for Convex Auth error forwarding
├── tests/
│   ├── unit/                          # domain tests
│   └── convex/                        # backend tests, including the permission matrix
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

Next.js 16 uses `src/proxy.ts` (formerly `middleware.ts`) for the Convex Auth route proxy. Remember that route middleware is a navigation/session convenience, **not** the security boundary; Convex queries and mutations must independently enforce authorization.

`src/app/api/` should not be created unless a real Next.js HTTP endpoint is required. Generated `convex/_generated/` files must be managed by the Convex CLI, not edited manually.

### 18.7 Environment Variables

Keep local secrets in `.env.local` and commit only placeholders in `.env.example`. Never commit real keys. Only variables prefixed with `NEXT_PUBLIC_` should be considered safe for the browser, because Next.js exposes those values in the client bundle.

#### Next.js / local `.env.local`

```dotenv
# Public application configuration (written by `npx convex dev`)
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<your-deployment>.convex.site
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

import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const categoryValidator = v.union(
  v.literal("grocery"),
  v.literal("restaurant"),
  v.literal("shopping"),
  v.literal("other"),
);

export default defineSchema({
  // Convex Auth's own tables (authAccounts holds the password hash, plus sessions,
  // refresh tokens and rate limits). App code never reads or writes them directly.
  ...authTables,

  // Replaces Convex Auth's default `users` table. Convex Auth creates the row at sign-up
  // from the Password provider's profile(). Row creation time is `_creationTime`.
  users: defineTable({
    name: v.optional(v.string()), // from sign-up, 1–60 chars; always set in practice
    email: v.optional(v.string()), // trimmed + lowercase (normalized in profile()); always set in practice
    emailVerificationTime: v.optional(v.number()), // Convex Auth field; unused (no verification)
    image: v.optional(v.string()), // Convex Auth field; unused
    isAnonymous: v.optional(v.boolean()), // Convex Auth field; unused
    username: v.optional(v.string()), // as typed by the user (onboarding)
    usernameNormalized: v.optional(v.string()), // lowercase, used for uniqueness/lookup
  })
    .index("email", ["email"]) // name required by Convex Auth; also used for invite-by-email
    .index("by_usernameNormalized", ["usernameNormalized"]),

  trips: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    storeName: v.optional(v.string()),
    tripDate: v.string(), // "YYYY-MM-DD", date-only, never timezone-converted
    category: categoryValidator,
    currency: v.literal("PKR"),
    totalPaisa: v.number(), // kept consistent with items in the same mutation
    itemCount: v.number(),
    searchText: v.string(), // normalized "title store item1 item2 …" for history search
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_date", ["ownerId", "tripDate"]),

  // Everyone the bill is split between. A person needs no account; `userId` is set only for
  // the owner and for people whose invitation was accepted.
  tripPeople: defineTable({
    tripId: v.id("trips"),
    role: v.union(v.literal("owner"), v.literal("person")),
    name: v.optional(v.string()), // typed by the owner, 1–40 chars; absent on the owner row
    nameNormalized: v.optional(v.string()), // normalizeText(name); unique per trip (checked in mutations)
    position: v.number(), // bill order: owner 0, then 1, 2, … in the order added; never changes
    userId: v.optional(v.id("users")), // linked account; always the owner on the owner row
    linkedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trip", ["tripId", "position"])
    .index("by_trip_user", ["tripId", "userId"]) // the caller's own person on a trip
    .index("by_user", ["userId"]), // every trip a user can see (owner or linked)

  items: defineTable({
    tripId: v.id("trips"),
    position: v.number(), // display order 0..n-1
    name: v.string(),
    normalizedName: v.string(),
    brand: v.optional(v.string()),
    variant: v.optional(v.string()),
    packSize: v.optional(v.string()),
    unit: v.optional(v.string()),
    productMatchKey: v.string(),
    quantityMilli: v.number(), // thousandths: 1.5 kg is 1500
    unitPricePaisa: v.number(),
    lineTotalPaisa: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trip", ["tripId", "position"])
    .index("by_trip_productMatchKey", ["tripId", "productMatchKey"]),

  itemAssignments: defineTable({
    tripId: v.id("trips"),
    itemId: v.id("items"),
    personId: v.id("tripPeople"), // a person on the bill, not an account
    allocatedAmountPaisa: v.number(),
  })
    .index("by_item", ["itemId"])
    .index("by_trip_person", ["tripId", "personId"]), // prefix [tripId] = all assignments of a trip
});

import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
});

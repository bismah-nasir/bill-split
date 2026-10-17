import { v } from "convex/values";

import { validateName } from "../src/domain/auth-validation";
import { isValidUsername, normalizeUsername, USERNAME_RULES } from "../src/domain/normalization";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getCurrentUser, requireCurrentUser } from "./lib/auth";
import { appError } from "./lib/errors";

/** The caller's own account, or `null` when signed out. Never anyone else's data. */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    return {
      id: user._id,
      name: user.name ?? "",
      email: user.email ?? "",
      username: user.username ?? null,
    };
  },
});

/** Whether a username is well-formed and free (the caller's own counts as free). Reveals nothing else. */
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (!isValidUsername(args.username)) return { valid: false, available: false };
    const available = await isUsernameFree(ctx, normalizeUsername(args.username), user._id);
    return { valid: true, available };
  },
});

export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    if (!isValidUsername(args.username)) {
      throw appError("USERNAME_INVALID", `Usernames are ${USERNAME_RULES}.`);
    }
    const usernameNormalized = normalizeUsername(args.username);
    // Mutations are serializable, so this check-then-patch can't race another claim.
    if (!(await isUsernameFree(ctx, usernameNormalized, user._id))) {
      throw appError("USERNAME_TAKEN", "That username is taken");
    }
    const username = args.username.normalize("NFKC").trim();
    await ctx.db.patch(user._id, { username, usernameNormalized });
    return { username };
  },
});

/** Changes the caller's own display name (trimmed, 1–60 characters). */
export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const name = validateName(args.name);
    if (!name.ok) throw appError("VALIDATION", name.error, { name: name.error });
    await ctx.db.patch(user._id, { name: name.value });
    return { name: name.value };
  },
});

async function isUsernameFree(ctx: QueryCtx, usernameNormalized: string, ownUserId: Id<"users">) {
  const holder = await ctx.db
    .query("users")
    .withIndex("by_usernameNormalized", (q) => q.eq("usernameNormalized", usernameNormalized))
    .first();
  return holder === null || holder._id === ownUserId;
}

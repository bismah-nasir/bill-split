import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError } from "./errors";

type Ctx = QueryCtx | MutationCtx;

export type OnboardedUser = Doc<"users"> & { username: string; usernameNormalized: string };

/** The caller's user row, from the verified Convex Auth identity, or `null`. */
export async function getCurrentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

export async function requireCurrentUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) throw appError("UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

/** Like `requireCurrentUser`, but also requires a chosen username. */
export async function requireOnboardedUser(ctx: Ctx): Promise<OnboardedUser> {
  const user = await requireCurrentUser(ctx);
  if (user.username === undefined || user.usernameNormalized === undefined) {
    throw appError("ONBOARDING_REQUIRED", "Choose a username to continue.");
  }
  return { ...user, username: user.username, usernameNormalized: user.usernameNormalized };
}

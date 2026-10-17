/// <reference types="vite/client" />
import { convexTest } from "convex-test";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";

// Every Convex module, minus multi-dot files such as `api.d.ts` and `auth.config.ts`
// (the `!(*.*.*)` extglob from the convex-test docs matches nothing under Vite 8).
export const modules = import.meta.glob(["../../convex/**/*.*s", "!../../convex/**/*.*.*s"]);

export function setupTest() {
  return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof setupTest>;

type CreateUserOptions = { name?: string; email?: string; skipUsername?: boolean };

/**
 * Inserts a user row (as Convex Auth would at sign-up) and returns an accessor that calls
 * functions as that user. Convex Auth's `getAuthUserId` reads the ID before the "|".
 */
export async function createUser(t: TestConvex, username: string, options: CreateUserOptions = {}) {
  const id: Id<"users"> = await t.run((ctx) =>
    ctx.db.insert("users", {
      name: options.name ?? username,
      email: options.email ?? `${username.toLowerCase()}@example.com`,
    }),
  );
  const as = t.withIdentity({ subject: `${id}|test-session` });
  if (!options.skipUsername) await as.mutation(api.users.setUsername, { username });
  return { id, as };
}

/** Runs `fn` and returns the `ConvexError` payload it throws. Fails if it doesn't throw. */
export async function errorDataOf(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof Error && "data" in error) return error.data;
    throw error;
  }
  throw new Error("Expected the call to throw a ConvexError");
}

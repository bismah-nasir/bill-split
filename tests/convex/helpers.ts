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

type UserAccessor = Awaited<ReturnType<typeof createUser>>["as"];

export type TripOverrides = {
  details?: Partial<{ title: string; storeName: string; tripDate: string; category: "grocery" | "restaurant" | "shopping" | "other" }>;
  people?: { key: string; personId?: string; name: string }[];
  items?: Partial<{
    itemId: string;
    name: string;
    brand: string;
    variant: string;
    packSize: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    assigneeKeys: string[];
  }>[];
};

/** Valid input for `trips.create`: no named people, every item paid by the owner. */
export function tripInput(overrides: TripOverrides = {}) {
  const items = overrides.items ?? [{}];
  return {
    details: {
      title: "Imtiaz Grocery",
      storeName: "Imtiaz",
      tripDate: "2026-10-16",
      category: "grocery" as const,
      ...overrides.details,
    },
    people: overrides.people ?? [],
    items: items.map((item) => ({
      name: "Cooking Oil",
      brand: "",
      variant: "",
      packSize: "",
      unit: "",
      quantity: "1",
      unitPrice: "500",
      assigneeKeys: ["owner"],
      ...item,
    })),
  };
}

/** Creates a trip as the given user and returns its ID. */
export async function createTrip(as: UserAccessor, overrides: TripOverrides = {}) {
  const { tripId } = await as.mutation(api.trips.create, tripInput(overrides));
  return tripId;
}

/** Saves `tripInput(overrides)` over an existing trip as the given user. */
export async function updateTrip(as: UserAccessor, tripId: string, overrides: TripOverrides = {}) {
  return await as.mutation(api.trips.update, { tripId, ...tripInput(overrides) });
}

/**
 * Makes `name` the only person on `tripId` besides the owner (items kept, paid by the owner)
 * and invites `username` as that person. Returns the invitation and person IDs.
 */
export async function addAndInvite(owner: { as: UserAccessor }, tripId: string, name: string, username: string) {
  const trip = await owner.as.query(api.trips.get, { tripId });
  if (!trip) throw new Error("No trip");
  await updateTrip(owner.as, tripId, {
    details: { title: trip.title, storeName: trip.storeName ?? "", tripDate: trip.tripDate },
    people: [{ key: "new:1", name }],
    items: trip.items.map((item) => ({
      itemId: item.id,
      name: item.name,
      brand: item.brand ?? "",
      packSize: item.packSize ?? "",
      unitPrice: String(item.unitPricePaisa / 100),
    })),
  });
  const updated = await owner.as.query(api.trips.get, { tripId });
  const personId = updated?.people.find((person) => person.name === name)?.personId;
  if (!personId) throw new Error(`No ${name} on the bill`);
  const { invitationId } = await owner.as.mutation(api.invitations.invite, {
    tripId,
    personId,
    via: "username",
    identifier: username,
  });
  return { invitationId, personId };
}

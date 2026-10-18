import { computeBill, lineTotalPaisa, type ComputedBill } from "../../src/domain/money";
import {
  buildProductMatchKey,
  buildTripSearchText,
  normalizeText,
} from "../../src/domain/normalization";
import {
  MAX_ITEMS_PER_TRIP,
  MAX_PEOPLE_PER_TRIP,
  OWNER_KEY,
  validateTripInput,
  type ItemInput,
  type PersonInput,
  type TripDetailsInput,
  type ValidatedItem,
  type ValidatedTrip,
} from "../../src/domain/trip-validation";
import { todayIsoDate } from "../../src/domain/format";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_ASSIGNMENTS_PER_TRIP } from "./access";
import { appError } from "./errors";

export type TripInput = { details: TripDetailsInput; people: PersonInput[]; items: ItemInput[] };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Saved person or item IDs that aren't (or are no longer) on the bill being edited. */
export const BILL_CHANGED_MESSAGE =
  "This bill has changed since you opened it. Reload the page and try again.";

/**
 * Runs the domain validation and throws `VALIDATION` with field errors on failure. The
 * future-date limit counts from tomorrow (UTC), so a browser ahead of UTC is never refused.
 */
export function validateOrThrow(input: TripInput): ValidatedTrip {
  const today = todayIsoDate(new Date(Date.now() + DAY_MS));
  const result = validateTripInput(input.details, input.people, input.items, { today });
  if (!result.ok) {
    throw appError("VALIDATION", "Some fields need attention.", result.fieldErrors);
  }
  return result.value;
}

/** Item fields derived from validated input: normalized name, product key, line total. */
export function buildItemDoc(item: ValidatedItem, position: number) {
  return {
    position,
    name: item.name,
    normalizedName: normalizeText(item.name),
    ...definedOnly({
      brand: item.brand,
      variant: item.variant,
      packSize: item.packSize,
      unit: item.unit,
    }),
    productMatchKey: buildProductMatchKey(item),
    quantityMilli: item.quantityMilli,
    unitPricePaisa: item.unitPricePaisa,
    lineTotalPaisa: lineTotalPaisa(item.quantityMilli, item.unitPricePaisa),
  };
}

/**
 * Inserts a new trip with its owner row (position 0), the named people (1, 2, …), items and
 * assignments, all computed from `computeBill` in bill order.
 */
export async function writeNewTrip(
  ctx: MutationCtx,
  owner: Doc<"users">,
  validated: ValidatedTrip,
): Promise<Id<"trips">> {
  const now = Date.now();
  const peopleOrder = [OWNER_KEY, ...validated.people.map((person) => person.key)];
  const bill = computeBill(validated.items, peopleOrder);

  const tripId = await ctx.db.insert("trips", {
    ownerId: owner._id,
    ...tripFields(validated, bill.totalPaisa),
    currency: "PKR",
    createdAt: now,
    updatedAt: now,
  });

  const personIds = new Map<string, Id<"tripPeople">>();
  personIds.set(
    OWNER_KEY,
    await ctx.db.insert("tripPeople", {
      tripId,
      role: "owner",
      position: 0,
      userId: owner._id,
      linkedAt: now,
      createdAt: now,
      updatedAt: now,
    }),
  );
  for (const [index, person] of validated.people.entries()) {
    personIds.set(
      person.key,
      await ctx.db.insert("tripPeople", {
        tripId,
        role: "person",
        name: person.name,
        nameNormalized: person.nameNormalized,
        position: index + 1,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  const itemIds: Id<"items">[] = [];
  for (const [index, item] of validated.items.entries()) {
    itemIds.push(
      await ctx.db.insert("items", {
        tripId,
        ...buildItemDoc(item, index),
        createdAt: now,
        updatedAt: now,
      }),
    );
  }
  await insertAssignments(ctx, tripId, itemIds, bill, personIds);

  return tripId;
}

/**
 * Rewrites a saved trip from validated input. Saved people and items are referenced by ID and
 * must belong to this trip (otherwise `VALIDATION`, before anything is written):
 * - People keep their `position` and get their name patched; new people get the next
 *   positions in the order listed; people left out are deleted. The bill order is by position.
 * - Items are replaced in place, inserted or deleted, and renumbered in the order listed.
 * - Every assignment of the trip is deleted and rebuilt from `computeBill`.
 * Only this trip's rows are read or written, so other bills (even with the same products)
 * never change.
 */
export async function writeTripUpdate(
  ctx: MutationCtx,
  trip: Doc<"trips">,
  validated: ValidatedTrip,
): Promise<void> {
  const now = Date.now();
  const savedPeople = await ctx.db
    .query("tripPeople")
    .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
    .take(MAX_PEOPLE_PER_TRIP);
  const savedItems = await ctx.db
    .query("items")
    .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
    .take(MAX_ITEMS_PER_TRIP);
  const ownerRow = savedPeople.find((person) => person.role === "owner");
  if (ownerRow === undefined) throw new Error("Trip is missing its owner row");

  // Resolve every saved ID before writing anything.
  const keptPeople = resolveSaved(
    validated.people.map((person) => person.personId),
    (id) => ctx.db.normalizeId("tripPeople", id),
    savedPeople.filter((person) => person.role === "person" && person.tripId === trip._id),
  );
  const keptItems = resolveSaved(
    validated.items.map((item) => item.itemId),
    (id) => ctx.db.normalizeId("items", id),
    savedItems.filter((item) => item.tripId === trip._id),
  );

  // Saved people keep their position; new ones follow the highest so far, in the order listed.
  let nextPosition = Math.max(...savedPeople.map((person) => person.position)) + 1;
  const people = validated.people
    .map((person, index) => {
      const saved = keptPeople[index];
      return { ...person, saved, position: saved?.position ?? nextPosition++ };
    })
    .sort((a, b) => a.position - b.position);
  const bill = computeBill(validated.items, [OWNER_KEY, ...people.map((person) => person.key)]);

  // Assignments are rebuilt from scratch, so they go first.
  const assignments = await ctx.db
    .query("itemAssignments")
    .withIndex("by_trip_person", (q) => q.eq("tripId", trip._id))
    .take(MAX_ASSIGNMENTS_PER_TRIP);
  for (const assignment of assignments) await ctx.db.delete(assignment._id);

  const keptPersonIds = new Set(people.flatMap((person) => (person.saved ? [person.saved._id] : [])));
  for (const person of savedPeople) {
    // Phase 6: also delete the person's invitations, which ends a linked account's access.
    if (person.role === "person" && !keptPersonIds.has(person._id)) await ctx.db.delete(person._id);
  }
  const personIds = new Map<string, Id<"tripPeople">>([[OWNER_KEY, ownerRow._id]]);
  for (const person of people) {
    if (person.saved) {
      if (person.saved.name !== person.name) {
        await ctx.db.patch(person.saved._id, {
          name: person.name,
          nameNormalized: person.nameNormalized,
          updatedAt: now,
        });
      }
      personIds.set(person.key, person.saved._id);
    } else {
      personIds.set(
        person.key,
        await ctx.db.insert("tripPeople", {
          tripId: trip._id,
          role: "person",
          name: person.name,
          nameNormalized: person.nameNormalized,
          position: person.position,
          createdAt: now,
          updatedAt: now,
        }),
      );
    }
  }

  const keptItemIds = new Set(keptItems.flatMap((item) => (item ? [item._id] : [])));
  for (const item of savedItems) {
    if (!keptItemIds.has(item._id)) await ctx.db.delete(item._id);
  }
  const itemIds: Id<"items">[] = [];
  for (const [index, item] of validated.items.entries()) {
    const saved = keptItems[index];
    if (saved) {
      // `replace`, not `patch`, so optional fields cleared in the form are removed.
      await ctx.db.replace(saved._id, {
        tripId: trip._id,
        ...buildItemDoc(item, index),
        createdAt: saved.createdAt,
        updatedAt: now,
      });
      itemIds.push(saved._id);
    } else {
      itemIds.push(
        await ctx.db.insert("items", {
          tripId: trip._id,
          ...buildItemDoc(item, index),
          createdAt: now,
          updatedAt: now,
        }),
      );
    }
  }
  await insertAssignments(ctx, trip._id, itemIds, bill, personIds);

  const fields = tripFields(validated, bill.totalPaisa);
  // An explicit `undefined` removes a store name that was cleared.
  await ctx.db.patch(trip._id, { ...fields, storeName: fields.storeName, updatedAt: now });
}

/**
 * Deletes a trip and everything that belongs to it, leaving no orphans: assignments, items,
 * people, then the trip itself (Phase 6 adds invitations before people).
 */
export async function deleteTrip(ctx: MutationCtx, tripId: Id<"trips">): Promise<void> {
  const assignments = await ctx.db
    .query("itemAssignments")
    .withIndex("by_trip_person", (q) => q.eq("tripId", tripId))
    .take(MAX_ASSIGNMENTS_PER_TRIP);
  for (const assignment of assignments) await ctx.db.delete(assignment._id);
  const items = await ctx.db
    .query("items")
    .withIndex("by_trip", (q) => q.eq("tripId", tripId))
    .take(MAX_ITEMS_PER_TRIP);
  for (const item of items) await ctx.db.delete(item._id);
  const people = await ctx.db
    .query("tripPeople")
    .withIndex("by_trip", (q) => q.eq("tripId", tripId))
    .take(MAX_PEOPLE_PER_TRIP);
  for (const person of people) await ctx.db.delete(person._id);
  await ctx.db.delete(tripId);
}

/** The trip fields that follow from its details and items. */
function tripFields(validated: ValidatedTrip, totalPaisa: number) {
  const { details } = validated;
  return {
    title: details.title,
    ...definedOnly({ storeName: details.storeName }),
    tripDate: details.tripDate,
    category: details.category,
    totalPaisa,
    itemCount: validated.items.length,
    searchText: buildTripSearchText(
      details.title,
      details.storeName,
      validated.items.map((item) => item.name),
    ),
  };
}

/** One assignment per allocation of each item, with person keys mapped to saved person IDs. */
async function insertAssignments(
  ctx: MutationCtx,
  tripId: Id<"trips">,
  itemIds: Id<"items">[],
  bill: ComputedBill,
  personIds: Map<string, Id<"tripPeople">>,
): Promise<void> {
  for (const [index, itemId] of itemIds.entries()) {
    for (const allocation of bill.items[index].allocations) {
      const personId = personIds.get(allocation.personKey);
      // Validation guarantees every assignee is on the bill.
      if (personId === undefined) throw new Error("Assignee is not on the bill");
      await ctx.db.insert("itemAssignments", {
        tripId,
        itemId,
        personId,
        allocatedAmountPaisa: allocation.amountPaisa,
      });
    }
  }
}

/**
 * The saved row behind each optional ID string (`undefined` for new entries). An ID that is
 * malformed, from another table or trip, or listed twice means the form is out of date (or
 * was tampered with), so the whole save is refused.
 */
function resolveSaved<Row extends { _id: string }>(
  ids: (string | undefined)[],
  normalize: (id: string) => Row["_id"] | null,
  rows: Row[],
): (Row | undefined)[] {
  const byId = new Map<string, Row>(rows.map((row) => [row._id, row]));
  const seen = new Set<string>();
  return ids.map((id) => {
    if (id === undefined) return undefined;
    const normalized = normalize(id);
    const row = normalized === null ? undefined : byId.get(normalized);
    if (row === undefined || seen.has(row._id)) throw appError("VALIDATION", BILL_CHANGED_MESSAGE);
    seen.add(row._id);
    return row;
  });
}

/** Drops `undefined` values: optional fields are left out of the document, not stored empty. */
function definedOnly<T extends Record<string, string | undefined>>(fields: T): Partial<Record<keyof T, string>> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<Record<keyof T, string>>;
}

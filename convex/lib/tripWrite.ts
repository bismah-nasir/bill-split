import { computeBill, lineTotalPaisa } from "../../src/domain/money";
import {
  buildProductMatchKey,
  buildTripSearchText,
  normalizeText,
} from "../../src/domain/normalization";
import {
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
import { appError } from "./errors";

export type TripInput = { details: TripDetailsInput; people: PersonInput[]; items: ItemInput[] };

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const { details } = validated;

  const tripId = await ctx.db.insert("trips", {
    ownerId: owner._id,
    title: details.title,
    ...definedOnly({ storeName: details.storeName }),
    tripDate: details.tripDate,
    category: details.category,
    currency: "PKR",
    totalPaisa: bill.totalPaisa,
    itemCount: validated.items.length,
    searchText: buildTripSearchText(
      details.title,
      details.storeName,
      validated.items.map((item) => item.name),
    ),
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

  for (const [index, item] of validated.items.entries()) {
    const itemId = await ctx.db.insert("items", {
      tripId,
      ...buildItemDoc(item, index),
      createdAt: now,
      updatedAt: now,
    });
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

  return tripId;
}

/** Drops `undefined` values: optional fields are left out of the document, not stored empty. */
function definedOnly<T extends Record<string, string | undefined>>(fields: T): Partial<Record<keyof T, string>> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<Record<keyof T, string>>;
}

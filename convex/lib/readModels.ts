/**
 * Response objects for trip screens. They carry only what the screens show: people appear by
 * the name the owner typed plus a username, never an account's name or email.
 */
import { personLabel } from "../../src/domain/people";
import type { BillPerson, TripCard, TripDetail, TripDetailShare } from "../../src/domain/types";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_ASSIGNMENTS_PER_TRIP, MAX_ITEMS_PER_TRIP, MAX_PEOPLE_PER_TRIP } from "./access";

export async function toTripCard(
  ctx: QueryCtx,
  trip: Doc<"trips">,
  viewerId: Id<"users">,
): Promise<TripCard> {
  const people = await loadBillPeople(ctx, trip, viewerId);
  const viewerPersonId = people.find((person) => person.isViewer)?.personId ?? null;
  return {
    id: trip._id,
    title: trip.title,
    storeName: trip.storeName ?? null,
    tripDate: trip.tripDate,
    category: trip.category,
    totalPaisa: trip.totalPaisa,
    itemCount: trip.itemCount,
    peopleLabels: people.map((person) => personLabel(person, viewerPersonId)),
    isOwner: trip.ownerId === viewerId,
  };
}

export async function toTripDetail(
  ctx: QueryCtx,
  trip: Doc<"trips">,
  viewerId: Id<"users">,
): Promise<TripDetail> {
  const people = await loadBillPeople(ctx, trip, viewerId);
  const items = await ctx.db
    .query("items")
    .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
    .take(MAX_ITEMS_PER_TRIP);
  const assignments = await ctx.db
    .query("itemAssignments")
    .withIndex("by_trip_person", (q) => q.eq("tripId", trip._id))
    .take(MAX_ASSIGNMENTS_PER_TRIP);

  const position = new Map(people.map((person, index) => [person.personId, index]));
  const byBillOrder = (a: Doc<"itemAssignments">, b: Doc<"itemAssignments">) =>
    (position.get(a.personId) ?? 0) - (position.get(b.personId) ?? 0);

  const assignmentsByItem = new Map<Id<"items">, Doc<"itemAssignments">[]>();
  for (const assignment of assignments) {
    const list = assignmentsByItem.get(assignment.itemId) ?? [];
    list.push(assignment);
    assignmentsByItem.set(assignment.itemId, list);
  }

  const shares = new Map<string, TripDetailShare>(
    people.map((person) => [person.personId, { personId: person.personId, totalPaisa: 0, items: [] }]),
  );
  const detailItems = items.map((item) => {
    const itemAssignments = (assignmentsByItem.get(item._id) ?? []).sort(byBillOrder);
    for (const assignment of itemAssignments) {
      const share = shares.get(assignment.personId);
      if (share === undefined) continue;
      share.totalPaisa += assignment.allocatedAmountPaisa;
      share.items.push({
        itemId: item._id,
        name: item.name,
        amountPaisa: assignment.allocatedAmountPaisa,
        splitCount: itemAssignments.length,
      });
    }
    return {
      id: item._id,
      name: item.name,
      brand: item.brand ?? null,
      variant: item.variant ?? null,
      packSize: item.packSize ?? null,
      unit: item.unit ?? null,
      quantityMilli: item.quantityMilli,
      unitPricePaisa: item.unitPricePaisa,
      lineTotalPaisa: item.lineTotalPaisa,
      assignees: itemAssignments.map((assignment) => ({
        personId: assignment.personId,
        amountPaisa: assignment.allocatedAmountPaisa,
      })),
    };
  });

  const shareList = [...shares.values()];
  const sharesTotal = shareList.reduce((sum, share) => sum + share.totalPaisa, 0);
  const itemsTotal = detailItems.reduce((sum, item) => sum + item.lineTotalPaisa, 0);
  const owner = people.find((person) => person.isOwner);
  const viewer = people.find((person) => person.isViewer);
  if (owner === undefined || viewer === undefined) {
    throw new Error("Trip is missing its owner or the viewer's person");
  }

  return {
    id: trip._id,
    title: trip.title,
    storeName: trip.storeName ?? null,
    tripDate: trip.tripDate,
    category: trip.category,
    currency: trip.currency,
    totalPaisa: trip.totalPaisa,
    viewerRole: trip.ownerId === viewerId ? "owner" : "participant",
    viewerPersonId: viewer.personId,
    owner: { username: owner.username ?? "" },
    people,
    items: detailItems,
    shares: shareList,
    reconciled: sharesTotal === trip.totalPaisa && itemsTotal === trip.totalPaisa,
  };
}

/** The trip's people in bill order, with only the username read from each linked account. */
async function loadBillPeople(
  ctx: QueryCtx,
  trip: Doc<"trips">,
  viewerId: Id<"users">,
): Promise<BillPerson[]> {
  const rows = await ctx.db
    .query("tripPeople")
    .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
    .take(MAX_PEOPLE_PER_TRIP);
  const isOwnerViewer = trip.ownerId === viewerId;
  return await Promise.all(
    rows.map(async (row): Promise<BillPerson> => {
      const account = row.userId === undefined ? null : await ctx.db.get(row.userId);
      const isOwner = row.role === "owner";
      return {
        personId: row._id,
        isOwner,
        isViewer: row.userId === viewerId,
        name: isOwner ? null : (row.name ?? ""),
        username: account?.username ?? null,
        link: isOwnerViewer && !isOwner ? await linkState(ctx, row) : null,
      };
    }),
  );
}

/** Invitations considered per person when working out their link state. */
const LINK_STATE_INVITATIONS = 50;

/**
 * A person's link state, for the owner: linked; otherwise their pending invitation; otherwise
 * "declined" when their most recent invitation was declined; otherwise none (never invited,
 * cancelled or unlinked).
 */
async function linkState(ctx: QueryCtx, person: Doc<"tripPeople">): Promise<NonNullable<BillPerson["link"]>> {
  if (person.userId !== undefined) return { state: "linked" };
  const invitations = await ctx.db
    .query("tripInvitations")
    .withIndex("by_person_status", (q) => q.eq("personId", person._id))
    .take(LINK_STATE_INVITATIONS);
  const latest =
    invitations.find((invitation) => invitation.status === "pending") ??
    invitations.reduce<Doc<"tripInvitations"> | undefined>(
      (newest, invitation) => (newest === undefined || invitation.updatedAt > newest.updatedAt ? invitation : newest),
      undefined,
    );
  if (latest === undefined || (latest.status !== "pending" && latest.status !== "declined")) {
    return { state: "none" };
  }
  const invitee = await ctx.db.get(latest.inviteeUserId);
  return {
    state: latest.status,
    invitationId: latest._id,
    username: invitee?.username ?? "",
    invitedAt: latest.createdAt,
    respondedAt: latest.respondedAt ?? null,
  };
}

import type { Category } from "./categories";

/** Outcome of parsing or validating one value. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The signed-in user's own account, as shown to that user only. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** `null` until onboarding is finished. */
  username: string | null;
};

/** A bill in a list (dashboard, Bill History). */
export type TripCard = {
  id: string;
  title: string;
  storeName: string | null;
  tripDate: string;
  category: Category;
  totalPaisa: number;
  itemCount: number;
  /** `personLabel()` for each person, in bill order; the viewer's own is "You". */
  peopleLabels: string[];
  isOwner: boolean;
};

/** Someone a bill is split between. Never carries an account's name or email. */
export type BillPerson = {
  personId: string;
  isOwner: boolean;
  isViewer: boolean;
  /** The name the owner typed; `null` for the owner row. */
  name: string | null;
  /** The owner's, or a linked person's; `null` when not linked. */
  username: string | null;
  /** Owner viewers only (`null` for everyone else, and for the owner row): the link state. */
  link:
    | null
    | { state: "none" }
    | { state: "linked" }
    | {
        state: "pending" | "declined";
        invitationId: string;
        username: string;
        invitedAt: number;
        respondedAt: number | null;
      };
};

export type TripDetailItem = {
  id: string;
  name: string;
  brand: string | null;
  variant: string | null;
  packSize: string | null;
  unit: string | null;
  quantityMilli: number;
  unitPricePaisa: number;
  lineTotalPaisa: number;
  /** In bill order. */
  assignees: { personId: string; amountPaisa: number }[];
};

export type TripDetailShare = {
  personId: string;
  totalPaisa: number;
  items: { itemId: string; name: string; amountPaisa: number; splitCount: number }[];
};

/** A saved bill, as seen by its owner or a participant. */
export type TripDetail = {
  id: string;
  title: string;
  storeName: string | null;
  tripDate: string;
  category: Category;
  currency: "PKR";
  totalPaisa: number;
  viewerRole: "owner" | "participant";
  viewerPersonId: string;
  owner: { username: string };
  /** Bill order (position). */
  people: BillPerson[];
  items: TripDetailItem[];
  /** Bill order, one per person, including people with Rs. 0. */
  shares: TripDetailShare[];
  reconciled: boolean;
};

/**
 * A pending invitation, as its invitee sees it on Invitations → Received. Only what they need
 * to decide: no items, totals or other people.
 */
export type InvitationReceived = {
  invitationId: string;
  tripTitle: string;
  storeName: string | null;
  tripDate: string;
  ownerUsername: string;
  /** The name the owner typed for the person they'd be linked to, e.g. "Ben". */
  personName: string;
  invitedAt: number;
};

/** An invitation the owner sent, on Invitations → Sent. */
export type InvitationSent = {
  invitationId: string;
  tripId: string;
  tripTitle: string;
  personName: string;
  /** The invitee's username. */
  username: string;
  status: "pending" | "accepted" | "declined";
  invitedAt: number;
  respondedAt: number | null;
};

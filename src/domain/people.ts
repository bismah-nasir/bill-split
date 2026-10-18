import { OWNER_KEY } from "./trip-validation";
import type { BillPerson } from "./types";

type LabelledPerson = Pick<BillPerson, "personId" | "isOwner" | "name" | "username">;

/**
 * How a person on a bill is shown: "You" for the viewer's own person, "@alice" for the
 * owner, "Ben" for an unlinked person and "Ben (@ben_doe)" for a linked one.
 */
export function personLabel(person: LabelledPerson, viewerPersonId: string | null): string {
  if (person.personId === viewerPersonId) return "You";
  if (person.isOwner) return `@${person.username ?? ""}`;
  const name = person.name ?? "";
  return person.username ? `${name} (@${person.username})` : name;
}

/**
 * How a person is shown on the split summary, which gets screenshotted and sent to others, so
 * it never says "You". The owner sees their own account name (`ownerName`, which only the
 * owner's own client has); everyone else sees the owner as "@alice". Other people show as in
 * `personLabel`: "Ben", or "Ben (@ben_doe)" once linked.
 */
export function summaryLabel(person: LabelledPerson, ownerName: string | null): string {
  if (person.isOwner && ownerName) return ownerName;
  return personLabel(person, null);
}

/**
 * Takes a person off every item. Items that only they paid for move to the owner, so every
 * item still has someone paying for it.
 */
export function removePersonFromItems<T extends { assigneeKeys: string[] }>(items: T[], key: string): T[] {
  return items.map((item) => {
    if (!item.assigneeKeys.includes(key)) return item;
    const rest = item.assigneeKeys.filter((assignee) => assignee !== key);
    return { ...item, assigneeKeys: rest.length > 0 ? rest : [OWNER_KEY] };
  });
}

/** "You, Ben, Sara +2": the first `max` labels, then how many more there are. */
export function summarizeLabels(labels: string[], max = 3): string {
  if (labels.length <= max) return labels.join(", ");
  return `${labels.slice(0, max).join(", ")} +${labels.length - max}`;
}

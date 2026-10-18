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

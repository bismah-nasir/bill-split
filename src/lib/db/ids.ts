import type { Id, TableNames } from "../../../convex/_generated/dataModel";

/**
 * App code passes IDs around as plain strings. These casts are the only bridge to
 * Convex's branded `Id` type; the backend still validates every ID it receives.
 */
export function toId<T extends TableNames>(id: string): Id<T> {
  return id as Id<T>;
}

export function fromId(id: Id<TableNames>): string {
  return id;
}

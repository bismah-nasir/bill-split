import { Badge } from "@/components/ui/badge";
import { categoryLabel, type Category } from "@/domain/categories";
import { formatTripDate } from "@/domain/format";

/** "Imtiaz · 16 Oct 2026", or just the date when there's no store. */
export function tripMetaLine(storeName: string | null | undefined, tripDate: string): string {
  return [storeName, formatTripDate(tripDate)].filter(Boolean).join(" · ");
}

export function CategoryBadge({ category }: { category: Category }) {
  return <Badge>{categoryLabel(category)}</Badge>;
}

export function OwnershipBadge({ isOwner }: { isOwner: boolean }) {
  return isOwner ? <Badge variant="primary">Owned</Badge> : <Badge>Shared with you</Badge>;
}

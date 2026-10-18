export const CATEGORIES = [
  { value: "grocery", label: "Grocery" },
  { value: "restaurant", label: "Restaurant" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const DEFAULT_CATEGORY: Category = "grocery";

export function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category.value === value);
}

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((category) => category.value === value)?.label ?? value;
}

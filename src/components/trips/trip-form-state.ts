/**
 * State for `TripForm`: field values as typed, inline errors and the edit → review step.
 * Pure (no React), so the rules for when errors appear live outside the UI.
 *
 * Item errors are stored by each row's stable `rowKey` (`items.r3.unitPrice`) rather than by
 * index, so removing a row can't move an error onto its neighbour. Validation results, which
 * use indexes (`items.2.unitPrice`), are translated with `byRowKey`.
 */
import { DEFAULT_CATEGORY } from "@/domain/categories";
import { milliToInput, paisaToInput, todayIsoDate } from "@/domain/format";
import {
  OWNER_KEY,
  validateTripInput,
  type ItemInput,
  type PersonInput,
  type TripDetailsInput,
  type TripValidationResult,
} from "@/domain/trip-validation";
import type { TripDetail } from "@/domain/types";

export type TripFormValue = { details: TripDetailsInput; people: PersonInput[]; items: ItemInput[] };

export type FormItem = ItemInput & { rowKey: string };

export type ItemField = "name" | "brand" | "variant" | "packSize" | "unit" | "quantity" | "unitPrice";

export type TripFormState = {
  step: "edit" | "review";
  details: TripDetailsInput;
  people: PersonInput[];
  items: FormItem[];
  /** Keyed by field path; item paths use row keys. */
  errors: Record<string, string>;
  /** A field to focus after the next render, e.g. the first error or a new row's name. */
  focus: { path: string; request: number } | null;
  /** A save failure that doesn't belong to a field. */
  saveError: string | null;
  nextRowId: number;
};

export type TripFormAction =
  | { type: "setDetail"; field: keyof TripDetailsInput; value: string }
  | { type: "setItem"; rowKey: string; field: ItemField; value: string }
  | { type: "blur"; path: string }
  | { type: "addItem" }
  | { type: "removeItem"; rowKey: string }
  | { type: "review" }
  | { type: "backToEdit" }
  | { type: "saveFailed"; message: string; fieldErrors: Record<string, string> };

export function emptyItem(): ItemInput {
  return {
    name: "",
    brand: "",
    variant: "",
    packSize: "",
    unit: "",
    quantity: "1",
    unitPrice: "",
    assigneeKeys: [OWNER_KEY],
  };
}

/** A new bill: dated today, in the default category, with one empty item. */
export function newTripValue(): TripFormValue {
  return {
    details: { title: "", storeName: "", tripDate: todayIsoDate(), category: DEFAULT_CATEGORY },
    people: [],
    items: [emptyItem()],
  };
}

export function initTripFormState(value: TripFormValue): TripFormState {
  return {
    step: "edit",
    details: value.details,
    people: value.people,
    items: value.items.map((item, index) => ({ ...item, rowKey: `r${index}` })),
    errors: {},
    focus: null,
    saveError: null,
    nextRowId: value.items.length,
  };
}

export function itemPath(rowKey: string, field: string): string {
  return `items.${rowKey}.${field}`;
}

/** The DOM id of the control for a field path, so errors can be focused. */
export function fieldId(path: string): string {
  return `trip-${path.replace(/\./g, "-")}`;
}

export function validateForm(state: Pick<TripFormState, "details" | "people" | "items">): TripValidationResult {
  return validateTripInput(state.details, state.people, state.items);
}

/** The form's value without UI-only row keys, as sent to the backend. */
export function toFormValue(state: TripFormState): TripFormValue {
  return {
    details: state.details,
    people: state.people,
    items: state.items.map(({ rowKey, ...item }) => {
      void rowKey;
      return item;
    }),
  };
}

export function tripFormReducer(state: TripFormState, action: TripFormAction): TripFormState {
  switch (action.type) {
    case "setDetail": {
      const next = { ...state, details: { ...state.details, [action.field]: action.value } };
      return recheckIfShown(next, action.field);
    }
    case "setItem": {
      const items = state.items.map((item) =>
        item.rowKey === action.rowKey ? { ...item, [action.field]: action.value } : item,
      );
      return recheckIfShown({ ...state, items }, itemPath(action.rowKey, action.field));
    }
    case "blur":
      return withError(state, action.path, currentErrors(state)[action.path]);
    case "addItem": {
      const rowKey = `r${state.nextRowId}`;
      return {
        ...state,
        items: [...state.items, { ...emptyItem(), rowKey }],
        nextRowId: state.nextRowId + 1,
        focus: focusOn(state, itemPath(rowKey, "name")),
      };
    }
    case "removeItem": {
      // The last row stays; a bill needs at least one item.
      if (state.items.length <= 1) return state;
      const prefix = `items.${action.rowKey}.`;
      const errors = Object.fromEntries(
        Object.entries(state.errors).filter(([path]) => !path.startsWith(prefix)),
      );
      return { ...state, items: state.items.filter((item) => item.rowKey !== action.rowKey), errors };
    }
    case "review": {
      const errors = currentErrors(state);
      const first = Object.keys(errors)[0];
      if (first === undefined) return { ...state, step: "review", errors: {}, saveError: null };
      return { ...state, errors, focus: focusOn(state, first) };
    }
    case "backToEdit":
      return { ...state, step: "edit", saveError: null };
    case "saveFailed": {
      const errors = byRowKey(action.fieldErrors, state.items);
      const first = Object.keys(errors)[0];
      // Field errors go back onto the form; anything else stays on the review screen.
      if (first === undefined) return { ...state, saveError: action.message };
      return { ...state, step: "edit", errors, saveError: null, focus: focusOn(state, first) };
    }
  }
}

function currentErrors(state: TripFormState): Record<string, string> {
  const result = validateForm(state);
  return result.ok ? {} : byRowKey(result.fieldErrors, state.items);
}

/** `items.2.unitPrice` -> `items.r5.unitPrice`, using the rows' order. */
function byRowKey(fieldErrors: Record<string, string>, items: FormItem[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    const match = /^items\.(\d+)\.(.+)$/.exec(path);
    const rowKey = match ? items[Number(match[1])]?.rowKey : undefined;
    mapped[match && rowKey ? itemPath(rowKey, match[2]) : path] = message;
  }
  return mapped;
}

/** Once a field shows an error, it's re-checked as it's edited. */
function recheckIfShown(state: TripFormState, path: string): TripFormState {
  if (state.errors[path] === undefined) return state;
  return withError(state, path, currentErrors(state)[path]);
}

function withError(state: TripFormState, path: string, message: string | undefined): TripFormState {
  if (state.errors[path] === message) return state;
  const errors = { ...state.errors };
  if (message === undefined) delete errors[path];
  else errors[path] = message;
  return { ...state, errors };
}

function focusOn(state: TripFormState, path: string): TripFormState["focus"] {
  return { path, request: (state.focus?.request ?? 0) + 1 };
}

/**
 * A saved bill as form input, for editing. Saved people and items keep their IDs (a saved
 * person's key is its ID), so the server updates them instead of creating new ones.
 */
export function tripToFormValue(trip: TripDetail): TripFormValue {
  const keyOf = new Map(
    trip.people.map((person) => [person.personId, person.isOwner ? OWNER_KEY : person.personId]),
  );
  return {
    details: {
      title: trip.title,
      storeName: trip.storeName ?? "",
      tripDate: trip.tripDate,
      category: trip.category,
    },
    people: trip.people
      .filter((person) => !person.isOwner)
      .map((person) => ({ key: person.personId, personId: person.personId, name: person.name ?? "" })),
    items: trip.items.map((item) => ({
      itemId: item.id,
      name: item.name,
      brand: item.brand ?? "",
      variant: item.variant ?? "",
      packSize: item.packSize ?? "",
      unit: item.unit ?? "",
      quantity: milliToInput(item.quantityMilli),
      unitPrice: paisaToInput(item.unitPricePaisa),
      assigneeKeys: item.assignees.flatMap((assignee) => keyOf.get(assignee.personId) ?? []),
    })),
  };
}

/** Whether the form differs from the value it started with (e.g. to confirm discarding). */
export function isFormDirty(state: TripFormState, initialValue: TripFormValue): boolean {
  return JSON.stringify(toFormValue(state)) !== JSON.stringify(initialValue);
}

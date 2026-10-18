/**
 * State for `TripForm`: field values as typed, inline errors and the edit → review step.
 * Pure (no React), so the rules for when errors appear live outside the UI.
 *
 * Item errors are stored by each row's stable `rowKey` (`items.r3.unitPrice`) and people's
 * errors by the person's key (`people.new:2.name`) rather than by index, so removing a row or
 * a person can't move an error onto a neighbour. Validation results, which use indexes
 * (`items.2.unitPrice`, `people.1.name`), are translated with `byStableKey`.
 */
import { DEFAULT_CATEGORY } from "@/domain/categories";
import { milliToInput, paisaToInput, todayIsoDate } from "@/domain/format";
import { removePersonFromItems } from "@/domain/people";
import {
  OWNER_KEY,
  validateNewPerson,
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
  /** Numbers the keys of people added in this form ("new:1", "new:2", …). */
  nextPersonId: number;
};

export type TripFormAction =
  | { type: "setDetail"; field: keyof TripDetailsInput; value: string }
  | { type: "setItem"; rowKey: string; field: ItemField; value: string }
  | { type: "blur"; path: string }
  | { type: "addItem" }
  | { type: "removeItem"; rowKey: string }
  /** Ignored unless `validateNewPerson` accepts the name. */
  | { type: "addPerson"; name: string }
  | { type: "renamePerson"; key: string; name: string }
  /** Also takes them off every item (`removePersonFromItems`). */
  | { type: "removePerson"; key: string }
  /** Who pays for an item; stored in bill order whatever order they're given in. */
  | { type: "setAssignees"; rowKey: string; assigneeKeys: string[] }
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
    nextPersonId: 1,
  };
}

export function itemPath(rowKey: string, field: string): string {
  return `items.${rowKey}.${field}`;
}

export function personPath(key: string): string {
  return `people.${key}.name`;
}

/** Every person's key in bill order: the owner, then everyone else as listed. */
export function billOrder(people: Pick<PersonInput, "key">[]): string[] {
  return [OWNER_KEY, ...people.map((person) => person.key)];
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
    case "addPerson": {
      const name = validateNewPerson(action.name, state.people);
      if (!name.ok) return state;
      // Added at the end, which is also where the server positions a new person.
      const person = { key: `new:${state.nextPersonId}`, name: name.value };
      return recheckPeople({
        ...state,
        people: [...state.people, person],
        nextPersonId: state.nextPersonId + 1,
      });
    }
    case "renamePerson": {
      const people = state.people.map((person) =>
        person.key === action.key ? { ...person, name: action.name } : person,
      );
      // Renaming one person can clear a "same name" error shown on another.
      return recheckPeople({ ...state, people });
    }
    case "removePerson": {
      const prefix = `people.${action.key}.`;
      const errors = Object.fromEntries(
        Object.entries(state.errors).filter(([path]) => !path.startsWith(prefix)),
      );
      return recheckPeople({
        ...state,
        people: state.people.filter((person) => person.key !== action.key),
        items: removePersonFromItems(state.items, action.key),
        errors,
      });
    }
    case "setAssignees": {
      const chosen = new Set(action.assigneeKeys);
      const assigneeKeys = billOrder(state.people).filter((key) => chosen.has(key));
      const items = state.items.map((item) =>
        item.rowKey === action.rowKey ? { ...item, assigneeKeys } : item,
      );
      // Shown straight away: there's no blur for a group of chips.
      const path = itemPath(action.rowKey, "assignees");
      const next = { ...state, items };
      return withError(next, path, currentErrors(next)[path]);
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
      const errors = byStableKey(action.fieldErrors, state);
      const first = Object.keys(errors)[0];
      // Field errors go back onto the form; anything else stays on the review screen.
      if (first === undefined) return { ...state, saveError: action.message };
      return { ...state, step: "edit", errors, saveError: null, focus: focusOn(state, first) };
    }
  }
}

function currentErrors(state: TripFormState): Record<string, string> {
  const result = validateForm(state);
  return result.ok ? {} : byStableKey(result.fieldErrors, state);
}

/**
 * `items.2.unitPrice` -> `items.r5.unitPrice` and `people.1.name` -> `people.new:2.name`,
 * using the order of the rows and people.
 */
function byStableKey(
  fieldErrors: Record<string, string>,
  state: Pick<TripFormState, "items" | "people">,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    const match = /^(items|people)\.(\d+)\.(.+)$/.exec(path);
    const list: { rowKey?: string; key?: string }[] | undefined =
      match?.[1] === "items" ? state.items : match?.[1] === "people" ? state.people : undefined;
    const entry = match && list ? list[Number(match[2])] : undefined;
    const key = entry?.rowKey ?? entry?.key;
    mapped[match && key ? `${match[1]}.${key}.${match[3]}` : path] = message;
  }
  return mapped;
}

/** Re-checks every people error on show, since one person's name can affect another's. */
function recheckPeople(state: TripFormState): TripFormState {
  const current = currentErrors(state);
  return Object.keys(state.errors)
    .filter((path) => path.startsWith("people"))
    .reduce((next, path) => withError(next, path, current[path]), state);
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

import { describe, expect, it } from "vitest";

import {
  initTripFormState,
  isFormDirty,
  itemPath,
  newTripValue,
  personPath,
  toFormValue,
  tripFormReducer,
  tripToFormValue,
  type TripFormAction,
  type TripFormState,
} from "../../src/components/trips/trip-form-state";
import { OWNER_KEY, validateTripInput } from "../../src/domain/trip-validation";
import type { TripDetail } from "../../src/domain/types";

const trip: TripDetail = {
  id: "trip1",
  title: "Imtiaz Grocery",
  storeName: null,
  tripDate: "2026-10-16",
  category: "grocery",
  currency: "PKR",
  totalPaisa: 100000,
  viewerRole: "owner",
  viewerPersonId: "p0",
  owner: { username: "alice" },
  people: [
    { personId: "p0", isOwner: true, isViewer: true, name: null, username: "alice", link: null },
    { personId: "p1", isOwner: false, isViewer: false, name: "Ben", username: null, link: { state: "none" } },
  ],
  items: [
    {
      id: "i0",
      name: "Rice",
      brand: "Guard",
      variant: null,
      packSize: "5 kg",
      unit: null,
      quantityMilli: 1500,
      unitPricePaisa: 33333,
      lineTotalPaisa: 50000,
      assignees: [{ personId: "p0", amountPaisa: 50000 }],
    },
    {
      id: "i1",
      name: "Pizza",
      brand: null,
      variant: null,
      packSize: null,
      unit: null,
      quantityMilli: 1000,
      unitPricePaisa: 50000,
      lineTotalPaisa: 50000,
      assignees: [
        { personId: "p0", amountPaisa: 25000 },
        { personId: "p1", amountPaisa: 25000 },
      ],
    },
  ],
  shares: [],
  reconciled: true,
};

describe("tripToFormValue", () => {
  it("prefills the form as typed text, keeping saved IDs", () => {
    expect(tripToFormValue(trip)).toEqual({
      details: { title: "Imtiaz Grocery", storeName: "", tripDate: "2026-10-16", category: "grocery" },
      people: [{ key: "p1", personId: "p1", name: "Ben" }],
      items: [
        {
          itemId: "i0",
          name: "Rice",
          brand: "Guard",
          variant: "",
          packSize: "5 kg",
          unit: "",
          quantity: "1.5",
          unitPrice: "333.33",
          assigneeKeys: [OWNER_KEY],
        },
        {
          itemId: "i1",
          name: "Pizza",
          brand: "",
          variant: "",
          packSize: "",
          unit: "",
          quantity: "1",
          unitPrice: "500",
          assigneeKeys: [OWNER_KEY, "p1"],
        },
      ],
    });
  });

  it("gives input that validates back to the saved values", () => {
    const { details, people, items } = tripToFormValue(trip);
    const result = validateTripInput(details, people, items, { today: "2026-10-18" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items.map((item) => [item.itemId, item.quantityMilli, item.unitPricePaisa])).toEqual([
      ["i0", 1500, 33333],
      ["i1", 1000, 50000],
    ]);
    expect(result.value.people).toEqual([{ key: "p1", personId: "p1", name: "Ben", nameNormalized: "ben" }]);
  });
});

describe("isFormDirty", () => {
  it("is clean until something changes, and clean again when it's changed back", () => {
    const initial = tripToFormValue(trip);
    let state = initTripFormState(initial);
    expect(isFormDirty(state, initial)).toBe(false);
    expect(toFormValue(state)).toEqual(initial);

    state = tripFormReducer(state, { type: "setDetail", field: "title", value: "Changed" });
    expect(isFormDirty(state, initial)).toBe(true);
    state = tripFormReducer(state, { type: "setDetail", field: "title", value: "Imtiaz Grocery" });
    expect(isFormDirty(state, initial)).toBe(false);
  });

  it("counts added and removed items as changes", () => {
    const initial = tripToFormValue(trip);
    const state = initTripFormState(initial);
    expect(isFormDirty(tripFormReducer(state, { type: "addItem" }), initial)).toBe(true);
    expect(isFormDirty(tripFormReducer(state, { type: "removeItem", rowKey: state.items[0].rowKey }), initial)).toBe(
      true,
    );
  });
});

describe("people in the form", () => {
  const apply = (state: TripFormState, ...actions: TripFormAction[]) => actions.reduce(tripFormReducer, state);

  it("adds people at the end with new keys, ignoring names validateNewPerson refuses", () => {
    const state = apply(
      initTripFormState(newTripValue()),
      { type: "addPerson", name: " Ben " },
      { type: "addPerson", name: "Sara" },
      { type: "addPerson", name: "ben" },
      { type: "addPerson", name: "" },
    );
    expect(state.people).toEqual([
      { key: "new:1", name: "Ben" },
      { key: "new:2", name: "Sara" },
    ]);
  });

  it("stores assignees in bill order and shows a missing payer straight away", () => {
    let state = apply(
      initTripFormState(newTripValue()),
      { type: "addPerson", name: "Ben" },
      { type: "addPerson", name: "Sara" },
    );
    const { rowKey } = state.items[0];
    state = apply(state, { type: "setAssignees", rowKey, assigneeKeys: ["new:2", OWNER_KEY, "new:1"] });
    expect(state.items[0].assigneeKeys).toEqual([OWNER_KEY, "new:1", "new:2"]);

    state = apply(state, { type: "setAssignees", rowKey, assigneeKeys: [] });
    expect(state.errors[itemPath(rowKey, "assignees")]).toBe("Choose who pays for this item");
    state = apply(state, { type: "setAssignees", rowKey, assigneeKeys: ["new:1"] });
    expect(state.errors).toEqual({});
  });

  it("takes a removed person off shared items and moves their solo items to the owner", () => {
    let state = apply(
      initTripFormState(newTripValue()),
      { type: "addPerson", name: "Ben" },
      { type: "addPerson", name: "Sara" },
      { type: "addItem" },
      { type: "addItem" },
    );
    const [pizza, drink, rice] = state.items.map((item) => item.rowKey);
    state = apply(
      state,
      { type: "setAssignees", rowKey: pizza, assigneeKeys: [OWNER_KEY, "new:1", "new:2"] },
      { type: "setAssignees", rowKey: drink, assigneeKeys: ["new:2"] },
      { type: "setAssignees", rowKey: rice, assigneeKeys: [OWNER_KEY, "new:2"] },
      { type: "removePerson", key: "new:2" },
    );
    expect(state.people).toEqual([{ key: "new:1", name: "Ben" }]);
    expect(state.items.map((item) => item.assigneeKeys)).toEqual([[OWNER_KEY, "new:1"], [OWNER_KEY], [OWNER_KEY]]);
  });

  it("keeps people's errors on the right person when someone before them is removed", () => {
    let state = apply(
      initTripFormState(newTripValue()),
      { type: "addPerson", name: "Ben" },
      { type: "addPerson", name: "Sara" },
      { type: "addPerson", name: "Zoe" },
      { type: "renamePerson", key: "new:3", name: "" },
      { type: "blur", path: personPath("new:3") },
    );
    expect(state.errors).toEqual({ [personPath("new:3")]: "Enter a name" });
    state = apply(state, { type: "removePerson", key: "new:1" });
    expect(state.errors).toEqual({ [personPath("new:3")]: "Enter a name" });
  });

  it("clears a duplicate-name error when the other person is renamed", () => {
    let state = apply(
      initTripFormState(newTripValue()),
      { type: "addPerson", name: "Ben" },
      { type: "addPerson", name: "Sara" },
      { type: "renamePerson", key: "new:2", name: "Ben" },
      { type: "blur", path: personPath("new:2") },
    );
    expect(state.errors).toEqual({ [personPath("new:2")]: "Someone on this bill already has that name" });
    state = apply(state, { type: "renamePerson", key: "new:1", name: "Ben D." });
    expect(state.errors).toEqual({});
  });

  it("gives new people keys that never clash with saved ones on an edit", () => {
    const initial = tripToFormValue(trip);
    const state = apply(initTripFormState(initial), { type: "addPerson", name: "Sara" });
    expect(state.people).toEqual([
      { key: "p1", personId: "p1", name: "Ben" },
      { key: "new:1", name: "Sara" },
    ]);
    expect(isFormDirty(state, initial)).toBe(true);
  });
});

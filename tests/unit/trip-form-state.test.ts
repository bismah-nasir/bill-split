import { describe, expect, it } from "vitest";

import {
  initTripFormState,
  isFormDirty,
  toFormValue,
  tripFormReducer,
  tripToFormValue,
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

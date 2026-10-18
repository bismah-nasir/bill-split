import { describe, expect, it } from "vitest";

import {
  OWNER_KEY,
  validateNewPerson,
  validatePersonName,
  validateTripInput,
  type ItemInput,
  type PersonInput,
  type TripDetailsInput,
} from "../../src/domain/trip-validation";

const TODAY = "2026-10-17";

const details = (overrides: Partial<TripDetailsInput> = {}): TripDetailsInput => ({
  title: "Imtiaz Grocery",
  storeName: "",
  tripDate: TODAY,
  category: "grocery",
  ...overrides,
});

const item = (overrides: Partial<ItemInput> = {}): ItemInput => ({
  name: "Cooking Oil",
  brand: "",
  variant: "",
  packSize: "",
  unit: "",
  quantity: "1",
  unitPrice: "500",
  assigneeKeys: [OWNER_KEY],
  ...overrides,
});

function errorsOf(
  tripDetails: TripDetailsInput,
  items: ItemInput[],
  people: PersonInput[] = [],
): Record<string, string> {
  const result = validateTripInput(tripDetails, people, items, { today: TODAY });
  return result.ok ? {} : result.fieldErrors;
}

describe("validateTripInput", () => {
  it("accepts a valid bill, trimming text and dropping empty optional fields", () => {
    const result = validateTripInput(
      details({ title: "  Weekly shop ", storeName: "  " }),
      [],
      [item({ name: " Oil ", brand: " Dalda ", quantity: "1.5", unitPrice: "1,250.50" })],
      { today: TODAY },
    );
    expect(result).toEqual({
      ok: true,
      value: {
        details: { title: "Weekly shop", storeName: undefined, tripDate: TODAY, category: "grocery" },
        people: [],
        items: [
          {
            itemId: undefined,
            name: "Oil",
            brand: "Dalda",
            variant: undefined,
            packSize: undefined,
            unit: undefined,
            quantityMilli: 1500,
            unitPricePaisa: 125050,
            assigneeKeys: [OWNER_KEY],
          },
        ],
      },
    });
  });

  it("requires a title of at most 80 characters", () => {
    expect(errorsOf(details({ title: "  " }), [item()])).toEqual({ title: "Enter a title" });
    expect(errorsOf(details({ title: "a".repeat(81) }), [item()])).toEqual({
      title: "Title must be 80 characters or fewer",
    });
    expect(errorsOf(details({ title: "a".repeat(80) }), [item()])).toEqual({});
  });

  it("limits the store to 60 characters", () => {
    expect(errorsOf(details({ storeName: "s".repeat(61) }), [item()])).toHaveProperty("storeName");
  });

  it("needs 1 to 200 items", () => {
    expect(errorsOf(details(), [])).toEqual({ items: "Add at least one item" });
    expect(errorsOf(details(), Array.from({ length: 200 }, () => item()))).toEqual({});
    expect(errorsOf(details(), Array.from({ length: 201 }, () => item()))).toEqual({
      items: "A bill can have at most 200 items",
    });
  });

  it("reports invalid prices and quantities under the item's index", () => {
    const errors = errorsOf(details(), [
      item(),
      item({ unitPrice: "" }),
      item({ quantity: "0" }),
      item({ unitPrice: "1.234", quantity: "abc" }),
    ]);
    expect(errors).toEqual({
      "items.1.unitPrice": "Enter a price",
      "items.2.quantity": "Quantity must be greater than 0",
      "items.3.unitPrice": "Enter a valid amount, e.g. 250 or 250.50",
      "items.3.quantity": "Enter a valid quantity, e.g. 1 or 1.5",
    });
  });

  it("checks item names and optional details", () => {
    const errors = errorsOf(details(), [item({ name: " ", brand: "b".repeat(41), unit: "u".repeat(41) })]);
    expect(errors).toEqual({
      "items.0.name": "Enter an item name",
      "items.0.brand": "Brand must be 40 characters or fewer",
      "items.0.unit": "Unit must be 40 characters or fewer",
    });
  });

  it("requires at least one assignee", () => {
    expect(errorsOf(details(), [item({ assigneeKeys: [] })])).toEqual({
      "items.0.assignees": "Choose who pays for this item",
    });
  });

  it("rejects an assignee who isn't on the bill", () => {
    expect(errorsOf(details(), [item({ assigneeKeys: [OWNER_KEY, "new:9"] })])).toEqual({
      "items.0.assignees": "Choose people from this bill",
    });
  });

  it("deduplicates assignees", () => {
    const result = validateTripInput(details(), [], [item({ assigneeKeys: [OWNER_KEY, OWNER_KEY] })], {
      today: TODAY,
    });
    expect(result.ok && result.value.items[0].assigneeKeys).toEqual([OWNER_KEY]);
  });

  it("accepts people on the bill as assignees", () => {
    const people = [{ key: "new:1", name: "Ben" }];
    expect(errorsOf(details(), [item({ assigneeKeys: [OWNER_KEY, "new:1"] })], people)).toEqual({});
  });

  it("checks people's names and keys", () => {
    const errors = errorsOf(details(), [item()], [
      { key: "new:1", name: "Ben" },
      { key: "new:2", name: " ben " },
      { key: "new:3", name: "" },
    ]);
    expect(errors).toEqual({
      "people.1.name": "Someone on this bill already has that name",
      "people.2.name": "Enter a name",
    });
    expect(errorsOf(details(), [item()], [{ key: OWNER_KEY, name: "Ben" }])).toHaveProperty("people");
  });

  it("treats names that differ only in case or spacing as duplicates", () => {
    const people = [
      { key: "new:1", name: "Ben Ali" },
      { key: "new:2", name: "  BEN   ali " },
    ];
    expect(errorsOf(details(), [item()], people)).toEqual({
      "people.1.name": "Someone on this bill already has that name",
    });
  });

  it("allows 19 people besides the owner, but not 20", () => {
    const people = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ key: `new:${index}`, name: `Person ${index}` }));
    expect(errorsOf(details(), [item()], people(19))).toEqual({});
    expect(errorsOf(details(), [item()], people(20))).toEqual({
      people: "A bill can have at most 20 people, including you",
    });
  });

  it("needs a name of 1–40 characters", () => {
    expect(errorsOf(details(), [item()], [{ key: "new:1", name: "   " }])).toEqual({
      "people.0.name": "Enter a name",
    });
    expect(errorsOf(details(), [item()], [{ key: "new:1", name: "x".repeat(41) }])).toEqual({
      "people.0.name": "Name must be 40 characters or fewer",
    });
    expect(errorsOf(details(), [item()], [{ key: "new:1", name: "x".repeat(40) }])).toEqual({});
  });

  it("rejects repeated person keys and the owner's key", () => {
    expect(
      errorsOf(details(), [item()], [
        { key: "new:1", name: "Ben" },
        { key: "new:1", name: "Sara" },
      ]),
    ).toHaveProperty("people");
    expect(errorsOf(details(), [item()], [{ key: OWNER_KEY, name: "Ben" }])).toHaveProperty("people");
  });

  it("allows dates up to one year ahead", () => {
    expect(errorsOf(details({ tripDate: "2027-10-17" }), [item()])).toEqual({});
    expect(errorsOf(details({ tripDate: "2027-10-18" }), [item()])).toEqual({
      tripDate: "The date can't be more than a year from now",
    });
    expect(errorsOf(details({ tripDate: "2020-01-01" }), [item()])).toEqual({});
  });

  it.each(["", "2026-02-30", "16/10/2026", "2026-1-5"])("rejects the date %j", (tripDate) => {
    expect(errorsOf(details({ tripDate }), [item()])).toHaveProperty("tripDate");
  });
});

describe("validatePersonName", () => {
  it("trims and allows 1–40 characters", () => {
    expect(validatePersonName("  Ben ")).toEqual({ ok: true, value: "Ben" });
    expect(validatePersonName("")).toEqual({ ok: false, error: "Enter a name" });
    expect(validatePersonName("x".repeat(41))).toEqual({
      ok: false,
      error: "Name must be 40 characters or fewer",
    });
  });
});

describe("validateNewPerson", () => {
  const ben = [{ name: "Ben" }];

  it("accepts a trimmed new name", () => {
    expect(validateNewPerson("  Sara ", ben)).toEqual({ ok: true, value: "Sara" });
  });

  it("rejects empty, too long and duplicate names", () => {
    expect(validateNewPerson(" ", ben)).toEqual({ ok: false, error: "Enter a name" });
    expect(validateNewPerson("x".repeat(41), ben)).toEqual({
      ok: false,
      error: "Name must be 40 characters or fewer",
    });
    expect(validateNewPerson("ben", ben)).toEqual({
      ok: false,
      error: "Someone on this bill already has that name",
    });
    expect(validateNewPerson(" BEN ", ben)).toMatchObject({ ok: false });
  });

  it("refuses a 21st person", () => {
    const nineteen = Array.from({ length: 19 }, (_, index) => ({ name: `Person ${index}` }));
    expect(validateNewPerson("Zoe", nineteen.slice(1))).toEqual({ ok: true, value: "Zoe" });
    expect(validateNewPerson("Zoe", nineteen)).toEqual({
      ok: false,
      error: "A bill can have at most 20 people, including you",
    });
  });
});

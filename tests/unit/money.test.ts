import { describe, expect, it } from "vitest";

import {
  allocateEqually,
  computeBill,
  lineTotalPaisa,
  parseQuantityToMilli,
  parseRupeesToPaisa,
  type BillItemInput,
} from "@/domain/money";

describe("parseRupeesToPaisa", () => {
  it.each([
    ["250", 25000],
    ["1,250.50", 125050],
    ["0", 0],
    ["0.5", 50],
    ["  99.99 ", 9999],
    ["10,000,000.00", 1_000_000_000],
  ])("parses %j as %i paisa", (input, paisa) => {
    expect(parseRupeesToPaisa(input)).toEqual({ ok: true, value: paisa });
  });

  it.each([
    ["", "Enter a price"],
    ["   ", "Enter a price"],
    ["abc", "Enter a valid amount, e.g. 250 or 250.50"],
    ["-1", "Enter a valid amount, e.g. 250 or 250.50"],
    ["1.234", "Enter a valid amount, e.g. 250 or 250.50"],
    ["1e3", "Enter a valid amount, e.g. 250 or 250.50"],
    ["10000000.01", "Price is too large"],
    ["123456789", "Price is too large"],
    ["99999999999999999999", "Price is too large"],
  ])("rejects %j", (input, error) => {
    expect(parseRupeesToPaisa(input)).toEqual({ ok: false, error });
  });
});

describe("parseQuantityToMilli", () => {
  it.each([
    ["1", 1000],
    ["1.5", 1500],
    ["0.001", 1],
    ["100000", 100_000_000],
  ])("parses %j as %i thousandths", (input, milli) => {
    expect(parseQuantityToMilli(input)).toEqual({ ok: true, value: milli });
  });

  it.each([
    ["", "Enter a quantity"],
    ["0", "Quantity must be greater than 0"],
    ["0.000", "Quantity must be greater than 0"],
    ["-1", "Quantity must be greater than 0"],
    ["1.2345", "Use up to 3 decimal places"],
    ["100000.001", "Quantity is too large"],
    ["abc", "Enter a valid quantity, e.g. 1 or 1.5"],
  ])("rejects %j", (input, error) => {
    expect(parseQuantityToMilli(input)).toEqual({ ok: false, error });
  });
});

describe("lineTotalPaisa", () => {
  it("rounds half-up to the nearest paisa", () => {
    expect(lineTotalPaisa(1500, 3333)).toBe(5000); // 4999.5
  });

  it.each([
    [2000, 12550, 25100],
    [1000, 0, 0],
    [1500, 33333, 50000], // 1.5 × Rs. 333.33 = 49999.5 → 50000
    [1, 1, 0], // 0.001 → rounds down
  ])("(%i, %i) = %i", (quantity, price, total) => {
    expect(lineTotalPaisa(quantity, price)).toBe(total);
  });

  it("stays exact for the largest allowed values", () => {
    // 100,000 × Rs. 10,000,000.00 = Rs. 1,000,000,000,000.00
    expect(lineTotalPaisa(100_000_000, 1_000_000_000)).toBe(100_000_000_000_000);
  });
});

describe("allocateEqually", () => {
  it("gives the remainder to the first people in bill order", () => {
    expect(allocateEqually(500000, ["a", "b", "c"])).toEqual([
      { personKey: "a", amountPaisa: 166667 },
      { personKey: "b", amountPaisa: 166667 },
      { personKey: "c", amountPaisa: 166666 },
    ]);
  });

  it("does not re-sort the keys", () => {
    expect(allocateEqually(500000, ["c", "a", "b"])).toEqual([
      { personKey: "c", amountPaisa: 166667 },
      { personKey: "a", amountPaisa: 166667 },
      { personKey: "b", amountPaisa: 166666 },
    ]);
  });

  it("gives everything to a single person", () => {
    expect(allocateEqually(100, ["x"])).toEqual([{ personKey: "x", amountPaisa: 100 }]);
  });

  it("handles fewer paisa than people", () => {
    expect(allocateEqually(1, ["a", "b"])).toEqual([
      { personKey: "a", amountPaisa: 1 },
      { personKey: "b", amountPaisa: 0 },
    ]);
  });

  it("throws on an empty list or duplicate keys", () => {
    expect(() => allocateEqually(100, [])).toThrow();
    expect(() => allocateEqually(100, ["a", "a"])).toThrow();
  });
});

const item = (unitPricePaisa: number, assigneeKeys: string[], quantityMilli = 1000): BillItemInput => ({
  quantityMilli,
  unitPricePaisa,
  assigneeKeys,
});

const shareOf = (bill: ReturnType<typeof computeBill>, key: string) =>
  bill.shares.find((share) => share.personKey === key)?.totalPaisa;

describe("computeBill", () => {
  it("charges one person for one item", () => {
    const bill = computeBill([item(25000, ["owner"])], ["owner"]);
    expect(bill.totalPaisa).toBe(25000);
    expect(bill.shares).toEqual([
      { personKey: "owner", totalPaisa: 25000, contributions: [{ itemIndex: 0, amountPaisa: 25000, splitCount: 1 }] },
    ]);
    expect(bill.reconciled).toBe(true);
  });

  it("adds up several individually assigned items", () => {
    const bill = computeBill([item(1000, ["a"]), item(2000, ["b"]), item(3000, ["a"])], ["a", "b"]);
    expect(shareOf(bill, "a")).toBe(4000);
    expect(shareOf(bill, "b")).toBe(2000);
    expect(bill.totalPaisa).toBe(6000);
  });

  it("splits a shared item 2 and 3 ways", () => {
    const two = computeBill([item(1001, ["a", "b"])], ["a", "b"]);
    expect(two.items[0].allocations.map((a) => a.amountPaisa)).toEqual([501, 500]);
    const three = computeBill([item(500000, ["a", "b", "c"])], ["a", "b", "c"]);
    expect(three.shares.map((share) => share.totalPaisa)).toEqual([166667, 166667, 166666]);
    expect(three.shares[0].contributions[0].splitCount).toBe(3);
  });

  it("mixes personal and shared items (the PRD dinner)", () => {
    const people = ["alice", "ben", "sara"];
    const bill = computeBill(
      [item(500000, ["alice", "ben", "sara"]), item(90000, ["ben"]), item(120000, ["alice", "sara"])],
      people,
    );
    expect(bill.totalPaisa).toBe(710000);
    expect(people.map((key) => shareOf(bill, key))).toEqual([226667, 256667, 226666]);
    expect(bill.reconciled).toBe(true);
  });

  it("handles an uneven paisa total", () => {
    const bill = computeBill([item(3333, ["a", "b"], 1500)], ["a", "b"]); // 4999.5 → 5000
    expect(bill.totalPaisa).toBe(5000);
    expect(bill.shares.map((share) => share.totalPaisa)).toEqual([2500, 2500]);
  });

  it("orders assignees by bill order, not as listed", () => {
    const bill = computeBill([item(100, ["c", "b", "a"])], ["a", "b", "c"]);
    expect(bill.items[0].allocations).toEqual([
      { personKey: "a", amountPaisa: 34 },
      { personKey: "b", amountPaisa: 33 },
      { personKey: "c", amountPaisa: 33 },
    ]);
  });

  it("includes everyone in peopleOrder, even with Rs. 0", () => {
    const bill = computeBill([item(100, ["a"])], ["a", "b"]);
    expect(bill.shares).toHaveLength(2);
    expect(bill.shares[1]).toEqual({ personKey: "b", totalPaisa: 0, contributions: [] });
  });

  it("throws for an assignee who isn't on the bill", () => {
    expect(() => computeBill([item(100, ["stranger"])], ["a"])).toThrow();
  });

  it("always reconciles: 500 seeded random bills", () => {
    const random = mulberry32(20261017);
    const int = (max: number) => Math.floor(random() * (max + 1));
    for (let run = 0; run < 500; run++) {
      const people = Array.from({ length: 1 + int(19) }, (_, i) => `p${i}`);
      const items = Array.from({ length: 1 + int(30) }, () => {
        const shuffled = [...people].sort(() => random() - 0.5);
        return item(int(1_000_000_000), shuffled.slice(0, 1 + int(people.length - 1)), 1 + int(100_000_000));
      });
      const bill = computeBill(items, people);
      const sharesTotal = bill.shares.reduce((sum, share) => sum + share.totalPaisa, 0);
      const linesTotal = bill.items.reduce((sum, line) => sum + line.lineTotalPaisa, 0);
      expect(bill.reconciled).toBe(true);
      expect(sharesTotal).toBe(bill.totalPaisa);
      expect(linesTotal).toBe(bill.totalPaisa);
      expect(bill.shares).toHaveLength(people.length);
    }
  });
});

/** Small seeded PRNG so the property test is reproducible. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

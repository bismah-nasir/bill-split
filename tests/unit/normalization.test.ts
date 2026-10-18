import { describe, expect, it } from "vitest";

import {
  buildProductMatchKey,
  buildTripSearchText,
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizePackSize,
  normalizeText,
  normalizeUnit,
  normalizeUsername,
} from "../../src/domain/normalization";

describe("normalizeText", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeText("  Cooking   Oil\t1 L ")).toBe("cooking oil 1 l");
  });

  it("applies NFKC so look-alike characters compare equal", () => {
    expect(normalizeText("Ｍｉｌｋ")).toBe("milk");
  });
});

describe("normalizeUsername", () => {
  it("lowercases and trims", () => {
    expect(normalizeUsername("  Alice_1 ")).toBe("alice_1");
  });

  it("keeps internal spaces so they stay invalid", () => {
    expect(normalizeUsername("has space")).toBe("has space");
  });
});

describe("isValidUsername", () => {
  it.each(["abc", "alice", "Alice", "a_1", "a".repeat(20), "  bob  "])("accepts %j", (name) => {
    expect(isValidUsername(name)).toBe(true);
  });

  it.each(["", "ab", "1abc", "_abc", "has space", "a".repeat(21), "bad-dash", "émile"])(
    "rejects %j",
    (name) => {
      expect(isValidUsername(name)).toBe(false);
    },
  );
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail(" Alice@Example.COM ")).toBe("alice@example.com");
  });
});

describe("isValidEmail", () => {
  it.each(["alice@example.com", " Alice@Example.COM ", "a.b+c@sub.example.pk"])("accepts %j", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "alice", "alice@", "alice@example", "@example.com", "al ice@example.com", "a@b@c.com"])(
    "rejects %j",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );

  it("rejects addresses longer than 254 characters", () => {
    const local = "a".repeat(64);
    const domain = `${"b".repeat(186)}.com`; // 64 + 1 + 190 = 255
    expect(isValidEmail(`${local}@${domain}`)).toBe(false);
    expect(isValidEmail(`${local}@${domain.slice(1)}`)).toBe(true);
  });
});

describe("normalizeUnit", () => {
  it.each([
    ["Litres", "l"],
    [" LTR ", "l"],
    ["millilitre", "ml"],
    ["Kgs", "kg"],
    ["gms", "g"],
    ["Pieces", "item"],
    ["packet", "pack"],
    ["dz", "dozen"],
    ["Tray", "tray"],
    ["", ""],
  ])("%j -> %j", (input, unit) => {
    expect(normalizeUnit(input)).toBe(unit);
  });
});

describe("normalizePackSize", () => {
  it.each([
    ["1 Litre", "1l"],
    ["500 gm", "500g"],
    ["5 ltr", "5l"],
    ["1.5kg", "1.5kg"],
    ["Pack of 6", "pack of 6"],
    ["2 x 250 ml", "2 x 250ml"],
  ])("%j -> %j", (input, pack) => {
    expect(normalizePackSize(input)).toBe(pack);
  });
});

describe("buildProductMatchKey", () => {
  const key = (fields: Partial<Parameters<typeof buildProductMatchKey>[0]>) =>
    buildProductMatchKey({ name: "Cooking Oil", ...fields });

  it("ignores case and extra spaces in the name", () => {
    expect(buildProductMatchKey({ name: "Cooking  Oil" })).toBe(buildProductMatchKey({ name: " cooking oil" }));
  });

  it("treats pack size spellings of the same amount as one product", () => {
    expect(key({ packSize: "1 Litre" })).toBe(key({ packSize: "1l" }));
  });

  it("keeps different pack sizes apart", () => {
    expect(key({ packSize: "1 l" })).not.toBe(key({ packSize: "5 l" }));
  });

  it("never merges a missing pack size with a given one", () => {
    expect(key({})).not.toBe(key({ packSize: "1 l" }));
  });

  it("keeps brand, variant and unit as separate segments", () => {
    expect(key({ brand: "Dalda" })).not.toBe(key({}));
    expect(key({ variant: "Canola" })).not.toBe(key({ brand: "Canola" }));
    expect(key({ unit: "Litres" })).toBe(key({ unit: "l" }));
  });
});

describe("buildTripSearchText", () => {
  it("joins the title, store and item names, normalized", () => {
    expect(buildTripSearchText("Weekly  Shop", "Imtiaz", ["Cooking Oil", "RICE"])).toBe(
      "weekly shop imtiaz cooking oil rice",
    );
    expect(buildTripSearchText("Dinner", undefined, [])).toBe("dinner");
  });
});

import { describe, expect, it } from "vitest";

import {
  isValidEmail,
  isValidUsername,
  normalizeEmail,
  normalizeText,
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

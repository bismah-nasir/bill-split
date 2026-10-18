import { describe, expect, it } from "vitest";

import { personLabel, removePersonFromItems, summarizeLabels, summaryLabel } from "../../src/domain/people";
import { OWNER_KEY } from "../../src/domain/trip-validation";

const owner = { personId: "p0", isOwner: true, name: null, username: "alice" };
const ben = { personId: "p1", isOwner: false, name: "Ben", username: null };
const linkedBen = { ...ben, username: "ben_doe" };

describe("personLabel", () => {
  it("shows the viewer's own person as You", () => {
    expect(personLabel(owner, "p0")).toBe("You");
    expect(personLabel(linkedBen, "p1")).toBe("You");
  });

  it("shows the owner to everyone else by username", () => {
    expect(personLabel(owner, "p1")).toBe("@alice");
    expect(personLabel(owner, null)).toBe("@alice");
  });

  it("shows other people by the typed name, plus the username once linked", () => {
    expect(personLabel(ben, "p0")).toBe("Ben");
    expect(personLabel(linkedBen, "p0")).toBe("Ben (@ben_doe)");
  });
});

describe("summaryLabel", () => {
  it("never says You", () => {
    expect(summaryLabel(owner, "Alice Khan")).toBe("Alice Khan");
    expect(summaryLabel(owner, null)).toBe("@alice");
    expect(summaryLabel(ben, "Alice Khan")).toBe("Ben");
    expect(summaryLabel(linkedBen, null)).toBe("Ben (@ben_doe)");
  });
});

describe("removePersonFromItems", () => {
  it("drops the person from shared items and moves their solo items to the owner", () => {
    const items = [
      { name: "Pizza", assigneeKeys: [OWNER_KEY, "ben", "sara"] },
      { name: "Drink", assigneeKeys: ["sara"] },
      { name: "Rice", assigneeKeys: [OWNER_KEY, "sara"] },
      { name: "Tea", assigneeKeys: ["ben"] },
    ];
    expect(removePersonFromItems(items, "sara")).toEqual([
      { name: "Pizza", assigneeKeys: [OWNER_KEY, "ben"] },
      { name: "Drink", assigneeKeys: [OWNER_KEY] },
      { name: "Rice", assigneeKeys: [OWNER_KEY] },
      { name: "Tea", assigneeKeys: ["ben"] },
    ]);
  });

  it("leaves items without the person untouched", () => {
    const items = [{ assigneeKeys: [OWNER_KEY] }];
    expect(removePersonFromItems(items, "ben")[0]).toBe(items[0]);
  });
});

describe("summarizeLabels", () => {
  it("lists up to three, then counts the rest", () => {
    expect(summarizeLabels(["You"])).toBe("You");
    expect(summarizeLabels(["You", "Ben", "Sara"])).toBe("You, Ben, Sara");
    expect(summarizeLabels(["You", "Ben", "Sara", "Zoe", "Ali"])).toBe("You, Ben, Sara +2");
  });
});

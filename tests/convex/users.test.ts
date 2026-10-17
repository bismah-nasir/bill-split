import { describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api";
import { createUser, errorDataOf, setupTest } from "./helpers";

describe("users.getCurrent", () => {
  it("returns exactly the caller's id, name, email and username", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice", { name: "Alice", email: "alice@example.com" });
    await createUser(t, "bob");

    const current = await alice.as.query(api.users.getCurrent);

    expect(Object.keys(current ?? {}).sort()).toEqual(["email", "id", "name", "username"]);
    expect(current).toEqual({ id: alice.id, name: "Alice", email: "alice@example.com", username: "alice" });
  });

  it("returns a null username before onboarding", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice", { skipUsername: true });
    expect((await alice.as.query(api.users.getCurrent))?.username).toBeNull();
  });

  it("returns null when unauthenticated", async () => {
    const t = setupTest();
    expect(await t.query(api.users.getCurrent)).toBeNull();
  });
});

describe("users.setUsername", () => {
  it.each(["ab", "1abc", "has space", "a".repeat(21), "bad-dash", ""])(
    "rejects the invalid username %j",
    async (username) => {
      const t = setupTest();
      const alice = await createUser(t, "alice", { skipUsername: true });
      const data = await errorDataOf(() => alice.as.mutation(api.users.setUsername, { username }));
      expect(data).toMatchObject({ code: "USERNAME_INVALID" });
    },
  );

  it("stores the username as typed and its lowercase form for lookups", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice", { skipUsername: true });
    await alice.as.mutation(api.users.setUsername, { username: "  Alice_1 " });

    const row = await t.run((ctx) => ctx.db.get(alice.id));
    expect(row).toMatchObject({ username: "Alice_1", usernameNormalized: "alice_1" });
  });

  it("treats usernames case-insensitively for uniqueness", async () => {
    const t = setupTest();
    await createUser(t, "Alice");
    const other = await createUser(t, "other", { skipUsername: true });

    const data = await errorDataOf(() => other.as.mutation(api.users.setUsername, { username: "alice" }));
    expect(data).toMatchObject({ code: "USERNAME_TAKEN" });
  });

  it("lets a user re-save their own username, in any case", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");

    await alice.as.mutation(api.users.setUsername, { username: "alice" });
    await alice.as.mutation(api.users.setUsername, { username: "ALICE" });

    expect((await alice.as.query(api.users.getCurrent))?.username).toBe("ALICE");
  });

  it("throws UNAUTHENTICATED when signed out", async () => {
    const t = setupTest();
    const data = await errorDataOf(() => t.mutation(api.users.setUsername, { username: "alice" }));
    expect(data).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

describe("users.isUsernameAvailable", () => {
  it("reports validity and availability, counting the caller's own name as free", async () => {
    const t = setupTest();
    const alice = await createUser(t, "alice");
    const bob = await createUser(t, "bob", { skipUsername: true });

    expect(await bob.as.query(api.users.isUsernameAvailable, { username: "ALICE" })).toEqual({
      valid: true,
      available: false,
    });
    expect(await bob.as.query(api.users.isUsernameAvailable, { username: "bobby" })).toEqual({
      valid: true,
      available: true,
    });
    expect(await bob.as.query(api.users.isUsernameAvailable, { username: "1x" })).toEqual({
      valid: false,
      available: false,
    });
    expect(await alice.as.query(api.users.isUsernameAvailable, { username: "Alice" })).toEqual({
      valid: true,
      available: true,
    });
  });

  it("throws UNAUTHENTICATED when signed out", async () => {
    const t = setupTest();
    const data = await errorDataOf(() => t.query(api.users.isUsernameAvailable, { username: "alice" }));
    expect(data).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

import { describe, expect, it } from "vitest";

import { invitationStatusLabel, noMatchMessage, normalizeInviteIdentifier } from "@/domain/invitations";

describe("normalizeInviteIdentifier", () => {
  it.each([
    ["ben_doe", "ben_doe"],
    [" Ben_Doe ", "ben_doe"],
    ["@ben_doe", "ben_doe"],
  ])("normalizes the username %j", (input, expected) => {
    expect(normalizeInviteIdentifier("username", input)).toBe(expected);
  });

  it.each(["", "@", "1bad", "ab", "has space", "ben@example.com"])("rejects the username %j", (input) => {
    expect(normalizeInviteIdentifier("username", input)).toBeNull();
  });

  it("trims and lowercases emails", () => {
    expect(normalizeInviteIdentifier("email", " Bob@Example.com ")).toBe("bob@example.com");
  });

  it.each(["", "bob", "bob@example", "bob @example.com"])("rejects the email %j", (input) => {
    expect(normalizeInviteIdentifier("email", input)).toBeNull();
  });
});

describe("invitation copy", () => {
  it("uses one generic message per identifier type", () => {
    expect(noMatchMessage("email")).toBe(
      "No account matches that email. Ask your friend to sign up and finish setting up their account.",
    );
    expect(noMatchMessage("username")).toMatch(/^No account matches that username\./);
  });

  it("labels statuses", () => {
    expect(invitationStatusLabel("pending")).toBe("Pending");
    expect(invitationStatusLabel("declined")).toBe("Declined");
  });
});

"use client";

import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";

import { isValidUsername } from "@/domain/normalization";
import type { CurrentUser } from "@/domain/types";

import { api } from "../../../convex/_generated/api";
import type { AppError } from "./errors";
import { useAppMutation } from "./use-app-mutation";

/** `undefined` while loading, `null` when signed out. */
export function useCurrentUser(): CurrentUser | null | undefined {
  return useQuery(api.users.getCurrent);
}

export type UsernameAvailability = "idle" | "invalid" | "checking" | "available" | "taken";

const AVAILABILITY_DEBOUNCE_MS = 400;

/**
 * Live availability of a username as the user types. Malformed names are reported
 * locally without asking the server; well-formed ones are checked after a 400 ms pause.
 */
export function useUsernameAvailability(username: string): UsernameAvailability {
  const candidate = username.trim();
  const isWellFormed = isValidUsername(candidate);
  const [debounced, setDebounced] = useState(candidate);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(candidate), AVAILABILITY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [candidate]);

  const isSettled = debounced === candidate;
  const result = useQuery(
    api.users.isUsernameAvailable,
    isWellFormed && isSettled ? { username: candidate } : "skip",
  );

  if (candidate.length === 0) return "idle";
  if (!isWellFormed) return "invalid";
  if (!isSettled || result === undefined) return "checking";
  if (!result.valid) return "invalid";
  return result.available ? "available" : "taken";
}

export function useSetUsername() {
  const { run, isPending, error } = useAppMutation(api.users.setUsername);
  const setUsername = useCallback(
    async (username: string): Promise<AppError | null> => errorOf(await run({ username })),
    [run],
  );
  return { setUsername, isPending, error };
}

export function useUpdateName() {
  const { run, isPending, error } = useAppMutation(api.users.updateName);
  const updateName = useCallback(
    async (name: string): Promise<AppError | null> => errorOf(await run({ name })),
    [run],
  );
  return { updateName, isPending, error };
}

function errorOf(result: { ok: true } | { ok: false; error: AppError }): AppError | null {
  return result.ok ? null : result.error;
}

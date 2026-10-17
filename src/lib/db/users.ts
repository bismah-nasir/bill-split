"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { useCallback, useEffect, useState } from "react";

import { isValidUsername } from "@/domain/normalization";
import type { CurrentUser } from "@/domain/types";

import { api } from "../../../convex/_generated/api";
import { toAppError, type AppError } from "./errors";

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
  const setUsername = useCallback((username: string) => run({ username }), [run]);
  return { setUsername, isPending, error };
}

export function useUpdateName() {
  const { run, isPending, error } = useAppMutation(api.users.updateName);
  const updateName = useCallback((name: string) => run({ name }), [run]);
  return { updateName, isPending, error };
}

/**
 * Wraps a mutation with pending and error state. `run` resolves to `null` on success,
 * or to the error to show, so forms needn't sync errors through effects.
 */
function useAppMutation<Mutation extends FunctionReference<"mutation">>(reference: Mutation) {
  const mutate = useMutation(reference);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const run = useCallback(
    async (args: FunctionArgs<Mutation>): Promise<AppError | null> => {
      setIsPending(true);
      setError(null);
      try {
        await mutate(args);
        return null;
      } catch (caught) {
        const appError = toAppError(caught);
        setError(appError);
        return appError;
      } finally {
        setIsPending(false);
      }
    },
    [mutate],
  );

  return { run, isPending, error };
}

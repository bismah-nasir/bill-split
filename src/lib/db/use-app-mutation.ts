"use client";

import { useConvex, useMutation } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { useCallback, useState } from "react";

import { OFFLINE_ERROR, toAppError, type AppError } from "./errors";

export type MutationResult<T> = { ok: true; value: T } | { ok: false; error: AppError };

/**
 * Wraps a mutation with pending and error state. `run` never throws: it resolves to the
 * mutation's result or to the error to show, so forms needn't sync errors through effects.
 *
 * While disconnected, Convex would queue the mutation and send it on reconnect, leaving the
 * form waiting with no feedback (and a retry could then save twice). So when the browser is
 * offline or the connection is down, `run` fails at once with `OFFLINE` and sends nothing.
 */
export function useAppMutation<Mutation extends FunctionReference<"mutation">>(reference: Mutation) {
  const client = useConvex();
  const mutate = useMutation(reference);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const run = useCallback(
    async (args: FunctionArgs<Mutation>): Promise<MutationResult<FunctionReturnType<Mutation>>> => {
      if (!navigator.onLine || !client.connectionState().isWebSocketConnected) {
        setError(OFFLINE_ERROR);
        return { ok: false, error: OFFLINE_ERROR };
      }
      setIsPending(true);
      setError(null);
      try {
        return { ok: true, value: await mutate(args) };
      } catch (caught) {
        const appError = toAppError(caught);
        setError(appError);
        return { ok: false, error: appError };
      } finally {
        setIsPending(false);
      }
    },
    [client, mutate],
  );

  return { run, isPending, error };
}

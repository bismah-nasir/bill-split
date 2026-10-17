"use client";

import * as React from "react";

import { TextField } from "@/components/ui/text-field";
import { normalizeUsername, USERNAME_RULES } from "@/domain/normalization";
import type { UsernameAvailability } from "@/lib/db/users";

type UsernameFieldProps = Omit<React.ComponentProps<typeof TextField>, "label" | "hint" | "success"> & {
  value: string;
  availability: UsernameAvailability;
};

/**
 * Username input with the rules hint and a live "available / taken" status.
 * An `error` (e.g. from a failed save) replaces the live status.
 */
export function UsernameField({ value, availability, error, ...props }: UsernameFieldProps) {
  return (
    <TextField
      label="Username"
      autoComplete="username"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      hint={USERNAME_RULES}
      value={value}
      error={error ?? (availability === "taken" ? "That username is taken" : undefined)}
      success={
        availability === "available" ? `@${normalizeUsername(value)} is available` : undefined
      }
      {...props}
    />
  );
}

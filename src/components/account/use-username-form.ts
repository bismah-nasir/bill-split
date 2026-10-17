"use client";

import * as React from "react";

import { isValidUsername, USERNAME_RULES } from "@/domain/normalization";
import { useSetUsername, useUsernameAvailability } from "@/lib/db/users";

/**
 * State and submit logic for choosing a username, shared by onboarding and Settings.
 * Rule and "taken" errors go under the field; anything else becomes a form message.
 */
export function useUsernameForm(initialUsername = "") {
  const [username, setUsername] = React.useState(initialUsername);
  const [fieldError, setFieldError] = React.useState<string | undefined>();
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const availability = useUsernameAvailability(username);
  const { setUsername: saveUsername, isPending } = useSetUsername();

  function changeUsername(value: string) {
    setUsername(value);
    setFieldError(undefined);
  }

  /** Resolves to `true` once the username is saved. */
  async function submit(): Promise<boolean> {
    setFormMessage(null);
    if (!isValidUsername(username)) {
      setFieldError(username.trim() ? `Usernames are ${USERNAME_RULES}.` : "Choose a username");
      return false;
    }
    if (availability === "taken") return false;

    const failure = await saveUsername(username);
    if (!failure) return true;
    if (failure.code === "USERNAME_TAKEN" || failure.code === "USERNAME_INVALID") {
      setFieldError(failure.message);
    } else {
      setFormMessage(failure.message);
    }
    return false;
  }

  return { username, changeUsername, availability, fieldError, formMessage, isPending, submit };
}

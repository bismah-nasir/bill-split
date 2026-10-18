"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { controlClassName, Field } from "./field";

type TextFieldProps = Omit<React.ComponentProps<"input">, "children" | "prefix"> & {
  label: string;
  /** Neutral guidance shown under the input, e.g. the rules for the value. */
  hint?: React.ReactNode;
  /** Shown in the error style and marks the input invalid. Takes precedence over `success`. */
  error?: string;
  /** A positive status, e.g. "@alice is available". */
  success?: string;
  /** Short fixed text inside the input before the value, e.g. "Rs.". */
  prefix?: string;
};

/** Labelled text input with hint and status messages wired up through `aria-describedby`. */
export function TextField({
  label,
  hint,
  error,
  success,
  prefix,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field label={label} id={id} hint={hint} error={error} success={success} className={className}>
      {(control) => (
        <div className="relative">
          {prefix && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-14 flex items-center type-body text-ink-muted"
            >
              {prefix}
            </span>
          )}
          <input {...control} className={cn(controlClassName, prefix && "pl-40")} {...inputProps} />
        </div>
      )}
    </Field>
  );
}

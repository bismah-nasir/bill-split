"use client";

import * as React from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type TextFieldProps = Omit<React.ComponentProps<"input">, "children"> & {
  label: string;
  /** Neutral guidance shown under the input, e.g. the rules for the value. */
  hint?: React.ReactNode;
  /** Shown in the error style and marks the input invalid. Takes precedence over `success`. */
  error?: string;
  /** A positive status, e.g. "@alice is available". */
  success?: string;
};

/** Labelled text input with hint and status messages wired up through `aria-describedby`. */
export function TextField({ label, hint, error, success, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const statusId = `${inputId}-status`;
  const status = error ?? success;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <label htmlFor={inputId} className="type-body-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hint && hintId, status && statusId) || undefined}
        className={cn(
          "h-control-md w-full min-w-0 rounded-md border border-line-strong bg-surface px-14 type-body text-ink transition-colors duration-fast ease-standard placeholder:text-ink-muted focus:border-primary disabled:opacity-50",
          error && "border-error focus:border-error",
        )}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="type-caption text-ink-muted">
          {hint}
        </p>
      )}
      {/* Always rendered so screen readers announce status changes as they happen. */}
      <p
        id={statusId}
        aria-live="polite"
        className={cn(
          "flex items-center gap-6 type-caption empty:hidden",
          error ? "text-error" : "text-success",
        )}
      >
        {status && (
          <>
            {error ? (
              <CircleAlert aria-hidden className="size-icon-sm shrink-0" />
            ) : (
              <CircleCheck aria-hidden className="size-icon-sm shrink-0" />
            )}
            {status}
          </>
        )}
      </p>
    </div>
  );
}

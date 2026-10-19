"use client";

import * as React from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/** Props a form control needs so its label and messages are announced with it. */
export type FieldControlProps = {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

type FieldProps = {
  label: string;
  /** Keeps the label for screen readers only, where the context already makes it clear. */
  hideLabel?: boolean;
  /** The control's id; generated when omitted. */
  id?: string;
  /** Neutral guidance shown under the control, e.g. the rules for the value. */
  hint?: React.ReactNode;
  /** Shown in the error style and marks the control invalid. Takes precedence over `success`. */
  error?: string;
  /** A positive status, e.g. "@alice is available". */
  success?: string;
  className?: string;
  children: (control: FieldControlProps) => React.ReactNode;
};

/** A label, a control and its hint and status messages, wired up through `aria-describedby`. */
export function Field({ label, hideLabel, id, hint, error, success, className, children }: FieldProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const statusId = `${controlId}-status`;
  const status = error ?? success;

  return (
    <div className={cn("flex min-w-0 flex-col gap-6", className)}>
      <label htmlFor={controlId} className={cn("type-body-sm font-medium text-ink", hideLabel && "sr-only")}>
        {label}
      </label>
      {children({
        id: controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": cn(hint && hintId, status && statusId) || undefined,
      })}
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

/** The bordered box shared by text inputs and select triggers. */
export const controlClassName =
  "h-control-md w-full min-w-0 rounded-md border border-line-control bg-surface px-14 type-body text-ink transition-colors duration-fast ease-standard placeholder:text-ink-muted focus:border-primary disabled:opacity-50 aria-invalid:border-error aria-invalid:focus:border-error";

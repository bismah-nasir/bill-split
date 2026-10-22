"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  /** Read by screen readers as the group's name, e.g. "Invite by". */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Stretch across the container; each option grows from its own label's width. */
  fullWidth?: boolean;
  className?: string;
};

/**
 * A choice between a few options, shown as a row of pills: an accessible radio group (arrow
 * keys move between options), e.g. Username / Email.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  fullWidth = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      orientation="horizontal"
      value={value}
      // Radix reports a plain string; it's always one of `options`.
      onValueChange={(next) => onValueChange(next as T)}
      className={cn(
        "gap-4 rounded-pill bg-surface-muted p-4",
        fullWidth ? "flex w-full" : "inline-flex w-fit",
        className,
      )}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "h-control-sm whitespace-nowrap rounded-pill type-button-sm text-ink-secondary transition-colors duration-fast ease-standard hover:text-ink data-[state=checked]:bg-surface data-[state=checked]:text-primary data-[state=checked]:shadow-subtle",
            // Minimal padding so three labels fit a 320px screen; flex-auto spreads the spare width.
            fullWidth ? "flex-auto px-4 md:px-16" : "px-16",
          )}
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

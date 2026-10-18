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
  className,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      orientation="horizontal"
      value={value}
      // Radix reports a plain string; it's always one of `options`.
      onValueChange={(next) => onValueChange(next as T)}
      className={cn("inline-flex w-fit gap-4 rounded-pill bg-surface-muted p-4", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className="h-control-sm min-w-0 rounded-pill px-16 type-button-sm text-ink-secondary transition-colors duration-fast ease-standard hover:text-ink data-[state=checked]:bg-surface data-[state=checked]:text-primary data-[state=checked]:shadow-subtle"
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

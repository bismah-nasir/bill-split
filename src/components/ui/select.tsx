"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

import { controlClassName, Field } from "./field";

export type SelectOption<T extends string> = { value: T; label: string };

type SelectProps<T extends string> = {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  id?: string;
  name?: string;
  hint?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
};

/** Labelled single-choice list (Radix Select), styled and wired like `TextField`. */
export function Select<T extends string>({
  label,
  options,
  value,
  onValueChange,
  id,
  name,
  hint,
  error,
  disabled,
  className,
}: SelectProps<T>) {
  return (
    <Field label={label} id={id} hint={hint} error={error} className={className}>
      {(control) => (
        <SelectPrimitive.Root
          name={name}
          value={value}
          disabled={disabled}
          // Radix reports a plain string; it's always one of `options`.
          onValueChange={(next) => onValueChange(next as T)}
        >
          <SelectPrimitive.Trigger
            {...control}
            className={cn(controlClassName, "flex items-center justify-between gap-8 text-left")}
          >
            <SelectPrimitive.Value />
            <SelectPrimitive.Icon asChild>
              <ChevronDown aria-hidden className="size-icon-md shrink-0 text-ink-secondary" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={6}
              className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line bg-surface-elevated shadow-card"
            >
              <SelectPrimitive.Viewport className="flex flex-col gap-2 p-6">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className="flex h-control-sm cursor-pointer items-center justify-between gap-8 rounded-sm px-10 type-body-sm text-ink outline-none select-none data-highlighted:bg-surface-subtle"
                  >
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator>
                      <Check aria-hidden className="size-icon-md text-primary" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      )}
    </Field>
  );
}

"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  /** Optional count shown after the label, e.g. pending invitations. */
  badge?: React.ReactNode;
  content: React.ReactNode;
};

type TabsProps<T extends string> = {
  /** Read by screen readers as the tab list's name. */
  label: string;
  items: readonly TabItem<T>[];
  defaultValue: T;
  className?: string;
};

/** Switches between panels on one page; the tab list looks like the segmented control. */
export function Tabs<T extends string>({ label, items, defaultValue, className }: TabsProps<T>) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} className={cn("flex flex-col gap-16", className)}>
      <TabsPrimitive.List
        aria-label={label}
        className="inline-flex w-fit gap-4 rounded-pill bg-surface-muted p-4"
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className="flex h-control-sm items-center gap-6 rounded-pill px-16 type-button-sm text-ink-secondary transition-colors duration-fast ease-standard hover:text-ink data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-subtle"
          >
            {item.label}
            {item.badge}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content key={item.value} value={item.value}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

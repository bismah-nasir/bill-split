"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type PickerPerson = { key: string; label: string };

type ParticipantPickerProps = {
  /** The DOM id of the group, so a validation error can be focused. */
  id: string;
  /** Everyone on the bill, in bill order. */
  people: PickerPerson[];
  selected: string[];
  error?: string;
  /** Describes the group to screen readers, e.g. "Who pays for item 2". */
  label: string;
  onChange: (keys: string[]) => void;
};

/** Toggle chips for who pays for an item, plus **Everyone**. */
export function ParticipantPicker({ id, people, selected, error, label, onChange }: ParticipantPickerProps) {
  const errorId = `${id}-error`;
  const chosen = new Set(selected);
  const everyone = people.every((person) => chosen.has(person.key));

  const toggle = (key: string) =>
    onChange(chosen.has(key) ? selected.filter((selectedKey) => selectedKey !== key) : [...selected, key]);

  return (
    <div className="flex flex-col gap-6">
      <div
        id={id}
        role="group"
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        tabIndex={-1}
        className="flex flex-wrap gap-8 rounded-sm"
      >
        <Chip pressed={everyone} onClick={() => onChange(everyone ? [] : people.map((person) => person.key))}>
          Everyone
        </Chip>
        {people.map((person) => (
          <Chip key={person.key} pressed={chosen.has(person.key)} onClick={() => toggle(person.key)}>
            {person.label}
          </Chip>
        ))}
      </div>
      <p
        id={errorId}
        aria-live="polite"
        className="flex items-center gap-6 type-caption text-error empty:hidden"
      >
        {error && (
          <>
            <CircleAlert aria-hidden className="size-icon-sm shrink-0" />
            {error}
          </>
        )}
      </p>
    </div>
  );
}

type ChipProps = { pressed: boolean; onClick: () => void; children: React.ReactNode };

function Chip({ pressed, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-control-sm max-w-full items-center rounded-pill border px-14 type-button-sm transition-colors duration-fast ease-standard",
        pressed
          ? "border-primary bg-primary-soft text-primary"
          : "border-line-strong bg-surface text-ink-secondary hover:bg-surface-subtle",
      )}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

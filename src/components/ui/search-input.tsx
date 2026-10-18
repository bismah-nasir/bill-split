"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { controlClassName } from "./field";

type SearchInputProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> & {
  /** Read by screen readers as the field's name, e.g. "Search bills". */
  label: string;
  /** The applied search. When it changes from outside (e.g. back navigation), the text follows. */
  value: string;
  /** Called 300 ms after typing stops, and at once when the field is cleared. */
  onDebouncedChange: (value: string) => void;
  /** Debounce delay in milliseconds. */
  delay?: number;
};

/** A search box with an icon, a clear button and a debounced change callback. */
export function SearchInput({
  label,
  value,
  onDebouncedChange,
  delay = 300,
  className,
  ...inputProps
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const [text, setText] = React.useState(value);

  // `value` usually catches up with what this field reported some time later (e.g. after a
  // URL update), possibly skipping values, while the user keeps typing. Those echoes must not
  // overwrite the text. Only a value the field never reported (Clear filters, back
  // navigation) replaces it.
  const [seenValue, setSeenValue] = React.useState(value);
  const [reported, setReported] = React.useState<string[]>([]);
  const [outsideChanges, setOutsideChanges] = React.useState(0);
  if (value !== seenValue) {
    setSeenValue(value);
    const index = reported.indexOf(value);
    if (index === -1) {
      setText(value);
      setReported([]);
      setOutsideChanges((count) => count + 1);
    } else {
      setReported(reported.slice(index + 1));
    }
  }

  // The pending timeout calls the latest callback, so it never acts on stale props.
  const onChangeRef = React.useRef(onDebouncedChange);
  React.useEffect(() => {
    onChangeRef.current = onDebouncedChange;
  });
  // An outside change wins over a search still waiting for its debounce.
  React.useEffect(() => window.clearTimeout(timer.current), [outsideChanges]);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  function emit(next: string) {
    window.clearTimeout(timer.current);
    setReported((list) => [...list, next]);
    onChangeRef.current(next);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setText(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => emit(next), delay);
  }

  function clear() {
    setText("");
    emit("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-14 my-auto size-icon-md text-ink-muted"
      />
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") emit(text);
          if (event.key === "Escape" && text) clear();
        }}
        className={cn(controlClassName, "pl-40", text && "pr-48")}
        {...inputProps}
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="absolute inset-y-0 right-2 my-auto flex size-tap items-center justify-center rounded-pill text-ink-secondary transition-colors duration-fast ease-standard hover:bg-surface-subtle hover:text-ink"
        >
          <X aria-hidden className="size-icon-md" />
        </button>
      )}
    </div>
  );
}

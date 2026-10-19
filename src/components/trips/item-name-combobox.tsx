"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { controlClassName, Field } from "@/components/ui/field";
import { productDetailsLine, productSearchTerm, suggestionLabel, suggestionPriceLine } from "@/domain/price-history";
import type { ItemSuggestion } from "@/domain/types";
import { useItemSuggestions } from "@/lib/db/price-history";
import { cn } from "@/lib/utils";

const SUGGEST_DEBOUNCE_MS = 250;

type ItemNameComboboxProps = {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  /** A product recorded before was chosen; the typed name is replaced by its name. */
  onSelectSuggestion: (suggestion: ItemSuggestion) => void;
};

/**
 * The item name field, suggesting products from the user's earlier bills as they type (ARIA
 * combobox with a list). The list opens inside the card under the field, pushing the rest of
 * the card down rather than covering it. Typing and ignoring it works like a plain field.
 */
export function ItemNameCombobox({ id, value, error, onChange, onBlur, onSelectSuggestion }: ItemNameComboboxProps) {
  const listId = `${id}-suggestions`;
  const timer = React.useRef<number | undefined>(undefined);
  // Suggestions are looked up only for what the user types, never for a prefilled name.
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const { suggestions } = useItemSuggestions(open ? term : "");
  const [shownSuggestions, setShownSuggestions] = React.useState(suggestions);
  if (suggestions !== shownSuggestions) {
    setShownSuggestions(suggestions);
    setActiveIndex(-1);
  }

  const typed = value.trim();
  const expanded =
    open && productSearchTerm(typed) !== null && suggestions !== null && suggestions !== undefined && suggestions.length > 0;
  // Option 0 keeps the typed name; the suggestions follow.
  const optionCount = expanded ? suggestions.length + 1 : 0;
  const optionId = (index: number) => `${listId}-${index}`;
  const activeId = expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function close() {
    window.clearTimeout(timer.current);
    setOpen(false);
    setTerm("");
    setActiveIndex(-1);
  }

  function choose(index: number) {
    const suggestion = index > 0 ? suggestions?.[index - 1] : undefined;
    close();
    if (suggestion) onSelectSuggestion(suggestion);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    onChange(next);
    setOpen(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTerm(next), SUGGEST_DEBOUNCE_MS);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!expanded) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((activeIndex + 1) % optionCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(activeIndex <= 0 ? optionCount - 1 : activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <Field label="Name" id={id} error={error}>
      {(control) => (
        <div className="flex flex-col gap-6">
          <input
            {...control}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            aria-activedescendant={activeId}
            autoComplete="off"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              close();
              onBlur();
            }}
            className={controlClassName}
          />
          {expanded && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Item suggestions"
              className="flex flex-col gap-2 rounded-md border border-line bg-surface p-6 shadow-subtle motion-safe:animate-fade-in"
            >
              <SuggestionOption
                id={optionId(0)}
                active={activeIndex === 0}
                onChoose={() => choose(0)}
                className="flex-row items-center gap-8 text-primary"
              >
                <Plus aria-hidden className="size-icon-md shrink-0" />
                <span className="type-body-sm font-medium wrap-break-word">Use “{typed}” as a new item</span>
              </SuggestionOption>
              {suggestions.map((suggestion, index) => {
                const details = productDetailsLine(suggestion);
                return (
                  <SuggestionOption
                    key={suggestion.productMatchKey}
                    id={optionId(index + 1)}
                    active={activeIndex === index + 1}
                    label={suggestionLabel(suggestion)}
                    onChoose={() => choose(index + 1)}
                  >
                    <span className="type-body-sm font-medium text-ink wrap-break-word">{suggestion.name}</span>
                    <span className="type-caption text-ink-muted tabular-nums wrap-break-word">
                      {details ? `${details} · ` : ""}
                      {suggestionPriceLine(suggestion)}
                    </span>
                  </SuggestionOption>
                );
              })}
            </ul>
          )}
          <p aria-live="polite" className="sr-only">
            {expanded
              ? `${suggestions.length} ${suggestions.length === 1 ? "suggestion" : "suggestions"}. Use the up and down arrows to choose.`
              : ""}
          </p>
        </div>
      )}
    </Field>
  );
}

type SuggestionOptionProps = {
  id: string;
  active: boolean;
  /** The option's accessible name when its visible text reads poorly as one line. */
  label?: string;
  onChoose: () => void;
  className?: string;
  children: React.ReactNode;
};

function SuggestionOption({ id, active, label, onChoose, className, children }: SuggestionOptionProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      aria-label={label}
      // Keeps focus in the name field, so choosing doesn't close the list through a blur first.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onChoose}
      className={cn(
        "flex min-h-tap cursor-pointer flex-col justify-center gap-2 rounded-sm px-10 py-6 select-none hover:bg-surface-subtle",
        active && "bg-surface-subtle",
        className,
      )}
    >
      {children}
    </li>
  );
}

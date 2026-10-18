"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import {
  countPanelFilters,
  HISTORY_OWNERSHIPS,
  HISTORY_SORTS,
  isDefaultHistoryFilters,
  MAX_HISTORY_SEARCH_LENGTH,
  type HistoryFilters,
} from "@/domain/bill-history";
import { CATEGORIES, isCategory } from "@/domain/categories";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = "all";
const CATEGORY_OPTIONS = [{ value: ALL_CATEGORIES, label: "All categories" }, ...CATEGORIES];

type BillHistoryFiltersProps = {
  filters: HistoryFilters;
  /** Called with only the filters that changed. */
  onChange: (patch: Partial<HistoryFilters>) => void;
  onClear: () => void;
};

/**
 * Search plus the filter panel for Bill History. On phones the panel opens from a **Filters**
 * button; from `md` up it's always shown inline.
 */
export function BillHistoryFilters({ filters, onChange, onClear }: BillHistoryFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = React.useId();
  const panelCount = countPanelFilters(filters);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex gap-8">
        <SearchInput
          label="Search bills"
          placeholder="Search title, store or item"
          maxLength={MAX_HISTORY_SEARCH_LENGTH}
          value={filters.search}
          onDebouncedChange={(search) => onChange({ search })}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          className="px-16 md:hidden"
        >
          <SlidersHorizontal aria-hidden className="size-icon-md" />
          {panelCount > 0 ? `Filters (${panelCount})` : "Filters"}
        </Button>
      </div>

      <div
        id={panelId}
        role="group"
        aria-label="Filters"
        className={cn(
          "grid-cols-2 gap-12 rounded-lg bg-surface p-16 shadow-card md:grid md:grid-cols-4",
          isOpen ? "grid" : "hidden",
        )}
      >
        <TextField
          label="From"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => onChange({ from: event.target.value })}
        />
        <TextField
          label="To"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => onChange({ to: event.target.value })}
        />
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={filters.category ?? ALL_CATEGORIES}
          onValueChange={(value) => onChange({ category: isCategory(value) ? value : null })}
          className="col-span-2 md:col-span-1"
        />
        <Select
          label="Sort by"
          options={HISTORY_SORTS}
          value={filters.sort}
          onValueChange={(sort) => onChange({ sort })}
          className="col-span-2 md:col-span-1"
        />
        <div className="col-span-2 flex flex-col gap-12 md:col-span-4 md:flex-row md:items-center md:justify-between">
          <SegmentedControl
            label="Whose bills"
            options={HISTORY_OWNERSHIPS}
            value={filters.ownership}
            onValueChange={(ownership) => onChange({ ownership })}
            fullWidth
            className="md:w-fit"
          />
          {!isDefaultHistoryFilters(filters) && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear} className="self-start md:self-auto">
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

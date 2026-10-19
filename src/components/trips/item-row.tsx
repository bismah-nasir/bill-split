"use client";

import * as React from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { TextField } from "@/components/ui/text-field";
import { formatPaisa } from "@/domain/format";
import { allocateEqually, lineTotalPaisa, parseQuantityToMilli, parseRupeesToPaisa } from "@/domain/money";
import type { ItemSuggestion } from "@/domain/types";
import { cn } from "@/lib/utils";

import { ItemNameCombobox } from "./item-name-combobox";
import { ParticipantPicker, type PickerPerson } from "./participant-picker";
import {
  fieldId,
  itemPath,
  PRODUCT_FIELDS,
  type FormItem,
  type ItemField,
  type ProductField,
} from "./trip-form-state";

const DETAIL_FIELDS: { field: ItemField; label: string; placeholder?: string }[] = [
  { field: "brand", label: "Brand" },
  { field: "variant", label: "Variant", placeholder: "e.g. Extra virgin" },
  { field: "packSize", label: "Pack size", placeholder: "e.g. 1 litre, 500 g" },
  { field: "unit", label: "Unit", placeholder: "e.g. kg, pack" },
];

type ItemRowProps = {
  item: FormItem;
  index: number;
  errors: Record<string, string>;
  /** Everyone on the bill, in bill order, labelled as the chips show them. */
  people: PickerPerson[];
  canRemove: boolean;
  /** Shown under the row, e.g. the "Only know the total?" hint on the first one. */
  hint?: string;
  onChange: (field: ItemField, value: string) => void;
  onBlur: (field: ItemField) => void;
  /** Sets name, brand, variant, pack size and unit together (a chosen suggestion). */
  onFillProduct: (product: Record<ProductField, string>) => void;
  onAssigneesChange: (keys: string[]) => void;
  onRemove: () => void;
  /** Enter in the price field adds the next row. */
  onAddItem: () => void;
};

/** One item card: name, quantity × price with a live line total, payer, and optional details. */
export function ItemRow({
  item,
  index,
  errors,
  people,
  canRemove,
  hint,
  onChange,
  onBlur,
  onFillProduct,
  onAssigneesChange,
  onRemove,
  onAddItem,
}: ItemRowProps) {
  const number = index + 1;
  const errorOf = (field: string) => errors[itemPath(item.rowKey, field)];
  // The price of the suggestion chosen for this row, until the product is changed by hand.
  const [lastPricePaisa, setLastPricePaisa] = React.useState<number | null>(null);
  const change = (field: ItemField, value: string) => {
    if ((PRODUCT_FIELDS as readonly string[]).includes(field)) setLastPricePaisa(null);
    onChange(field, value);
  };
  const fieldProps = (field: ItemField) => ({
    id: fieldId(itemPath(item.rowKey, field)),
    value: item[field],
    error: errorOf(field),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => change(field, event.target.value),
    onBlur: () => onBlur(field),
  });

  const hasDetailError = DETAIL_FIELDS.some(({ field }) => errorOf(field) !== undefined);
  const [detailsOpen, setDetailsOpen] = React.useState(() =>
    DETAIL_FIELDS.some(({ field }) => item[field].trim().length > 0),
  );
  const showDetails = detailsOpen || hasDetailError;
  const detailsId = React.useId();

  // Fills the product but not the price, and opens More details so the filled fields show.
  function selectSuggestion(suggestion: ItemSuggestion) {
    onFillProduct({
      name: suggestion.name,
      brand: suggestion.brand ?? "",
      variant: suggestion.variant ?? "",
      packSize: suggestion.packSize ?? "",
      unit: suggestion.unit ?? "",
    });
    setDetailsOpen(true);
    setLastPricePaisa(suggestion.latestPricePaisa);
  }

  const quantity = parseQuantityToMilli(item.quantity);
  const unitPrice = parseRupeesToPaisa(item.unitPrice);
  const lineTotal =
    quantity.ok && unitPrice.ok ? lineTotalPaisa(quantity.value, unitPrice.value) : null;

  return (
    <li>
      <Card className="flex flex-col gap-12 p-16">
        <div className="flex items-center justify-between gap-8">
          <h3 className="type-body-sm font-medium text-ink-secondary">Item {number}</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove item ${number}`}
            disabled={!canRemove}
            onClick={onRemove}
            className="-my-8 -mr-8"
          >
            <Trash2 aria-hidden className="size-icon-lg" />
          </Button>
        </div>

        <ItemNameCombobox
          id={fieldId(itemPath(item.rowKey, "name"))}
          value={item.name}
          error={errorOf("name")}
          onChange={(value) => change("name", value)}
          onBlur={() => onBlur("name")}
          onSelectSuggestion={selectSuggestion}
        />

        <div className="flex items-start gap-8">
          <TextField
            label="Qty"
            inputMode="decimal"
            autoComplete="off"
            className="w-72 shrink-0"
            {...fieldProps("quantity")}
          />
          <TextField
            label="Unit price"
            prefix="Rs."
            inputMode="decimal"
            autoComplete="off"
            className="flex-1"
            hint={lastPricePaisa === null ? undefined : `Last price ${formatPaisa(lastPricePaisa)}`}
            {...fieldProps("unitPrice")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddItem();
              }
            }}
          />
          <div className="flex shrink-0 flex-col items-end gap-6">
            <span className="type-body-sm font-medium text-ink">Total</span>
            <output
              htmlFor={`${fieldId(itemPath(item.rowKey, "quantity"))} ${fieldId(itemPath(item.rowKey, "unitPrice"))}`}
              className="flex h-control-md items-center"
            >
              {lineTotal === null ? (
                <span className="text-ink-muted">—</span>
              ) : (
                <MoneyText paisa={lineTotal} className="font-semibold" />
              )}
            </output>
          </div>
        </div>

        {people.length < 2 ? (
          <p className="type-caption text-ink-muted">Paid by you</p>
        ) : (
          <div className="flex flex-col gap-6">
            <ParticipantPicker
              id={fieldId(itemPath(item.rowKey, "assignees"))}
              label={`Who pays for item ${number}`}
              people={people}
              selected={item.assigneeKeys}
              error={errorOf("assignees")}
              onChange={onAssigneesChange}
            />
            {lineTotal !== null && item.assigneeKeys.length > 0 && (
              <p className="type-caption tabular-nums text-ink-muted">
                {splitPreview(lineTotal, item.assigneeKeys, people)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-12">
          <button
            type="button"
            aria-expanded={showDetails}
            aria-controls={detailsId}
            // A field with an error stays visible until it's fixed.
            onClick={() => setDetailsOpen(!showDetails)}
            className="flex min-h-tap-sm items-center gap-6 self-start rounded-sm type-button-sm text-primary"
          >
            More details
            <ChevronDown aria-hidden className={cn("size-icon-md", showDetails && "rotate-180")} />
          </button>
          {showDetails && (
            <div id={detailsId} className="grid grid-cols-1 gap-12 sm:grid-cols-2">
              {DETAIL_FIELDS.map(({ field, label, placeholder }) => (
                <TextField
                  key={field}
                  label={`${label} (optional)`}
                  autoComplete="off"
                  placeholder={placeholder}
                  {...fieldProps(field)}
                />
              ))}
            </div>
          )}
        </div>

        {hint && <p className="type-caption text-ink-muted">{hint}</p>}
      </Card>
    </li>
  );
}

/**
 * "Ben pays Rs. 900.00", or "Split 3 ways: Rs. 1,666.67 / Rs. 1,666.67 / Rs. 1,666.66" in bill
 * order, which is how the server allocates the extra paisa.
 */
function splitPreview(lineTotal: number, assigneeKeys: string[], people: PickerPerson[]): string {
  const ordered = people.filter((person) => assigneeKeys.includes(person.key));
  if (ordered.length === 1) {
    const [payer] = ordered;
    return `${payer.label} ${payer.label === "You" ? "pay" : "pays"} ${formatPaisa(lineTotal)}`;
  }
  const amounts = allocateEqually(lineTotal, ordered.map((person) => person.key));
  return `Split ${amounts.length} ways: ${amounts.map((amount) => formatPaisa(amount.amountPaisa)).join(" / ")}`;
}

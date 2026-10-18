"use client";

import * as React from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { TextField } from "@/components/ui/text-field";
import { lineTotalPaisa, parseQuantityToMilli, parseRupeesToPaisa } from "@/domain/money";
import { cn } from "@/lib/utils";

import { fieldId, itemPath, type FormItem, type ItemField } from "./trip-form-state";

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
  canRemove: boolean;
  /** Shown under the row, e.g. the "Only know the total?" hint on the first one. */
  hint?: string;
  onChange: (field: ItemField, value: string) => void;
  onBlur: (field: ItemField) => void;
  onRemove: () => void;
  /** Enter in the price field adds the next row. */
  onAddItem: () => void;
};

/** One item card: name, quantity × price with a live line total, payer, and optional details. */
export function ItemRow({
  item,
  index,
  errors,
  canRemove,
  hint,
  onChange,
  onBlur,
  onRemove,
  onAddItem,
}: ItemRowProps) {
  const number = index + 1;
  const errorOf = (field: string) => errors[itemPath(item.rowKey, field)];
  const fieldProps = (field: ItemField) => ({
    id: fieldId(itemPath(item.rowKey, field)),
    value: item[field],
    error: errorOf(field),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(field, event.target.value),
    onBlur: () => onBlur(field),
  });

  const hasDetailError = DETAIL_FIELDS.some(({ field }) => errorOf(field) !== undefined);
  const [detailsOpen, setDetailsOpen] = React.useState(() =>
    DETAIL_FIELDS.some(({ field }) => item[field].trim().length > 0),
  );
  const showDetails = detailsOpen || hasDetailError;
  const detailsId = React.useId();

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

        <TextField label="Name" autoComplete="off" {...fieldProps("name")} />

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

        <p className="type-caption text-ink-muted">Paid by you</p>

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

"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ItemRow } from "./item-row";
import { itemPath, type FormItem, type TripFormAction } from "./trip-form-state";

type ItemEditorProps = {
  items: FormItem[];
  errors: Record<string, string>;
  dispatch: React.Dispatch<TripFormAction>;
};

const TOTAL_ONLY_HINT = "Only know the total? Leave quantity as 1 and enter the total as the price.";

/** The bill's item cards and **Add item**. */
export function ItemEditor({ items, errors, dispatch }: ItemEditorProps) {
  const headingId = React.useId();
  const addItem = () => dispatch({ type: "addItem" });

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <h2 id={headingId} className="type-h3">
        Items
      </h2>
      <ul className="flex flex-col gap-12">
        {items.map((item, index) => (
          <ItemRow
            key={item.rowKey}
            item={item}
            index={index}
            errors={errors}
            canRemove={items.length > 1}
            hint={index === 0 ? TOTAL_ONLY_HINT : undefined}
            onChange={(field, value) => dispatch({ type: "setItem", rowKey: item.rowKey, field, value })}
            onBlur={(field) => dispatch({ type: "blur", path: itemPath(item.rowKey, field) })}
            onRemove={() => dispatch({ type: "removeItem", rowKey: item.rowKey })}
            onAddItem={addItem}
          />
        ))}
      </ul>
      <Button type="button" variant="secondary" className="self-start" onClick={addItem}>
        <Plus aria-hidden className="size-icon-md" />
        Add item
      </Button>
    </section>
  );
}

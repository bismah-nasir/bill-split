"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/ui/money-text";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { CATEGORIES } from "@/domain/categories";
import { lineTotalPaisa, parseQuantityToMilli, parseRupeesToPaisa } from "@/domain/money";
import { OWNER_KEY, type PersonInput, type TripDetailsInput } from "@/domain/trip-validation";
import type { AppError } from "@/lib/db/errors";

import { billViewFromForm } from "./bill-view";
import { ItemEditor } from "./item-editor";
import type { PickerPerson } from "./participant-picker";
import { PeopleEditor } from "./people-editor";
import { CategoryBadge, tripMetaLine } from "./trip-meta";
import { TripSummary } from "./trip-summary";
import {
  fieldId,
  initTripFormState,
  isFormDirty,
  toFormValue,
  tripFormReducer,
  validateForm,
  type FormItem,
  type TripFormState,
  type TripFormValue,
} from "./trip-form-state";

/** Lets the page ask about the form, e.g. before discarding it on **Cancel**. */
export type TripFormHandle = { isDirty: () => boolean };

type TripFormProps = {
  mode: "create" | "edit";
  initialValue: TripFormValue;
  /** Saves the bill. Resolves to `null` on success, or to the error to show. */
  onSubmit: (value: TripFormValue) => Promise<AppError | null>;
  ref?: React.Ref<TripFormHandle>;
};

const SAVE_FAILED_MESSAGE = "Couldn't save your bill. Your changes are still here. Try again.";

/** Create or edit a bill: details, people and items, then a review of the split before saving. */
export function TripForm({ mode, initialValue, onSubmit, ref }: TripFormProps) {
  const [state, dispatch] = React.useReducer(tripFormReducer, initialValue, initTripFormState);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useImperativeHandle(ref, () => ({ isDirty: () => isFormDirty(state, initialValue) }), [
    state,
    initialValue,
  ]);

  // Focus the field the reducer asked for (the first error, or a new row's name).
  React.useEffect(() => {
    if (!state.focus) return;
    const element = document.getElementById(fieldId(state.focus.path));
    if (!element) return;
    element.scrollIntoView({ block: "center" });
    element.focus({ preventScroll: true });
  }, [state.focus]);

  async function save() {
    setIsSaving(true);
    const error = await onSubmit(toFormValue(state));
    // On success the page navigates away; keep the saving state until it does.
    if (!error) return;
    setIsSaving(false);
    dispatch({
      type: "saveFailed",
      fieldErrors: error.code === "VALIDATION" ? error.fieldErrors : {},
      message: error.code === "UNKNOWN" || error.code === "OFFLINE" ? SAVE_FAILED_MESSAGE : error.message,
    });
  }

  if (state.step === "review") {
    return (
      <ReviewStep
        state={state}
        isSaving={isSaving}
        saveLabel={mode === "create" ? "Save bill" : "Save changes"}
        onBack={() => dispatch({ type: "backToEdit" })}
        onSave={() => void save()}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        dispatch({ type: "review" });
      }}
      className="flex flex-col gap-24"
    >
      <DetailsSection
        details={state.details}
        errors={state.errors}
        onChange={(field, value) => dispatch({ type: "setDetail", field, value })}
        onBlur={(path) => dispatch({ type: "blur", path })}
      />
      <PeopleEditor people={state.people} items={state.items} errors={state.errors} dispatch={dispatch} />
      <ItemEditor
        items={state.items}
        errors={state.errors}
        people={pickerPeople(state.people)}
        dispatch={dispatch}
      />
      <StickyFooter>
        <RunningTotal items={state.items} />
        <Button type="submit" size="lg">
          Review
        </Button>
      </StickyFooter>
    </form>
  );
}

type DetailsSectionProps = {
  details: TripDetailsInput;
  errors: Record<string, string>;
  onChange: (field: keyof TripDetailsInput, value: string) => void;
  onBlur: (path: string) => void;
};

function DetailsSection({ details, errors, onChange, onBlur }: DetailsSectionProps) {
  const headingId = React.useId();
  const fieldProps = (field: "title" | "storeName" | "tripDate") => ({
    id: fieldId(field),
    value: details[field],
    error: errors[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(field, event.target.value),
    onBlur: () => onBlur(field),
  });

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-12">
      <h2 id={headingId} className="type-h3">
        Details
      </h2>
      <Card className="flex flex-col gap-16 p-16 md:p-24">
        <TextField label="Title" placeholder="e.g. Imtiaz Grocery" autoComplete="off" {...fieldProps("title")} />
        <TextField label="Store (optional)" autoComplete="off" {...fieldProps("storeName")} />
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          <TextField label="Date" type="date" {...fieldProps("tripDate")} />
          <Select
            label="Category"
            id={fieldId("category")}
            options={CATEGORIES}
            value={details.category}
            error={errors.category}
            onValueChange={(value) => onChange("category", value)}
          />
        </div>
      </Card>
    </section>
  );
}

/** Everyone on the bill in bill order, labelled as the item chips show them. */
function pickerPeople(people: PersonInput[]): PickerPerson[] {
  return [
    { key: OWNER_KEY, label: "You" },
    ...people.map((person, index) => ({ key: person.key, label: person.name.trim() || `Person ${index + 2}` })),
  ];
}

/** "3 items · Total Rs. 1,234.50", counting only rows whose quantity and price are valid. */
function RunningTotal({ items }: { items: FormItem[] }) {
  const totalPaisa = items.reduce((sum, item) => {
    const quantity = parseQuantityToMilli(item.quantity);
    const unitPrice = parseRupeesToPaisa(item.unitPrice);
    return quantity.ok && unitPrice.ok ? sum + lineTotalPaisa(quantity.value, unitPrice.value) : sum;
  }, 0);

  return (
    <p aria-live="polite" className="flex min-w-0 flex-col type-body-sm text-ink-secondary sm:flex-row sm:gap-6">
      <span>
        {items.length} {items.length === 1 ? "item" : "items"}
        <span className="hidden sm:inline"> ·</span>
      </span>
      <span>
        Total <MoneyText paisa={totalPaisa} className="font-semibold text-ink" />
      </span>
    </p>
  );
}

type ReviewStepProps = {
  state: TripFormState;
  isSaving: boolean;
  saveLabel: string;
  onBack: () => void;
  onSave: () => void;
};

function ReviewStep({ state, isSaving, saveLabel, onBack, onSave }: ReviewStepProps) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const saveErrorRef = React.useRef<HTMLDivElement>(null);
  const validation = validateForm(state);

  // A new screen: start at its top, and move focus there for screen readers.
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, []);

  // The message sits below the breakdown; bring it into view so a failed save is never missed.
  React.useEffect(() => {
    if (state.saveError) saveErrorRef.current?.scrollIntoView({ block: "center" });
  }, [state.saveError]);

  // The reducer only enters review with a valid form.
  if (!validation.ok) return null;
  const { details } = validation.value;
  const bill = billViewFromForm(validation.value);

  return (
    <div className="flex flex-col gap-24">
      <h2 ref={headingRef} tabIndex={-1} className="type-h2">
        Review your bill
      </h2>

      <Card className="flex flex-col gap-8 p-16 md:p-24">
        <p className="type-h3 break-words">{details.title}</p>
        <p className="type-body-sm text-ink-secondary">
          {tripMetaLine(details.storeName, details.tripDate)}
        </p>
        <div className="flex flex-wrap items-center gap-8">
          <CategoryBadge category={details.category} />
          <span className="type-caption text-ink-muted">People: {bill.people.join(", ")}</span>
        </div>
      </Card>

      <TripSummary bill={bill} />

      {state.saveError && (
        <Alert
          ref={saveErrorRef}
          action={
            <Button type="button" variant="secondary" size="sm" disabled={isSaving} onClick={onSave}>
              Try again
            </Button>
          }
        >
          {state.saveError}
        </Alert>
      )}

      <StickyFooter>
        <Button type="button" variant="secondary" size="lg" disabled={isSaving} onClick={onBack}>
          Back to edit
        </Button>
        <Button type="button" size="lg" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Saving…" : saveLabel}
        </Button>
      </StickyFooter>
    </div>
  );
}

/** Stays in view above the mobile tab bar (or the window's bottom on desktop). */
function StickyFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-tab-bar z-10 -mx-16 flex items-center justify-between gap-12 border-t border-line bg-surface px-16 py-12 shadow-raised md:bottom-16 md:mx-0 md:rounded-lg md:border md:shadow-card">
      {children}
    </div>
  );
}

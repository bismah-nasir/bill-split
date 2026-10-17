"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type InlineEditFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  /** A failure that doesn't belong to the field, shown above the buttons. */
  formMessage: string | null;
  /** The field being edited. */
  children: React.ReactNode;
};

/** A one-field edit form with Save and Cancel. Escape cancels. */
export function InlineEditForm({
  onSubmit,
  onCancel,
  isPending,
  formMessage,
  children,
}: InlineEditFormProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !isPending) onCancel();
      }}
      className="flex flex-col gap-12"
    >
      {children}
      {formMessage && <Alert>{formMessage}</Alert>}
      <div className="flex gap-8">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

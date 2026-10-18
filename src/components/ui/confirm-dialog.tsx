"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { Alert } from "./alert";
import { Button } from "./button";
import { dialogContentClassName, dialogOverlayClassName, dialogPositionerClassName } from "./dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Shown on the confirm button while `isPending`, e.g. "Deleting…". */
  pendingLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  /** While pending, both buttons are disabled and the dialog can't be dismissed. */
  isPending?: boolean;
  /** A failure to show inside the dialog, e.g. when deleting failed. */
  error?: string | null;
  onConfirm: () => void;
  /** Where focus goes on close; call `event.preventDefault()` to move it yourself. */
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * Asks before a consequential action. The dialog stays open while the action runs; the
 * caller closes it (or navigates away) when it succeeds.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  isPending = false,
  error,
  onConfirm,
  onCloseAutoFocus,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={dialogOverlayClassName} />
        <div className={dialogPositionerClassName}>
          <AlertDialogPrimitive.Content onCloseAutoFocus={onCloseAutoFocus} className={dialogContentClassName}>
            <div className="flex flex-col gap-8">
              <AlertDialogPrimitive.Title className="type-h3">{title}</AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="type-body-sm text-ink-secondary">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="flex flex-col-reverse gap-8 sm:flex-row sm:justify-end">
              <AlertDialogPrimitive.Cancel asChild>
                <Button variant="secondary" disabled={isPending}>
                  {cancelLabel}
                </Button>
              </AlertDialogPrimitive.Cancel>
              {/* Not `AlertDialog.Action`, which would close the dialog before the action finishes. */}
              <Button variant={variant} disabled={isPending} onClick={onConfirm}>
                {isPending && pendingLabel ? pendingLabel : confirmLabel}
              </Button>
            </div>
          </AlertDialogPrimitive.Content>
        </div>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { Alert } from "./alert";
import { Button } from "./button";

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
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay motion-safe:animate-fade-in" />
        <AlertDialogPrimitive.Content className="fixed inset-x-16 top-1/2 z-50 mx-auto flex max-w-form -translate-y-1/2 flex-col gap-16 rounded-lg bg-surface-elevated p-24 shadow-floating motion-safe:animate-dialog-in">
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
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

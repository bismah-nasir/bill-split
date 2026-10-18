"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "./button";

// Shared by every modal so they look and animate alike. The positioner centres the dialog and
// keeps a gutter around it; the dialog scrolls inside it when it's taller than the screen.
export const dialogOverlayClassName = "fixed inset-0 z-50 bg-overlay motion-safe:animate-fade-in";
export const dialogPositionerClassName =
  "pointer-events-none fixed inset-16 z-50 flex items-center justify-center";
export const dialogContentClassName =
  "pointer-events-auto flex max-h-full w-full max-w-form flex-col gap-16 overflow-y-auto rounded-lg bg-surface-elevated p-24 shadow-floating motion-safe:animate-dialog-in";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Where focus goes when the dialog opens; call `event.preventDefault()` to move it yourself. */
  onOpenAutoFocus?: (event: Event) => void;
};

/** A modal with a title, a close button and any content (Radix Dialog: focus trap, Escape closes). */
export function Dialog({ open, onOpenChange, title, description, children, onOpenAutoFocus }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={dialogOverlayClassName} />
        <div className={dialogPositionerClassName}>
          <DialogPrimitive.Content
            onOpenAutoFocus={onOpenAutoFocus}
            // Without a description, tell Radix there's deliberately none.
            {...(description ? {} : { "aria-describedby": undefined })}
            className={dialogContentClassName}
          >
            <div className="flex items-start justify-between gap-12">
              <div className="flex min-w-0 flex-col gap-8">
                <DialogPrimitive.Title className="type-h3">{title}</DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="type-body-sm text-ink-secondary">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close" className="-mt-8 -mr-8">
                  <X aria-hidden className="size-icon-lg" />
                </Button>
              </DialogPrimitive.Close>
            </div>
            {children}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

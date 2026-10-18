"use client";

import * as React from "react";

import { Alert } from "./alert";

type ToastVariant = "success" | "info" | "error";
type Toast = { id: number; message: string; variant: ToastVariant };
type ShowToast = (message: string, variant?: ToastVariant) => void;

const ToastContext = React.createContext<ShowToast | null>(null);

const TOAST_DURATION_MS = 4000;

/**
 * The app's one feedback mechanism for actions that leave the page, e.g. "Bill deleted"
 * after returning to the dashboard. One toast at a time; a new one replaces the last.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<Toast | null>(null);
  const nextId = React.useRef(0);

  const show = React.useCallback<ShowToast>((message, variant = "success") => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, variant });
  }, []);

  React.useEffect(() => {
    if (toast === null) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      {/* Always rendered, so screen readers announce messages added to it. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-tab-bar z-30 px-16 pb-16 md:bottom-0 md:pb-24"
      >
        {toast && (
          <Alert
            key={toast.id}
            role="none"
            variant={toast.variant}
            className="pointer-events-auto mx-auto max-w-form shadow-floating motion-safe:animate-toast-in"
          >
            {toast.message}
          </Alert>
        )}
      </div>
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  const show = React.useContext(ToastContext);
  if (show === null) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

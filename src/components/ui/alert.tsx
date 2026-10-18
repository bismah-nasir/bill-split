import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-8 rounded-md px-14 py-12 type-body-sm", {
  variants: {
    variant: {
      error: "bg-error-soft text-error",
      warning: "bg-warning-soft text-warning",
      success: "bg-success-soft text-success",
      info: "bg-primary-soft text-primary",
    },
  },
  defaultVariants: { variant: "error" },
});

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const ICONS: Record<AlertVariant, LucideIcon> = {
  error: CircleAlert,
  warning: TriangleAlert,
  success: CircleCheck,
  info: Info,
};

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** An optional button, e.g. "Try again", shown at the end of the message. */
    action?: React.ReactNode;
  };

/** Inline, announced message, e.g. above a form's submit button. */
export function Alert({ className, variant, action, children, ...props }: AlertProps) {
  const resolved = variant ?? "error";
  const Icon = ICONS[resolved];
  return (
    <div
      role={resolved === "error" || resolved === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), action && "items-center", className)}
      {...props}
    >
      <Icon aria-hidden className={cn("size-icon-md shrink-0", !action && "mt-2")} />
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

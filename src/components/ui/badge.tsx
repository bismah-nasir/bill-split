import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-4 rounded-pill px-8 py-2 type-caption whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-ink-secondary",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        error: "bg-error-soft text-error",
        primary: "bg-primary-soft text-primary",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/** Small status label, e.g. a category, "Owned" / "Shared" or an invitation state. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

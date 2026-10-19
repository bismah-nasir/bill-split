import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-8 whitespace-nowrap select-none transition-colors duration-fast ease-standard disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-ink-inverse hover:bg-primary-pressed shadow-floating",
        secondary:
          "bg-surface border border-line-control text-ink hover:bg-surface-subtle",
        ghost: "bg-transparent text-ink hover:bg-surface-subtle",
        danger: "bg-error text-ink-inverse",
        /** Lower-emphasis destructive action, e.g. Sign out. */
        "danger-soft": "bg-error-soft border border-error text-error hover:bg-error-soft-hover",
      },
      size: {
        lg: "h-control-lg px-28 type-button rounded-pill",
        md: "h-control-md px-24 type-button-sm rounded-pill",
        sm: "h-control-sm px-16 type-button-sm rounded-pill",
        icon: "size-tap rounded-pill",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a `next/link`) with button styling. */
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };

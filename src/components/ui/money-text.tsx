import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { formatPaisa } from "@/domain/format";
import { cn } from "@/lib/utils";

const moneyTextVariants = cva("font-numeric whitespace-nowrap tabular-nums", {
  variants: {
    size: {
      sm: "text-body-sm",
      body: "text-body",
      h3: "text-h3",
      numeric: "text-numeric",
    },
  },
  defaultVariants: { size: "body" },
});

type MoneyTextProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof moneyTextVariants> & { paisa: number };

/** An amount such as "Rs. 1,234.56", in the numeric font with aligned digits. */
export function MoneyText({ paisa, size, className, ...props }: MoneyTextProps) {
  return (
    <span className={cn(moneyTextVariants({ size }), className)} {...props}>
      {formatPaisa(paisa)}
    </span>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

/** Raised white surface for grouped content. */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-lg bg-surface p-24 shadow-card", className)} {...props} />;
}

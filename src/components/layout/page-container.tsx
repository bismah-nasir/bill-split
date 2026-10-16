import * as React from "react";

import { cn } from "@/lib/utils";

/** Centred, width-capped content column with the standard side gutters. */
export function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-content px-16 md:px-24", className)} {...props} />;
}

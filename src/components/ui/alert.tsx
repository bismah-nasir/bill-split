import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/** Inline, announced error message, e.g. above a form's submit button. */
export function Alert({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-8 rounded-md bg-error-soft px-14 py-12 type-body-sm text-error",
        className,
      )}
      {...props}
    >
      <CircleAlert aria-hidden className="mt-2 size-icon-md shrink-0" />
      <div>{children}</div>
    </div>
  );
}

"use client";

import * as React from "react";

/**
 * While `enabled`, asks the browser to confirm before the page is reloaded, closed or left for
 * another site. Browsers show their own wording; the message can't be customised.
 *
 * In-app navigation doesn't need this: Next.js keeps recently visited pages alive, drafts
 * included. The listener is removed while the page is hidden.
 */
export function useWarnBeforeUnload(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);
}

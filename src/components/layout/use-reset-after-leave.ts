"use client";

import * as React from "react";

/**
 * Next.js keeps visited pages alive (hidden with React's `<Activity>`) and restores their
 * state on return. That's right for a draft, but wrong once a page has finished its job: a
 * saved form would come back still "Saving…".
 *
 * Use `key` as the React key of the page's stateful content and call `resetAfterLeave()` once
 * it's done (e.g. just before navigating away after a save). When the page is next hidden,
 * the key changes, so the content starts fresh on the next visit. Until then nothing resets.
 */
export function useResetAfterLeave() {
  const [key, setKey] = React.useState(0);
  const shouldReset = React.useRef(false);

  // Cleanup runs when Activity hides the page (and on unmount, where it's harmless).
  React.useLayoutEffect(() => {
    return () => {
      if (shouldReset.current) {
        shouldReset.current = false;
        setKey((current) => current + 1);
      }
    };
  }, []);

  const resetAfterLeave = React.useCallback(() => {
    shouldReset.current = true;
  }, []);

  return { key, resetAfterLeave };
}

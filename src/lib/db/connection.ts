"use client";

import * as React from "react";
import { useConvexConnectionState } from "convex/react";

/** How long the connection may be down before the UI says so. */
const TROUBLE_AFTER_MS = 10_000;

/**
 * True once the connection to the backend has been down for a while (Convex keeps retrying
 * in the background). Lets a page that's waiting for data say why, instead of loading forever.
 */
export function useConnectionTrouble(): boolean {
  const { isWebSocketConnected } = useConvexConnectionState();
  const [isTrouble, setIsTrouble] = React.useState(false);

  React.useEffect(() => {
    if (isWebSocketConnected) return;
    const timer = window.setTimeout(() => setIsTrouble(true), TROUBLE_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      setIsTrouble(false);
    };
  }, [isWebSocketConnected]);

  return isTrouble && !isWebSocketConnected;
}

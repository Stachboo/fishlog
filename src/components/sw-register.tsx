"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount.
 * Only runs when NEXT_PUBLIC_ENABLE_OFFLINE === "true".
 * Add this component to the root layout.
 */
export function SWRegister() {
  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[FishLog SW] registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[FishLog SW] registration failed:", err);
        });
    }
  }, []);

  return null;
}

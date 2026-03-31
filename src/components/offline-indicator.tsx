"use client";

import { useEffect, useState } from "react";
import { getQueueSize, processQueue, isOfflineEnabled } from "@/lib/services/offline";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Refresh queue count
  async function refreshQueueSize() {
    const size = await getQueueSize();
    setQueueSize(size);
  }

  useEffect(() => {
    if (!isOfflineEnabled()) return;

    // Init from navigator
    setIsOnline(navigator.onLine);

    function handleOffline() {
      setIsOnline(false);
      refreshQueueSize();
    }

    async function handleOnline() {
      setIsOnline(true);
      const size = await getQueueSize();
      if (size > 0) {
        setSyncing(true);
        await processQueue();
        setSyncing(false);
        await refreshQueueSize();
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Poll queue size every 10s when offline
    const interval = setInterval(() => {
      if (!navigator.onLine) refreshQueueSize();
    }, 10_000);

    refreshQueueSize();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  if (!isOfflineEnabled()) return null;

  // Online with no pending sync — nothing to show
  if (isOnline && !syncing && queueSize === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: syncing ? "#1a3a5c" : "#b45309",
        color: "#fff",
        padding: "0.5rem 1.25rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: 500,
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {syncing ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "0.75rem",
              height: "0.75rem",
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Synchronisation…
        </>
      ) : (
        <>
          <span>⚡</span>
          Mode hors-ligne
          {queueSize > 0 && (
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                padding: "0 0.4em",
                marginLeft: "0.25rem",
              }}
            >
              {queueSize} en attente
            </span>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

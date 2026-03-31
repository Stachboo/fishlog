"use client";

import { useState, useEffect } from "react";

// VAPID public key from env (set at build time)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type PushStatus = "unsupported" | "denied" | "disabled" | "enabled" | "loading";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export function PushToggle() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setCurrentEndpoint(sub.endpoint);
          setStatus("enabled");
        } else {
          setStatus("disabled");
        }
      })
      .catch(() => setStatus("disabled"));
  }, []);

  async function handleEnable() {
    if (!VAPID_PUBLIC_KEY) {
      console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
      return;
    }

    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
        }),
      });

      setCurrentEndpoint(sub.endpoint);
      setStatus("enabled");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setStatus("disabled");
    }
  }

  async function handleDisable() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setCurrentEndpoint(null);
      setStatus("disabled");
    } catch (err) {
      console.error("Unsubscribe failed:", err);
      setStatus("enabled");
    }
  }

  // Labels & styles per status
  const configs: Record<
    Exclude<PushStatus, "loading">,
    { label: string; description: string; canToggle: boolean; active: boolean }
  > = {
    unsupported: {
      label: "Non supporté",
      description: "Votre navigateur ne supporte pas les notifications push.",
      canToggle: false,
      active: false,
    },
    denied: {
      label: "Bloqué",
      description:
        "Les notifications sont bloquées. Modifiez les permissions dans votre navigateur.",
      canToggle: false,
      active: false,
    },
    disabled: {
      label: "Activez les alertes",
      description: "Recevez des notifications quand ça mord près de vous.",
      canToggle: true,
      active: false,
    },
    enabled: {
      label: "Alertes activées",
      description: "Vous recevrez des notifications pour les signalements à proximité.",
      canToggle: true,
      active: true,
    },
  };

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-md)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "var(--radius-md)",
          opacity: 0.6,
        }}
      >
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
          Chargement...
        </span>
      </div>
    );
  }

  const cfg = configs[status];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--spacing-md)",
        padding: "var(--spacing-md)",
        background: "var(--color-surface)",
        border: `1px solid ${cfg.active ? "var(--color-primary)" : "var(--color-surface-border)"}`,
        borderRadius: "var(--radius-md)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
        {/* Bell icon */}
        <svg
          width={20}
          height={20}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          style={{ color: cfg.active ? "var(--color-primary)" : "var(--color-text-muted)", flexShrink: 0 }}
        >
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
            fill="currentColor"
          />
        </svg>
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-small)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {cfg.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-micro)",
              color: "var(--color-text-muted)",
            }}
          >
            {cfg.description}
          </div>
        </div>
      </div>

      {cfg.canToggle && (
        <button
          onClick={cfg.active ? handleDisable : handleEnable}
          style={{
            padding: "var(--spacing-xs) var(--spacing-md)",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${cfg.active ? "var(--color-error)" : "var(--color-primary)"}`,
            background: "transparent",
            color: cfg.active ? "var(--color-error)" : "var(--color-primary)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-small)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all var(--duration-short)",
            flexShrink: 0,
          }}
        >
          {cfg.active ? "Désactiver" : "Activer"}
        </button>
      )}
    </div>
  );
}

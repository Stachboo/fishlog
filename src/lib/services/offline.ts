// ── Offline Sync Service ────────────────────────────────────────────────────
// IndexedDB-based sync queue for private data only (spots, sessions, memos).
// Community writes always require an online connection.
// Only active when NEXT_PUBLIC_ENABLE_OFFLINE === "true".

const DB_NAME = "fishlog-offline";
const DB_VERSION = 1;
const STORE_NAME = "sync-queue";

export interface SyncQueueItem {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  url: string;
  body?: unknown;
  timestamp: number;
  retries: number;
}

// ── Feature flag ───────────────────────────────────────────────────────────

export function isOfflineEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true";
}

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error);
      })
  );
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Add an operation to the sync queue.
 * If IndexedDB is full (QuotaExceededError), clears old items and retries.
 */
export async function addToQueue(
  item: Omit<SyncQueueItem, "id" | "timestamp" | "retries">
): Promise<void> {
  if (!isOfflineEnabled()) return;

  const entry: SyncQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    retries: 0,
  };

  try {
    await withStore("readwrite", (store) => store.add(entry));
  } catch (err) {
    // QuotaExceededError: purge oldest entries and retry once
    if (
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.code === 22)
    ) {
      await purgeOldest(10);
      try {
        await withStore("readwrite", (store) => store.add(entry));
      } catch {
        console.warn("[FishLog offline] Failed to queue operation after purge");
      }
    } else {
      console.warn("[FishLog offline] Failed to queue operation:", err);
    }
  }
}

/**
 * Replay all queued operations against the server (client-wins strategy).
 * Successfully replayed items are removed from the queue.
 */
export async function processQueue(): Promise<void> {
  if (!isOfflineEnabled()) return;
  if (!navigator.onLine) return;

  const items = await getAllItems();
  if (items.length === 0) return;

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body != null ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok || res.status === 409) {
        // 409 Conflict: server already has newer data, discard local
        await withStore("readwrite", (store) => store.delete(item.id));
      } else if (res.status >= 400 && res.status < 500) {
        // Client error: discard — retrying won't help
        await withStore("readwrite", (store) => store.delete(item.id));
      } else {
        // Server error: increment retry counter, keep in queue
        await incrementRetries(item);
      }
    } catch {
      // Network error: keep in queue
      await incrementRetries(item);
    }
  }
}

/**
 * Remove all items from the sync queue.
 */
export async function clearQueue(): Promise<void> {
  await withStore("readwrite", (store) => store.clear());
}

/**
 * Returns the number of pending operations in the queue.
 */
export async function getQueueSize(): Promise<number> {
  try {
    const result = await withStore("readonly", (store) => store.count());
    return result;
  } catch {
    return 0;
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

function getAllItems(): Promise<SyncQueueItem[]> {
  return openDB().then(
    (db) =>
      new Promise<SyncQueueItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("timestamp");
        const req = index.getAll();
        req.onsuccess = () => resolve(req.result as SyncQueueItem[]);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

async function incrementRetries(item: SyncQueueItem): Promise<void> {
  const MAX_RETRIES = 5;
  if (item.retries >= MAX_RETRIES) {
    // Give up after too many failures
    await withStore("readwrite", (store) => store.delete(item.id));
  } else {
    const updated: SyncQueueItem = { ...item, retries: item.retries + 1 };
    await withStore("readwrite", (store) => store.put(updated));
  }
}

/** Purge the N oldest entries to free space. */
async function purgeOldest(n: number): Promise<void> {
  const items = await getAllItems();
  const toDelete = items.slice(0, n);
  for (const item of toDelete) {
    await withStore("readwrite", (store) => store.delete(item.id));
  }
}

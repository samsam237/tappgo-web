type OfflineMethod = 'post' | 'patch' | 'delete';

export type OfflineQueueItem = {
  id: string;
  method: OfflineMethod;
  url: string;
  data?: any;
  createdAt: number;
};

const STORAGE_KEY = 'tappplus_offline_queue_v1';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  return safeParse<OfflineQueueItem[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function setOfflineQueue(items: OfflineQueueItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueueOffline(item: Omit<OfflineQueueItem, 'id' | 'createdAt'>) {
  const items = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    ...item,
    id: `offline_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    createdAt: Date.now(),
  };
  setOfflineQueue([...items, newItem]);
  return newItem;
}

export function dequeueOffline(id: string) {
  const items = getOfflineQueue();
  setOfflineQueue(items.filter((x) => x.id !== id));
}


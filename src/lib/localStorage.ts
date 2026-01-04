const STORAGE_KEYS = {
  readNotifications: "sis-davus-read-notifications",
  dismissedNotifications: "sis-davus-dismissed-notifications",
} as const;

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

export function getReadNotifications(): string[] {
  return getFromStorage(STORAGE_KEYS.readNotifications, []);
}

export function saveReadNotifications(ids: string[]): void {
  setToStorage(STORAGE_KEYS.readNotifications, ids);
}

export function getDismissedNotifications(): string[] {
  return getFromStorage(STORAGE_KEYS.dismissedNotifications, []);
}

export function saveDismissedNotifications(ids: string[]): void {
  setToStorage(STORAGE_KEYS.dismissedNotifications, ids);
}

export function clearAllStorage(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

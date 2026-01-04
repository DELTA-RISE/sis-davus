import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  item_id: string;
  item_type: "product" | "asset";
  action: "create" | "update" | "delete" | "movement" | "checkout" | "return";
  timestamp: string;
  user_name: string;
  changes: {
    field: string;
    old_value: string | number | null;
    new_value: string | number | null;
  }[];
  description: string;
}

const HISTORY_KEY = "sis-davus-item-history";
const MAX_HISTORY_ENTRIES = 500;

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = entries.slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Error saving history:", error);
  }
}

export function useItemHistory(item_id?: string, item_type?: "product" | "asset") {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const allHistory = getHistory();
    if (item_id && item_type) {
      setHistory(allHistory.filter((h) => h.item_id === item_id && h.item_type === item_type));
    } else {
      setHistory(allHistory);
    }
  }, [item_id, item_type]);

  const addHistoryEntry = useCallback(
    (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      const allHistory = getHistory();
      const updatedHistory = [newEntry, ...allHistory];
      saveHistory(updatedHistory);

      if (item_id && item_type) {
        setHistory(updatedHistory.filter((h) => h.item_id === item_id && h.item_type === item_type));
      } else {
        setHistory(updatedHistory);
      }
    },
    [item_id, item_type]
  );

  const getItemHistory = useCallback((id: string, type: "product" | "asset") => {
    return getHistory().filter((h) => h.item_id === id && h.item_type === type);
  }, []);

  return { history, addHistoryEntry, getItemHistory };
}

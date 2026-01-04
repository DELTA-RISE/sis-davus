"use client";

import { toast } from "sonner";

interface OfflineAction {
  id: string;
  table: string;
  action: 'upsert' | 'delete';
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'sis_davus_sync_queue';

export function getSyncQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addToSyncQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const queue = getSyncQueue();
  const newAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  queue.push(newAction);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  
  toast.info("Ação salva offline. Será sincronizada ao restaurar conexão.");
}

export async function processSyncQueue(supabaseClient: any) {
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  toast.loading(`Sincronizando ${queue.length} alterações...`);

  const results = await Promise.all(
    queue.map(async (item) => {
      try {
        let result;
        if (item.action === 'upsert') {
          result = await supabaseClient.from(item.table).upsert(item.payload);
        } else if (item.action === 'delete') {
          result = await supabaseClient.from(item.table).delete().match({ id: item.payload.id });
        }
        
        if (result?.error) throw result.error;
        return item.id;
      } catch (err) {
        console.error("Failed to sync item:", item, err);
        return null;
      }
    })
  );

  const successfulIds = results.filter(id => id !== null);
  const remainingQueue = queue.filter(item => !successfulIds.includes(item.id));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));

  if (successfulIds.length > 0) {
    toast.dismiss();
    toast.success(`${successfulIds.length} alterações sincronizadas!`);
  }
}

"use client";

import { toast } from "sonner";
import { db } from "./dexie-db";
import { supabase } from "./supabase";

export async function addToSyncQueue(action: {
  table: string;
  action: 'upsert' | 'delete';
  payload: any;
}) {
  try {
    await db.sync_queue.add({
      table: action.table,
      action: action.action,
      payload: action.payload,
      timestamp: Date.now(),
      status: 'pending'
    });
    toast.info("Alteração salva offline.", {
      description: "Será sincronizada quando a conexão retornar."
    });
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
    toast.error("Erro ao salvar alteração offline.");
  }
}

export async function processSyncQueue() {
  if (typeof window === 'undefined') return;
  if (!window.navigator.onLine) return;

  const pendingActions = await db.sync_queue
    .where('status')
    .equals('pending')
    .toArray();

  if (pendingActions.length === 0) return;

  const toastId = toast.loading(`Sincronizando ${pendingActions.length} alterações...`);
  let successCount = 0;

  for (const item of pendingActions) {
    try {
      // Mark as syncing to avoid double processing
      await db.sync_queue.update(item.id!, { status: 'syncing' });

      let result;
      if (item.action === 'upsert') {
        result = await supabase.from(item.table).upsert(item.payload);
      } else if (item.action === 'delete') {
        result = await supabase.from(item.table).delete().match(item.payload);
      }

      if (result?.error) throw result.error;

      // Remove from queue on success
      await db.sync_queue.delete(item.id!);
      successCount++;
    } catch (err) {
      console.error(`Failed to sync item ${item.id}:`, err);
      // Revert to pending (or maybe mark as failed if it's a permanent error?)
      // For now, keep as pending to retry later
      await db.sync_queue.update(item.id!, { status: 'failed' });
    }
  }

  if (successCount > 0) {
    toast.success(`${successCount} alterações sincronizadas!`, { id: toastId });
  } else {
    toast.dismiss(toastId);
  }
}

// Global listener for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    toast.success("Conexão restaurada. Sincronizando...");
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    toast.warning("Você está offline. Alterações serão salvas localmente.");
  });
}

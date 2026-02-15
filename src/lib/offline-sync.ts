"use client";

import { toast } from "sonner";
import { db } from "./dexie-db";
import { supabase } from "./supabase";

export async function addToSyncQueue(action: {
  table: string;
  action: 'upsert' | 'delete';
  payload: Record<string, unknown>;
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
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      console.error(`Failed to sync item ${item.id}:`, error);

      // Check for permanent errors that shouldn't be retried
      const isPermanentError =
        error.code === '23514' || // Check violation
        error.code === '23505' || // Unique violation
        error.code === 'PGRST204' || // Column not found
        error.code === '42703' || // Undefined column
        (error.code && error.code.startsWith('22')) || // Data exception
        (error.status >= 400 && error.status < 500); // Client errors

      if (isPermanentError) {
        console.warn(`Cleaned up failing sync item ${item.id} due to permanent error:`, item.payload);
        await db.sync_queue.delete(item.id!);
        toast.error(`Erro de sincronização permanente removido: ${error.message}`);
      } else {
        // Revert to pending (or maybe mark as failed if it's a permanent error?)
        // For now, keep as pending to retry later
        await db.sync_queue.update(item.id!, { status: 'failed' });
      }
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

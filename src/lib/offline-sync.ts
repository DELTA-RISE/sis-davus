"use client";

import { toast } from "sonner";
import { db } from "./dexie-db";
import { supabase } from "./supabase";

export async function addToSyncQueue(action: {
  table: string;
  action: 'upsert' | 'delete';
  payload: Record<string, unknown>;
}): Promise<boolean> {
  try {
    await db.sync_queue.add({
      table: action.table,
      action: action.action,
      payload: action.payload,
      timestamp: Date.now(),
      status: 'pending'
    });
    toast.info("Alteracao salva offline.", {
      description: "Sera sincronizada quando a conexao retornar."
    });
    return true;
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
    toast.error("Erro ao salvar alteracao offline.");
    return false;
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

  const toastId = toast.loading(`Sincronizando ${pendingActions.length} alteracoes...`);
  let successCount = 0;

  for (const item of pendingActions) {
    try {
      await db.sync_queue.update(item.id!, { status: 'syncing' });

      let result;
      if (item.action === 'upsert') {
        result = await supabase.from(item.table).upsert(item.payload);
      } else if (item.action === 'delete') {
        result = await supabase.from(item.table).delete().match(item.payload);
      }

      if (result?.error) throw result.error;

      await db.sync_queue.delete(item.id!);
      successCount++;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      console.error(`Failed to sync item ${item.id}:`, error);

      const isPermanentError =
        error.code === '23514' ||
        error.code === '23505' ||
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        (error.code && error.code.startsWith('22')) ||
        (error.status >= 400 && error.status < 500);

      if (isPermanentError) {
        console.warn(`Cleaned up failing sync item ${item.id} due to permanent error:`, item.payload);
        await db.sync_queue.delete(item.id!);
        toast.error(`Erro permanente de sincronizacao: ${error.message}`);
      } else {
        await db.sync_queue.update(item.id!, { status: 'pending' });
      }
    }
  }

  if (successCount > 0) {
    toast.success(`${successCount} alteracoes sincronizadas!`, { id: toastId });
  } else {
    toast.dismiss(toastId);
  }
}


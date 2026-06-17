"use client";

import { toast } from "sonner";
import { db } from "./dexie-db";
import { supabase } from "./supabase";

const pluralizeChanges = (count: number) => `${count} ${count === 1 ? "alteração" : "alterações"}`;
const SYNC_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = SYNC_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Tempo limite ao sincronizar com o Supabase.")), timeoutMs);
  });

  return Promise.race([
    Promise.resolve(promise).then((result) => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise,
  ]);
}

const cleanPayload = (payload: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(payload).filter(([key]) => !key.startsWith("__")));

const normalizePayloadForSync = (table: string, payload: Record<string, unknown>) => {
  const cleaned = cleanPayload(payload);

  if (table === "maintenance_tasks") {
    const allowedMaintenanceColumns = new Set([
      "id",
      "title",
      "description",
      "asset_id",
      "asset_name",
      "asset_code",
      "due_date",
      "status",
      "priority",
      "assigned_to",
      "cost",
      "steps_data",
      "approval_status",
      "rejection_reason",
      "created_by",
      "manager_signature",
      "manager_signed_at",
      "approved_by",
      "admin_signature",
      "admin_signed_at",
      "completed_date",
      "created_at",
      "updated_at",
    ]);

    return Object.fromEntries(
      Object.entries(cleaned).filter(([key]) => allowedMaintenanceColumns.has(key))
    );
  }

  if (
    table === "asset_timelines" &&
    (cleaned.type === "location" || cleaned.type === "assignment" || cleaned.type === "movimentacao")
  ) {
    return { ...cleaned, type: "audit" };
  }

  return cleaned;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (typeof error === "string") return error;
  return "Erro inesperado ao sincronizar com o Supabase.";
};

export async function addToSyncQueue(action: {
  table: string;
  action: "upsert" | "delete";
  payload: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const payload = normalizePayloadForSync(action.table, action.payload);
    const payloadId = payload.id;

    if (payloadId) {
      const existing = await db.sync_queue
        .where("table")
        .equals(action.table)
        .filter((item) => item.action === action.action && item.payload?.id === payloadId)
        .first();

      if (existing?.id) {
        await db.sync_queue.update(existing.id, {
          payload,
          timestamp: Date.now(),
          status: "pending",
        });
        return true;
      }
    }

    await db.sync_queue.add({
      table: action.table,
      action: action.action,
      payload,
      timestamp: Date.now(),
      status: "pending",
    });
    toast.info("Alteração salva localmente", {
      description: "O SIS DAVUS sincronizará os dados assim que a conexão for restabelecida.",
    });
    return true;
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
    toast.error("Erro ao salvar alteração local", {
      description: "Não foi possível preservar essa ação para sincronização.",
    });
    return false;
  }
}

export async function processSyncQueue(options: { showToast?: boolean } = {}) {
  if (typeof window === "undefined") return;
  if (!window.navigator.onLine) return;

  await db.sync_queue
    .where("status")
    .equals("syncing")
    .modify({ status: "pending" });

  const pendingActions = await db.sync_queue
    .where("status")
    .equals("pending")
    .toArray();

  if (pendingActions.length === 0) return;

  const showToast = options.showToast ?? true;
  const toastId = showToast
    ? toast.loading("SIS DAVUS sincronizando dados", {
      description: `${pluralizeChanges(pendingActions.length)} pendentes na fila de sincronização.`,
    })
    : undefined;
  let successCount = 0;

  for (const item of pendingActions) {
    try {
      await db.sync_queue.update(item.id!, { status: "syncing" });

      let result;
      if (item.action === "upsert") {
        let payloadForSync = item.payload;

        if (item.table === "maintenance_tasks" && item.payload?.id) {
          const localTask = await db.maintenance_tasks.get(item.payload.id as string);
          if (localTask) {
            payloadForSync = { ...localTask, ...item.payload };
          }
        }

        result = await withTimeout(
          supabase.from(item.table).upsert(normalizePayloadForSync(item.table, payloadForSync))
        );
      } else if (item.action === "delete") {
        result = await withTimeout(
          supabase.from(item.table).delete().match(item.payload)
        );
      }

      if (result?.error) throw result.error;

      await db.sync_queue.delete(item.id!);
      successCount++;
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      console.error(`Failed to sync item ${item.id}:`, error);

      const isPermanentError =
        error.code === "23514" ||
        error.code === "23505" ||
        error.code === "PGRST204" ||
        error.code === "42703" ||
        (error.code && error.code.startsWith("22")) ||
        (typeof error.status === "number" && error.status >= 400 && error.status < 500);

      if (isPermanentError) {
        console.warn(`Cleaned up failing sync item ${item.id} due to permanent error:`, item.payload);
        await db.sync_queue.delete(item.id!);
        if (showToast) {
          toast.error("Falha permanente na sincronização", {
            description: getErrorMessage(error),
          });
        }
      } else {
        await db.sync_queue.update(item.id!, { status: "pending" });
      }
    }
  }

  if (showToast && successCount > 0) {
    toast.success("Sincronização concluída", {
      id: toastId,
      description: `${pluralizeChanges(successCount)} enviadas com sucesso para o Supabase.`,
    });
  } else if (toastId) {
    toast.dismiss(toastId);
  }
}

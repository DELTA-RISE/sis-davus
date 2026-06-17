import { supabase } from './supabase';
import { db } from './dexie-db';
import { addToSyncQueue } from './offline-sync';
import { toast } from 'sonner';
import {
  Product,
  Asset,
  StockMovement,
  MaintenanceTask,
  Checkout,
  CostCenter,
  AuditLog,
  User,
  AssetTimeline,
  WriteOffRequest,
  Category
} from './store';
import { normalizeRole } from './roles';

const notifyClientError = (title: string, description?: string) => {
  if (typeof window === 'undefined') return;
  toast.error(title, description ? { description } : undefined);
};

// Helper to parse User Agent
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') return undefined;

  const ua = window.navigator.userAgent;
  let os = "Desconhecido";
  let browser = "Desconhecido";
  let device = "Desktop";

  // Simple OS detection
  if (ua.indexOf("Win") !== -1) os = "Windows";
  else if (ua.indexOf("Mac") !== -1) os = "MacOS";
  else if (ua.indexOf("Linux") !== -1) os = "Linux";
  else if (ua.indexOf("Android") !== -1) os = "Android";
  else if (ua.indexOf("iOS") !== -1) os = "iOS";

  // Simple Browser detection
  if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
  else if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
  else if (ua.indexOf("Safari") !== -1) browser = "Safari";
  else if (ua.indexOf("Edge") !== -1) browser = "Edge";

  // Simple Device detection
  if (/Mobi|Android/i.test(ua)) device = "Mobile";
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

  return { os, browser, device };
};

export const getPublicIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) return "127.0.0.1";
    const data = await response.json();
    return data.ip || "127.0.0.1";
  } catch (_error) {
    return "127.0.0.1";
  }
};

const isOnline = () => typeof window !== 'undefined' && window.navigator.onLine;

const TIMEOUT_MS = 15000;
const SYNC_FRESHNESS_MS = 60_000;
const syncInFlight = new Map<string, Promise<void>>();
// memoryCache removed in favor of Dexie

export type PersistenceStatus = 'synced' | 'queued';
export type Persisted<T> = T & {
  __persistenceStatus?: PersistenceStatus;
  __persistenceError?: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  if (typeof error === 'string') return error;
  return undefined;
};

const getSyncTimestampKey = (table: string) => `sis-davus:last-sync:${table}`;

const getLastSyncTime = (table: string) => {
  if (typeof window === 'undefined') return 0;
  const value = window.localStorage.getItem(getSyncTimestampKey(table));
  return value ? Number(value) || 0 : 0;
};

const markTableSynced = (table: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getSyncTimestampKey(table), String(Date.now()));
};

const isRecentlySynced = (table: string) => {
  const lastSync = getLastSyncTime(table);
  return lastSync > 0 && Date.now() - lastSync < SYNC_FRESHNESS_MS;
};

export function isPendingSync<T>(item: Persisted<T> | null | undefined): boolean {
  return item?.__persistenceStatus === 'queued';
}

async function hasPendingUpsert(table: string, id: string): Promise<boolean> {
  return Boolean(await db.sync_queue
    .where('table')
    .equals(table)
    .filter((item) =>
      item.action === 'upsert' &&
      item.status !== 'failed' &&
      item.payload?.id === id
    )
    .first());
}

function withPersistenceStatus<T extends object>(
  item: T,
  status: PersistenceStatus,
  error?: unknown
): Persisted<T> {
  const message = getErrorMessage(error);
  return {
    ...item,
    __persistenceStatus: status,
    ...(message ? { __persistenceError: message } : {}),
  };
}

function sanitizeRemotePayload<T>(table: string, item: Partial<T>): Partial<T> {
  const baseEntries = Object.entries(item as Record<string, unknown>)
    .filter(([key]) => !key.startsWith('__'));

  if (table !== 'maintenance_tasks') {
    return Object.fromEntries(baseEntries) as Partial<T>;
  }

  const allowedMaintenanceColumns = new Set([
    'id',
    'title',
    'description',
    'asset_id',
    'asset_name',
    'asset_code',
    'due_date',
    'status',
    'priority',
    'assigned_to',
    'cost',
    'steps_data',
    'approval_status',
    'rejection_reason',
    'created_by',
    'manager_signature',
    'manager_signed_at',
    'approved_by',
    'admin_signature',
    'admin_signed_at',
    'completed_date',
    'created_at',
    'updated_at',
  ]);

  return Object.fromEntries(
    baseEntries.filter(([key]) => allowedMaintenanceColumns.has(key))
  ) as Partial<T>;
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([
    Promise.resolve(promise).then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}

// Helper to handle standard CRUD
async function getAll<T>(table: string, orderColumn: keyof T = 'created_at' as keyof T, ascending: boolean = false, _forceRefresh = false): Promise<T[]> {
  const localData = await db.table(table).toArray();

  if (!isOnline()) {
    return localData.sort((a, b) => {
      // Simple sort for offline
      const valA = a[orderColumn] as unknown as string | number;
      const valB = b[orderColumn] as unknown as string | number;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    }) as T[];
  }

  // Network First (if online)
  try {
    await syncTable(table, orderColumn as string, ascending, _forceRefresh);
    const refreshed = await db.table(table).toArray();
    return refreshed.sort((a, b) => {
      const valA = a[orderColumn] as unknown as string | number;
      const valB = b[orderColumn] as unknown as string | number;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    }) as T[];
  } catch (err) {
    console.error(`Fetch error ${table}, falling back to cache:`, err);
    return localData as T[];
  }
}

// Explicit Sync Function (Fire and Forget)
export async function syncTable(table: string, orderColumn: string = 'created_at', ascending: boolean = false, force = false) {
  if (!isOnline()) return;
  if (!force && isRecentlySynced(table)) return;

  const inFlightKey = `${table}:${orderColumn}:${ascending}`;
  const currentSync = syncInFlight.get(inFlightKey);
  if (currentSync) return currentSync;

  const syncPromise = (async () => {
    try {
      const queuedUpserts = await db.sync_queue
        .where('table')
        .equals(table)
        .filter((item) => item.action === 'upsert' && item.status !== 'failed')
        .toArray();
      const queuedDeleteIds = new Set(
        (await db.sync_queue
          .where('table')
          .equals(table)
          .filter((item) => item.action === 'delete' && item.status !== 'failed' && Boolean(item.payload?.id))
          .toArray())
          .map((item) => String(item.payload.id))
      );
      const queuedPayloads = queuedUpserts
        .map((item) => item.payload)
        .filter(
          (payload): payload is Record<string, unknown> =>
            Boolean(payload && payload.id && !queuedDeleteIds.has(String(payload.id)))
        );

      const { data, error } = await withTimeout(
        supabase
          .from(table)
          .select('*')
          .order(orderColumn, { ascending })
      );

      if (error) throw error;

      await db.transaction('rw', db.table(table), async () => {
        await db.table(table).clear();
        await db.table(table).bulkAdd(
          (data || []).filter((item: { id?: string }) => !queuedDeleteIds.has(String(item.id)))
        );
        if (queuedPayloads.length > 0) {
          await db.table(table).bulkPut(queuedPayloads);
        }
      });
      markTableSynced(table);
    } catch (error) {
      console.error(`Sync failed for ${table}:`, error);
    } finally {
      syncInFlight.delete(inFlightKey);
    }
  })();

  syncInFlight.set(inFlightKey, syncPromise);
  return syncPromise;
}

// Specialized getter with filtering
async function getAllFiltered<T>(
  table: string,
  userInfo: { role: string | null; cost_center: string | null },
  orderColumn: keyof T = 'created_at' as keyof T,
  ascending: boolean = false
): Promise<T[]> {
  // Offline: Filter local data
  if (!isOnline()) {
    const localData = await db.table(table).toArray();
    let filtered = localData.filter((item) => !item.deleted_at); // Exclude soft deleted

    if (userInfo.cost_center) {
      filtered = filtered.filter((item) => item.cost_center === userInfo.cost_center);
    }

    return filtered.sort((a, b) => {
      const valA = a[orderColumn] as unknown as string | number;
      const valB = b[orderColumn] as unknown as string | number;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    }) as T[];
  }

  // Online: Supabase query
  try {
    let query = supabase
      .from(table)
      .select('*')
      .is('deleted_at', null) // Exclude soft deleted
      .order(orderColumn as string, { ascending });

    if (userInfo.cost_center) {
      query = query.eq('cost_center', userInfo.cost_center);
    }

    const { data, error } = await withTimeout(query);

    if (error) throw error;

    return data as T[];
  } catch (err) {
    console.error(`Fetch filtered error ${table}:`, err);
    return [] as T[];
  }
}

async function upsert<T extends { id?: string }>(table: string, item: Partial<T>): Promise<Persisted<T> | null> {
  const tableRef = db.table(table);
  let localItem = item as Partial<T>;

  // 1. Optimistic Update (Local)
  try {
    if (!localItem.id) {
      localItem.id = crypto.randomUUID();
    }
    if (table === 'maintenance_tasks') {
      const existingLocal = await tableRef.get(localItem.id);
      if (existingLocal) {
        localItem = { ...existingLocal, ...localItem };
      }
    }
    await tableRef.put(localItem);
  } catch (e) {
    console.warn("Local update failed", e);
  }

  const remoteItem = sanitizeRemotePayload(table, localItem);

  // 2. Offline Handling
  if (!isOnline()) {
    const queued = await addToSyncQueue({ table, action: 'upsert', payload: remoteItem });
    return queued ? withPersistenceStatus(localItem as T, 'queued') : null;
  }

  // 3. Online Handling
  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .upsert(remoteItem as never)
        .select()
        .single()
    );

    if (error) throw error;

    // Update local with confirmed server data (e.g. correct ID, timestamps)
    await tableRef.put(table === 'maintenance_tasks' ? { ...data, ...localItem } : data);

    return withPersistenceStatus(data as T, 'synced');
  } catch (err) {
    console.error(`Sync error ${table}, queuing:`, err);
    notifyClientError(
      "Falha ao sincronizar com o Supabase",
      getErrorMessage(err) || "A alteracao foi salva localmente para nova tentativa."
    );
    const queued = await addToSyncQueue({ table, action: 'upsert', payload: remoteItem });
    return queued ? withPersistenceStatus(localItem as T, 'queued', err) : null;
  }
}

async function softDelete(table: string, id: string): Promise<boolean> {
  const deletedAt = new Date().toISOString();
  // 1. Local
  try {
    // We update local item to have deleted_at. 
    // Or we could remove it from local view if we only show non-deleted.
    // Let's update it so we keep it but filter it out in getters.
    await db.table(table).update(id, { deleted_at: deletedAt });
  } catch (e) { console.warn("Local heavy delete failed", e); }

  // 2. Offline
  if (!isOnline()) {
    await addToSyncQueue({ table, action: 'upsert', payload: { id, deleted_at: deletedAt } });
    return true;
  }

  // 3. Online
  try {
    const { error } = await withTimeout(
      supabase
        .from(table)
        .update({ deleted_at: deletedAt })
        .match({ id })
    );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Sync soft-delete error ${table}:`, err);
    await addToSyncQueue({ table, action: 'upsert', payload: { id, deleted_at: deletedAt } });
    return true;
  }
}

async function restore(table: string, id: string): Promise<boolean> {
  // 1. Local
  try {
    await db.table(table).update(id, { deleted_at: null });
  } catch (e) { console.warn("Local restore failed", e); }

  // 2. Offline
  if (!isOnline()) {
    await addToSyncQueue({ table, action: 'upsert', payload: { id, deleted_at: null } });
    return true;
  }

  // 3. Online
  try {
    const { error } = await withTimeout(
      supabase
        .from(table)
        .update({ deleted_at: null })
        .match({ id })
    );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Sync restore error ${table}:`, err);
    await addToSyncQueue({ table, action: 'upsert', payload: { id, deleted_at: null } });
    return true;
  }
}

async function remove(table: string, id: string): Promise<boolean> {
  const tableRef = db.table(table);

  // 1. Optimistic Delete (Local)
  try {
    const pendingUpserts = await db.sync_queue
      .where('table')
      .equals(table)
      .filter((item) => item.action === 'upsert' && item.payload?.id === id)
      .toArray();

    if (pendingUpserts.length > 0) {
      await db.sync_queue.bulkDelete(pendingUpserts.map((item) => item.id!).filter(Boolean));
    }

    await tableRef.delete(id);
  } catch (e) { console.warn("Local delete failed", e); }

  // 2. Offline Handling
  if (!isOnline()) {
    await addToSyncQueue({ table, action: 'delete', payload: { id } });
    return true;
  }

  // 3. Online Handling
  try {
    const { error } = await withTimeout(
      supabase
        .from(table)
        .delete()
        .match({ id })
    );

    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Sync delete error ${table}, queuing:`, err);
    await addToSyncQueue({ table, action: 'delete', payload: { id } });
    return true;
  }
}

// Products
// Products
export const getProducts = async (_forceRefresh = false, costCenterId?: string | null) => {
  return getAllFiltered<Product>('products', { role: null, cost_center: costCenterId || null }, 'name', true);
};

export const saveProduct = async (product: Partial<Product>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<Product>('products', product as Product);
  if (result && userInfo) {
    await logActivity(
      product.id ? "UPDATE" : "CREATE",
      "PRODUTO",
      `Produto "${result.name}" ${product.id ? "atualizado" : "criado"} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};

export const deleteProduct = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await softDelete('products', id);
  if (success && userInfo) {
    await logActivity(
      "DELETE",
      "PRODUTO",
      `Produto (ID: ${id}) movido para a lixeira por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};

export const restoreProduct = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await restore('products', id);
  if (success && userInfo) {
    await logActivity(
      "RESTORE",
      "PRODUTO",
      `Produto (ID: ${id}) restaurado por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};
// ... (skip getProductById etc) ...

// Assets
export const getAssets = async (_forceRefresh = false, costCenterId?: string | null) => {
  return getAllFiltered<Asset>('assets', { role: null, cost_center: costCenterId || null }, 'name', true);
};

export const syncAssets = async () => {
  if (!isOnline()) return;

  try {
    const query = supabase
      .from('assets')
      .select('*')
      .is('deleted_at', null);

    const { data, error } = await withTimeout(query);

    if (error) throw error;

    // Perform diff or full replace? getAllFiltered uses "Existent or New". 
    // For sync, we generally want to make the local DB match the server for the filtered set.
    // However, we must be careful not to wipe out *other* assets if we were to support multiple roles better.
    // But since this app seems to isolate checks by role, replacing the 'assets' table content 
    // might be too aggressive if we switched users, but acceptable for single user session.
    // BETTER APPROACH for specialized sync:
    // 1. Get all local IDs.
    // 2. Identify stale ones? 
    // Simpler for now: clear and replace is what syncTable does, but syncTable does it for WHOLE table.
    // Use syncTable logic but with filter.

    // Actually, if we just use `bulkPut`, we update existing. But we won't delete ones that were removed on server (unless we check IDs).
    // `syncTable` in this file clears the table first! `await db.table(table).clear();`
    // So we should probably do similar if we want a true sync.

    await db.transaction('rw', db.assets, async () => {
      // If we are a manager, we only see OUR assets. 
      // Clearing the whole table is fine because the manager shouldn't have other assets anyway.
      // If we are admin, we fetch ALL assets, so clearing is also fine.
      await db.assets.clear();
      await db.assets.bulkAdd(data);
    });

  } catch (error) {
    console.error("Sync assets failed:", error);
  }
};
export const getAssetById = async (id: string): Promise<Asset | null> => {
  try {
    const localAsset = await db.assets.get(id);
    if (localAsset && await hasPendingUpsert('assets', id)) {
      return localAsset as Asset;
    }

    const { data, error } = await withTimeout(supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .maybeSingle());
    if (error) return localAsset as Asset || null;
    if (data) await db.assets.put(data as Asset);
    return data as Asset;
  } catch (error) {
    console.error("Error in getAssetById:", error);
    return await db.assets.get(id) as Asset || null;
  }
};

export const getAssetByCode = async (code: string): Promise<Asset | null> => {
  const cleanCode = code.trim();
  if (!cleanCode) return null;

  try {
    const localAsset = await db.assets
      .where('code')
      .equals(cleanCode)
      .first();
    if (localAsset) return localAsset as Asset;

    const { data, error } = await withTimeout(supabase
      .from('assets')
      .select('*')
      .eq('code', cleanCode)
      .is('deleted_at', null)
      .maybeSingle());
    if (error) return null;
    if (data) await db.assets.put(data as Asset);
    return data as Asset;
  } catch (error) {
    console.error("Error in getAssetByCode:", error);
    return await db.assets
      .where('code')
      .equals(cleanCode)
      .first() as Asset || null;
  }
};
export const saveAsset = async (asset: Partial<Asset>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<Asset>('assets', asset as Asset);
  if (result && userInfo) {
    await logActivity(
      asset.id ? "UPDATE" : "PATRIMONIO",
      "PATRIMONIO",
      `Patrimônio "${result.name}" (${result.code}) ${asset.id ? "atualizado" : "criado"} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};
export const deleteAsset = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await softDelete('assets', id);
  if (success && userInfo) {
    await logActivity(
      "DELETE",
      "PATRIMONIO",
      `Patrimônio (ID: ${id}) movido para a lixeira por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};
export const restoreAsset = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await restore('assets', id);
  if (success && userInfo) {
    await logActivity(
      "RESTORE",
      "PATRIMONIO",
      `Patrimônio (ID: ${id}) restaurado por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};

// Movements
export const getMovements = (forceRefresh = false) => getAll<StockMovement>('stock_movements', 'date', false, forceRefresh);
export const saveMovement = async (movement: Partial<StockMovement>, userInfo?: { name: string, id: string }) => {
  const quantity = Number(movement.quantity || 0);
  const productId = movement.product_id;

  if (!productId || !movement.type || quantity <= 0) return null;

  const currentProduct = await db.products.get(productId);
  if (!currentProduct) {
    notifyClientError("Produto não encontrado", "Não foi possível atualizar o saldo do estoque.");
    return null;
  }

  const nextQuantity = movement.type === "entrada"
    ? (currentProduct.quantity || 0) + quantity
    : (currentProduct.quantity || 0) - quantity;

  if (nextQuantity < 0) {
    notifyClientError(
      "Saldo insuficiente",
      `A saída solicitada excede o saldo atual de ${currentProduct.quantity || 0} unidades.`
    );
    return null;
  }

  const result = await upsert<StockMovement>('stock_movements', movement as StockMovement);
  if (!result) return null;

  await upsert<Product>('products', {
    ...currentProduct,
    quantity: nextQuantity,
    updated_at: new Date().toISOString(),
  });

  if (result && userInfo) {
    await logActivity(
      movement.type === "entrada" ? "CREATE" : "DELETE",
      "ESTOQUE",
      `Movimentação de ${movement.type} (${movement.quantity} un.) para "${movement.product_name}" por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
}

// Maintenance
export const getMaintenanceTasks = async (assetId?: string, forceRefresh = false) => {
  const tasks = await getAll<MaintenanceTask>('maintenance_tasks', 'due_date', true, forceRefresh);

  if (assetId) {
    return tasks.filter(t => t.asset_id === assetId);
  }

  return tasks;
};
export const saveMaintenanceTask = async (task: Partial<MaintenanceTask>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<MaintenanceTask>('maintenance_tasks', task as MaintenanceTask);
  if (result && userInfo) {
    await logActivity(
      task.id ? "UPDATE" : "MANUTENCAO",
      "MANUTENCAO",
      `Tarefa de manutenção "${result.title}" para "${result.asset_name}" ${task.id ? "atualizada" : "criada"} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};

export const deleteMaintenanceTask = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await remove('maintenance_tasks', id);
  if (success && userInfo) {
    await logActivity(
      "DELETE",
      "MANUTENCAO",
      `Tarefa de manutenção (ID: ${id}) excluída por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};

// Checkouts
export const createWriteOffRequest = async (request: Partial<WriteOffRequest>) => {
  return upsert<WriteOffRequest>('write_off_requests', request as WriteOffRequest);
};

export const getWriteOffRequests = async () => {
  return getAll<WriteOffRequest>('write_off_requests', 'created_at', true, true);
};

// Checkouts
export const getCheckouts = async (itemId?: string, itemType?: 'product' | 'asset', forceRefresh = false) => {
  const sortByCheckoutDate = (items: Checkout[]) =>
    items.sort((a, b) => new Date(b.checkout_date || 0).getTime() - new Date(a.checkout_date || 0).getTime());

  const filterCheckout = (checkout: Checkout) => {
    if (!itemId || !itemType) return true;
    return checkout.item_id === itemId && checkout.item_type === itemType;
  };

  const localData = (await db.checkouts.toArray()).filter(filterCheckout);

  if (!isOnline()) {
    return sortByCheckoutDate(localData);
  }

  let query = supabase.from('checkouts').select('*').order('checkout_date', { ascending: false });
  if (itemId && itemType) query = query.eq('item_id', itemId).eq('item_type', itemType);

  try {
    const { data, error } = await withTimeout(query);
    if (error) throw error;

    const remoteData = (data || []) as Checkout[];
    const remoteIds = new Set(remoteData.map((checkout) => checkout.id));
    const localOnly = localData.filter((checkout) => !remoteIds.has(checkout.id));

    if (!itemId && !itemType && !forceRefresh) {
      await db.checkouts.bulkPut(remoteData);
    }

    return sortByCheckoutDate([...remoteData, ...localOnly]);
  } catch (_error) {
    return sortByCheckoutDate(localData);
  }
};
export const saveCheckout = async (checkout: Partial<Checkout>, userInfo?: { name: string, id: string }) => {
  const payload: Partial<Checkout> = {
    ...checkout,
    quantity: checkout.quantity ?? 1,
  };
  const result = await upsert<Checkout>('checkouts', payload as Checkout);
  if (result && userInfo) {
    await logActivity(
      payload.id ? "UPDATE" : "CHECKOUT",
      "CHECKOUT",
      `Checkout de "${result.item_name}" ${payload.id ? "atualizado" : "realizado"} para ${result.user_name} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};

// Cost Centers
export const getCostCenters = (forceRefresh = false) => getAll<CostCenter>('cost_centers', 'name', true, forceRefresh);
export const syncCostCenters = () => syncTable('cost_centers', 'name', true);
export const saveCostCenter = async (cc: Partial<CostCenter>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<CostCenter>('cost_centers', cc as CostCenter);
  if (result && userInfo) {
    await logActivity(
      cc.id ? 'UPDATE' : 'CREATE',
      'CENTRO_CUSTO',
      { name: result.name, code: result.code, status: result.status },
      result.id,
      userInfo.name
    );
  }
  return result;
};
export const deleteCostCenter = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await remove('cost_centers', id);
  if (success && userInfo) {
    await logActivity(
      "DELETE",
      "CENTRO_CUSTO",
      `Centro de custo (ID: ${id}) excluído por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};

// Categories
export const getCategories = (type: 'insumo' | 'patrimonio', forceRefresh = false) => {
  return getAll<Category>('categories', 'name', true, forceRefresh)
    .then(cats => cats.filter(c => c.type === type));
};
export const syncCategories = () => syncTable('categories', 'name', true);
export const saveCategory = (category: Partial<Category>) => upsert<Category>('categories', category as Category);
export const deleteCategory = (id: string) => remove('categories', id);



// Audit Logs
export const getAuditLogs = async (limit = 120, forceRefresh = false): Promise<AuditLog[]> => {
  const localData = await db.admin_audit_logs
    .orderBy('created_at')
    .reverse()
    .limit(limit)
    .toArray();

  if (!isOnline() || (!forceRefresh && isRecentlySynced('admin_audit_logs'))) {
    return localData;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    );

    if (error) throw error;

    await db.admin_audit_logs.bulkPut(data || []);
    markTableSynced('admin_audit_logs');
    return data || [];
  } catch (error) {
    console.error('Fetch error admin_audit_logs, falling back to cache:', error);
    return localData;
  }
};

export const logActivity = async (
  action: string,
  resource: string,
  details: unknown,
  resourceId?: string,
  userName?: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const deviceInfo = getDeviceInfo();

    // Construct the log entry matching admin_audit_logs table
    const logEntry = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      user_email: session.user.email,
      user_name: userName || session.user.user_metadata?.name || session.user.email,
      action,
      resource,
      resource_id: resourceId,
      details: {
        ...(typeof details === 'object' && details !== null ? details : { value: details }),
        device: deviceInfo,
      },
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };

    if (!isOnline()) {
      notifyClientError(
        "Falha ao registrar log de auditoria",
        "Sem conexão no momento. A ação principal foi concluída, mas o log não foi enviado."
      );
      return null;
    }

    const { error } = await withTimeout(
      supabase
        .from('admin_audit_logs')
        .insert(logEntry)
    );

    if (error) {
      notifyClientError("Falha ao registrar log de auditoria", error.message);
      return null;
    }

    return logEntry as unknown as AuditLog;
  } catch (error) {
    console.error("Failed to log activity:", error);
    notifyClientError(
      "Falha ao registrar log de auditoria",
      error instanceof Error ? error.message : "Erro inesperado ao salvar o registro."
    );
    return null;
  }
};



// Users / Profiles
export const getUsers = (forceRefresh = false) => getAll<User>('profiles', 'name', true, forceRefresh);
export const syncUsers = () => syncTable('profiles', 'name', true);

export const saveUser = async (user: Partial<User>, userInfo?: { name: string, id: string }) => {
  if (!user.id && !user.email) return Promise.resolve(null); // Basic validation
  const normalizedUser = user.role ? { ...user, role: normalizeRole(user.role) } : user;
  const result = await upsert<User>('profiles', normalizedUser as User);
  if (result && userInfo) {
    await logActivity(
      "UPDATE",
      "USUARIO",
      `Usuário "${result.name}" (${result.email}) atualizado por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};
export const getProfile = async (id: string): Promise<User | null> => {
  if (!id) return null;
  try {
    const { data, error } = await withTimeout(supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle());
    if (error) return null;
    return data ? { ...data, role: normalizeRole((data as User).role) } as User : null;
  } catch (_error) {
    return null;
  }
};

// Asset Timelines
export const getAssetTimelines = async (assetId?: string, forceRefresh = false) => {
  if (!assetId) {
    return getAll<AssetTimeline>('asset_timelines', 'date', false, forceRefresh);
  }
  const localTimelines = (await db.asset_timelines
    .where('asset_id')
    .equals(assetId)
    .toArray()) as AssetTimeline[];

  let query = supabase.from('asset_timelines').select('*').order('date', { ascending: false });
  query = query.eq('asset_id', assetId);
  try {
    const { data, error } = await withTimeout(query);
    if (error) return localTimelines;
    const remoteTimelines = (data || []) as AssetTimeline[];
    const remoteIds = new Set(remoteTimelines.map((item) => item.id));
    const localOnly = localTimelines.filter((item) => !remoteIds.has(item.id));
    await db.asset_timelines.bulkPut(remoteTimelines);
    return [...remoteTimelines, ...localOnly].sort(
      (a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime()
    );
  } catch (_error) {
    return localTimelines;
  }
};
export const saveAssetTimeline = (timeline: Partial<AssetTimeline>) => upsert<AssetTimeline>('asset_timelines', timeline as AssetTimeline);


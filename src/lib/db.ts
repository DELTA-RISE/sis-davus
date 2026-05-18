import { supabase } from './supabase';
import { db } from './dexie-db';
import { addToSyncQueue } from './offline-sync';
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
import { isCostCenterScopedRole } from './roles';

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
// memoryCache removed in favor of Dexie

export type PersistenceStatus = 'synced' | 'queued';
export type Persisted<T> = T & {
  __persistenceStatus?: PersistenceStatus;
  __persistenceError?: string;
};

export function isPendingSync<T>(item: Persisted<T> | null | undefined): boolean {
  return item?.__persistenceStatus === 'queued';
}

function withPersistenceStatus<T extends object>(
  item: T,
  status: PersistenceStatus,
  error?: unknown
): Persisted<T> {
  const message = error instanceof Error ? error.message : undefined;
  return {
    ...item,
    __persistenceStatus: status,
    ...(message ? { __persistenceError: message } : {}),
  };
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
    await syncTable(table, orderColumn as string, ascending);
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
export async function syncTable(table: string, orderColumn: string = 'created_at', ascending: boolean = false) {
  if (!isOnline()) return;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .select('*')
        .order(orderColumn, { ascending })
    );

    if (error) throw error;

    await db.transaction('rw', db.table(table), async () => {
      await db.table(table).clear();
      await db.table(table).bulkAdd(data);
    });
  } catch (error) {
    console.error(`Sync failed for ${table}:`, error);
  }
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

    if (isCostCenterScopedRole(userInfo.role) && userInfo.cost_center) {
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

    if (isCostCenterScopedRole(userInfo.role) && userInfo.cost_center) {
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

  // 1. Optimistic Update (Local)
  try {
    if (!item.id) {
      item.id = crypto.randomUUID();
    }
    await tableRef.put(item);
  } catch (e) {
    console.warn("Local update failed", e);
  }

  // 2. Offline Handling
  if (!isOnline()) {
    const queued = await addToSyncQueue({ table, action: 'upsert', payload: item });
    return queued ? withPersistenceStatus(item as T, 'queued') : null;
  }

  // 3. Online Handling
  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .upsert(item as never)
        .select()
        .single()
    );

    if (error) throw error;

    // Update local with confirmed server data (e.g. correct ID, timestamps)
    await tableRef.put(data);

    return withPersistenceStatus(data as T, 'synced');
  } catch (err) {
    console.error(`Sync error ${table}, queuing:`, err);
    const queued = await addToSyncQueue({ table, action: 'upsert', payload: item });
    return queued ? withPersistenceStatus(item as T, 'queued', err) : null;
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
  const { data: { session } } = await supabase.auth.getSession();
  const userRole = session?.user?.user_metadata?.role || null;
  const userCostCenter = session?.user?.user_metadata?.cost_center || null;

  let role = userRole;
  let costCenter = userCostCenter;

  if (session?.user?.id) {
    const profile = await getProfile(session.user.id);
    if (profile) {
      role = profile.role;
      // If user is manager, force their cost center. If admin, allow override via argument.
      if (isCostCenterScopedRole(role)) {
        costCenter = (profile as unknown as { cost_center: string }).cost_center;
      } else if (role === 'admin' && costCenterId) {
        costCenter = costCenterId;
      }
    }
  }

  // If explicitly passed (e.g. from admin dashboard) and user is admin (checked above implicitly or by caller trusting admin role), use it.
  // The above logic handles: Manager -> forced to own CC. Admin -> uses arg if present.

  return getAllFiltered<Product>('products', { role, cost_center: costCenter }, 'name', true);
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
  const { data: { session } } = await supabase.auth.getSession();
  let role = session?.user?.user_metadata?.role;
  let costCenter = session?.user?.user_metadata?.cost_center;

  if (session?.user?.id) {
    const profile = await getProfile(session.user.id);
    if (profile) {
      role = profile.role;
      if (isCostCenterScopedRole(role)) {
        costCenter = (profile as unknown as { cost_center: string }).cost_center;
      } else if (role === 'admin' && costCenterId) {
        costCenter = costCenterId;
      }
    }
  }
  return getAllFiltered<Asset>('assets', { role, cost_center: costCenter }, 'name', true);
};

export const syncAssets = async () => {
  if (!isOnline()) return;

  const { data: { session } } = await supabase.auth.getSession();
  let role = session?.user?.user_metadata?.role;
  let costCenter = session?.user?.user_metadata?.cost_center;

  if (session?.user?.id) {
    const profile = await getProfile(session.user.id);
    if (profile) {
      role = profile.role;
      if (isCostCenterScopedRole(role)) {
        costCenter = (profile as unknown as { cost_center: string }).cost_center;
      }
    }
  }

  try {
    let query = supabase
      .from('assets')
      .select('*')
      .is('deleted_at', null);

    if (isCostCenterScopedRole(role) && costCenter) {
      query = query.eq('cost_center', costCenter);
    }

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
    const { data, error } = await withTimeout(supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .maybeSingle());
    if (error) return null;
    return data as Asset;
  } catch (error) {
    console.error("Error in getAssetById:", error);
    return null;
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
  const result = await upsert<StockMovement>('stock_movements', movement as StockMovement);
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
  const { data: { session } } = await supabase.auth.getSession();
  let role = session?.user?.user_metadata?.role;
  let costCenter = session?.user?.user_metadata?.cost_center;

  if (session?.user?.id) {
    // If getProfile is available in scope (it is exported below, but imported ones work too)
    // Note: getProfile is defined below. To avoid issues, we can try to rely on session or just use supabase direct.
    // getAssets uses getProfile so it should be fine if function hoisting works or if we are careful.
    // However, to be safe and consistent with getAssets:
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        role = data.role;
        if (isCostCenterScopedRole(role)) {
          costCenter = (data as unknown as { cost_center: string }).cost_center;
        }
      }
    } catch (_e) { /* ignore */ }
  }

  // Offline / Dexie
  if (!isOnline()) {
    const tasks = await getAll<MaintenanceTask>('maintenance_tasks', 'due_date', true, forceRefresh);

    let filtered = tasks;
    if (assetId) {
      filtered = filtered.filter(t => t.asset_id === assetId);
    }

    if (isCostCenterScopedRole(role) && costCenter) {
      try {
        const myAssets = await db.assets.where('cost_center').equals(costCenter).toArray();
        const myAssetIds = new Set(myAssets.map(a => a.id));
        filtered = filtered.filter(t => myAssetIds.has(t.asset_id));
      } catch (e) {
        console.warn("Offline filtering failed", e);
      }
    }
    return filtered;
  }

  // Online / Supabase
  // We use !inner join to filter tasks ensuring the related asset belongs to the cost center.
  let query = supabase.from('maintenance_tasks').select('*, assets!inner(cost_center)').order('due_date', { ascending: true });

  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  if (isCostCenterScopedRole(role) && costCenter) {
    query = query.eq('assets.cost_center', costCenter);
  }

  try {
    const { data, error } = await withTimeout(query);
    if (error) {
      console.error("Error fetching maintenance tasks:", error);
      // Fallback or empty? 
      // If error is PGRST204 (inner join failed?), it might be 406 or something.
      // If we are strictly filtering for security/visibility, returning empty on error is safer.
      return [];
    }
    // The data will contain `assets: { cost_center: ... }`. We cast it to clear that out.
    return data as unknown as MaintenanceTask[];
  } catch (error) {
    console.error("Exception fetching maintenance tasks:", error);
    return [];
  }
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

// Checkouts
export const createWriteOffRequest = async (request: Partial<WriteOffRequest>) => {
  return upsert<WriteOffRequest>('write_off_requests', request as WriteOffRequest);
};

export const getWriteOffRequests = async () => {
  return getAll<WriteOffRequest>('write_off_requests', 'created_at', true, true);
};

// Checkouts
export const getCheckouts = async (itemId?: string, itemType?: 'product' | 'asset', forceRefresh = false) => {
  if (!itemId && !itemType) {
    return getAll<Checkout>('checkouts', 'checkout_date', false, forceRefresh);
  }
  let query = supabase.from('checkouts').select('*').order('checkout_date', { ascending: false });
  if (itemId && itemType) {
    query = query.eq('item_id', itemId).eq('item_type', itemType);
  }
  try {
    const { data, error } = await withTimeout(query);
    if (error) return [];
    return data as Checkout[];
  } catch (_error) {
    return [];
  }
};
export const saveCheckout = async (checkout: Partial<Checkout>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<Checkout>('checkouts', checkout as Checkout);
  if (result && userInfo) {
    await logActivity(
      checkout.id ? "UPDATE" : "CHECKOUT",
      "CHECKOUT",
      `Checkout de "${result.item_name}" ${checkout.id ? "atualizado" : "realizado"} para ${result.user_name} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};

// Cost Centers
export const getCostCenters = (forceRefresh = false) => getAll<CostCenter>('cost_centers', 'name', true, forceRefresh);
export const syncCostCenters = () => syncTable('cost_centers', 'name', true);
export const saveCostCenter = (cc: Partial<CostCenter>) => upsert<CostCenter>('cost_centers', cc as CostCenter);

// Categories
export const getCategories = (type: 'insumo' | 'patrimonio', forceRefresh = false) => {
  return getAll<Category>('categories', 'name', true, forceRefresh)
    .then(cats => cats.filter(c => c.type === type));
};
export const syncCategories = () => syncTable('categories', 'name', true);
export const saveCategory = (category: Partial<Category>) => upsert<Category>('categories', category as Category);
export const deleteCategory = (id: string) => remove('categories', id);



// Audit Logs
export const getAuditLogs = (forceRefresh = false) => getAll<AuditLog>('admin_audit_logs', 'created_at', false, forceRefresh);

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

    const _deviceInfo = getDeviceInfo();

    // Construct the log entry matching admin_audit_logs table
    const logEntry = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      user_email: session.user.email,
      user_name: userName || session.user.user_metadata?.name || session.user.email,
      action,
      resource,
      resource_id: resourceId,
      details: details, // Supabase handles object -> JSONB
      ip_address: await getPublicIp(),
      user_agent: window.navigator.userAgent
    };

    return upsert<AuditLog>('admin_audit_logs', logEntry as unknown as AuditLog);
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
};



// Users / Profiles
export const getUsers = (forceRefresh = false) => getAll<User>('profiles', 'name', true, forceRefresh);
export const syncUsers = () => syncTable('profiles', 'name', true);

export const saveUser = async (user: Partial<User>, userInfo?: { name: string, id: string }) => {
  if (!user.id && !user.email) return Promise.resolve(null); // Basic validation
  const result = await upsert<User>('profiles', user as User);
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
    return data as User;
  } catch (_error) {
    return null;
  }
};

// Asset Timelines
export const getAssetTimelines = async (assetId?: string, forceRefresh = false) => {
  if (!assetId) {
    return getAll<AssetTimeline>('asset_timelines', 'date', false, forceRefresh);
  }
  let query = supabase.from('asset_timelines').select('*').order('date', { ascending: false });
  query = query.eq('asset_id', assetId);
  try {
    const { data, error } = await withTimeout(query);
    if (error) return [];
    return data as AssetTimeline[];
  } catch (_error) {
    return [];
  }
};
export const saveAssetTimeline = (timeline: Partial<AssetTimeline>) => upsert<AssetTimeline>('asset_timelines', timeline as AssetTimeline);


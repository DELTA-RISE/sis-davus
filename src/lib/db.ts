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
  StorageLocation,
  AuditLog,
  User,
  AssetTimeline
} from './store';

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
  } catch (error) {
    return "127.0.0.1";
  }
};

const isOnline = () => typeof window !== 'undefined' && window.navigator.onLine;

const TIMEOUT_MS = 15000;
// memoryCache removed in favor of Dexie

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
async function getAll<T>(table: string, orderColumn: string = 'created_at', ascending: boolean = false, forceRefresh = false): Promise<T[]> {
  const localData = await db.table(table).toArray();

  if (!isOnline()) {
    return localData.sort((a, b) => {
      // Simple sort for offline
      if (a[orderColumn] < b[orderColumn]) return ascending ? -1 : 1;
      if (a[orderColumn] > b[orderColumn]) return ascending ? 1 : -1;
      return 0;
    }) as T[];
  }

  // Network First (if online)
  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .select('*')
        .order(orderColumn, { ascending })
    );

    if (error) throw error;

    // Cache to Dexie (Overwrite strategy)
    // Note: We might want to be smarter about this to not overwrite unsynced changes
    // But for now, we rely on the sync queue re-applying changes if needed, or sync running first.
    await db.table(table).bulkPut(data);

    // Also cleanup deprecated/deleted items (simple approach: clear and add)
    // For large datasets, bulkPut is better. To remove deleted items, we'd need to know IDs.
    // Let's assume bulkPut updates existing. 'clear' + 'bulkAdd' is cleaner for full sync but risky for pending.
    // Compromise: We return the FRESH server data to the UI.
    return data as T[];
  } catch (err) {
    console.error(`Fetch error ${table}, falling back to cache:`, err);
    return localData as T[];
  }
}

async function upsert<T>(table: string, item: any): Promise<T | null> {
  const tableRef = db.table(table);

  // 1. Optimistic Update (Local)
  try {
    // If it's a new item without ID, give it a temp ID for local storage? 
    // Dexie moves fine with auto-increment, but we use UUIDs usually from Supabase.
    // If item.id is missing, we might need to generate one if Supabase expects it, or let Supabase generate.
    // For offline, we MUST have an ID.
    if (!item.id) {
      // Create a temp ID if needed, or handle in payload. 
      // But usually we rely on Supabase returning the ID.
    }
    await tableRef.put(item);
  } catch (e) {
    console.warn("Local update failed", e);
  }

  // 2. Offline Handling
  if (!isOnline()) {
    await addToSyncQueue({ table, action: 'upsert', payload: item });
    return item as T;
  }

  // 3. Online Handling
  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .upsert(item)
        .select()
        .single()
    );

    if (error) throw error;

    // Update local with confirmed server data (e.g. correct ID, timestamps)
    await tableRef.put(data);

    return data as T;
  } catch (err) {
    console.error(`Sync error ${table}, queuing:`, err);
    await addToSyncQueue({ table, action: 'upsert', payload: item });
    return item as T;
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
export const getProducts = (forceRefresh = false) => getAll<Product>('products', 'name', true, forceRefresh);
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await withTimeout(supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle());
    if (error) return null;
    return data as Product;
  } catch (error) {
    console.error("Error in getProductById:", error);
    return null;
  }
};
export const saveProduct = async (product: Partial<Product>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<Product>('products', product);
  if (result && userInfo) {
    await logActivity(
      product.id ? "UPDATE" : "CREATE",
      "PRODUTO",
      `Produto "${result.name}" (${result.sku}) ${product.id ? "atualizado" : "criado"} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};
export const deleteProduct = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await remove('products', id);
  if (success && userInfo) {
    await logActivity(
      "DELETE",
      "PRODUTO",
      `Produto (ID: ${id}) excluído por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};

// Assets
export const getAssets = (forceRefresh = false) => getAll<Asset>('assets', 'name', true, forceRefresh);
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
  const result = await upsert<Asset>('assets', asset);
  if (result && userInfo) {
    await logActivity(
      asset.id ? "UPDATE" : "CREATE",
      "PATRIMONIO",
      `Patrimônio "${result.name}" (${result.code}) ${asset.id ? "atualizado" : "criado"} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
};
export const deleteAsset = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await remove('assets', id);
  if (success && userInfo) {
    await logActivity(
      "DELETE",
      "PATRIMONIO",
      `Patrimônio (ID: ${id}) excluído por ${userInfo.name}.`,
      id,
      userInfo.name
    );
  }
  return success;
};

// Movements
export const getMovements = (forceRefresh = false) => getAll<StockMovement>('stock_movements', 'date', false, forceRefresh);
export const saveMovement = async (movement: Partial<StockMovement>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<StockMovement>('stock_movements', movement);
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
  if (!assetId) {
    return getAll<MaintenanceTask>('maintenance_tasks', 'due_date', true, forceRefresh);
  }
  let query = supabase.from('maintenance_tasks').select('*').order('due_date', { ascending: true });
  query = query.eq('asset_id', assetId);
  try {
    const { data, error } = await withTimeout(query);
    if (error) return [];
    return data as MaintenanceTask[];
  } catch (error) {
    return [];
  }
};
export const saveMaintenanceTask = async (task: Partial<MaintenanceTask>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<MaintenanceTask>('maintenance_tasks', task);
  if (result && userInfo) {
    await logActivity(
      task.id ? "UPDATE" : "CREATE",
      "MANUTENCAO",
      `Tarefa de manutenção "${result.title}" para "${result.asset_name}" ${task.id ? "atualizada" : "criada"} por ${userInfo.name}.`,
      result.id,
      userInfo.name
    );
  }
  return result;
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
  } catch (error) {
    return [];
  }
};
export const saveCheckout = async (checkout: Partial<Checkout>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<Checkout>('checkouts', checkout);
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
export const saveCostCenter = (cc: Partial<CostCenter>) => upsert<CostCenter>('cost_centers', cc);

// Storage Locations
export const getStorageLocations = (forceRefresh = false) => getAll<StorageLocation>('storage_locations', 'name', true, forceRefresh);
export const saveStorageLocation = (loc: Partial<StorageLocation>) => upsert<StorageLocation>('storage_locations', loc);

// Audit Logs
export const getAuditLogs = (forceRefresh = false) => getAll<AuditLog>('admin_audit_logs', 'created_at', false, forceRefresh);

export const logActivity = async (
  action: string,
  resource: string,
  details: any,
  resourceId?: string,
  userName?: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const deviceInfo = getDeviceInfo();

    // Construct the log entry matching admin_audit_logs table
    const logEntry = {
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

    return upsert<AuditLog>('admin_audit_logs', logEntry);
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
};



// Users / Profiles
export const getUsers = (forceRefresh = false) => getAll<User>('profiles', 'name', true, forceRefresh);
export const saveUser = async (user: Partial<User>, userInfo?: { name: string, id: string }) => {
  if (!user.id && !user.email) return Promise.resolve(null); // Basic validation
  const result = await upsert<User>('profiles', user);
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
  } catch (error) {
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
  } catch (error) {
    return [];
  }
};
export const saveAssetTimeline = (timeline: Partial<AssetTimeline>) => upsert<AssetTimeline>('asset_timelines', timeline);

import { supabase } from './supabase';
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

const isOnline = () => typeof window !== 'undefined' && window.navigator.onLine;

const TIMEOUT_MS = 15000;
const CACHE_TTL = 60000; // 60 seconds

const memoryCache: Record<string, { data: any[], timestamp: number }> = {};

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
  const cached = memoryCache[table];
  const now = Date.now();

  if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`[Cache] Serving ${table} from memory`);
    return cached.data as T[];
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .select('*')
        .order(orderColumn, { ascending })
    );

    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      return cached ? cached.data as T[] : []; // Return stale cache on error if available
    }

    // Update cache
    memoryCache[table] = { data: data, timestamp: now };

    return data as T[];
  } catch (err) {
    console.error(`Timeout or error fetching from ${table}:`, err);
    return cached ? cached.data as T[] : []; // Return stale cache on error if available
  }
}

async function upsert<T>(table: string, item: Partial<T>): Promise<T | null> {
  // Invalidate cache immediately
  delete memoryCache[table];

  if (!isOnline()) {
    addToSyncQueue({ table, action: 'upsert', payload: item });
    return item as T;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(table)
        .upsert(item)
        .select()
        .single()
    );

    if (error) {
      console.error(`Error saving to ${table}:`, error);
      return null;
    }
    return data as T;
  } catch (err) {
    console.error(`Timeout or error saving to ${table}:`, err);
    return null;
  }
}

async function remove(table: string, id: string): Promise<boolean> {
  // Invalidate cache immediately
  delete memoryCache[table];

  if (!isOnline()) {
    addToSyncQueue({ table, action: 'delete', payload: { id } });
    return true;
  }

  try {
    const { error } = await withTimeout(
      supabase
        .from(table)
        .delete()
        .match({ id })
    );

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Timeout or error deleting from ${table}:`, err);
    return false;
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
    await saveAuditLog({
      action: product.id ? "UPDATE" : "CREATE",
      entity: "PRODUTO",
      entity_id: result.id,
      user_name: userInfo.name,
      details: `Produto "${result.name}" (${result.sku}) ${product.id ? "atualizado" : "criado"} por ${userInfo.name}.`,
    });
  }
  return result;
};
export const deleteProduct = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await remove('products', id);
  if (success && userInfo) {
    await saveAuditLog({
      action: "DELETE",
      entity: "PRODUTO",
      entity_id: id,
      user_name: userInfo.name,
      details: `Produto (ID: ${id}) excluído por ${userInfo.name}.`,
    });
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
    await saveAuditLog({
      action: asset.id ? "UPDATE" : "CREATE",
      entity: "PATRIMONIO",
      entity_id: result.id,
      user_name: userInfo.name,
      details: `Patrimônio "${result.name}" (${result.code}) ${asset.id ? "atualizado" : "criado"} por ${userInfo.name}.`,
    });
  }
  return result;
};
export const deleteAsset = async (id: string, userInfo?: { name: string, id: string }) => {
  const success = await remove('assets', id);
  if (success && userInfo) {
    await saveAuditLog({
      action: "DELETE",
      entity: "PATRIMONIO",
      entity_id: id,
      user_name: userInfo.name,
      details: `Patrimônio (ID: ${id}) excluído por ${userInfo.name}.`,
    });
  }
  return success;
};

// Movements
export const getMovements = (forceRefresh = false) => getAll<StockMovement>('stock_movements', 'date', false, forceRefresh);
export const saveMovement = async (movement: Partial<StockMovement>, userInfo?: { name: string, id: string }) => {
  const result = await upsert<StockMovement>('stock_movements', movement);
  if (result && userInfo) {
    await saveAuditLog({
      action: movement.type === "entrada" ? "CREATE" : "DELETE", // Interpreting Stock IN/OUT as Create/Delete logic for simplicity or just UPDATE
      entity: "ESTOQUE",
      entity_id: result.id,
      user_name: userInfo.name,
      details: `Movimentação de ${movement.type} (${movement.quantity} un.) para "${movement.product_name}" por ${userInfo.name}.`
    })
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
    await saveAuditLog({
      action: task.id ? "UPDATE" : "CREATE",
      entity: "MANUTENCAO",
      entity_id: result.id,
      user_name: userInfo.name,
      details: `Tarefa de manutenção "${result.title}" para "${result.asset_name}" ${task.id ? "atualizada" : "criada"} por ${userInfo.name}.`,
    });
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
    await saveAuditLog({
      action: checkout.id ? "UPDATE" : "CHECKOUT",
      entity: "CHECKOUT",
      entity_id: result.id,
      user_name: userInfo.name,
      details: `Checkout de "${result.item_name}" ${checkout.id ? "atualizado" : "realizado"} para ${result.user_name} por ${userInfo.name}.`,
    });
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
export const getAuditLogs = (forceRefresh = false) => getAll<AuditLog>('audit_logs', 'timestamp', false, forceRefresh);
export const saveAuditLog = async (log: Partial<AuditLog>) => {
  // Enrich log with simple device info if available
  const deviceInfo = getDeviceInfo();
  if (deviceInfo) {
    log.user_agent = window.navigator.userAgent;
    log.device_info = deviceInfo;
  }
  // If IP isn't set, try to simulate or leave blank (mostly client-side limitation)
  if (!log.ip) log.ip = "127.0.0.1"; // Placeholder or fetch from service

  return upsert<AuditLog>('audit_logs', log);
}

// Users / Profiles
export const getUsers = (forceRefresh = false) => getAll<User>('profiles', 'name', true, forceRefresh);
export const saveUser = async (user: Partial<User>, userInfo?: { name: string, id: string }) => {
  if (!user.id && !user.email) return Promise.resolve(null); // Basic validation
  const result = await upsert<User>('profiles', user);
  if (result && userInfo) {
    await saveAuditLog({
      action: "UPDATE",
      entity: "USUARIO",
      entity_id: result.id,
      user_name: userInfo.name,
      details: `Usuário "${result.name}" (${result.email}) atualizado por ${userInfo.name}.`,
    });
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

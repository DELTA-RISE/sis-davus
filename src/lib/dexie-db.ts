import Dexie, { Table } from 'dexie';
import {
    Product, Asset, StockMovement, MaintenanceTask,
    Checkout, CostCenter, StorageLocation, AuditLog,
    User, AssetTimeline
} from './store';

export class SisDavusDB extends Dexie {
    products!: Table<Product>;
    assets!: Table<Asset>;
    stock_movements!: Table<StockMovement>;
    maintenance_tasks!: Table<MaintenanceTask>;
    checkouts!: Table<Checkout>;
    cost_centers!: Table<CostCenter>;
    storage_locations!: Table<StorageLocation>;
    admin_audit_logs!: Table<AuditLog>;
    profiles!: Table<User>;
    asset_timelines!: Table<AssetTimeline>;
    sync_queue!: Table<{
        id?: number;
        table: string;
        action: 'upsert' | 'delete';
        payload: any;
        timestamp: number;
        status: 'pending' | 'syncing' | 'failed';
    }>;

    constructor() {
        super('SisDavusDB');
        this.version(1).stores({
            products: 'id, name, sku, category',
            assets: 'id, name, code, category, location, status',
            stock_movements: 'id, type, product_id, date',
            maintenance_tasks: 'id, status, priority, due_date, asset_id',
            checkouts: 'id, item_id, user_id, status, checkout_date',
            cost_centers: 'id, name, code',
            storage_locations: 'id, name, type',
            admin_audit_logs: 'id, action, resource, created_at',
            profiles: 'id, name, email, role',
            asset_timelines: 'id, asset_id, type',
            sync_queue: '++id, table, status'
        });
    }
}

export const db = new SisDavusDB();

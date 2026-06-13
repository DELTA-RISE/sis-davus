import Dexie, { Table } from 'dexie';
import {
    Product, Asset, StockMovement, MaintenanceTask,
    Checkout, CostCenter, AuditLog,
    User, AssetTimeline, WriteOffRequest, Category
} from './store';

export class SisDavusDB extends Dexie {
    products!: Table<Product>;
    assets!: Table<Asset>;
    stock_movements!: Table<StockMovement>;
    maintenance_tasks!: Table<MaintenanceTask>;
    checkouts!: Table<Checkout>;
    cost_centers!: Table<CostCenter>;
    categories!: Table<Category>;

    admin_audit_logs!: Table<AuditLog>;
    profiles!: Table<User>;
    asset_timelines!: Table<AssetTimeline>;
    write_off_requests!: Table<WriteOffRequest>;
    sync_queue!: Table<{
        id?: number;
        table: string;
        action: 'upsert' | 'delete';
        payload: Record<string, unknown>;
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

            admin_audit_logs: 'id, action, resource, created_at',
            profiles: 'id, name, email, role',
            asset_timelines: 'id, asset_id, type',
            write_off_requests: 'id, asset_id, user_id, status',
            sync_queue: '++id, table, status',
            categories: 'id, name, type'
        });
        this.version(2).stores({
            maintenance_tasks: 'id, status, priority, due_date, asset_id, approval_status',
        });
        this.version(3).stores({
            products: 'id, name, sku, category, cost_center',
            assets: 'id, name, code, category, location, status, cost_center',
            stock_movements: 'id, type, product_id, cost_center, date',
            checkouts: 'id, item_id, user_id, status, checkout_date',
        });
    }
}

export const db = new SisDavusDB();


import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie-db";
import { User, Product, Asset, StockMovement, Checkout, MaintenanceTask } from "@/lib/store";

// Helper to sort by created_at desc (or name asc, etc)
// We'll mimic the current ordering in db.ts

export function useUsers(searchTerm = ""): { users: User[], isLoading: boolean } {
    const users = useLiveQuery(async () => {
        const all = await db.profiles.toArray();
        // Assuming we want to filter soft-deleted locally for display (if deleted_at logic exists in store/db)
        // Check store.ts/db.ts: db.ts uses 'deleted_at' for strict deletion. 
        // Note: The current 'User' type might not have deleted_at exposed in the UI but let's assume valid users.

        let filtered = all;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = all.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            );
        }

        // internal sort
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm]);

    return {
        users: users || [],
        isLoading: users === undefined // simple loading state for Dexie
    };
}

export function useProducts(searchTerm = "") {
    const products = useLiveQuery(async () => {
        const all = await db.products.toArray();
        const active = all.filter((p: any) => !p.deleted_at);

        if (!searchTerm) return active.sort((a, b) => a.name.localeCompare(b.name));

        const lower = searchTerm.toLowerCase();
        return active.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.sku.toLowerCase().includes(lower)
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm]);

    return { products: products || [], isLoading: products === undefined };
}

export function useAssets(searchTerm = "") {
    const assets = useLiveQuery(async () => {
        const all = await db.assets.toArray();
        const active = all.filter((a: any) => !a.deleted_at);

        if (!searchTerm) return active.sort((a, b) => a.name.localeCompare(b.name));

        const lower = searchTerm.toLowerCase();
        return active.filter(a =>
            a.name.toLowerCase().includes(lower) ||
            (a.code && a.code.toLowerCase().includes(lower))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm]);

    return { assets: assets || [], isLoading: assets === undefined };
}

export function useDashboardData() {
    // This aggregates multiple queries.
    // useLiveQuery to return the whole stats object.

    const data = useLiveQuery(async () => {
        const [products, assets, movements, checkouts] = await Promise.all([
            db.products.toArray(),
            db.assets.toArray(),
            db.stock_movements.toArray(),
            db.checkouts.toArray()
        ]);

        const activeProducts = products.filter((p: any) => !p.deleted_at);
        const activeAssets = assets.filter((a: any) => !a.deleted_at);

        // We can just return raw arrays and let the component derive stats 
        // OR derive them here. Deriving here is fine.

        return {
            products: activeProducts,
            assets: activeAssets,
            movements, // All movements usually
            checkouts
        };
    });

    return {
        products: data?.products || [],
        assets: data?.assets || [],
        movements: data?.movements || [],
        checkouts: data?.checkouts || [],
        isLoading: data === undefined
    };
}

export function useCostCenters() {
    const list = useLiveQuery(async () => {
        return await db.cost_centers.orderBy('name').toArray();
    });
    return { costCenters: list || [], isLoading: list === undefined };
}

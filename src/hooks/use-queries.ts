
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie-db";


// ...

export function useProducts(searchTerm = "") {
    const products = useLiveQuery(async () => {
        const all = await db.products.orderBy('name').toArray();
        const active = all.filter((p) => !p.deleted_at);

        if (!searchTerm) return active;

        const lower = searchTerm.toLowerCase();
        return active.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.sku.toLowerCase().includes(lower)
        );
    }, [searchTerm]);

    return { products: products || [], isLoading: products === undefined };
}

export function useUsers(searchTerm = "") {
    const users = useLiveQuery(async () => {
        const all = await db.profiles.orderBy('name').toArray();
        const active = all.filter((u) => u.status !== 'inativo'); // Or whatever logic for active users

        if (!searchTerm) return active;

        const lower = searchTerm.toLowerCase();
        return active.filter((u) =>
            u.name.toLowerCase().includes(lower) ||
            u.email.toLowerCase().includes(lower)
        );
    }, [searchTerm]);

    return { users: users || [], isLoading: users === undefined };
}

export function useAssets(searchTerm = "") {
    const assets = useLiveQuery(async () => {
        const all = await db.assets.orderBy('name').toArray();
        const active = all.filter((a) => !a.deleted_at);

        if (!searchTerm) return active;

        const lower = searchTerm.toLowerCase();
        return active.filter(a =>
            a.name.toLowerCase().includes(lower) ||
            (a.code && a.code.toLowerCase().includes(lower))
        );
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

        const activeProducts = products.filter((p) => !p.deleted_at);
        const activeAssets = assets.filter((a) => !a.deleted_at);

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

export function useCategories(type: 'insumo' | 'patrimonio') {
    const list = useLiveQuery(async () => {
        return await db.categories.where('type').equals(type).sortBy('name');
    }, [type]);
    return { categories: list || [], isLoading: list === undefined };
}

export function useNotifications() {
    // Aggregates data for notifications
    const data = useLiveQuery(async () => {
        const [products, assets, writeOffs, maintenanceTasks] = await Promise.all([
            db.products.toArray(),
            db.assets.toArray(),
            db.write_off_requests.toArray(),
            db.maintenance_tasks.toArray()
        ]);

        return {
            products: products.filter(p => !p.deleted_at),
            assets: assets.filter(a => !a.deleted_at),
            writeOffs,
            maintenanceTasks
        };
    });

    return {
        data: data || { products: [], assets: [], writeOffs: [], maintenanceTasks: [] },
        isLoading: data === undefined
    };
}

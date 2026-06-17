import { useMemo, useEffect, useState } from "react";
import { toast } from "sonner";
import { syncTable } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie-db";

import { DateRange } from "react-day-picker";
import { isWithinInterval, subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkout, StockMovement } from "@/lib/store";

interface DashboardDataParams {
    role?: string;
    costCenterId?: string | null;
    userId?: string | null;
    userName?: string | null;
    dateRange?: DateRange;
}

const EMPTY_ARRAY: never[] = [];

export function useDashboardData({ role, costCenterId, userId, userName, dateRange }: DashboardDataParams = {}) {
    const [isInitialSyncing, setIsInitialSyncing] = useState(true);

    useEffect(() => {
        if (!role || typeof window === "undefined") {
            setIsInitialSyncing(false);
            return;
        }

        let cancelled = false;
        setIsInitialSyncing(true);

        const hasCachedData = async () => {
            const [productsCount, assetsCount, movementsCount, checkoutsCount] = await Promise.all([
                db.products.count(),
                db.assets.count(),
                db.stock_movements.count(),
                db.checkouts.count(),
            ]);
            return productsCount + assetsCount + movementsCount + checkoutsCount > 0;
        };

        const runScopedSync = async () => {
            try {
                await Promise.all([
                    syncTable('products', 'name', true),
                    syncTable('assets', 'name', true),
                    syncTable('stock_movements', 'date', false),
                    syncTable('checkouts', 'checkout_date', false)
                ]);
            } finally {
                if (!cancelled) setIsInitialSyncing(false);
            }
        };

        void hasCachedData().then((hasCache) => {
            if (!cancelled && hasCache) setIsInitialSyncing(false);
        });

        const win = window as Window & {
            requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };

        if (win.requestIdleCallback && win.cancelIdleCallback) {
            const idleId = win.requestIdleCallback(() => void runScopedSync(), { timeout: 1200 });
            return () => {
                cancelled = true;
                win.cancelIdleCallback?.(idleId);
            };
        }

        const timeoutId = globalThis.setTimeout(() => void runScopedSync(), 100);

        return () => {
            cancelled = true;
            globalThis.clearTimeout(timeoutId);
        };
    }, [role, costCenterId]);

    const data = useLiveQuery(async () => {
        let productsQuery = db.products.filter(p => !p.deleted_at);
        let assetsQuery = db.assets.filter(a => !a.deleted_at);
        // Movements don't typically have cost_center directly on the table in this schema?
        // Actually, store.ts says User has cost_center. Movement has user_id or similar?
        // Checking StockMovement interface: product_id, type, quantity, reason, date. No cost_center.
        // But we can filter by products that belong to cost_center? Or assume movements should be filtered by user?
        // Use case: Manager checks "Movements". They should see movements of THEIR products or THEIR actions?
        // Usually movements of products in their cost center.
        // NOTE: Product has `cost_center`? Let's check store.ts.
        // Wait, db.ts getAllFiltered uses `item.cost_center`.
        // Let's assume Products and Assets have `cost_center`.

        if (costCenterId) {
            productsQuery = productsQuery.filter(p => p.cost_center === costCenterId);
            assetsQuery = assetsQuery.filter(a => a.cost_center === costCenterId);
        }

        const [products, assets] = await Promise.all([
            productsQuery.toArray(),
            assetsQuery.toArray(),
        ]);

        const visibleProductIds = new Set(products.map(p => p.id));
        const visibleAssetIds = new Set(assets.map(a => a.id));
        const [allMovements, allCheckouts] = await Promise.all([
            costCenterId
                ? db.stock_movements
                    .where('cost_center')
                    .equals(costCenterId)
                    .toArray()
                : db.stock_movements.toArray(),
            db.checkouts.toArray()
        ]);

        const movements = (allMovements as StockMovement[]).filter(m =>
            visibleProductIds.has(m.product_id) ||
            Boolean(costCenterId && m.cost_center === costCenterId)
        );

        const checkouts = allCheckouts.filter(c => {
            const belongsToCurrentUser =
                Boolean(userId && c.user_id === userId) ||
                Boolean(userName && c.user_name === userName);
            if (belongsToCurrentUser) return true;
            if (c.item_type === 'asset') return visibleAssetIds.has(c.item_id);
            // if c.item_type === 'product' // Checkouts usually only assets in this system?
            // Interface says item_type: 'product' | 'asset'.
            return visibleProductIds.has(c.item_id); // Fallback
        }) as Checkout[];


        return { products, assets, movements, checkouts };
    }, [role, costCenterId, userId, userName]);

    const refreshData = async () => {
        await Promise.all([
            syncTable('products', 'name', true),
            syncTable('assets', 'name', true),
            syncTable('stock_movements', 'date', false),
            syncTable('checkouts', 'checkout_date', false)
        ]);
        toast.success("Dados atualizados!");
    };

    const products = data?.products || EMPTY_ARRAY;
    const assets = data?.assets || EMPTY_ARRAY;
    const movements = data?.movements || EMPTY_ARRAY;
    const checkouts = data?.checkouts || EMPTY_ARRAY;
    const hasAnyData = products.length + assets.length + movements.length + checkouts.length > 0;
    const isLoading = !data || (isInitialSyncing && !hasAnyData);

    // Derived Data
    const lowStockProducts = useMemo(() =>
        products.filter((p) => p.quantity < (p.min_stock || 0)),
        [products]);

    const pendingCheckouts = useMemo(() =>
        checkouts.filter((c) => c.status === "Ativo" || c.status === "Atrasado"),
        [checkouts]);

    const assetsInMaintenance = useMemo(() =>
        assets.filter((a) => a.condition === "Manutenção"),
        [assets]);

    const recentMovements = useMemo(() =>
        [...movements]
            .sort((a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime())
            .slice(0, 5),
        [movements]);

    const stockByCategory = useMemo(() => {
        const categories: Record<string, number> = {};
        products.forEach((p) => {
            const category = p.category || "Sem categoria";
            categories[category] = (categories[category] || 0) + p.quantity;
        });
        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by value desc
    }, [products]);

    const movementsData = useMemo(() => {
        const days: Record<string, { name: string; entradas: number; saidas: number }> = {};

        let rangeStart = subDays(new Date(), 6); // Default to last 7 days (today - 6)
        let rangeEnd = new Date();

        if (dateRange?.from) {
            rangeStart = dateRange.from;
            rangeEnd = dateRange.to || dateRange.from;
        }

        // Generate all days in interval
        const intervalDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

        intervalDays.forEach(d => {
            const dateStr = d.toISOString().split("T")[0];
            const label = format(d, "EEE", { locale: ptBR }); // Short weekday
            days[dateStr] = { name: label, entradas: 0, saidas: 0 };
        });

        movements.forEach((m) => {
            if (!m.date) return;
            const mDate = new Date(m.date);
            // Check if within range
            if (isWithinInterval(mDate, { start: startOfDay(rangeStart), end: endOfDay(rangeEnd) })) {
                const dateStr = mDate.toISOString().split("T")[0];
                if (days[dateStr]) {
                    if (m.type === "entrada") days[dateStr].entradas += m.quantity;
                    else days[dateStr].saidas += m.quantity;
                }
            }
        });

        return Object.values(days);
    }, [movements, dateRange]);

    return {
        products,
        assets,
        movements,
        checkouts,
        isLoading,
        refreshData,
        lowStockProducts,
        pendingCheckouts,
        assetsInMaintenance,
        recentMovements,
        stockByCategory,
        movementsData
    };
}

import { useMemo, useEffect } from "react";
import { toast } from "sonner";
import { mockProducts, mockAssets, mockStockMovements, mockCheckouts } from "@/lib/store";
import { syncTable } from "@/lib/db";
import { useOnboarding } from "@/lib/onboarding-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie-db";

import { DateRange } from "react-day-picker";
import { isWithinInterval, subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardDataParams {
    role?: string;
    costCenterId?: string | null;
    dateRange?: DateRange;
}

const EMPTY_ARRAY: never[] = [];

export function useDashboardData({ role, costCenterId, dateRange }: DashboardDataParams = {}) {
    const { isDemoMode } = useOnboarding();

    // Trigger Syncs
    useEffect(() => {
        if (!isDemoMode && role === 'admin') {
            // Admin syncs everything to ensure they can see all data
            syncTable('products', 'name', true);
            syncTable('assets', 'name', true);
            syncTable('stock_movements', 'date', false);
            syncTable('checkouts', 'checkout_date', false);
        }
    }, [isDemoMode, role]);

    const data = useLiveQuery(async () => {
        if (isDemoMode) {
            return {
                products: mockProducts,
                assets: mockAssets,
                movements: mockStockMovements,
                checkouts: mockCheckouts
            };
        }

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

        const targetCostCenter = role === 'gestor' ? (costCenterId || undefined) : costCenterId; // If gestor, costCenterId passed in hook should be theirs.

        if (targetCostCenter) {
            productsQuery = productsQuery.filter(p => p.cost_center === targetCostCenter);
            assetsQuery = assetsQuery.filter(a => a.cost_center === targetCostCenter);
        }

        const [products, assets, allMovements, allCheckouts] = await Promise.all([
            productsQuery.toArray(),
            assetsQuery.toArray(),
            db.stock_movements.toArray(),
            db.checkouts.toArray()
        ]);

        // Post-filter movements based on visible products?
        // Or if we want to be strict, we need to join.
        // For dashboard speed, let's filter movements that relate to the visible products.
        const visibleProductIds = new Set(products.map(p => p.id));
        const movements = allMovements.filter(m => visibleProductIds.has(m.product_id));

        // Checkouts: filter by asset_id (if asset) or item_id (if product)
        const visibleAssetIds = new Set(assets.map(a => a.id));
        const checkouts = allCheckouts.filter(c => {
            if (c.item_type === 'asset') return visibleAssetIds.has(c.item_id);
            // if c.item_type === 'product' // Checkouts usually only assets in this system?
            // Interface says item_type: 'product' | 'asset'.
            return visibleProductIds.has(c.item_id); // Fallback
        });


        return { products, assets, movements, checkouts };
    }, [isDemoMode, role, costCenterId]);

    const refreshData = async () => {
        if (isDemoMode) {
            toast.success("Dados atualizados (Demo)!");
            return;
        }
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
    const isLoading = !data;

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
        movements.slice(0, 5),
        [movements]);

    const stockByCategory = useMemo(() => {
        const categories: Record<string, number> = {};
        products.forEach((p) => {
            categories[p.category] = (categories[p.category] || 0) + p.quantity;
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

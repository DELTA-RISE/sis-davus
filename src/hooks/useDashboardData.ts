import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Product, Asset, StockMovement, Checkout } from "@/lib/store";
import { getProducts, getAssets, getMovements, getCheckouts } from "@/lib/db";

export function useDashboardData() {
    const [products, setProducts] = useState<Product[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [checkouts, setCheckouts] = useState<Checkout[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [p, a, m, c] = await Promise.all([
                getProducts(),
                getAssets(),
                getMovements(),
                getCheckouts(),
            ]);
            setProducts(p);
            setAssets(a);
            setMovements(m);
            setCheckouts(c);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            toast.error("Erro ao carregar dados do dashboard");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const refreshData = useCallback(async () => {
        await loadData(true); // Silent for pull to refresh or manual refresh to avoid skeleton flash if desired, 
        // OR await loadData(false) if we WANT skeleton. 
        // For PullToRefresh, typically we dont want full page skeleton, the ptr spinner is enough.
        // Let's stick to the plan: silent updates for background/minor refreshes.
        // Actually for explicit "Refresh", maybe we keep it as is?
        // The plan said: "Update `refreshData` to use `loadData(false)` (or true...)"
        // Let's make refreshData use silent=true so the user sees the old data while new comes in, 
        // unless it's an initial load.
        // Wait, PullToRefresh has its own spinner. So silent=true is perfect.
        toast.success("Dados atualizados!");
    }, [loadData]);

    // Derived Data
    const lowStockProducts = useMemo(() =>
        products.filter((p) => p.quantity < (p.min_stock || 0)),
        [products]);

    const pendingCheckouts = useMemo(() =>
        checkouts.filter((c) => c.status === "em_uso" || c.status === "atrasado"),
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
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const label = d.toLocaleDateString("pt-BR", { weekday: "short" });
            return { dateStr, label };
        }).reverse();

        last7Days.forEach(({ dateStr, label }) => {
            days[dateStr] = { name: label, entradas: 0, saidas: 0 };
        });

        movements.forEach((m) => {
            const date = m.date?.split("T")[0];
            if (date && days[date]) {
                if (m.type === "entrada") days[date].entradas += m.quantity;
                else days[date].saidas += m.quantity;
            }
        });

        return Object.values(days);
    }, [movements]);

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

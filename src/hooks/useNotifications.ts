import { useState, useEffect, useCallback } from "react";
import { getProducts, getAssets, getCheckouts, getWriteOffRequests, getMaintenanceTasks } from "@/lib/db";
import {
    getReadNotifications,
    saveReadNotifications,
    getDismissedNotifications,
    saveDismissedNotifications
} from "@/lib/localStorage";
import { useAuth } from "@/lib/auth-context";
import { getScopedCostCenter } from "@/lib/access-scope";

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    unread: boolean;
    type: "low_stock" | "maintenance" | "overdue" | "write_off_request" | "maintenance_request";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
}

export function useNotifications() {
    const { currentRole, costCenter } = useAuth();
    const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        // Initial load from local storage
        setReadIds(getReadNotifications());
        setDismissedIds(getDismissedNotifications());
    }, []);

    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const [products, assets, checkouts, writeOffRequests, maintenanceTasks] = await Promise.all([
                getProducts(false, scopedCostCenter),
                getAssets(false, scopedCostCenter),
                getCheckouts(),
                getWriteOffRequests(),
                getMaintenanceTasks(),
            ]);
            const visibleProductIds = new Set(products.map((product) => product.id));
            const visibleAssetIds = new Set(assets.map((asset) => asset.id));
            const visibleCheckouts = checkouts.filter((checkout) => {
                if (checkout.item_type === "asset") return visibleAssetIds.has(checkout.item_id);
                return visibleProductIds.has(checkout.item_id);
            });

            const lowStockNotifs: Notification[] = products
                .filter(p => p.quantity < (p.min_stock || 0))
                .map(p => ({
                    id: `prod-${p.id}`,
                    title: "Estoque Baixo",
                    message: `${p.name} está com ${p.quantity} unidades (Mínimo: ${p.min_stock})`,
                    time: "Agora",
                    unread: !readIds.includes(`prod-${p.id}`),
                    type: "low_stock"
                }));

            const maintenanceNotifs: Notification[] = assets
                .filter(a => a.condition === "Manutenção")
                .map(a => ({
                    id: `asset-${a.id}`,
                    title: "Em Manutenção",
                    message: `${a.name} (${a.code}) está em manutenção`,
                    time: "Agora",
                    unread: !readIds.includes(`asset-${a.id}`),
                    type: "maintenance"
                }));

            const overdueNotifs: Notification[] = visibleCheckouts
                .filter(c => c.status === "Atrasado" || (c.status === "Ativo" && c.expected_return_date && new Date(c.expected_return_date) < new Date()))
                .map(c => ({
                    id: `checkout-${c.id}`,
                    title: "Checkout Atrasado",
                    message: `${c.item_name} deveria ter sido devolvido em ${new Date(c.expected_return_date || "").toLocaleDateString()}`,
                    time: "Atrasado",
                    unread: !readIds.includes(`checkout-${c.id}`),
                    type: "overdue"
                }));

            const writeOffNotifs: Notification[] = writeOffRequests
                .filter(r => r.status === 'pending' && visibleAssetIds.has(r.asset_id))
                .map(r => ({
                    id: `writeoff-${r.id}`,
                    title: "Solicitação de Baixa",
                    message: `Solicitado por ${r.user_name || 'Usuário'} para o patrimônio ${r.asset_name || r.asset_id}. Motivo: ${r.reason}`,
                    time: new Date(r.created_at || "").toLocaleDateString(),
                    unread: true,
                    type: "write_off_request",
                    metadata: r
                }));

            const maintenanceRequestNotifs: Notification[] = maintenanceTasks
                .filter(t => t.approval_status === 'pending' && visibleAssetIds.has(t.asset_id))
                .map(t => ({
                    id: `maint-req-${t.id}`,
                    title: "Solicitação de Manutenção",
                    message: `Solicitado por ${t.created_by || 'Gestor'} para ${t.asset_name} (${t.priority}). ${t.title}`,
                    time: new Date(t.created_at || "").toLocaleDateString(),
                    unread: true,
                    type: "maintenance_request",
                    metadata: t
                }));

            const allNotifs = [...writeOffNotifs, ...maintenanceRequestNotifs, ...lowStockNotifs, ...maintenanceNotifs, ...overdueNotifs]
                .filter(n => !dismissedIds.includes(n.id));

            setNotifications(allNotifs);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setIsLoading(false);
        }
    }, [readIds, dismissedIds, scopedCostCenter]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const markAsRead = (id: string) => {
        const newRead = [...readIds, id];
        setReadIds(newRead);
        saveReadNotifications(newRead);
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        const newRead = Array.from(new Set([...readIds, ...allIds]));
        setReadIds(newRead);
        saveReadNotifications(newRead);
    };

    const dismissNotification = (id: string) => {
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        saveDismissedNotifications(newDismissed);
    };

    const clearAllNotifications = () => {
        const allIds = notifications.map(n => n.id);
        const newDismissed = Array.from(new Set([...dismissedIds, ...allIds]));
        setDismissedIds(newDismissed);
        saveDismissedNotifications(newDismissed);
    }

    return {
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        refreshNotifications: loadNotifications,
        clearAllNotifications
    };
}

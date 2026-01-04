"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts, getAssets, getCheckouts } from "@/lib/db";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Package, Building2, ChevronLeft, Trash2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "low_stock" | "maintenance" | "overdue";
}

import {
  getReadNotifications,
  saveReadNotifications,
  getDismissedNotifications,
  saveDismissedNotifications
} from "@/lib/localStorage";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setReadIds(getReadNotifications());
    setDismissedIds(getDismissedNotifications());
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    const [products, assets, checkouts] = await Promise.all([
      getProducts(),
      getAssets(),
      getCheckouts(),
    ]);

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

    const overdueNotifs: Notification[] = checkouts
      .filter(c => c.status === "atrasado" || (c.status === "em_uso" && c.expected_return && new Date(c.expected_return) < new Date()))
      .map(c => ({
        id: `checkout-${c.id}`,
        title: "Checkout Atrasado",
        message: `${c.item_name} deveria ter sido devolvido em ${new Date(c.expected_return || "").toLocaleDateString()}`,
        time: "Atrasado",
        unread: !readIds.includes(`checkout-${c.id}`),
        type: "overdue"
      }));

    const allNotifs = [...lowStockNotifs, ...maintenanceNotifs, ...overdueNotifs]
      .filter(n => !dismissedIds.includes(n.id));

    setNotifications(allNotifs);
    setIsLoading(false);
  }, [readIds, dismissedIds]);

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

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    saveDismissedNotifications(newDismissed);
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    const newDismissed = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(newDismissed);
    saveDismissedNotifications(newDismissed);
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => router.back()}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Notificações
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => n.unread) && (
                <Button variant="outline" size="sm" className="gap-2 h-8" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4" />
                  Ler Tudo
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground hover:text-destructive" onClick={clearAll}>
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card/50 rounded-xl animate-pulse border border-border/50" />)}
            </div>
          ) : notifications.length > 0 ? (
            <StaggerContainer className="space-y-3">
              {notifications.map((notif) => (
                <StaggerItem key={notif.id}>
                  <Card
                    className={cn(
                      "border-border/50 transition-all cursor-pointer hover:bg-muted/50",
                      notif.unread ? "bg-primary/5 ring-1 ring-primary/20" : "bg-card/50"
                    )}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notif.type === "low_stock" ? "bg-destructive/10 text-destructive" :
                          notif.type === "overdue" ? "bg-red-500/10 text-red-500" :
                            "bg-amber-500/10 text-amber-500"
                      )}>
                        {notif.type === "low_stock" ? <Package className="h-5 w-5" /> :
                          notif.type === "overdue" ? <Calendar className="h-5 w-5" /> :
                            <Building2 className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm md:text-base leading-none">{notif.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notif.time}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => deleteNotification(e, notif.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1.5">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-3">
                          {notif.unread && <Badge variant="default" className="text-[10px] h-4 px-1.5">Nova</Badge>}
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                            {notif.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h2 className="text-lg font-medium">Tudo limpo!</h2>
              <p className="text-sm text-muted-foreground">Você não tem nenhuma notificação pendente.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition >
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, Package, Building2, Calendar, FileWarning, HardHat } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationCenter() {
    const router = useRouter();
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        dismissNotification
    } = useNotifications();

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-primary hover:text-primary/80"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllAsRead();
                            }}
                        >
                            Ler todas
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px] md:h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">Você não tem notificações.</p>
                        </div>
                    ) : (
                        <div className="grid gap-1 p-1">
                            {notifications.map((notif) => (
                                <DropdownMenuItem
                                    key={notif.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 cursor-pointer focus:bg-accent",
                                        notif.unread ? "bg-accent/50" : ""
                                    )}
                                    onSelect={() => {
                                        markAsRead(notif.id);
                                        if (notif.type === 'write_off_request' || notif.type === 'maintenance_request') {
                                            router.push('/notificacoes');
                                        } else if (notif.type === 'low_stock') {
                                            router.push('/estoque');
                                        } else if (notif.type === 'maintenance') {
                                            router.push('/patrimonio');
                                        } else if (notif.type === 'overdue') {
                                            router.push('/checkouts');
                                        }
                                    }}
                                >
                                    <div className={cn(
                                        "mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        notif.type === "low_stock" ? "bg-destructive/10 text-destructive" :
                                            notif.type === "overdue" ? "bg-red-500/10 text-red-500" :
                                                notif.type === "write_off_request" ? "bg-purple-500/10 text-purple-500" :
                                                    "bg-amber-500/10 text-amber-500"
                                    )}>
                                        {notif.type === "low_stock" ? <Package className="h-4 w-4" /> :
                                            notif.type === "overdue" ? <Calendar className="h-4 w-4" /> :
                                                notif.type === "write_off_request" ? <FileWarning className="h-4 w-4" /> :
                                                    notif.type === "maintenance_request" ? <HardHat className="h-4 w-4" /> :
                                                        <Building2 className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium leading-none">{notif.title}</p>
                                            <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                    </div>
                                    {notif.unread && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="p-2 text-center text-xs justify-center cursor-pointer text-muted-foreground"
                    onSelect={() => router.push('/notificacoes')}
                >
                    Ver todas as notificações
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

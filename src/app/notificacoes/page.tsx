"use client";

import type { MouseEvent } from "react";
import { approveWriteOff, rejectWriteOff } from "@/actions/write-off";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Package, Building2, ChevronLeft, Trash2, Calendar, FileWarning, CheckCircle, XCircle, HardHat, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { useNotifications, Notification } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, userName } = useAuth();

  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications,
    clearAllNotifications: clearAll
  } = useNotifications();

  const deleteNotification = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    dismissNotification(id);
  };

  const handleApprove = async (e: MouseEvent, notif: Notification) => {
    e.stopPropagation();
    if (!user) return;

    if (notif.type === 'write_off_request') {
      const request = notif.metadata;
      try {
        const result = await approveWriteOff(request.id, request.asset_id, user.id, userName);
        if (result.success) {
          toast.success("Solicitação aprovada e patrimônio baixado!");
          refreshNotifications();
        } else {
          toast.error("Erro ao aprovar: " + result.error);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao aprovar solicitação.");
      }
    } else if (notif.type === 'maintenance_request') {
      markAsRead(notif.id);
      router.push("/patrimonio/manutencao");
    }
  };

  const handleReject = async (e: MouseEvent, notif: Notification) => {
    e.stopPropagation();
    if (!user) return;

    if (notif.type === 'write_off_request') {
      const request = notif.metadata;
      try {
        const result = await rejectWriteOff(request.id, user.id);
        if (result.success) {
          toast.success("Solicitação rejeitada.");
          refreshNotifications();
        } else {
          toast.error("Erro ao rejeitar: " + result.error);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao rejeitar solicitação.");
      }
    } else if (notif.type === 'maintenance_request') {
      markAsRead(notif.id);
      router.push("/patrimonio/manutencao");
    }
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
                            notif.type === "write_off_request" ? "bg-purple-500/10 text-purple-500" :
                              "bg-amber-500/10 text-amber-500"
                      )}>
                        {notif.type === "low_stock" ? <Package className="h-5 w-5" /> :
                          notif.type === "overdue" ? <Calendar className="h-5 w-5" /> :
                            notif.type === "write_off_request" ? <FileWarning className="h-5 w-5" /> :
                              notif.type === "maintenance_request" ? <HardHat className="h-5 w-5" /> :
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
                          {notif.type === 'write_off_request' && (
                            <div className="flex items-center gap-2 ml-auto">
                              <Button size="sm" variant="outline" className="h-7 border-green-500/50 text-green-600 hover:bg-green-50" onClick={(e) => handleApprove(e, notif)}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 border-red-500/50 text-red-600 hover:bg-red-50" onClick={(e) => handleReject(e, notif)}>
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeitar
                              </Button>
                            </div>
                          )}
                          {notif.type === 'maintenance_request' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-auto h-7 border-primary/40 text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                                router.push("/patrimonio/manutencao");
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Acompanhar
                            </Button>
                          )}
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

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, QrCode, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useRouter } from "next/navigation";
import {
  getReadNotifications,
  saveReadNotifications,
  getDismissedNotifications
} from "@/lib/localStorage";
import { getProducts, getAssets } from "@/lib/db";
import { Product, Asset } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  type: "product" | "asset";
  subtext: string;
}

export function TopBar() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isBellAnimating, setIsBellAnimating] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [p, a] = await Promise.all([getProducts(), getAssets()]);
      setProducts(p);
      setAssets(a);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const readIds = getReadNotifications();
    const dismissedIds = getDismissedNotifications();

    if (!Array.isArray(products) || !Array.isArray(assets)) return;

    const lowStockNotifs: Notification[] = products
      .filter(p => p.quantity < p.min_stock)
      .filter(p => !dismissedIds.includes(`prod-${p.id}`))
      .map(p => ({
        id: `prod-${p.id}`,
        title: "Estoque Baixo",
        message: `${p.name} está com ${p.quantity} unidades`,
        time: "Agora",
        unread: !readIds.includes(`prod-${p.id}`)
      }));

    const maintenanceNotifs: Notification[] = assets
      .filter(a => a.condition === "Manutenção")
      .filter(a => !dismissedIds.includes(`asset-${a.id}`))
      .map(a => ({
        id: `asset-${a.id}`,
        title: "Em Manutenção",
        message: `${a.name} (${a.code}) está em manutenção`,
        time: "Agora",
        unread: !readIds.includes(`asset-${a.id}`)
      }));

    const allNotifs = [...lowStockNotifs, ...maintenanceNotifs];
    setNotifications(allNotifs);

    const unreadCount = allNotifs.filter(n => n.unread).length;
    const hasNewUnread = unreadCount > prevUnreadCount;

    if (hasNewUnread) {
      setIsBellAnimating(true);
      const audio = new Audio("/notification.mp3");
      audio.play().catch(e => console.log("Erro ao reproduzir som:", e));
    } else if (unreadCount === 0) {
      setIsBellAnimating(false);
    }

    setHasUnread(unreadCount > 0);
    setPrevUnreadCount(unreadCount);
  }, [products, assets, prevUnreadCount]);

  const markAsRead = (id: string) => {
    const readIds = getReadNotifications();
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      saveReadNotifications(newReadIds);
      setPrevUnreadCount(prev => prev - 1); // Trigger re-render
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const readIds = getReadNotifications();
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    saveReadNotifications(newReadIds);
    setPrevUnreadCount(0); // Trigger re-render
    setIsBellAnimating(false);
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    if (!Array.isArray(products) || !Array.isArray(assets)) return;

    const term = searchTerm.toLowerCase();

    const productResults: SearchResult[] = products
      .filter(p => p.name.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        type: "product" as const,
        subtext: `Estoque: ${p.quantity} | ${p.category}`,
      }));

    const assetResults: SearchResult[] = assets
      .filter(a => a.name.toLowerCase().includes(term) || a.code.toLowerCase().includes(term))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        name: a.name,
        type: "asset" as const,
        subtext: `${a.code} | ${a.location}`,
      }));

    setSearchResults([...productResults, ...assetResults]);
  }, [searchTerm, products, assets]);

  const handleSelect = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchTerm("");
    if (result.type === "product") {
      router.push(`/estoque?search=${encodeURIComponent(result.name)}`);
    } else {
      router.push(`/patrimonio/${result.id}`);
    }
  };



  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border safe-area-top md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Image src="/davus-logo.svg" alt="SIS DAVUS" width={32} height={32} className="w-8 h-8" priority />
            <span className="font-semibold text-sm hidden sm:inline">SIS DAVUS</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/patrimonio")}
            >
              <QrCode className="h-5 w-5" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 relative"
                >
                  <Bell className={cn("h-5 w-5", isBellAnimating && "animate-bell-ring text-primary")} />
                  {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <p className="font-semibold text-sm">Notificações</p>
                  {hasUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] gap-1"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-3 w-3" />
                      Ler tudo
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors flex items-start justify-between gap-2",
                          notif.unread && "bg-primary/5"
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                        </div>
                        {notif.unread && <span className="w-2 h-2 mt-1.5 bg-primary rounded-full shrink-0" />}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                      Nenhuma notificação por enquanto
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => router.push("/notificacoes")}
                  >
                    Ver todas
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Buscar</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos, patrimônios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto -mx-4 border-t border-border mt-4">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0",
                        result.type === "product" ? "bg-primary/20 text-primary" : "bg-chart-5/20 text-chart-5"
                      )}>
                        {result.type === "product" ? "E" : "P"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtext}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase flex-shrink-0">
                        {result.type === "product" ? "Estoque" : "Patrimônio"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Nenhum resultado encontrado
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Digite para buscar em estoque e patrimônio
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}
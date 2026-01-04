"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Bell, Command, User, CheckCheck, Shield, HardHat, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGravatarUrl } from "@/lib/gravatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getReadNotifications, saveReadNotifications, getDismissedNotifications } from "@/lib/localStorage";
import { getProducts, getAssets } from "@/lib/db";
import { Product, Asset, mockProducts, mockAssets } from "@/lib/store";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@/components/ui/dialog";
import { useOnboarding } from "@/lib/onboarding-context";

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

export function DesktopTopBar() {
  const { userName, email, currentRole, gravatarUrl } = useAuth();
  const { isDemoMode } = useOnboarding();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isBellAnimating, setIsBellAnimating] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (isDemoMode) {
        setProducts(mockProducts);
        setAssets(mockAssets);
      } else {
        const [p, a] = await Promise.all([getProducts(), getAssets()]);
        setProducts(p);
        setAssets(a);
      }
    };
    fetchData();
  }, [isDemoMode]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

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
    setSelectedIndex(0);
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

  const handleKeyDownSearch = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      handleSelect(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-b border-border items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/davus-logo.svg" alt="SIS DAVUS" width={36} height={36} className="w-9 h-9" priority />
            <span className="font-bold text-xl tracking-tight hidden lg:block">SIS <span className="text-primary">DAVUS</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 h-10 px-4 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors min-w-[300px] lg:min-w-[400px]"
              data-tour="command-palette"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1 text-left">Buscar produtos, patrimônios...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                id="header-notifications"
                className="h-10 w-10 relative rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Bell className={cn("h-5 w-5", isBellAnimating && "animate-bell-ring text-primary")} />
                {hasUnread && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-border/50 overflow-hidden">
              <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Notificações</p>
                  <p className="text-[10px] text-muted-foreground">Você tem {notifications.filter(n => n.unread).length} novas mensagens</p>
                </div>
                {hasUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-[10px] gap-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Ler tudo
                  </Button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "p-4 border-b border-border/30 hover:bg-muted/50 cursor-pointer transition-all flex items-start justify-between gap-3",
                        notif.unread && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">{notif.time}</p>
                      </div>
                      {notif.unread && <span className="w-2 h-2 mt-1.5 bg-primary rounded-full shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-xs font-medium">Nenhuma notificação</p>
                  </div>
                )}
              </div>

              <div className="p-2 bg-muted/10 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs font-semibold py-5 rounded-xl hover:bg-primary/5 hover:text-primary"
                  onClick={() => router.push("/notificacoes")}
                >
                  Ver todas as notificações
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <ThemeToggle />

          <div className="h-6 w-px bg-border mx-2" />

          <Link href="/perfil" className="flex items-center gap-3 p-1.5 px-3 rounded-xl hover:bg-muted transition-all active:scale-95 group border border-transparent hover:border-border outline-none cursor-pointer">
            <div className="flex flex-col items-end hidden lg:flex">
              <span className="text-sm font-bold leading-none">{userName}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-wider font-semibold">
                {currentRole === "admin" ? "Administrador" : "Gestor"}
              </span>
            </div>
            <Avatar className="w-9 h-9 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AvatarImage src={gravatarUrl || ""} />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                {currentRole === "admin" ? (
                  <Shield className="h-5 w-5" />
                ) : (
                  <HardHat className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
          </Link>

        </div>
      </header>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Buscar</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center border-b border-border p-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/50 px-3">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                ref={inputRef}
                placeholder="Buscar produtos, patrimônios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDownSearch}
                className="border-0 focus-visible:ring-0 h-12 text-base flex-1 bg-transparent shadow-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex h-6 items-center rounded border border-border bg-background px-2 text-xs text-muted-foreground flex-shrink-0">
                ESC
              </kbd>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-2">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold",
                    result.type === "product" ? "bg-primary/20 text-primary" : "bg-chart-5/20 text-chart-5"
                  )}>
                    {result.type === "product" ? "E" : "P"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtext}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">
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
        </DialogContent>
      </Dialog>
    </>
  );
}

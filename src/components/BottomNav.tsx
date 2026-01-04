"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  User,
  Building2,
  FileBarChart,
  Users,
  MapPin,
  FileText,
  Briefcase,
  ArrowLeftRight,
  LogOut,
  X,
  Wrench,
  Settings,
  Shield,
  HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGravatarUrl } from "@/lib/gravatar";

interface SubMenuItem {
  href: string;
  icon: typeof Home;
  label: string;
}

export function BottomNav() {
  const pathname = usePathname();
  const { currentRole, email, gravatarUrl } = useAuth();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const ferramentasGestor: SubMenuItem[] = [
    { href: "/estoque", icon: Package, label: "Estoque" },
    { href: "/patrimonio", icon: Building2, label: "Patrimônio" },
    { href: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações" },
    { href: "/checkouts", icon: LogOut, label: "Checkouts" },
    { href: "/relatorios", icon: FileBarChart, label: "Relatórios" },
  ];

  const ferramentasAdmin: SubMenuItem[] = [
    ...ferramentasGestor,
    { href: "/admin/hub", icon: Shield, label: "Hub Admin" },
  ];

  const ferramentas = currentRole === "admin" ? ferramentasAdmin : ferramentasGestor;

  const handleNavClick = (key: string) => {
    if (activeSubmenu === key) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(key);
    }
  };

  const closeSubmenu = () => {
    setActiveSubmenu(null);
  };

  const isFerramentasActive = ferramentas.some(item =>
    pathname.startsWith(item.href) || pathname.startsWith("/admin")
  );
  const isPerfilActive = pathname === "/perfil";

  return (
    <>
      {activeSubmenu && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={closeSubmenu}
        />
      )}

      {activeSubmenu === "ferramentas" && (
        <div className="md:hidden fixed bottom-20 left-0 right-0 z-50 px-4 pb-2 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-card border border-border rounded-2xl p-3 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-sm font-semibold text-foreground">
                Ferramentas
              </span>
              <button
                onClick={closeSubmenu}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ferramentas.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSubmenu}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted active:scale-95"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all",
              pathname === "/dashboard"
                ? "text-primary"
                : "text-muted-foreground active:scale-95"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all",
              pathname === "/dashboard" && "bg-primary/20"
            )}>
              <Home className={cn("h-5 w-5", pathname === "/dashboard" && "stroke-[2.5px]")} />
            </div>
            <span className="text-[10px] font-medium">Início</span>
          </Link>

          <button
            id="mobile-nav-tools"
            onClick={() => handleNavClick("ferramentas")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all",
              isFerramentasActive || activeSubmenu === "ferramentas"
                ? "text-primary"
                : "text-muted-foreground active:scale-95"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all",
              (isFerramentasActive || activeSubmenu === "ferramentas") && "bg-primary/20"
            )}>
              <Wrench className={cn("h-5 w-5", (isFerramentasActive || activeSubmenu === "ferramentas") && "stroke-[2.5px]")} />
            </div>
            <span className="text-[10px] font-medium">Ferramentas</span>
          </button>

          <Link
            href="/perfil"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all",
              isPerfilActive
                ? "text-primary"
                : "text-muted-foreground active:scale-95"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all",
              isPerfilActive && "bg-primary/20"
            )}>
              <Avatar className="h-5 w-5 rounded-lg overflow-hidden border border-transparent group-active:scale-90 transition-transform">
                <AvatarImage src={gravatarUrl || ""} />
                <AvatarFallback className="bg-transparent p-0">
                  {currentRole === "admin" ? (
                    <Shield className={cn("h-5 w-5", isPerfilActive && "stroke-[2.5px]")} />
                  ) : (
                    <HardHat className={cn("h-5 w-5", isPerfilActive && "stroke-[2.5px]")} />
                  )}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] font-medium">Perfil</span>
          </Link>

        </div>
      </nav>
    </>
  );
}

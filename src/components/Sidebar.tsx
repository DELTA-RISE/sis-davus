"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Building2,
  FileBarChart,
  Users,
  MapPin,
  FileText,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const adminItems = [
  { href: "/admin/logs", icon: FileText, label: "Logs de Auditoria" },
  { href: "/admin/usuarios", icon: Users, label: "Gestão de Usuários" },
  { href: "/admin/centros-custo", icon: Briefcase, label: "Centros de Custo" },
  { href: "/admin/locais", icon: MapPin, label: "Locais de Armazenamento" },
];

const gestorItems = [
  { href: "/estoque", icon: Package, label: "Estoque" },
  { href: "/patrimonio", icon: Building2, label: "Patrimônio" },
  { href: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações" },
  { href: "/checkouts", icon: LogOut, label: "Checkouts" },
  { href: "/relatorios", icon: FileBarChart, label: "Relatórios" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { currentRole } = useAuth();

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 p-1.5 rounded-full bg-sidebar border border-sidebar-border hover:bg-sidebar-accent transition-colors shadow-lg"
        data-tour="sidebar-trigger"
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
      </button>

      <div className="h-16" />

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Início" : ""}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Início</span>}
        </Link>

        {currentRole === "admin" && (
          <>
            {!isCollapsed && (
              <p className="px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
            )}
            {isCollapsed && <div className="h-px bg-sidebar-border my-2" />}
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.label : ""}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}

        {!isCollapsed && (
          <p className="px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gestão
          </p>
        )}
        {isCollapsed && <div className="h-px bg-sidebar-border my-2" />}
        {gestorItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
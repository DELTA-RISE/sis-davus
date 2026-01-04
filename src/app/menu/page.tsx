"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Building2,
  ArrowLeftRight,
  LogOut,
  Users,
  MapPin,
  FileText,
  Briefcase,
  FileBarChart,
  ChevronRight,
  Shield,
  UserCog,
  Home,
} from "lucide-react";
import { UserRole } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const allMenuItems = [
  { href: "/", icon: Home, label: "Início", description: "Tela inicial", category: "geral", color: "bg-primary/20 text-primary" },
  { href: "/admin/logs", icon: FileText, label: "Logs de Auditoria", description: "Histórico de ações", category: "admin", color: "bg-blue-500/20 text-blue-500" },
  { href: "/admin/usuarios", icon: Users, label: "Gestão de Usuários", description: "Gerenciar acessos", category: "admin", color: "bg-purple-500/20 text-purple-500" },
  { href: "/admin/centros-custo", icon: Briefcase, label: "Centros de Custo", description: "Gerenciar centros", category: "admin", color: "bg-amber-500/20 text-amber-500" },
  { href: "/admin/locais", icon: MapPin, label: "Locais de Armazenamento", description: "Pontos de armazenamento", category: "admin", color: "bg-green-500/20 text-green-500" },
  { href: "/estoque", icon: Package, label: "Estoque", description: "Controle de produtos", category: "gestor", color: "bg-primary/20 text-primary" },
  { href: "/patrimonio", icon: Building2, label: "Patrimônio", description: "Gestão de bens", category: "gestor", color: "bg-chart-5/20 text-chart-5" },
  { href: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações", description: "Entrada e saída", category: "gestor", color: "bg-green-500/20 text-green-500" },
  { href: "/checkouts", icon: LogOut, label: "Checkouts", description: "Retiradas e devoluções", category: "gestor", color: "bg-amber-500/20 text-amber-500" },
  { href: "/relatorios", icon: FileBarChart, label: "Relatórios", description: "Análises e indicadores", category: "gestor", color: "bg-chart-2/20 text-chart-2" },
];

export default function MenuPage() {
  const { currentRole, userName } = useAuth();

  const getMenuItems = () => {
    const geral = allMenuItems.filter(i => i.category === "geral");
    if (currentRole === "admin") return [...geral, ...allMenuItems.filter(i => i.category !== "geral")];
    return [...geral, ...allMenuItems.filter(i => i.category === "gestor")];
  };

  const menuItems = getMenuItems();

  const categories = {
    geral: "Geral",
    admin: "Administração",
    gestor: "Gestão",
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-lg font-bold">Menu</h1>
              <p className="text-xs text-muted-foreground">{userName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              {categories[category as keyof typeof categories]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-all active:scale-[0.99] h-full">
                    <CardContent className="p-3 md:p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
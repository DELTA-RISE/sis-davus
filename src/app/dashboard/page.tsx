"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, Asset, StockMovement, Checkout } from "@/lib/store";
import { getProducts, getAssets, getMovements, getCheckouts } from "@/lib/db"; // unused but keep for type safety if needed, technically types are imported from store

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useDashboardData } from "@/hooks/useDashboardData";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PageTransition, StaggerContainer, StaggerItem, SlideUp } from "@/components/PageTransition";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
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
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const adminMenuItems = [
  { href: "/admin/logs", icon: FileText, label: "Logs de Auditoria", description: "Histórico de ações", color: "bg-blue-500/20 text-blue-500" },
  { href: "/admin/usuarios", icon: Users, label: "Gestão de Usuários", description: "Gerenciar acessos", color: "bg-purple-500/20 text-purple-500" },
  { href: "/admin/centros-custo", icon: Briefcase, label: "Centros de Custo", description: "Gerenciar centros", color: "bg-amber-500/20 text-amber-500" },
  { href: "/admin/locais", icon: MapPin, label: "Locais", description: "Pontos de armazenamento", color: "bg-green-500/20 text-green-500" },
];

const gestorMenuItems = [
  { href: "/estoque", icon: Package, label: "Estoque", description: "Controle de produtos", color: "bg-primary/20 text-primary" },
  { href: "/patrimonio", icon: Building2, label: "Patrimônio", description: "Gestão de bens", color: "bg-chart-5/20 text-chart-5" },
  { href: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações", description: "Entrada e saída", color: "bg-green-500/20 text-green-500" },
  { href: "/checkouts", icon: LogOut, label: "Checkouts", description: "Retiradas e devoluções", color: "bg-amber-500/20 text-amber-500" },
  { href: "/relatorios", icon: FileBarChart, label: "Relatórios", description: "Análises e indicadores", color: "bg-chart-2/20 text-chart-2" },
];

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const { currentRole } = useAuth();
  const {
    products,
    assets,
    isLoading,
    refreshData,
    lowStockProducts,
    pendingCheckouts,
    assetsInMaintenance,
    recentMovements,
    stockByCategory,
    movementsData
  } = useDashboardData();

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: refreshData,
  });

  const getMenuItems = () => {
    if (currentRole === "admin") return [...adminMenuItems, ...gestorMenuItems];
    return gestorMenuItems;
  };

  const menuItems = getMenuItems();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={threshold} />

        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Resumo Geral</h1>
              <p className="text-xs text-muted-foreground">Bem-vindo ao SIS DAVUS</p>
            </div>
            <Badge variant="outline" className="gap-1.5 py-1 px-3">
              <Zap className="h-3 w-3 text-primary animate-pulse" />
              Sincronizado
            </Badge>
          </div>

          <SlideUp>
            <div id="dashboard-kpi" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Produtos</p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Patrimônios</p>
                    <p className="text-2xl font-bold">{assets.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-chart-5/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-chart-5" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Checkouts</p>
                    <p className="text-2xl font-bold">{pendingCheckouts.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Alertas</p>
                    <p className="text-2xl font-bold text-destructive">
                      {lowStockProducts.length + assetsInMaintenance.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </SlideUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fluxo de Estoque (7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={movementsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        tick={{ fill: 'currentColor', opacity: 0.5 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        tick={{ fill: 'currentColor', opacity: 0.5 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                      <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stockByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Acesso Rápido
            </h2>
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {menuItems.map((item) => (
                <StaggerItem key={item.href}>
                  <Link href={item.href}>
                    <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-all active:scale-[0.98] h-full">
                      <CardContent className="p-4">
                        <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <p className="font-medium text-sm">{item.label}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Movimentações Recentes
                </h2>
                <Link href="/movimentacoes" className="text-xs text-primary flex items-center gap-1">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {recentMovements.map((movement) => (
                  <Card key={movement.id} className="border-border/50 bg-card/50">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${movement.type === "entrada" ? "bg-green-500/20" : "bg-red-500/20"
                        }`}>
                        <TrendingUp className={`h-4 w-4 ${movement.type === "entrada" ? "text-green-500" : "text-red-500 rotate-180"
                          }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{movement.product_name}</p>
                        <p className="text-xs text-muted-foreground">{movement.reason}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${movement.type === "entrada" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                        }`}>
                        {movement.type === "entrada" ? "+" : "-"}{movement.quantity}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Resumo por Centro
              </h2>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 space-y-4">
                  {stockByCategory.slice(0, 4).map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{cat.name}</span>
                        <span className="text-muted-foreground">{cat.value} un</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min((cat.value / (products.length || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

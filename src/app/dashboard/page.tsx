"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Product, Asset, StockMovement, Checkout } from "@/lib/store";
// import { getProducts, getAssets, getMovements, getCheckouts } from "@/lib/db"; // unused but keep for type safety if needed, technically types are imported from store

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useDashboardData } from "@/hooks/useDashboardData";

import { PullToRefresh } from "@/components/PullToRefresh";
import { PageTransition, SlideUp, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { CalendarDateRangePicker } from "@/components/DateRangePicker";
import { NotificationCenter } from "@/components/NotificationCenter";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Package,
  Building2,
  ArrowLeftRight,
  LogOut,
  Users,
  FileText,
  Briefcase,
  FileBarChart,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Zap,
} from "lucide-react";
// import { toast } from "sonner";

const adminMenuItems = [
  { href: "/admin/logs", icon: FileText, label: "Logs de Auditoria", description: "Histórico de ações", color: "bg-blue-500/20 text-blue-500" },
  { href: "/admin/usuarios", icon: Users, label: "Gestão de Usuários", description: "Gerenciar acessos", color: "bg-purple-500/20 text-purple-500" },
  { href: "/admin/centros-custo", icon: Briefcase, label: "Centros de Custo", description: "Gerenciar centros", color: "bg-amber-500/20 text-amber-500" },
];

const gestorMenuItems = [
  { href: "/estoque", icon: Package, label: "Estoque", description: "Controle de produtos", color: "bg-primary/20 text-primary" },
  { href: "/patrimonio", icon: Building2, label: "Patrimônio", description: "Gestão de bens", color: "bg-chart-5/20 text-chart-5" },
  { href: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações", description: "Entrada e saída", color: "bg-green-500/20 text-green-500" },
  { href: "/checkouts", icon: LogOut, label: "Checkouts", description: "Retiradas e devoluções", color: "bg-amber-500/20 text-amber-500" },
  { href: "/relatorios", icon: FileBarChart, label: "Relatórios", description: "Análises e indicadores", color: "bg-chart-2/20 text-chart-2" },
];

// Chart colors from globals.css are in HEX, so we don't need hsl() wrapper
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const movementsChartConfig = {
  entradas: {
    label: "Entradas",
    color: "var(--chart-4)", // Green for entries
  },
  saidas: {
    label: "Saídas",
    color: "var(--destructive)", // Red for exits
  },
} satisfies ChartConfig;

const categoryChartConfig = {
  value: {
    label: "Quantidade",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { currentRole } = useAuth();
  const [costCenters, setCostCenters] = useState<{ id: string, name: string }[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  useEffect(() => {
    if (currentRole === 'admin') {
      import("@/lib/db").then(mod => {
        mod.getCostCenters().then(setCostCenters);
      });
    }
  }, [currentRole]);

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
  } = useDashboardData({ role: currentRole || undefined, costCenterId: selectedCostCenter, dateRange });

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: refreshData,
  });

  const getMenuItems = () => {
    if (currentRole === "admin") return [...adminMenuItems, ...gestorMenuItems];
    return gestorMenuItems;
  };

  const menuItems = getMenuItems();

  const totalStock = useMemo(() => {
    return stockByCategory.reduce((acc, curr) => acc + curr.value, 0);
  }, [stockByCategory]);

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
      <div className="min-h-screen relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10">
          <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={threshold} />

          <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">Resumo Geral</h1>
                <p className="text-xs text-muted-foreground">Bem-vindo ao SIS DAVUS</p>
              </div>

              <div className="flex items-center gap-2">
                {currentRole === 'admin' && (
                  <select
                    className="bg-background border border-border text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary h-9 outline-none"
                    value={selectedCostCenter || ""}
                    onChange={(e) => setSelectedCostCenter(e.target.value || null)}
                  >
                    <option value="">Visão Global (Todos)</option>
                    {costCenters.map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                )}
                <Badge variant="outline" className="gap-1.5 py-1 px-3 h-9 hidden md:flex">
                  <Zap className="h-3 w-3 text-primary animate-pulse" />
                  Sincronizado
                </Badge>
                <div className="hidden md:block">
                  <CalendarDateRangePicker date={dateRange} setDate={setDateRange} />
                </div>
                <NotificationCenter />
              </div>
            </div>
            {/* Mobile Date Picker */}
            <div className="md:hidden">
              <CalendarDateRangePicker date={dateRange} setDate={setDateRange} className="w-full" />
            </div>

            <SlideUp>
              <div id="dashboard-kpi" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Link href="/estoque">
                  <Card className="border-border/50 bg-card/40 backdrop-blur-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-primary/20 group h-full">
                    <CardContent className="p-4 flex items-center justify-between h-full">
                      <div>
                        <p className="text-xs text-muted-foreground">Produtos</p>
                        <p className="text-2xl font-bold">{products.length}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/patrimonio">
                  <Card className="border-border/50 bg-card/40 backdrop-blur-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-chart-5/20 group h-full">
                    <CardContent className="p-4 flex items-center justify-between h-full">
                      <div>
                        <p className="text-xs text-muted-foreground">Patrimônios</p>
                        <p className="text-2xl font-bold">{assets.length}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-chart-5/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-chart-5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/checkouts">
                  <Card className="border-border/50 bg-card/40 backdrop-blur-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-amber-500/20 group h-full">
                    <CardContent className="p-4 flex items-center justify-between h-full">
                      <div>
                        <p className="text-xs text-muted-foreground">Checkouts</p>
                        <p className="text-2xl font-bold">{pendingCheckouts.length}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <LogOut className="h-5 w-5 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/estoque">
                  <Card className="border-border/50 bg-card/40 backdrop-blur-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:border-destructive/20 group h-full">
                    <CardContent className="p-4 flex items-center justify-between h-full">
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
                </Link>
              </div>
            </SlideUp>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/40 backdrop-blur-lg shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Fluxo de Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ChartContainer config={movementsChartConfig} className="h-full w-full">
                      <BarChart accessibilityLayer data={movementsData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="entradas" fill="var(--color-entradas)" radius={4} />
                        <Bar dataKey="saidas" fill="var(--color-saidas)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/40 backdrop-blur-lg shadow-sm flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={categoryChartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={stockByCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        {stockByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {totalStock.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    Produtos
                                  </tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
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
                      <Card className="border-border/50 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all hover:scale-[1.05] hover:shadow-md active:scale-[0.98] h-full group">
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
                    <Card key={movement.id} className="border-border/50 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${movement.type === "entrada" ? "bg-green-500/20" : "bg-red-500/20"
                          }`}>
                          <TrendingUp className={`h-4 w-4 ${movement.type === "entrada" ? "text-green-500" : "text-red-500 rotate-180"
                            }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{movement.product_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{movement.reason}</span>
                            <span className="text-border mx-[-2px]">|</span>
                            <div className="flex items-center gap-1.5" title={`Por: ${movement.user_name || movement.user_id}`}>
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {(movement.user_name || movement.user_id || "?").substring(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px] hidden sm:inline-block">
                                {movement.user_name || "Usuário"}
                              </span>
                            </div>
                          </div>
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
                <Card className="border-border/50 bg-card/40 backdrop-blur-lg shadow-sm">
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
      </div>
    </PageTransition>
  );
}

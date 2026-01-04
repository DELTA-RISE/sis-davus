"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Asset, StockMovement, MaintenanceTask } from "@/lib/store";
import { getProducts, getAssets, getMovements, getMaintenanceTasks } from "@/lib/db";
import { exportProducts, exportAssets, exportMaintenance, exportOverview } from "@/lib/export-utils";
import { exportProductsPDF, exportAssetsPDF, exportMaintenancePDF, exportOverviewPDF } from "@/lib/export-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileBarChart,
  Download,

  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Building2,
  Wrench,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#ff5d38", "#8b5cf6", "#22c55e", "#eab308", "#06b6d4", "#ec4899", "#f97316"];

export default function RelatoriosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);

  // Individual loading states for progressive rendering
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");

  // Progressive loading - each query loads independently
  const loadData = useCallback(async (silent = false) => {
    // Set all loading states if not silent
    if (!silent) {
      setLoadingProducts(true);
      setLoadingAssets(true);
      setLoadingMovements(true);
      setLoadingMaintenance(true);
    }

    // Load each dataset independently - they complete as fast as possible
    // Products (usually fast with cache)
    getProducts().then(p => {
      setProducts(p);
      setLoadingProducts(false);
    }).catch(err => {
      console.error("Error loading products:", err);
      setLoadingProducts(false);
    });

    // Assets (usually fast with cache)
    getAssets().then(a => {
      setAssets(a);
      setLoadingAssets(false);
    }).catch(err => {
      console.error("Error loading assets:", err);
      setLoadingAssets(false);
    });

    // Movements (slower - the bottleneck)
    getMovements().then(m => {
      setMovements(m);
      setLoadingMovements(false);
    }).catch(err => {
      console.error("Error loading movements:", err);
      setLoadingMovements(false);
    });

    // Maintenance Tasks
    getMaintenanceTasks().then(t => {
      setMaintenanceTasks(t);
      setLoadingMaintenance(false);
    }).catch(err => {
      console.error("Error loading maintenance:", err);
      setLoadingMaintenance(false);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Data Calculations
  const metrics = useMemo(() => {
    // Stock Metrics
    const lowStock = products.filter(p => p.quantity < (p.min_stock || 0));
    const criticalStock = products.filter(p => p.quantity === 0);
    const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * (p.unit_price || 0)), 0);

    // Asset Metrics
    const totalAssetValue = assets.reduce((acc, a) => acc + (a.value || 0), 0);
    const assetsByCondition = assets.reduce((acc, a) => {
      acc[a.condition] = (acc[a.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const assetsInMaintenance = assets.filter(a => a.condition === "Manutenção").length;

    // Movement Metrics
    const entries = movements.filter(m => m.type === "entrada");
    const exits = movements.filter(m => m.type === "saida");
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyMovements = movements.filter(m => {
      if (!m.date) return false;
      const moveDate = new Date(m.date);
      return moveDate.getMonth() === currentMonth && moveDate.getFullYear() === currentYear;
    }).length;

    // Maintenance Metrics
    const pendingMaintenance = maintenanceTasks.filter(t => t.status !== 'concluido').length;
    const overdueMaintenance = maintenanceTasks.filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < new Date()).length;
    const inProgressMaintenance = maintenanceTasks.filter(t => t.status === 'em_andamento').length;
    const completedMaintenance = maintenanceTasks.filter(t => t.status === 'concluido').length;

    // Top Products and Assets
    const topProducts = [...products]
      .map(p => ({ ...p, totalValue: p.quantity * (p.unit_price || 0) }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    const topAssets = [...assets]
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 5);

    // Total Investment
    const totalInvestment = totalStockValue + totalAssetValue;

    return {
      lowStock,
      criticalStock,
      totalStockValue,
      totalAssetValue,
      totalInvestment,
      assetsByCondition,
      assetsInMaintenance,
      entriesCount: entries.length,
      exitsCount: exits.length,
      monthlyMovements,
      pendingMaintenance,
      overdueMaintenance,
      inProgressMaintenance,
      completedMaintenance,
      topProducts,
      topAssets
    };
  }, [products, assets, movements, maintenanceTasks]);

  // Charts Data
  const chartsData = useMemo(() => {
    const productsByCategory = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const assetsCategoryData = Object.entries(
      assets.reduce((acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const movementTrend = Object.values(
      movements.reduce((acc, m) => {
        const date = m.date?.split("T")[0] || "";
        if (!acc[date]) acc[date] = { date, entrada: 0, saida: 0 };
        if (m.type === "entrada") acc[date].entrada += m.quantity;
        else acc[date].saida += m.quantity;
        return acc;
      }, {} as Record<string, any>)
    ).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

    // Maintenance Status Breakdown
    const maintenanceStatus = [
      { name: 'Concluído', value: metrics.completedMaintenance, fill: '#22c55e' },
      { name: 'Pendente', value: metrics.pendingMaintenance - metrics.overdueMaintenance - metrics.inProgressMaintenance, fill: '#eab308' },
      { name: 'Em Andamento', value: metrics.inProgressMaintenance, fill: '#3b82f6' },
      { name: 'Atrasado', value: metrics.overdueMaintenance, fill: '#ef4444' },
    ].filter(s => s.value > 0);

    return {
      productsByCategory: Object.entries(productsByCategory).map(([name, value]) => ({ name, value })),
      assetsCategoryData,
      movementTrend,
      maintenanceStatus
    };
  }, [products, assets, movements, maintenanceTasks, metrics]);

  // Helper to determine if critical data for overview is loaded
  const hasOverviewData = !loadingProducts && !loadingAssets && !loadingMaintenance;

  return (
    <div className="min-h-screen bg-background/50">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-1/20 flex items-center justify-center">
              <FileBarChart className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold">Relatórios e Análises</h1>
              <p className="text-xs text-muted-foreground">Visão holística do sistema</p>
            </div>
          </div>

        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="assets">Patrimônio</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => exportOverviewPDF(products, assets, maintenanceTasks)}>
                <FileBarChart className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportOverview(products, assets, maintenanceTasks, 'xlsx')}>
                <Download className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>

            {/* KPI Cards - 2 Rows */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Valor Total Estoque - depends on products */}
              {loadingProducts ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-36" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R$ {metrics.totalStockValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{products.length} produtos cadastrados</p>
                  </CardContent>
                </Card>
              )}

              {/* Valor Patrimonial - depends on assets */}
              {loadingAssets ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-36" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Patrimonial</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R$ {metrics.totalAssetValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{assets.length} bens ativos</p>
                  </CardContent>
                </Card>
              )}

              {/* Alerta de Estoque - depends on products */}
              {loadingProducts ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-36" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alerta de Estoque</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-500">{metrics.lowStock.length}</div>
                    <p className="text-xs text-muted-foreground">Itens abaixo do mínimo</p>
                  </CardContent>
                </Card>
              )}

              {/* Manutenção Pendente - depends on maintenance */}
              {loadingMaintenance ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-36" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Manutenção Pendente</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.pendingMaintenance}</div>
                    <p className="text-xs text-muted-foreground">{metrics.overdueMaintenance} atrasadas</p>
                  </CardContent>
                </Card>
              )}
            </div>


            {/* Row 2 Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Investido - depends on products + assets */}
              {loadingProducts || loadingAssets ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-28 mb-2" />
                    <Skeleton className="h-3 w-36" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">R$ {metrics.totalInvestment.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Estoque + Patrimônio</p>
                  </CardContent>
                </Card>
              )}

              {/* Movimentações do Mês - depends on movements */}
              {loadingMovements ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Movimentações (Mês)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.monthlyMovements}</div>
                    <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                  </CardContent>
                </Card>
              )}

              {/* Estoque Crítico - depends on products */}
              {loadingProducts ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{metrics.criticalStock.length}</div>
                    <p className="text-xs text-muted-foreground">Itens esgotados</p>
                  </CardContent>
                </Card>
              )}

              {/* Em Manutenção - depends on assets */}
              {loadingAssets ? (
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
                    <Wrench className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500">{metrics.assetsInMaintenance}</div>
                    <p className="text-xs text-muted-foreground">Ativos em reparo</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Movimentação (14 dias)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartsData.movementTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => val.slice(5)} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" name="Entradas" dataKey="entrada" stroke="#22c55e" strokeWidth={2} dot={false} />
                      <Line type="monotone" name="Saídas" dataKey="saida" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Patrimônio por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={chartsData.assetsCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartsData.assetsCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Produtos por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.productsByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Status de Manutenção</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={chartsData.maintenanceStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartsData.maintenanceStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top 5 Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Produtos Mais Valiosos</CardTitle>
                  <CardDescription>Produtos com maior valor total em estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">V. Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.topProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-center">{p.quantity}</TableCell>
                          <TableCell className="text-right">R$ {(p.unit_price || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">R$ {p.totalValue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Ativos Mais Valiosos</CardTitle>
                  <CardDescription>Ativos com maior valor individual</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.topAssets.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.code}</TableCell>
                          <TableCell>{a.name}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">R$ {(a.value || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-red-500/50">
                <CardHeader>
                  <CardTitle className="text-red-500 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Estoque Crítico
                  </CardTitle>
                  <CardDescription>Produtos esgotados que necessitam reposição urgente</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.criticalStock.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">Nenhum item esgotado</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Categoria</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.criticalStock.slice(0, 5).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-red-600">{p.name}</TableCell>
                            <TableCell>{p.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {metrics.criticalStock.length > 5 && (
                    <div className="mt-4 text-xs text-center text-muted-foreground">
                      +{metrics.criticalStock.length - 5} itens esgotados. Use a exportação para ver todos.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-amber-500/50">
                <CardHeader>
                  <CardTitle className="text-amber-500 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Manutenções Atrasadas
                  </CardTitle>
                  <CardDescription>Tarefas que ultrapassaram o prazo</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.overdueMaintenance === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">Nenhuma manutenção atrasada</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarefa</TableHead>
                          <TableHead>Ativo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceTasks
                          .filter(t => t.status !== 'concluido' && t.due_date && new Date(t.due_date) < new Date())
                          .slice(0, 5)
                          .map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium text-amber-600">{t.title}</TableCell>
                              <TableCell>{t.asset_name}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ASSETS TAB */}
          <TabsContent value="assets" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => exportAssetsPDF(assets)}>
                <FileBarChart className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportAssets(assets, 'xlsx')}>
                <Download className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Listagem de Patrimônios</CardTitle>
                  <CardDescription>Visão tabular de todos os bens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assets.slice(0, 10).map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.code}</TableCell>
                            <TableCell>{asset.name}</TableCell>
                            <TableCell>{asset.category}</TableCell>
                            <TableCell>{asset.location}</TableCell>
                            <TableCell className="text-right">R$ {asset.value?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-xs text-center text-muted-foreground">Exibindo os 10 primeiros registros. Use Exportar para lista completa.</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Condição dos Bens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics.assetsByCondition).map(([condition, count]) => (
                      <div key={condition} className="flex items-center justify-between">
                        <span className="capitalize text-sm">{condition}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(count / assets.length) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* STOCK TAB */}
          <TabsContent value="stock" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => exportProductsPDF(products)}>
                <FileBarChart className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportProducts(products, 'xlsx')}>
                <Download className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-500 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Produtos com Estoque Baixo
                  </CardTitle>
                  <CardDescription>Itens que precisam de reposição urgente</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Atual</TableHead>
                        <TableHead className="text-center">Mínimo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.lowStock.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhum item com estoque baixo</TableCell>
                        </TableRow>
                      ) : (
                        metrics.lowStock.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-center text-red-500 font-bold">{p.quantity}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{p.min_stock}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Categorias (Qtd Produtos)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.productsByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MAINTENANCE TAB */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => exportMaintenancePDF(maintenanceTasks)}>
                <FileBarChart className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportMaintenance(maintenanceTasks, 'xlsx')}>
                <Download className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Próximas Manutenções</CardTitle>
                <CardDescription>Tarefas agendadas e atrasadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceTasks
                      .filter(t => t.status !== 'concluido')
                      .sort((a, b) => {
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                      })
                      .slice(0, 10)
                      .map((task) => {
                        const isLate = task.due_date ? new Date(task.due_date) < new Date() : false;
                        return (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>{task.asset_name}</TableCell>
                            <TableCell className={isLate ? "text-red-500 font-bold" : ""}>
                              {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "Sem Data"}
                              {isLate && " (Atrasada)"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={task.priority === 'alta' ? 'destructive' : 'secondary'}>
                                {task.priority}
                              </Badge>
                            </TableCell>
                            <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    {maintenanceTasks.filter(t => t.status !== 'concluido').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma manutenção pendente</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

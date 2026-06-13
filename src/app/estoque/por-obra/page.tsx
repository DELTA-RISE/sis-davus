"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Package, Search, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { Product, StockMovement } from "@/lib/store";
import { syncTable } from "@/lib/db";
import { db } from "@/lib/dexie-db";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getScopedCostCenter } from "@/lib/access-scope";
import { useCostCenters } from "@/hooks/use-queries";
import { useDebounce } from "@/hooks/useDebounce";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/CardSkeleton";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_MOVEMENTS: StockMovement[] = [];

type CostCenterStockSummary = {
  id: string;
  name: string;
  productCount: number;
  currentQuantity: number;
  stockValue: number;
  lowStockCount: number;
  receivedQuantity: number;
  sentQuantity: number;
  movementCount: number;
  recentMovements: StockMovement[];
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export default function EstoquePorObraPage() {
  const { currentRole, costCenter, isLoading: isAuthLoading } = useAuth();
  const { costCenters } = useCostCenters();
  const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);

  const localData = useLiveQuery(async () => {
    if (currentRole !== "admin") {
      return { products: [] as Product[], movements: [] as StockMovement[] };
    }

    let productsQuery = db.products.filter((product) => !product.deleted_at);
    if (scopedCostCenter) {
      productsQuery = productsQuery.filter((product) => product.cost_center === scopedCostCenter);
    }

    const [stockItems, stockMovements] = await Promise.all([
      productsQuery.toArray(),
      scopedCostCenter
        ? db.stock_movements.where("cost_center").equals(scopedCostCenter).toArray()
        : db.stock_movements.toArray(),
    ]);

    return { products: stockItems, movements: stockMovements };
  }, [currentRole, scopedCostCenter]);

  const products = useMemo(() => localData?.products || EMPTY_PRODUCTS, [localData?.products]);
  const movements = useMemo(() => localData?.movements || EMPTY_MOVEMENTS, [localData?.movements]);
  const isLoading = isAuthLoading || localData === undefined;

  useEffect(() => {
    if (currentRole !== "admin") return;

    const refreshLocalCache = () => {
      void Promise.all([
        syncTable("products", "name", true),
        syncTable("stock_movements", "date", false),
      ]);
    };

    const timeoutId = window.setTimeout(refreshLocalCache, 250);

    const productsChannel = supabase
      .channel("stock-by-cost-center-products")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { event: "*", table: "products" }, refreshLocalCache)
      .subscribe();

    const movementsChannel = supabase
      .channel("stock-by-cost-center-movements")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { event: "*", table: "stock_movements" }, refreshLocalCache)
      .subscribe();

    return () => {
      window.clearTimeout(timeoutId);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, [currentRole]);

  const stockByCostCenter = useMemo(() => {
    const summaries = new Map<string, CostCenterStockSummary>();
    const productsById = new Map(products.map((product) => [product.id, product]));

    const getSummary = (costCenterId?: string) => {
      const id = costCenterId || "almoxarifado";
      const center = costCenters.find((item) => item.id === id || item.name === id);
      const name = center?.name || (id === "almoxarifado" ? "Almoxarifado" : "Centro sem cadastro");

      if (!summaries.has(id)) {
        summaries.set(id, {
          id,
          name,
          productCount: 0,
          currentQuantity: 0,
          stockValue: 0,
          lowStockCount: 0,
          receivedQuantity: 0,
          sentQuantity: 0,
          movementCount: 0,
          recentMovements: [],
        });
      }

      return summaries.get(id)!;
    };

    products.forEach((product) => {
      const summary = getSummary(product.cost_center);
      summary.productCount += 1;
      summary.currentQuantity += product.quantity || 0;
      summary.stockValue += (product.quantity || 0) * (product.unit_price || 0);
      if ((product.quantity || 0) < (product.min_stock || 0)) summary.lowStockCount += 1;
    });

    movements
      .filter((movement) => productsById.has(movement.product_id))
      .forEach((movement) => {
        const product = productsById.get(movement.product_id);
        const summary = getSummary(movement.cost_center || product?.cost_center);
        if (movement.type === "entrada") {
          summary.receivedQuantity += movement.quantity || 0;
        } else {
          summary.sentQuantity += movement.quantity || 0;
        }
        summary.movementCount += 1;
        summary.recentMovements.push(movement);
      });

    return Array.from(summaries.values())
      .filter((summary) => summary.productCount > 0)
      .map((summary) => ({
        ...summary,
        recentMovements: summary.recentMovements
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 2),
      }))
      .sort((a, b) => b.stockValue - a.stockValue);
  }, [products, movements, costCenters]);

  const filteredSummaries = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    if (!search) return stockByCostCenter;
    return stockByCostCenter.filter((center) => center.name.toLowerCase().includes(search));
  }, [debouncedSearch, stockByCostCenter]);

  const totals = useMemo(() => {
    return filteredSummaries.reduce(
      (acc, center) => {
        acc.items += center.currentQuantity;
        acc.received += center.receivedQuantity;
        acc.sent += center.sentQuantity;
        acc.value += center.stockValue;
        acc.low += center.lowStockCount;
        return acc;
      },
      { items: 0, received: 0, sent: 0, value: 0, low: 0 }
    );
  }, [filteredSummaries]);

  if (!isAuthLoading && currentRole !== "admin") {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center p-4">
          <EmptyState
            title="Acesso restrito"
            description="O estoque por centro de custo é uma área administrativa."
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
          <div className="flex flex-col gap-4 px-4 py-5 md:px-8 lg:px-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Estoque por centro</h1>
                  <p className="text-sm text-muted-foreground">
                    Itens em estoque, entradas, saídas e responsáveis por centro de custo.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="w-fit border-primary/30 bg-background/70 text-foreground">
                {filteredSummaries.length} centros acompanhados
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryTile icon={Package} label="Itens em estoque" value={totals.items.toString()} />
              <SummaryTile icon={TrendingUp} label="Entradas registradas" value={totals.received.toString()} accent="text-emerald-500" />
              <SummaryTile icon={TrendingDown} label="Saídas registradas" value={totals.sent.toString()} accent="text-red-500" />
              <SummaryTile icon={WalletCards} label="Valor em estoque" value={formatCurrency(totals.value)} />
              <SummaryTile icon={Package} label="Itens abaixo do mínimo" value={totals.low.toString()} accent="text-amber-500" />
            </div>
          </div>
        </header>

        <main className="space-y-4 p-4 md:p-8 lg:p-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar centro de custo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 border-border/50 bg-card/50 pl-9"
            />
          </div>

          {isLoading ? (
            <CardSkeletonList count={4} />
          ) : filteredSummaries.length === 0 ? (
            <EmptyState
              title="Nenhum estoque por centro encontrado"
              description="Cadastre produtos com centro de custo para acompanhar os saldos."
            />
          ) : (
            <StaggerContainer className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {filteredSummaries.map((center) => (
                <StaggerItem key={center.id}>
                  <Card className="h-full overflow-hidden border-border/60 bg-card/55">
                    <CardContent className="flex min-h-[210px] flex-col border-l-4 border-primary p-3">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <ScrollingText
                              text={center.name}
                              className="text-base font-bold leading-tight text-foreground"
                              threshold={18}
                            />
                            <p className="text-[11px] text-muted-foreground">{center.productCount} itens cadastrados</p>
                          </div>
                          <Badge variant="outline" className="shrink-0 border-border/60 bg-background/60 px-2 py-0 text-[10px]">
                            {center.movementCount} mov.
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-1.5">
                          <Metric label="Itens" value={center.currentQuantity.toString()} />
                          <Metric label="Ent." value={center.receivedQuantity.toString()} className="text-emerald-500" />
                          <Metric label="Saíd." value={center.sentQuantity.toString()} className="text-red-500" />
                          <Metric label="Valor" value={formatCurrency(center.stockValue)} />
                        </div>
                      </div>

                      <div className="mt-3 min-w-0 border-t border-border/45 pt-2">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Últimas movimentações
                          </p>
                          {center.lowStockCount > 0 && (
                            <Badge variant="destructive" className="shrink-0 px-2 py-0 text-[10px]">
                              {center.lowStockCount} baixo
                            </Badge>
                          )}
                        </div>
                        {center.recentMovements.length > 0 ? (
                          <div className="space-y-1.5">
                            {center.recentMovements.map((movement) => (
                              <div key={movement.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border/35 bg-background/35 px-2 py-1.5">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-foreground" title={movement.product_name}>
                                    {movement.product_name}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground" title={(movement.user_name || "Usuário").split("@")[0]}>
                                    {(movement.user_name || "Usuário").split("@")[0]}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-5 shrink-0 px-1.5 text-[10px]",
                                    movement.type === "entrada"
                                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-500"
                                      : "border-red-500/35 bg-red-500/10 text-red-500"
                                  )}
                                >
                                  {movement.type === "entrada" ? "+" : "-"}{movement.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-md border border-dashed border-border/45 px-2 py-2 text-xs text-muted-foreground">
                            Nenhuma movimentação registrada para este centro.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </main>
      </div>
    </PageTransition>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <ScrollingText text={label} className="text-xs text-muted-foreground" threshold={22} />
          <ScrollingText text={value} className={cn("text-lg font-bold text-foreground", accent)} threshold={10} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border/40 bg-muted/25 px-2 py-1.5">
      <p className="truncate text-[10px] leading-tight text-muted-foreground" title={label}>
        {label}
      </p>
      <p className={cn("mt-0.5 truncate text-sm font-bold leading-tight text-foreground", className)} title={value}>
        {value}
      </p>
    </div>
  );
}

function ScrollingText({
  text,
  className,
  threshold = 18,
}: {
  text: string;
  className?: string;
  threshold?: number;
}) {
  const shouldScroll = text.length > threshold;
  const duration = `${Math.min(Math.max(text.length * 0.18, 4), 9)}s`;

  if (!shouldScroll) {
    return (
      <p className={cn("truncate", className)} title={text}>
        {text}
      </p>
    );
  }

  return (
    <div className="group min-w-0 overflow-hidden" title={text}>
      <div
        className="flex w-max animate-marquee gap-8 whitespace-nowrap group-hover:[animation-play-state:paused]"
        style={{ animationDuration: duration }}
      >
        <span className={className}>{text}</span>
        <span className={className} aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
}

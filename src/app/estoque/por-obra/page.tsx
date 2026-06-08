"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Package, Search, TrendingDown, WalletCards } from "lucide-react";
import { Product, StockMovement } from "@/lib/store";
import { getMovements, getProducts } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getScopedCostCenter } from "@/lib/access-scope";
import { useCostCenters } from "@/hooks/use-queries";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/CardSkeleton";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";

type CostCenterStockSummary = {
  id: string;
  name: string;
  productCount: number;
  currentQuantity: number;
  stockValue: number;
  lowStockCount: number;
  sentQuantity: number;
  recentExits: StockMovement[];
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export default function EstoquePorObraPage() {
  const { currentRole, costCenter } = useAuth();
  const { costCenters } = useCostCenters();
  const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    const [stockItems, stockMovements] = await Promise.all([
      getProducts(false, scopedCostCenter),
      getMovements(),
    ]);

    setProducts(stockItems);
    setMovements(stockMovements);
    if (!silent) setIsLoading(false);
  }, [scopedCostCenter]);

  useEffect(() => {
    loadData();

    const productsChannel = supabase
      .channel("stock-by-cost-center-products")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { event: "*", table: "products" }, () => loadData(true))
      .subscribe();

    const movementsChannel = supabase
      .channel("stock-by-cost-center-movements")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, { event: "*", table: "stock_movements" }, () => loadData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, [loadData]);

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
          sentQuantity: 0,
          recentExits: [],
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
      .filter((movement) => movement.type === "saida" && productsById.has(movement.product_id))
      .forEach((movement) => {
        const product = productsById.get(movement.product_id);
        const summary = getSummary(product?.cost_center || movement.cost_center);
        summary.sentQuantity += movement.quantity || 0;
        summary.recentExits.push(movement);
      });

    return Array.from(summaries.values())
      .filter((summary) => summary.productCount > 0)
      .map((summary) => ({
        ...summary,
        recentExits: summary.recentExits
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5),
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
        acc.sent += center.sentQuantity;
        acc.value += center.stockValue;
        acc.low += center.lowStockCount;
        return acc;
      },
      { items: 0, sent: 0, value: 0, low: 0 }
    );
  }, [filteredSummaries]);

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
                  <h1 className="text-xl font-bold text-foreground">Estoque por obra</h1>
                  <p className="text-sm text-muted-foreground">
                    Itens em estoque, saídas registradas e responsáveis por centro de custo.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="w-fit border-primary/30 bg-background/70 text-foreground">
                {filteredSummaries.length} centros acompanhados
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile icon={Package} label="Itens em estoque" value={totals.items.toString()} />
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
              placeholder="Buscar obra ou centro de custo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 border-border/50 bg-card/50 pl-9"
            />
          </div>

          {isLoading ? (
            <CardSkeletonList count={4} />
          ) : filteredSummaries.length === 0 ? (
            <EmptyState
              title="Nenhum estoque por obra encontrado"
              description="Cadastre produtos com centro de custo para acompanhar os saldos por obra."
            />
          ) : (
            <StaggerContainer className="grid gap-4 xl:grid-cols-2">
              {filteredSummaries.map((center) => (
                <StaggerItem key={center.id}>
                  <Card className="h-full overflow-hidden border-border/60 bg-card/55">
                    <CardContent className="grid h-full gap-0 p-0 lg:grid-cols-[minmax(280px,0.9fr)_minmax(320px,1.1fr)]">
                      <div className="space-y-4 border-l-4 border-primary p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <ScrollingText
                              text={center.name}
                              className="text-lg font-bold text-foreground"
                              threshold={20}
                            />
                            <p className="text-sm text-muted-foreground">{center.productCount} itens cadastrados</p>
                          </div>
                          {center.lowStockCount > 0 && (
                            <Badge variant="destructive" className="shrink-0 text-[11px]">
                              {center.lowStockCount} baixo
                            </Badge>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <Metric label="Itens em estoque" value={center.currentQuantity.toString()} />
                          <Metric label="Saídas" value={center.sentQuantity.toString()} className="text-red-500" />
                          <Metric label="Valor" value={formatCurrency(center.stockValue)} />
                        </div>
                      </div>

                      <div className="border-t border-border/50 bg-muted/10 p-4 lg:border-l lg:border-t-0">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                          Últimas saídas
                        </p>
                        {center.recentExits.length > 0 ? (
                          <div className="space-y-3">
                            {center.recentExits.map((movement) => (
                              <div key={movement.id} className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-xl border border-border/40 bg-background/45 p-3 text-sm">
                                <div className="min-w-0">
                                  <ScrollingText
                                    text={movement.product_name}
                                    className="font-semibold text-foreground"
                                    threshold={24}
                                  />
                                  <ScrollingText
                                    text={`Responsável: ${(movement.user_name || "Usuário").split("@")[0]}`}
                                    className="text-xs text-muted-foreground"
                                    threshold={30}
                                  />
                                </div>
                                <Badge variant="outline" className="border-red-500/35 bg-red-500/10 text-red-500">
                                  -{movement.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-xl border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                            Nenhuma saída registrada para este centro.
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
    <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
      <ScrollingText text={label} className="text-xs leading-tight text-muted-foreground" threshold={16} />
      <ScrollingText text={value} className={cn("mt-1 text-base font-bold text-foreground", className)} threshold={7} />
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

  if (!shouldScroll) {
    return (
      <p className={cn("truncate", className)} title={text}>
        {text}
      </p>
    );
  }

  return (
    <div className="group min-w-0 overflow-hidden" title={text}>
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap group-hover:[animation-play-state:paused]">
        <span className={className}>{text}</span>
        <span className={className} aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
}

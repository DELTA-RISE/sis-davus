"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StockMovement, Product } from "@/lib/store";
import { getMovements, saveMovement, getProducts } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { movementSchema } from "@/lib/validations";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/CardSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeftRight,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar as CalendarIcon,
  User,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";

export default function MovementsPage() {
  const { userName, user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteMovementId, setDeleteMovementId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newMovement, setNewMovement] = useState<Partial<StockMovement>>({
    type: "entrada",
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [m, p] = await Promise.all([getMovements(), getProducts()]);
    setMovements(m);
    setProducts(p);
    if (!silent) setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('stock-movements')
      .on('postgres_changes' as any, { event: '*', table: 'stock_movements' }, () => {
        loadData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const productName = m.product_name || "";
      const reason = m.reason || "";
      const matchesSearch =
        productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        reason.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = typeFilter === "all" || m.type === typeFilter;

      let matchesDate = true;
      if (dateRange?.from) {
        const movementDate = parseISO(m.date);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        matchesDate = isWithinInterval(movementDate, { start: from, end: to });
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [movements, debouncedSearch, typeFilter, dateRange]);

  const validateForm = () => {
    const result = movementSchema.safeParse({
      product_id: newMovement.product_id,
      type: newMovement.type,
      quantity: newMovement.quantity || 0,
      reason: newMovement.reason || "",
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      (result.error as any).errors.forEach((err: any) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveMovement = async () => {
    if (!validateForm()) {
      toast.error("Corrija os erros do formulário");
      return;
    }

    const product = products.find((p) => p.id === newMovement.product_id);
    if (!product) return;

    const payload: Partial<StockMovement> = {
      ...newMovement,
      product_name: product.name,
      date: new Date().toISOString(),
      user_name: userName,
      cost_center: product.cost_center,
    };

    const saved = await saveMovement(payload, { name: userName, id: user?.id || "" });
    if (saved) {
      toast.success("Movimentação registrada com sucesso!");
      setIsDialogOpen(false);
      setNewMovement({ type: "entrada" });
    } else {
      toast.error("Erro ao registrar movimentação");
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold">Movimentações</h1>
                    <Badge variant="outline" className="h-5 px-1.5 py-0 gap-1 text-[10px] bg-primary/5">
                      <Zap className="h-3 w-3 text-primary animate-pulse" />
                      Realtime
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{movements.length} registros</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 gap-1">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nova</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                  <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tipo de Movimentação</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={newMovement.type === "entrada" ? "default" : "outline"}
                          onClick={() => setNewMovement({ ...newMovement, type: "entrada" })}
                          className={newMovement.type === "entrada" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Entrada
                        </Button>
                        <Button
                          type="button"
                          variant={newMovement.type === "saida" ? "default" : "outline"}
                          onClick={() => setNewMovement({ ...newMovement, type: "saida" })}
                          className={newMovement.type === "saida" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          <ArrowDownRight className="h-4 w-4 mr-2" />
                          Saída
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Produto</Label>
                      <Select value={newMovement.product_id} onValueChange={(v) => setNewMovement({ ...newMovement, product_id: v })}>
                        <SelectTrigger className={errors.product_id ? "border-destructive" : ""}>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.quantity} un)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={newMovement.quantity || ""}
                        onChange={(e) => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) || 0 })}
                        className={errors.quantity ? "border-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Textarea
                        value={newMovement.reason || ""}
                        onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                        rows={3}
                        className={errors.reason ? "border-destructive" : ""}
                      />
                    </div>
                    <Button onClick={handleSaveMovement} className="w-full">Registrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card/50 border-border/50 h-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] bg-card/50 border-border/50 h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 bg-card/50 border-border/50">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateRange?.from ? format(dateRange.from, "dd/MM") : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          {isLoading ? (
            <CardSkeletonList count={6} />
          ) : filteredMovements.length === 0 ? (
            <EmptyState type="search" />
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMovements.map((m) => (
                <StaggerItem key={m.id}>
                  <Card className="border-border/50 bg-card/50 hover:bg-muted/30 cursor-default">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.type === "entrada" ? "bg-green-500/20" : "bg-red-500/20"
                        }`}>
                        {m.type === "entrada" ? <ArrowUpRight className="h-5 w-5 text-green-500" /> : <ArrowDownRight className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{m.product_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{m.user_name}</span>
                          <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{new Date(m.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={m.type === "entrada" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                        {m.type === "entrada" ? "+" : "-"}{m.quantity}
                      </Badge>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

          )}
        </div>
      </div>
    </PageTransition>
  );
}

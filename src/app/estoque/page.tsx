"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Product } from "@/lib/store";
import { getProducts, isPendingSync, saveProduct, deleteProduct } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { productSchema } from "@/lib/validations";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useItemHistory } from "@/hooks/useItemHistory";
import { useCostCenters } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeletonList } from "@/components/CardSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExportMenu } from "@/components/ExportMenu";
import { AdvancedFilters, FilterConfig, ActiveFilter } from "@/components/AdvancedFilters";
import { InfiniteScrollLoader } from "@/components/InfiniteScrollLoader";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
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
  Package,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Check,
  ChevronsUpDown,
  Building2,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getScopedCostCenter } from "@/lib/access-scope";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUpload } from "@/components/ui/image-upload";
import { getCategories } from "@/lib/db";
import { Category } from "@/lib/store";

// FilterConfigs moved inside component

export default function EstoquePage() {
  const { userName, user, currentRole, costCenter } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const { costCenters } = useCostCenters();
  const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
  const availableCostCenters = useMemo(
    () => scopedCostCenter ? costCenters.filter((center) => center.id === scopedCostCenter) : costCenters,
    [costCenters, scopedCostCenter]
  );
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories("insumo").then(setCategories);
  }, []);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: "category",
      label: "Categoria",
      type: "select",
      options: categories.map(c => ({ value: c.name, label: c.name })),
    },
    {
      key: "cost_center",
      label: "Centro de Custo",
      type: "text",
    },
    {
      key: "stockStatus",
      label: "Status Estoque",
      type: "select",
      options: [
        { value: "low", label: "Estoque Baixo" },
        { value: "normal", label: "Normal" },
        { value: "high", label: "Excesso" },
      ],
    },
  ], [categories]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: "Escritório",
  });
  const [openCostCenterSelect, setOpenCostCenterSelect] = useState(false);
  const { addHistoryEntry } = useItemHistory();

  useEffect(() => {
    if (!editingProduct && scopedCostCenter) {
      setNewProduct((current) => ({ ...current, cost_center: current.cost_center || scopedCostCenter }));
    }
  }, [editingProduct, scopedCostCenter]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    const data = await getProducts(false, scopedCostCenter);
    setProducts(data);

    if (!silent) setIsLoading(false);
  }, [scopedCostCenter]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('products')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: '*', table: 'products' }, () => {
        loadData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData();
    toast.success("Dados atualizados!");
  }, [loadData]);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const getStockStatus = (product: Product) => {
    if (product.quantity < (product.min_stock || 0)) return "low";
    if (product.quantity > (product.max_stock || 9999)) return "high";
    return "normal";
  };

  const costCenterNameById = useMemo(() => {
    return new Map(costCenters.map((center) => [center.id, center.name.toLowerCase()]));
  }, [costCenters]);

  const filteredProducts = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    return products.filter((p) => {
      const name = p.name || "";
      const sku = p.sku || "";
      const category = p.category || "";

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        sku.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search);

      const matchesFilters = activeFilters.every((filter) => {
        if (filter.key === "category") return category === filter.value;
        if (filter.key === "cost_center") {
          // We might want to match name if we have the list, or just check against ID if simple text
          // But since filter type is text, user probably types name.
          // Let's check against resolving the name if we can, or strict if assuming value is ID.
          // Given type='text' in filter config, user types a string.
          // So we check if cost_center ID resolves to a name that contains the string.
          const ccName = costCenterNameById.get(p.cost_center || "") || "";
          return ccName.toLowerCase().includes(filter.value.toLowerCase());
        }
        if (filter.key === "stockStatus") return getStockStatus(p) === filter.value;
        return true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [products, debouncedSearch, activeFilters, costCenterNameById]);

  const { displayedItems, hasMore, loaderRef } = useInfiniteScroll({
    data: filteredProducts,
    pageSize: 12,
  });

  const stockCounts = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        if (product.quantity < (product.min_stock || 0)) acc.low += 1;
        if (product.quantity > (product.max_stock || 9999)) acc.high += 1;
        return acc;
      },
      { low: 0, high: 0 }
    );
  }, [products]);

  const exportFilteredProducts = useCallback(async (format: "xlsx" | "csv" | "json") => {
    const { exportProducts } = await import("@/lib/export-utils");
    exportProducts(filteredProducts, format);
  }, [filteredProducts]);

  const validateForm = () => {
    const result = productSchema.safeParse({
      ...newProduct,
      cost_center: scopedCostCenter || newProduct.cost_center,
      quantity: newProduct.quantity ?? 0,
      min_stock: newProduct.min_stock ?? 0,
      max_stock: newProduct.max_stock ?? 1,
      unit_price: newProduct.unit_price ?? 0,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result.error as any).errors.forEach((err: any) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      toast.error("Corrija os erros do formulário");
      return;
    }

    setIsSaving(true);
    const payload: Partial<Product> = {
      ...newProduct,
      cost_center: scopedCostCenter || newProduct.cost_center,
      updated_at: new Date().toISOString(),
    };

    const saved = await saveProduct(payload, { name: userName, id: user?.id || "" });
    setIsSaving(false);

    if (saved) {
      if (isPendingSync(saved)) {
        toast.warning(editingProduct ? "Produto atualizado localmente." : "Produto cadastrado localmente.", {
          description: "A sincronizacao com o Supabase ainda esta pendente.",
        });
      } else {
        toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
      }

      addHistoryEntry({
        item_id: saved.id,
        item_type: "product",
        action: editingProduct ? "update" : "create",
        user_name: userName,
        changes: [],
        description: `Produto "${saved.name}" ${editingProduct ? "atualizado" : "cadastrado"}`,
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setNewProduct({ category: "Escritório", cost_center: scopedCostCenter || undefined });
    } else {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteProductId(product.id);
  };

  const confirmDelete = async () => {
    if (deleteProductId) {
      const success = await deleteProduct(deleteProductId, { name: userName, id: user?.id || "" });
      if (success) {
        toast.success("Produto excluído com sucesso!");
        setDeleteProductId(null);
        setSelectedIds(prev => prev.filter(id => id !== deleteProductId));
      } else {
        toast.error("Erro ao excluir produto");
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkDelete = async () => {
    const results = await Promise.all(selectedIds.map(id => deleteProduct(id, { name: userName, id: user?.id || "" })));
    const successCount = results.filter(Boolean).length;
    toast.success(`${successCount} itens excluidos.`);
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    loadData();
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={threshold} />

        <header id="stock-header" className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div id="stock-stats" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Estoque</h1>
                  <p className="text-xs text-muted-foreground">{products.length} produtos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExportMenu
                  onExportXLSX={() => exportFilteredProducts("xlsx")}
                  onExportCSV={() => exportFilteredProducts("csv")}
                  onExportJSON={() => exportFilteredProducts("json")}
                  itemCount={filteredProducts.length}
                />
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setEditingProduct(null);
                    setNewProduct({ category: "Escritório", cost_center: scopedCostCenter || undefined });
                    setErrors({});
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button id="stock-new-btn" size="sm" className="h-9 gap-1">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Novo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Image Upload Section */}
                      <div className="flex justify-center">
                        <ImageUpload
                          bucket="public-assets"
                          folder="products"
                          defaultImage={newProduct.image_url}
                          onImageChange={(url) => setNewProduct({ ...newProduct, image_url: url })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            value={newProduct.name || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>SKU</Label>
                          <Input
                            value={newProduct.sku || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                            placeholder="Ex: PAP001"
                            className={errors.sku ? "border-destructive" : ""}
                          />
                          {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select
                            value={newProduct.category}
                            onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                        </div>
                        <div className="space-y-2 text-left">
                          <Label>Centro de Custo</Label>
                          <Popover open={openCostCenterSelect} onOpenChange={setOpenCostCenterSelect}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCostCenterSelect}
                                className="w-full justify-between font-normal"
                              >
                                {newProduct.cost_center
                                  ? costCenters.find((cc) => cc.id === newProduct.cost_center)?.name || newProduct.cost_center
                                  : "Selecione..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar centro de custo..." />
                                <CommandList>
                                  <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {availableCostCenters.map((cc) => (
                                      <CommandItem
                                        key={cc.id}
                                        value={cc.name}
                                        onSelect={() => {
                                          setNewProduct({ ...newProduct, cost_center: cc.id });
                                          setOpenCostCenterSelect(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            newProduct.cost_center === cc.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {cc.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {errors.cost_center && <p className="text-xs text-destructive">{errors.cost_center}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Localização</Label>
                        <Input
                          value={newProduct.location || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                          placeholder="Ex: Almoxarifado A1"
                          className={errors.location ? "border-destructive" : ""}
                        />
                        {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Qtd Atual</Label>
                          <Input
                            type="number"
                            value={newProduct.quantity || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mín</Label>
                          <Input
                            type="number"
                            value={newProduct.min_stock || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, min_stock: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máx</Label>
                          <Input
                            type="number"
                            value={newProduct.max_stock || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, max_stock: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Unidade de Medida</Label>
                          <Input
                            value={newProduct.unit_of_measure || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, unit_of_measure: e.target.value })}
                            placeholder="Ex: kg, un, cx"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço Unitário (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newProduct.unit_price || ""}
                            onChange={(e) => setNewProduct({ ...newProduct, unit_price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleSaveProduct} className="w-full" disabled={isSaving}>
                        {isSaving ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="default">{selectedIds.length}</Badge>
                  <span className="text-sm font-medium">itens selecionados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Cancelar</Button>
                  <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)} className="gap-1.5 border-none">
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(stockCounts.low > 0 || stockCounts.high > 0) && selectedIds.length === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stockCounts.low > 0 && (
                <Badge variant="destructive" className="flex-shrink-0 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {stockCounts.low} com estoque baixo
                </Badge>
              )}
              {stockCounts.high > 0 && (
                <Badge className="flex-shrink-0 gap-1 bg-amber-500/20 text-amber-500 border-none">
                  <TrendingUp className="h-3 w-3" />
                  {stockCounts.high} em excesso
                </Badge>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card/50 border-border/50 h-10"
              />
            </div>
            <AdvancedFilters
              filters={filterConfigs}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
          </div>

          {isLoading ? (
            <CardSkeletonList count={6} />
          ) : displayedItems.length === 0 ? (
            <EmptyState
              type={debouncedSearch || activeFilters.length > 0 ? "search" : "noData"}
              action={!debouncedSearch && activeFilters.length === 0 ? { label: "Adicionar Produto", onClick: () => setIsDialogOpen(true) } : undefined}
            />
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {displayedItems.map((product) => {
                const stockStatus = getStockStatus(product);
                const isSelected = selectedIds.includes(product.id);
                return (
                  <StaggerItem key={product.id}>
                    <Card
                      className={`border-border/50 bg-card/50 ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                        }`}
                      onClick={() => toggleSelect(product.id)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(product.id)}
                            />
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stockStatus === "low" ? "bg-red-500/20" :
                            stockStatus === "high" ? "bg-amber-500/20" : "bg-primary/20"
                            }`}>
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                            <Package className={`h-5 w-5 ${stockStatus === "low" ? "text-red-500" :
                              stockStatus === "high" ? "text-amber-500" : "text-primary"
                              }`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <Badge variant="secondary" className="text-[10px] flex-shrink-0">{product.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{product.sku}</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {costCenters.find(c => c.id === product.cost_center)?.name || product.cost_center || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${stockStatus === "low" ? "border-red-500 text-red-500" :
                                  stockStatus === "high" ? "border-amber-500 text-amber-500" :
                                    "border-green-500 text-green-500"
                                  }`}
                              >
                                {product.quantity} un
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                Mín: {product.min_stock} | Máx: {product.max_stock}
                              </span>
                            </div>
                          </div>
                          <div className="text-right" onClick={(e) => e.stopPropagation()}>
                            <p className="text-sm font-semibold">
                              R$ {(product.unit_price || 0).toFixed(2)} <span className="text-xs text-muted-foreground font-normal">/ {product.unit_of_measure || 'un'}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Total: R$ {((product.quantity || 0) * (product.unit_price || 0)).toFixed(2)}
                            </p>
                            <div className="flex gap-1 mt-1">
                              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-600" title="Registrar entrada">
                                <Link href={`/movimentacoes?productId=${product.id}&type=entrada`}>
                                  <ArrowUpRight className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-600" title="Registrar saída">
                                <Link href={`/movimentacoes?productId=${product.id}&type=saida`}>
                                  <ArrowDownRight className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="h-7 w-7 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(product)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

          )}

          <InfiniteScrollLoader ref={loaderRef} hasMore={hasMore} />
        </div>

        <ConfirmDialog
          open={!!deleteProductId}
          onOpenChange={(open) => !open && setDeleteProductId(null)}
          title="Excluir Produto"
          description={`Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
          confirmText="Excluir"
          variant="destructive"
        />
        <ConfirmDialog
          open={isBulkDeleteOpen}
          onOpenChange={setIsBulkDeleteOpen}
          title="Excluir Produtos"
          description={`Tem certeza que deseja excluir ${selectedIds.length} produto(s)? Esta acao nao pode ser desfeita.`}
          onConfirm={bulkDelete}
          confirmText="Excluir"
          variant="destructive"
        />
      </div>
    </PageTransition>
  );
}

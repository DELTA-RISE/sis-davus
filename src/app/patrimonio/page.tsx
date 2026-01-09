"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Asset } from "@/lib/store";
import { getAssets, saveAsset, deleteAsset } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useItemHistory } from "@/hooks/useItemHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportMenu } from "@/components/ExportMenu";
import { AdvancedFilters, FilterConfig, ActiveFilter } from "@/components/AdvancedFilters";
import { InfiniteScrollLoader } from "@/components/InfiniteScrollLoader";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";

import { AssetLabel, AssetLabelLayout } from "@/components/AssetLabel";
import { exportAssets } from "@/lib/export-utils";
import { useAuth } from "@/lib/auth-context";
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
  Building2,
  Search,
  Plus,
  Edit,
  MapPin,
  User,
  Wrench,
  ChevronRight,
  QrCode,
  Trash2,
  Zap,
  Printer,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const conditionColors: Record<string, string> = {
  Excelente: "bg-green-500/20 text-green-500 border-green-500/30",
  Bom: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Regular: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Ruim: "bg-red-500/20 text-red-500 border-red-500/30",
  Manutenção: "bg-purple-500/20 text-purple-500 border-purple-500/30",
};

const filterConfigs: FilterConfig[] = [
  {
    key: "category",
    label: "Categoria",
    type: "select",
    options: [
      { value: "Informática", label: "Informática" },
      { value: "Mobiliário", label: "Mobiliário" },
      { value: "Climatização", label: "Climatização" },
      { value: "Audiovisual", label: "Audiovisual" },
      { value: "Veículos", label: "Veículos" },
      { value: "Outros", label: "Outros" },
    ],
  },
  {
    key: "condition",
    label: "Estado",
    type: "select",
    options: [
      { value: "Excelente", label: "Excelente" },
      { value: "Bom", label: "Bom" },
      { value: "Regular", label: "Regular" },
      { value: "Ruim", label: "Ruim" },
      { value: "Manutenção", label: "Em Manutenção" },
    ],
  },
  {
    key: "location",
    label: "Localização",
    type: "text",
  },
];

import { useOnboarding } from "@/lib/onboarding-context";
import { mockAssets } from "@/lib/store"; // Removed Asset (duplicate)

// ... imports

export default function PatrimonioPage() {
  const { userName, user } = useAuth();
  const { isDemoMode } = useOnboarding();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Restored

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    category: "Informática",
    condition: "Bom",
  });
  const { addHistoryEntry } = useItemHistory();

  const generateAssetId = useCallback(() => {
    // Generate a random ID and ensure it doesn't exist in the current assets list
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `DAV-${hash}`;

      // Check if code exists in current loaded assets
      // Note: This is a client-side check. A DB unique constraint is the final safety net.
      const exists = assets.some(a => a.code === code);
      if (!exists) return code;

      attempts++;
    }

    // Fallback if we somehow fail to generate a unique one (extremely unlikely)
    return `DAV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }, [assets]);

  const handleOpenNew = () => {
    setEditingAsset(null);
    setNewAsset({
      category: "Informática",
      condition: "Bom",
      code: generateAssetId()
    });
    setIsDialogOpen(true);
  };

  // Bulk Print State
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [printLayout, setPrintLayout] = useState<AssetLabelLayout>('standard');
  const [printingAssets, setPrintingAssets] = useState<Asset[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generateBulkPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      // 1. Set assets to print (triggers render of hidden container)
      const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
      setPrintingAssets(selectedAssets);

      // 2. Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));

      const { toPng } = await import('html-to-image');
      const jsPDF = (await import('jspdf')).default;

      // 3. Setup PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      let tagWidth, tagHeight, gapX, gapY, cols, rows, startX, startY;

      if (printLayout === 'compact') {
        tagWidth = 50; tagHeight = 25;
        gapX = 5; gapY = 5;
        cols = 3; rows = 9;
        startX = (pageWidth - (cols * tagWidth + (cols - 1) * gapX)) / 2;
        startY = 15;
      } else {
        tagWidth = 80; tagHeight = 40;
        gapX = 10; gapY = 10;
        cols = 2; rows = 6;
        startX = (pageWidth - (cols * tagWidth + (cols - 1) * gapX)) / 2;
        startY = 15;
      }

      const itemsPerPage = cols * rows;
      let currentItem = 0;

      // 4. Capture and Add Images
      for (const asset of selectedAssets) {
        const element = document.getElementById(`bulk-tag-${asset.id}`);
        if (!element) continue;

        const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 4 });

        // Pagination
        if (currentItem > 0 && currentItem % itemsPerPage === 0) {
          pdf.addPage();
        }

        const pageIndex = currentItem % itemsPerPage;
        const col = pageIndex % cols;
        const row = Math.floor(pageIndex / cols);

        const x = startX + col * (tagWidth + gapX);
        const y = startY + row * (tagHeight + gapY);

        pdf.addImage(dataUrl, 'PNG', x, y, tagWidth, tagHeight);
        currentItem++;
      }

      pdf.save(`etiquetas-lote-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF gerado com sucesso!");
      setBulkPrintOpen(false);
      setSelectedIds([]); // Optional: clear selection after print
    } catch (error) {
      console.error('Bulk Print Error:', error);
      toast.error("Erro ao gerar PDF em lote");
    } finally {
      setIsGeneratingPdf(false);
      setPrintingAssets([]); // Clear hidden container
    }
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAssets(mockAssets);
    } else {
      const data = await getAssets();
      setAssets(data);
    }

    if (!silent) setIsLoading(false);
  }, [isDemoMode]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('assets-changes')
      .on('postgres_changes' as any, { event: '*', table: 'assets' }, () => {
        loadData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData(true);
    toast.success("Dados atualizados!");
  }, [loadData]);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const name = a.name || "";
      const code = a.code || "";
      const category = a.category || "";
      const location = a.location || "";

      const matchesSearch =
        name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        location.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesFilters = activeFilters.every((filter) => {
        if (filter.key === "category") return a.category === filter.value;
        if (filter.key === "condition") return a.condition === filter.value;
        if (filter.key === "location") return location.toLowerCase().includes(filter.value.toLowerCase());
        return true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [assets, debouncedSearch, activeFilters]);

  const { displayedItems, hasMore, loaderRef } = useInfiniteScroll({
    data: filteredAssets,
    pageSize: 12,
  });

  const handleSaveAsset = async () => {
    if (!newAsset.name || !newAsset.code) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const saved = await saveAsset(newAsset, { name: userName, id: user?.id || "" });

    if (saved) {
      toast.success(editingAsset ? "Patrimônio atualizado com sucesso!" : "Patrimônio cadastrado com sucesso!");

      addHistoryEntry({
        item_id: saved.id,
        item_type: "asset",
        action: editingAsset ? "update" : "create",
        user_name: userName,
        changes: [],
        description: `Patrimônio "${saved.name}" ${editingAsset ? "atualizado" : "cadastrado"}`,
      });
      setIsDialogOpen(false);
      setEditingAsset(null);
      setNewAsset({ category: "Informática", condition: "Bom" });
    } else {
      toast.error("Erro ao salvar patrimônio");
    }
  };

  const handleEdit = (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAsset(asset);
    setNewAsset(asset);
    setIsDialogOpen(true);
  };



  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkDelete = async () => {
    if (confirm(`Deseja excluir ${selectedIds.length} patrimônios?`)) {
      const results = await Promise.all(selectedIds.map(id => deleteAsset(id, { name: userName, id: user?.id || "" })));
      const successCount = results.filter(Boolean).length;
      toast.success(`${successCount} itens excluídos.`);
      setSelectedIds([]);
      loadData();
    }
  };

  const totalValue = assets.reduce((acc, a) => acc + (a.value || 0), 0);
  const assetsInMaintenance = assets.filter((a) => a.condition === "Manutenção").length;

  return (
    <PageTransition>
      <div className="min-h-screen">
        <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={threshold} />

        <header id="assets-header" className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div id="assets-stats" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-chart-5/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-chart-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold">Patrimônio</h1>
                    <Badge variant="outline" className="h-5 px-1.5 py-0 gap-1 text-[10px] bg-primary/5">
                      <Zap className="h-3 w-3 text-primary animate-pulse" />
                      Realtime
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {assets.length} bens • R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ExportMenu
                  onExportXLSX={() => exportAssets(filteredAssets, "xlsx")}
                  onExportCSV={() => exportAssets(filteredAssets, "csv")}
                  onExportJSON={() => exportAssets(filteredAssets, "json")}
                  itemCount={filteredAssets.length}
                />
                <Link href="/patrimonio/manutencao">
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">Manutenções</span>
                    {assetsInMaintenance > 0 && (
                      <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-purple-500 text-[10px]">
                        {assetsInMaintenance}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setEditingAsset(null);
                    setNewAsset({ category: "Informática", condition: "Bom" });
                  }
                }}>
                  <Button id="assets-new-btn" size="sm" className="h-9 gap-1" onClick={handleOpenNew}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo</span>
                  </Button>

                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                    <DialogHeader>
                      <DialogTitle>{editingAsset ? "Editar Patrimônio" : "Novo Patrimônio"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome do Bem</Label>
                          <Input value={newAsset.name || ""} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Código</Label>
                          <div className="flex gap-2">
                            <Input value={newAsset.code || ""} onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })} placeholder="Ex: DAV-X1Y2Z3" />
                            <Button variant="outline" size="icon" onClick={() => setNewAsset({ ...newAsset, code: generateAssetId() })} title="Gerar Código">
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select value={newAsset.category} onValueChange={(v) => setNewAsset({ ...newAsset, category: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Informática">Informática</SelectItem>
                              <SelectItem value="Mobiliário">Mobiliário</SelectItem>
                              <SelectItem value="Climatização">Climatização</SelectItem>
                              <SelectItem value="Audiovisual">Audiovisual</SelectItem>
                              <SelectItem value="Veículos">Veículos</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select value={newAsset.condition} onValueChange={(v) => setNewAsset({ ...newAsset, condition: v as Asset["condition"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Excelente">Excelente</SelectItem>
                              <SelectItem value="Bom">Bom</SelectItem>
                              <SelectItem value="Regular">Regular</SelectItem>
                              <SelectItem value="Ruim">Ruim</SelectItem>
                              <SelectItem value="Manutenção">Em Manutenção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Localização</Label>
                          <Input value={newAsset.location || ""} onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <Input value={newAsset.assigned_to || ""} onChange={(e) => setNewAsset({ ...newAsset, assigned_to: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data Aquisição</Label>
                          <Input type="date" value={newAsset.purchase_date || ""} onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor (R$)</Label>
                          <Input type="number" step="0.01" value={newAsset.value || ""} onChange={(e) => setNewAsset({ ...newAsset, value: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={newAsset.description || ""} onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })} rows={2} />
                      </div>
                      <Button onClick={handleSaveAsset} className="w-full">{editingAsset ? "Salvar Alterações" : "Cadastrar"}</Button>
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
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Badge variant="default">{selectedIds.length}</Badge>
                  <span className="text-sm font-medium">patrimônios selecionados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Cancelar</Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkPrintOpen(true)} className="gap-1.5"><Printer className="h-4 w-4" />Gerar Etiquetas</Button>
                  <Button variant="destructive" size="sm" onClick={bulkDelete} className="gap-1.5 border-none"><Trash2 className="h-4 w-4" />Excluir</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Container for Bulk Printing */}
          <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none" style={{ position: 'fixed', left: '-9999px' }}>
            {printingAssets.map(asset => (
              <div key={asset.id} id={`bulk-tag-${asset.id}`} className="bg-white inline-block">
                <AssetLabel asset={asset} layout={printLayout} />
              </div>
            ))}
          </div>

          <Dialog open={bulkPrintOpen} onOpenChange={setBulkPrintOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Gerar Etiquetas em Lote</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Layout da Etiqueta</Label>
                  <Select value={printLayout} onValueChange={(v) => setPrintLayout(v as AssetLabelLayout)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Padrão (80x40mm)</SelectItem>
                      <SelectItem value="compact">Compacto (50x25mm)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {printLayout === 'standard' ? 'Caberão 12 etiquetas por página A4.' : 'Caberão 27 etiquetas por página A4.'}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBulkPrintOpen(false)}>Cancelar</Button>
                  <Button onClick={generateBulkPDF} disabled={isGeneratingPdf} className="gap-2">
                    {isGeneratingPdf ? <Zap className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar patrimônio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-card/50 border-border/50 h-10" />
            </div>
            <AdvancedFilters filters={filterConfigs} activeFilters={activeFilters} onFilterChange={setActiveFilters} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Card key={i} className="border-border/50 bg-card/50 animate-pulse"><CardContent className="p-4 h-32" /></Card>)}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {displayedItems.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <StaggerItem key={asset.id}>
                    <Card
                      className={`border-border/50 bg-card/50 hover:bg-card/80 cursor-pointer h-full ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                        }`}
                      onClick={() => toggleSelect(asset.id)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(asset.id)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/patrimonio/detalhes?id=${asset.id}`} className="block group" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{asset.name}</p>
                                <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0">{asset.code}</Badge>
                              </div>
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">{asset.description}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{asset.location}</span>
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{asset.assigned_to}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-[10px]">{asset.category}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${conditionColors[asset.condition]}`}>{asset.condition}</Badge>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <p className="text-sm font-semibold">R$ {(asset.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={(e) => handleEdit(e, asset)} className="h-7 w-7 p-0"><Edit className="h-4 w-4" /></Button>
                              <Link href={`/patrimonio/detalhes?id=${asset.id}`}><ChevronRight className="h-4 w-4 text-muted-foreground hover:text-primary" /></Link>
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


      </div >
    </PageTransition >
  );
}

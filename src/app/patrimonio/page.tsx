"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Asset } from "@/lib/store";
import {
  isPendingSync,
  saveAsset,
  deleteAsset,
  syncAssets,
  saveAssetTimeline,
  getMaintenanceTasks,
  saveMaintenanceTask,
} from "@/lib/db";
import { requestWriteOff } from "@/actions/write-off";
import { db } from "@/lib/dexie-db";
import { supabase } from "@/lib/supabase";
import { assetSchema } from "@/lib/validations";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useItemHistory } from "@/hooks/useItemHistory";
import { useAssets, useCostCenters } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";

import { AssetLabel, AssetLabelLayout } from "@/components/AssetLabel";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  User,
  Wrench,
  // QrCode,
  Trash2,
  Zap,
  Printer,
  RefreshCcw,
  FileWarning,
  Check,
  ChevronsUpDown,
  Briefcase,
  ArrowLeftRight,
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
import { motion, AnimatePresence } from "framer-motion";
import { ImageUpload } from "@/components/ui/image-upload"; // Imported component

const conditionColors: Record<string, string> = {
  Excelente: "bg-green-500/20 text-green-500 border-green-500/30",
  Bom: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Regular: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Ruim: "bg-red-500/20 text-red-500 border-red-500/30",
  Manutenção: "bg-purple-500/20 text-purple-500 border-purple-500/30",
};

function normalizeAssetCondition(condition?: string): Asset["condition"] {
  const value = condition
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (value?.includes("manutencao")) return "Manutenção";
  if (value === "excelente") return "Excelente";
  if (value === "regular") return "Regular";
  if (value === "ruim") return "Ruim";
  return "Bom";
}

function deriveAssetStatus(asset: Partial<Asset>, condition: Asset["condition"]): Asset["status"] {
  if (condition === "Manutenção") return "Em Manutenção";
  if (asset.status === "Em Manutenção") return "Disponível";
  return asset.status || "Disponível";
}

const openMaintenanceStatuses = new Set([
  "Pendente",
  "Em Andamento",
  "Aguardando Aprovação",
  "Aprovado",
  "Atrasada",
]);

export default function PatrimonioPage() {
  const { userName, user, currentRole } = useAuth();
  // const { isDemoMode } = useOnboarding();

  const filterConfigs: FilterConfig[] = useMemo(() => [
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
  ], []);

  // Local-First Hook
  const { assets, isLoading: isLocalLoading } = useAssets();
  const { costCenters } = useCostCenters();

  // We can use isLocalLoading for the initial skeleton, or specific loading state.
  // Existing code uses 'isLoading'. Let's map it.
  const isLoading = isLocalLoading && assets.length === 0;
  // Only show loading if we have NO assets. If we have cache, show it immediately.

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    category: "",
    location: "",
    condition: "Bom",
  });
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [assetToMove, setAssetToMove] = useState<Asset | null>(null);
  const [openMovementCostCenterSelect, setOpenMovementCostCenterSelect] = useState(false);
  const [movementErrors, setMovementErrors] = useState<Record<string, string>>({});
  const [assetMovement, setAssetMovement] = useState<{
    cost_center: string;
    condition: Asset["condition"];
    notes: string;
  }>({
    cost_center: "",
    condition: "Bom",
    notes: "",
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
      category: "",
      location: "",
      condition: "Bom",
      code: generateAssetId()
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const condition = normalizeAssetCondition(newAsset.condition);
    // Ensure all required fields for Zod are present or have defaults
    const payload = {
      ...newAsset,
      condition,
      status: deriveAssetStatus(newAsset, condition),
      value: newAsset.value ?? 0,
      // Ensure strings that might be empty are treated correctly if optional in schema but required in form
    };

    const result = assetSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result.error as any).issues.forEach((err: any) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // Bulk Print State
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [printLayout, setPrintLayout] = useState<AssetLabelLayout>('standard');
  const [printingAssets, setPrintingAssets] = useState<Asset[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Write Off Request State
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState("");
  const [assetToWriteOff, setAssetToWriteOff] = useState<Asset | null>(null);

  const handleOpenWriteOff = async (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for dependencies (Maintenance)
    const activeTasks = await db.maintenance_tasks
      .where('asset_id')
      .equals(asset.id)
      .filter((task) => (task.status as string) !== 'Concluída' && (task.status as string) !== 'Concluida')
      .count();

    if (activeTasks > 0) {
      toast.warning(`Não é possível solicitar baixa. O patrimônio está em manutenção.`, {
        duration: 5000,
      });
      return;
    }

    setAssetToWriteOff(asset);
    setWriteOffReason("");
    setWriteOffDialogOpen(true);
  };

  const submitWriteOffRequest = async () => {
    if (!assetToWriteOff) return;
    if (!writeOffReason.trim()) {
      toast.error("Por favor, informe o motivo da baixa.");
      return;
    }

    try {
      const result = await requestWriteOff(assetToWriteOff.id, writeOffReason, user?.id || "");
      if (result.success) {
        toast.success("Solicitação de baixa enviada com sucesso!");
        setWriteOffDialogOpen(false);
        setAssetToWriteOff(null);
      } else {
        toast.error("Erro ao enviar solicitação: " + result.error);
      }
    } catch (error) {
      toast.error("Erro inesperado ao enviar solicitação.");
      console.error(error);
    }
  };

  const ensureMaintenanceTaskForAsset = async (
    asset: Asset,
    originDescription: string,
    notes?: string
  ) => {
    const existingTasks = await getMaintenanceTasks(asset.id);
    const hasOpenTask = existingTasks.some((task) => openMaintenanceStatuses.has(task.status));

    if (hasOpenTask) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await saveMaintenanceTask({
      title: `Manutenção - ${asset.name}`,
      description: notes?.trim()
        ? `${originDescription}. Observações: ${notes.trim()}`
        : originDescription,
      asset_id: asset.id,
      asset_name: asset.name,
      asset_code: asset.code,
      due_date: dueDate.toISOString().slice(0, 10),
      priority: "media",
      status: "Pendente",
      assigned_to: asset.assigned_to,
      cost: 0,
      created_by: user?.id,
      steps_data: [
        {
          id: "1",
          title: "Registro inicial",
          description: originDescription,
          completed: true,
          completed_by: userName,
          completed_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Análise da manutenção",
          description: "Aguardando avaliação e acompanhamento do responsável.",
          completed: false,
        },
      ],
    }, { name: userName, id: user?.id || "" });
  };

  const handleSaveAssetMovement = async () => {
    if (!assetToMove) return;

    const fieldErrors: Record<string, string> = {};
    if (!assetMovement.cost_center) fieldErrors.cost_center = "Selecione o centro de custo de destino";
    if (!assetMovement.condition) fieldErrors.condition = "Informe o estado do equipamento";
    if (!assetMovement.notes.trim()) fieldErrors.notes = "Informe as observações da movimentação";

    if (Object.keys(fieldErrors).length > 0) {
      setMovementErrors(fieldErrors);
      toast.error("Corrija os erros da movimentação");
      return;
    }

    const condition = normalizeAssetCondition(assetMovement.condition);
    const fromCostCenter = costCenters.find((cc) => cc.id === assetToMove.cost_center);
    const toCostCenter = costCenters.find((cc) => cc.id === assetMovement.cost_center);
    const fromName = fromCostCenter?.name || assetToMove.cost_center || "Sem centro de custo";
    const toName = toCostCenter?.name || assetMovement.cost_center;

    const updatedAsset: Partial<Asset> = {
      ...assetToMove,
      cost_center: assetMovement.cost_center,
      condition,
      status: deriveAssetStatus(assetToMove, condition),
    };

    const saved = await saveAsset(updatedAsset, { name: userName, id: user?.id || "" });

    if (!saved) {
      toast.error("Erro ao movimentar patrimônio");
      return;
    }

    if (condition === "Manutenção") {
      await ensureMaintenanceTaskForAsset(
        saved,
        `Patrimônio movimentado para ${toName} e marcado como em manutenção`,
        assetMovement.notes
      );
    }

    await saveAssetTimeline({
      asset_id: assetToMove.id,
      type: "assignment",
      date: new Date().toISOString(),
      title: "Movimentação de centro de custo",
      user_name: userName,
      description: `Movimentação de centro de custo: ${fromName} -> ${toName}. Estado: ${condition}. Observações: ${assetMovement.notes.trim()}`,
    });

    toast.success("Movimentação registrada com sucesso!");
    setMovementDialogOpen(false);
    setAssetToMove(null);
    setAssetMovement({ cost_center: "", condition: "Bom", notes: "" });
    setMovementErrors({});
  };

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
      // const pageHeight = 297;
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

  useEffect(() => {
    // Trigger background sync on mount
    syncAssets();

    const channel = supabase
      .channel('assets-changes')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes' as any, { event: '*', table: 'assets' }, () => {
        syncAssets(); // Sync instead of loadData
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    await syncAssets();
    toast.success("Dados atualizados!");
  }, []);

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const filteredAssets = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    return assets.filter((a) => {
      const name = a.name || "";
      const code = a.code || "";
      const costCenterName = costCenters.find((cc) => cc.id === a.cost_center)?.name || a.cost_center || "";
      const assignedTo = a.assigned_to || "";

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        code.toLowerCase().includes(search) ||
        costCenterName.toLowerCase().includes(search) ||
        assignedTo.toLowerCase().includes(search);

      const matchesFilters = activeFilters.every((filter) => {
        if (filter.key === "condition") return a.condition === filter.value;
        return true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [assets, costCenters, debouncedSearch, activeFilters]);

  const { displayedItems, hasMore, loaderRef } = useInfiniteScroll({
    data: filteredAssets,
    pageSize: 12,
  });

  const handleSaveAsset = async () => {
    if (!validateForm()) {
      toast.error("Corrija os erros do formulário");
      return;
    }

    const condition = editingAsset ? normalizeAssetCondition(newAsset.condition) : "Bom";
    const assetToSave: Partial<Asset> = {
      ...newAsset,
      category: newAsset.category || "",
      location: newAsset.location || "",
      cost_center: newAsset.cost_center || "",
      assigned_to: newAsset.assigned_to || "",
      condition,
      status: deriveAssetStatus(newAsset, condition),
      value: newAsset.value ?? 0,
    };

    const saved = await saveAsset(assetToSave, { name: userName, id: user?.id || "" });

    if (saved) {
      if (condition === "Manutenção") {
        await ensureMaintenanceTaskForAsset(
          saved,
          "Patrimônio marcado como em manutenção no cadastro/edição."
        );
      }

      if (isPendingSync(saved)) {
        toast.warning(editingAsset ? "Patrimonio atualizado localmente." : "Patrimonio cadastrado localmente.", {
          description: "A sincronizacao com o Supabase ainda esta pendente.",
        });
      } else {
        toast.success(editingAsset ? "Patrimonio atualizado com sucesso!" : "Patrimonio cadastrado com sucesso!");
      }

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
      setNewAsset({ category: "", location: "", condition: "Bom", cost_center: "", assigned_to: "" });
    } else {
      toast.error("Erro ao salvar patrimônio");
    }
  };

  const handleEdit = (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAsset(asset);
    setNewAsset(asset);
    setErrors({});
    setIsDialogOpen(true);
  };



  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkDelete = async () => {
    // Check for dependencies
    const assetsWithDependencies: string[] = [];
    for (const id of selectedIds) {
      const activeTasks = await db.maintenance_tasks
        .where('asset_id')
        .equals(id)
        .filter((task) => (task.status as string) !== 'Concluída' && (task.status as string) !== 'Concluida')
        .count();

      if (activeTasks > 0) {
        const asset = assets.find(a => a.id === id);
        assetsWithDependencies.push(asset?.name || id);
      }
    }

    if (assetsWithDependencies.length > 0) {
      toast.warning(`Não é possível excluir: ${assetsWithDependencies.join(", ")}. Existem manutenções pendentes.`, {
        duration: 5000,
      });
      return;
    }

    const results = await Promise.all(selectedIds.map(id => deleteAsset(id, { name: userName, id: user?.id || "" })));
    const successCount = results.filter(Boolean).length;
    toast.success(`${successCount} itens excluidos.`);
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };

  const assetSummary = useMemo(() => {
    return assets.reduce(
      (summary, asset) => {
        summary.totalValue += asset.value || 0;
        if (normalizeAssetCondition(asset.condition) === "Manutenção") {
          summary.inMaintenance += 1;
        }
        return summary;
      },
      { totalValue: 0, inMaintenance: 0 }
    );
  }, [assets]);

  const exportFilteredAssets = useCallback(async (format: "xlsx" | "csv" | "json") => {
    const { exportAssets } = await import("@/lib/export-utils");
    exportAssets(filteredAssets, format);
  }, [filteredAssets]);

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
                    {assets.length} bens • R$ {assetSummary.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ExportMenu
                  onExportXLSX={() => exportFilteredAssets("xlsx")}
                  onExportCSV={() => exportFilteredAssets("csv")}
                  onExportJSON={() => exportFilteredAssets("json")}
                  itemCount={filteredAssets.length}
                />
                <Link href="/patrimonio/manutencao">
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">Manutenções</span>
                    {assetSummary.inMaintenance > 0 && (
                      <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-purple-500 text-[10px]">
                        {assetSummary.inMaintenance}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setEditingAsset(null);
                    setNewAsset({ category: "", location: "", condition: "Bom", cost_center: "", assigned_to: "" });
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
                      {/* Image Upload Section */}
                      <div className="flex justify-center">
                        <ImageUpload
                          bucket="public-assets"
                          folder="assets"
                          defaultImage={newAsset.image_url}
                          onImageChange={(url) => setNewAsset({ ...newAsset, image_url: url })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Equipamento</Label>
                          <Input
                            value={newAsset.name || ""}
                            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Código</Label>
                          <div className="flex gap-2">
                            <Input
                              value={newAsset.code || ""}
                              onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })}
                              placeholder="Ex: DAV-X1Y2Z3"
                              className={errors.code ? "border-destructive" : ""}
                            />
                            <Button variant="outline" size="icon" onClick={() => setNewAsset({ ...newAsset, code: generateAssetId() })} title="Gerar Código">
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          </div>
                          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data Aquisição</Label>
                          <Input
                            type="date"
                            value={newAsset.purchase_date || ""}
                            onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                            className={errors.purchase_date ? "border-destructive" : ""}
                          />
                          {errors.purchase_date && <p className="text-xs text-destructive">{errors.purchase_date}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Valor (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newAsset.value || ""}
                            onChange={(e) => setNewAsset({ ...newAsset, value: parseFloat(e.target.value) || 0 })}
                            className={errors.value ? "border-destructive" : ""}
                          />
                          {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nota Fiscal</Label>
                          <Input
                            value={newAsset.invoice_number || ""}
                            onChange={(e) => setNewAsset({ ...newAsset, invoice_number: e.target.value })}
                            placeholder="Opcional"
                            className={errors.invoice_number ? "border-destructive" : ""}
                          />
                          {errors.invoice_number && <p className="text-xs text-destructive">{errors.invoice_number}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Garantia (meses)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={newAsset.warranty_months ?? ""}
                            onChange={(e) => setNewAsset({ ...newAsset, warranty_months: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                            placeholder="Opcional"
                            className={errors.warranty_months ? "border-destructive" : ""}
                          />
                          {errors.warranty_months && <p className="text-xs text-destructive">{errors.warranty_months}</p>}
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

                <Dialog open={writeOffDialogOpen} onOpenChange={setWriteOffDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Solicitar Baixa de Patrimônio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-3 bg-muted rounded-md text-sm">
                        <p className="font-medium">{assetToWriteOff?.name}</p>
                        <p className="text-xs text-muted-foreground">{assetToWriteOff?.code}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo da Baixa</Label>
                        <Textarea
                          value={writeOffReason}
                          onChange={(e) => setWriteOffReason(e.target.value)}
                          placeholder="Descreva o motivo (ex: Danificado, Obsolescência...)"
                          rows={3}
                        />
                      </div>
                      <Button onClick={submitWriteOffRequest} className="w-full gap-2">
                        Enviar Solicitação
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                    <DialogHeader>
                      <DialogTitle>Movimentar Patrimônio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                        <p className="text-sm font-semibold">{assetToMove?.name}</p>
                        <p className="text-xs text-muted-foreground">{assetToMove?.code}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Origem: {costCenters.find((cc) => cc.id === assetToMove?.cost_center)?.name || assetToMove?.cost_center || "Sem centro de custo"}
                        </p>
                      </div>

                      <div className="space-y-2 text-left">
                        <Label>Centro de Custo</Label>
                        <Popover open={openMovementCostCenterSelect} onOpenChange={setOpenMovementCostCenterSelect}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openMovementCostCenterSelect}
                              className={cn("w-full justify-between font-normal", movementErrors.cost_center && "border-destructive")}
                            >
                              {assetMovement.cost_center
                                ? costCenters.find((cc) => cc.id === assetMovement.cost_center)?.name || assetMovement.cost_center
                                : "Selecione o destino..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar centro de custo..." />
                              <CommandList>
                                <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {costCenters.map((cc) => (
                                    <CommandItem
                                      key={cc.id}
                                      value={cc.name}
                                      onSelect={() => {
                                        setAssetMovement({ ...assetMovement, cost_center: cc.id });
                                        setOpenMovementCostCenterSelect(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          assetMovement.cost_center === cc.id ? "opacity-100" : "opacity-0"
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
                        {movementErrors.cost_center && <p className="text-xs text-destructive">{movementErrors.cost_center}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Estado em que se encontra o equipamento</Label>
                        <Select
                          value={normalizeAssetCondition(assetMovement.condition)}
                          onValueChange={(v) => setAssetMovement({ ...assetMovement, condition: normalizeAssetCondition(v) })}
                        >
                          <SelectTrigger className={movementErrors.condition ? "border-destructive" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excelente">Excelente</SelectItem>
                            <SelectItem value="Bom">Bom</SelectItem>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="Ruim">Ruim</SelectItem>
                            <SelectItem value="Manutenção">Em Manutenção</SelectItem>
                          </SelectContent>
                        </Select>
                        {movementErrors.condition && <p className="text-xs text-destructive">{movementErrors.condition}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Observações de avaria de equipamento</Label>
                        <Textarea
                          value={assetMovement.notes}
                          onChange={(e) => setAssetMovement({ ...assetMovement, notes: e.target.value })}
                          placeholder="Informe avarias, condições de uso ou observações da transferência."
                          rows={3}
                          className={movementErrors.notes ? "border-destructive" : ""}
                        />
                        {movementErrors.notes && <p className="text-xs text-destructive">{movementErrors.notes}</p>}
                      </div>

                      <Button onClick={handleSaveAssetMovement} className="w-full gap-2">
                        <ArrowLeftRight className="h-4 w-4" />
                        Registrar Movimentação
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
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Badge variant="default">{selectedIds.length}</Badge>
                  <span className="text-sm font-medium">patrimônios selecionados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Cancelar</Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkPrintOpen(true)} className="gap-1.5"><Printer className="h-4 w-4" />Gerar Etiquetas</Button>
                  <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)} className="gap-1.5 border-none"><Trash2 className="h-4 w-4" />Excluir</Button>
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
                const assetCostCenter = costCenters.find((cc) => cc.id === asset.cost_center)?.name || asset.cost_center || "Sem centro de custo";
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
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10`}>
                            {asset.image_url ? (
                              <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Briefcase className="h-5 w-5 text-primary" />
                            )}
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
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{assetCostCenter}</span>
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{asset.assigned_to}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={`text-[10px] ${conditionColors[asset.condition]}`}>{asset.condition}</Badge>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <p className="text-sm font-semibold">R$ {(asset.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={(e) => handleEdit(e, asset)} className="h-7 w-7 p-0"><Edit className="h-4 w-4" /></Button>
                              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="Movimentar Patrimônio">
                                <Link href={`/patrimonio/detalhes?id=${asset.id}`}>
                                  <ArrowLeftRight className="h-4 w-4" />
                                </Link>
                              </Button>
                              {(currentRole === 'gestor' || currentRole === 'manager') && (
                                <Button variant="ghost" size="sm" onClick={(e) => handleOpenWriteOff(e, asset)} className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Solicitar Baixa">
                                  <FileWarning className="h-4 w-4" />
                                </Button>
                              )}
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
          open={isBulkDeleteOpen}
          onOpenChange={setIsBulkDeleteOpen}
          title="Excluir Patrimonios"
          description={`Tem certeza que deseja excluir ${selectedIds.length} patrimonio(s)? Esta acao nao pode ser desfeita.`}
          onConfirm={bulkDelete}
          confirmText="Excluir"
          variant="destructive"
        />
      </div >
    </PageTransition >
  );
}

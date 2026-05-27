"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Asset, MaintenanceTask, AssetTimeline, Checkout, CostCenter } from "@/lib/store";
import {
  getAssetById,
  getMaintenanceTasks,
  getAssetTimelines,
  getCheckouts,
  saveAsset,
  saveAssetTimeline,
  saveCheckout,
  saveMaintenanceTask,

  getCostCenters,
} from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { AssetLabel, AssetLabelLayout } from "@/components/AssetLabel";
import { ImageUpload } from "@/components/ui/image-upload";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  MapPin,
  User as UserIcon,
  Calendar,
  DollarSign,
  Tag,
  Wrench,
  LogOut,
  RefreshCcw,
  Edit,
  History,
  Package,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Download,
  Save,
  Printer,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { UserSelect } from "@/components/UserSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const conditionColors: Record<string, string> = {
  Excelente: "bg-green-500/20 text-green-500 border-green-500/30",
  Bom: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Regular: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Ruim: "bg-red-500/20 text-red-500 border-red-500/30",
  Manutenção: "bg-purple-500/20 text-purple-500 border-purple-500/30",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const timelineIcons: Record<string, any> = {
  criacao: Package,
  movimentacao: ArrowRightLeft,
  manutencao: Wrench,
  checkout: LogOut,
  devolucao: RefreshCcw,
  atualizacao: Edit,
};

const timelineColors: Record<string, string> = {
  criacao: "bg-green-500/20 text-green-500",
  movimentacao: "bg-blue-500/20 text-blue-500",
  manutencao: "bg-purple-500/20 text-purple-500",
  checkout: "bg-amber-500/20 text-amber-500",
  devolucao: "bg-cyan-500/20 text-cyan-500",
  atualizacao: "bg-slate-500/20 text-slate-400",
};

const openMaintenanceStatuses = new Set([
  "Pendente",
  "Em Andamento",
  "Aguardando Aprovação",
  "Aprovado",
  "Atrasada",
]);

export default function AssetHubPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const { userName, user } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [timeline, setTimeline] = useState<AssetTimeline[]>([]);
  const [activeCheckout, setActiveCheckout] = useState<Checkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generalInfoDialogOpen, setGeneralInfoDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  // Form Data
  const [editForm, setEditForm] = useState<Partial<Asset>>({});
  const [generalInfoForm, setGeneralInfoForm] = useState<Partial<Asset>>({});
  const [transferData, setTransferData] = useState({
    origin: "",
    cost_center: "",
    responsible: "",
    condition: "Bom" as Asset["condition"],
    movement_date: new Date().toISOString().split("T")[0],
    notes: "",
    image_url: "",
  });
  const [checkoutData, setCheckoutData] = useState({ user_name: "", expected_return: "", notes: "" });
  const [labelLayout, setLabelLayout] = useState<AssetLabelLayout>('standard');
  const [fillPage, setFillPage] = useState(false);

  // Lists for Selects

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const currentCostCenterName = costCenters.find((cc) => cc.id === asset?.cost_center)?.name
    || costCenters.find((cc) => cc.name === asset?.cost_center)?.name
    || asset?.cost_center
    || "Sem centro de custo";

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Etiqueta-${asset?.code || 'Patrimonio'}`,
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [assetData, tasksData, timelineData, checkoutsData, ccsData] = await Promise.all([
        getAssetById(id),
        getMaintenanceTasks(id),
        getAssetTimelines(id),
        getCheckouts(id, "asset"),
        getCostCenters()
      ]);

      if (assetData) {
        setAsset(assetData);
        setEditForm(assetData);
      }
      setMaintenanceTasks(tasksData);
      setTimeline(timelineData);
      setCostCenters(ccsData);

      const current = checkoutsData.find(c => c.status === "Ativo" || c.status === "Atrasado");
      setActiveCheckout(current || null);
    } catch (error) {
      console.error("Error loading asset details:", error);
      toast.error("Erro ao carregar dados do patrimônio");
    } finally {
      setIsLoading(false);
    }
  }, [id]);


  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${asset?.code || 'qr'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const ensureMaintenanceTaskForAsset = async (targetAsset: Asset, originDescription: string) => {
    const existingTasks = await getMaintenanceTasks(targetAsset.id);
    const hasOpenTask = existingTasks.some((task) => openMaintenanceStatuses.has(task.status));

    if (hasOpenTask) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await saveMaintenanceTask({
      title: `Manutenção - ${targetAsset.name}`,
      description: originDescription,
      asset_id: targetAsset.id,
      asset_name: targetAsset.name,
      asset_code: targetAsset.code,
      due_date: dueDate.toISOString().slice(0, 10),
      priority: "media",
      status: "Pendente",
      assigned_to: targetAsset.assigned_to,
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

  const handleSaveEdit = async () => {
    if (!asset || !editForm.name) return;
    const condition = editForm.condition || asset.condition;
    const updated = await saveAsset({
      ...asset,
      ...editForm,
      id: asset.id,
      status: condition === "Manutenção"
        ? "Em Manutenção"
        : asset.status === "Em Manutenção"
          ? "Disponível"
          : asset.status,
    }, { name: userName, id: user?.id || "" });
    if (updated) {
      if (condition === "Manutenção") {
        await ensureMaintenanceTaskForAsset(updated, "Patrimônio marcado como em manutenção na aba de detalhes.");
      }
      setAsset(updated);
      setEditDialogOpen(false);
      toast.success("Patrimônio atualizado com sucesso!");
      loadData();
    } else {
      toast.error("Erro ao salvar alterações");
    }
  };

  const handleSaveGeneralInfo = async () => {
    if (!asset) return;

    const updated = await saveAsset({
      ...asset,
      category: generalInfoForm.category?.trim() || "",
      brand: generalInfoForm.brand?.trim() || "",
      model: generalInfoForm.model?.trim() || "",
      serial_number: generalInfoForm.serial_number?.trim() || "",
      description: generalInfoForm.description?.trim() || "",
    }, { name: userName, id: user?.id || "" });

    if (updated) {
      await saveAssetTimeline({
        asset_id: asset.id,
        type: "audit",
        date: new Date().toISOString(),
        title: "Informações gerais atualizadas",
        user_name: userName,
        description: "Categoria, marca, modelo, número de série ou descrição do patrimônio foram revisados.",
      });

      setAsset(updated);
      setGeneralInfoDialogOpen(false);
      toast.success("Informações gerais atualizadas!");
      loadData();
    } else {
      toast.error("Erro ao salvar informações gerais");
    }
  };

  const handleTransfer = async () => {
    if (!asset || !transferData.origin || !transferData.cost_center) {
      toast.error("Informe a origem e o destino da movimentação");
      return;
    }

    const destination = costCenters.find((cc) => cc.id === transferData.cost_center);
    const originName = transferData.origin.trim();
    const destinationName = destination?.name || transferData.cost_center;
    const condition = transferData.condition || asset.condition;

    const updated = await saveAsset({
      ...asset,
      location: originName,
      cost_center: transferData.cost_center,
      condition,
      status: condition === "Manutenção"
        ? "Em Manutenção"
        : asset.status === "Em Manutenção"
          ? "Disponível"
          : asset.status,
      assigned_to: transferData.responsible || asset.assigned_to
    }, { name: userName, id: user?.id || "" });

    if (updated) {
      if (condition === "Manutenção") {
        await ensureMaintenanceTaskForAsset(
          updated,
          `Patrimônio movimentado para ${destinationName} e marcado como em manutenção.`
        );
      }

      await saveAssetTimeline({
        asset_id: asset.id,
        type: "assignment",
        date: new Date(`${transferData.movement_date}T12:00:00`).toISOString(),
        title: "Movimentação de patrimônio",
        user_name: userName,
        description: `Origem: ${originName}. Destino: ${destinationName}. Estado: ${condition}.${transferData.notes.trim() ? ` Observações: ${transferData.notes.trim()}` : ""}`,
        image_url: transferData.image_url || undefined,
      });

      setAsset(updated);
      setTransferDialogOpen(false);
      setTransferData({
        origin: "",
        cost_center: "",
        responsible: "",
        condition: "Bom",
        movement_date: new Date().toISOString().split("T")[0],
        notes: "",
        image_url: "",
      });
      toast.success("Movimentação realizada!");
      loadData();
    } else {
      toast.error("Erro ao movimentar patrimônio");
    }
  };

  const handleCheckout = async () => {
    if (!asset || !checkoutData.user_name) return;

    const checkout = await saveCheckout({
      item_id: asset.id,
      item_type: "asset",
      item_name: asset.name,
      user_name: checkoutData.user_name,
      quantity: 1,
      checkout_date: new Date().toISOString(),
      expected_return_date: checkoutData.expected_return || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
      status: "Ativo",
      notes: checkoutData.notes
    }, { name: userName, id: user?.id || "" });

    if (checkout) {
      setCheckoutDialogOpen(false);
      setCheckoutData({ user_name: "", expected_return: "", notes: "" });
      toast.success("Checkout realizado!");
      loadData();
    } else {
      toast.error("Erro ao realizar checkout");
    }
  };

  const handleCheckin = async () => {
    if (!activeCheckout) return;
    const updated = await saveCheckout({
      ...activeCheckout,
      return_date: new Date().toISOString(),
      status: "Devolvido"
    }, { name: userName, id: user?.id || "" });
    if (updated) {
      toast.success("Devolução registrada!");
      loadData();
    } else {
      toast.error("Erro ao registrar devolução");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Carregando patrimônio...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Patrimônio não encontrado</p>
          <Button onClick={() => router.push("/patrimonio")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const daysSinceAcquisition = Math.floor(
    (new Date().getTime() - new Date(asset.purchase_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)
  );
  const yearsSinceAcquisition = (daysSinceAcquisition / 365).toFixed(1);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3 max-w-6xl mx-auto">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-chart-5/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-chart-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{asset.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {asset.code}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${conditionColors[asset.condition]}`}>
                  {asset.condition}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-6xl mx-auto">
        {activeCheckout && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Em uso por {activeCheckout.user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Devolução prevista: {new Date(activeCheckout.expected_return_date || '').toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {activeCheckout.status === "Atrasado" && (
                  <Badge className="bg-red-500/20 text-red-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Atrasado
                  </Badge>
                )}
                <Button variant="secondary" size="sm" onClick={handleCheckin}>Devolver</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Informações Gerais
                  </CardTitle>
                  <Dialog open={generalInfoDialogOpen} onOpenChange={(open) => {
                    setGeneralInfoDialogOpen(open);
                    if (open && asset) {
                      setGeneralInfoForm({
                        category: asset.category || "",
                        brand: asset.brand || "",
                        model: asset.model || "",
                        serial_number: asset.serial_number || "",
                        description: asset.description || "",
                      });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs">
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Editar Informações Gerais</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Input
                              value={generalInfoForm.category || ""}
                              onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, category: e.target.value })}
                              placeholder="Opcional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Marca</Label>
                            <Input
                              value={generalInfoForm.brand || ""}
                              onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, brand: e.target.value })}
                              placeholder="Opcional"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Modelo</Label>
                            <Input
                              value={generalInfoForm.model || ""}
                              onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, model: e.target.value })}
                              placeholder="Opcional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nº Série</Label>
                            <Input
                              value={generalInfoForm.serial_number || ""}
                              onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, serial_number: e.target.value })}
                              placeholder="Opcional"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={generalInfoForm.description || ""}
                            onChange={(e) => setGeneralInfoForm({ ...generalInfoForm, description: e.target.value })}
                            placeholder="Opcional"
                          />
                        </div>
                        <Button onClick={handleSaveGeneralInfo}>Salvar Informações</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Categoria</p>
                    <p className="text-sm font-medium">{asset.category || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Marca</p>
                    <p className="text-sm font-medium">{asset.brand || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Modelo</p>
                    <p className="text-sm font-medium">{asset.model || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nº Série</p>
                    <p className="text-sm font-medium font-mono">{asset.serial_number || "N/A"}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                  <p className="text-sm">{asset.description || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 h-full flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Valor</p>
                      <p className="text-lg font-bold">
                        R$ {(asset.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 h-full flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Aquisição</p>
                      <p className="text-lg font-bold">{yearsSinceAcquisition} anos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 h-full flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Tag className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Nota Fiscal</p>
                      <p className="text-lg font-bold">{asset.invoice_number || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 h-full flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Garantia</p>
                      <p className="text-lg font-bold">{asset.warranty_months ? `${asset.warranty_months} meses` : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Local Atual</p>
                      <p className="text-sm font-medium flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {asset.location}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Centro de Custo</p>
                      <p className="text-sm font-medium truncate">{currentCostCenterName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 h-full flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Responsável</p>
                      <p className="text-sm font-medium truncate">{asset.assigned_to}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Manutenções
                  </CardTitle>
                  <Link href="/patrimonio/manutencao">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Ver todas
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {maintenanceTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma manutenção registrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {maintenanceTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${task.status === "Concluída"
                            ? "bg-green-500/20"
                            : task.status === "Em Andamento"
                              ? "bg-blue-500/20"
                              : "bg-amber-500/20"
                            }`}
                        >
                          {task.status === "Concluída" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : task.status === "Em Andamento" ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.updated_at ? new Date(task.updated_at).toLocaleDateString("pt-BR") : '-'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${task.status === "Concluída"
                            ? "border-green-500/30 text-green-500"
                            : task.status === "Em Andamento"
                              ? "border-blue-500/30 text-blue-500"
                              : "border-amber-500/30 text-amber-500"
                            }`}
                        >
                          {task.status === "Concluída"
                            ? "Concluído"
                            : task.status === "Em Andamento"
                              ? "Em andamento"
                              : task.status === "Atrasada"
                                ? "Atrasado"
                                : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum evento registrado
                  </p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {timeline.slice(0, 5).map((event) => {
                        const Icon = timelineIcons[event.type] || Package;
                        const colorClass = timelineColors[event.type] || "bg-slate-500/20 text-slate-500";

                        return (
                          <div key={event.id} className="relative flex items-start gap-3 pl-2">
                            <div
                              className={`relative z-10 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shrink-0`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <p className="text-sm font-medium">{event.title}</p>
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                              {event.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={event.image_url}
                                  alt={event.title}
                                  className="mt-2 h-16 w-24 rounded-md object-cover border border-border/60"
                                />
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{new Date(event.date).toLocaleDateString("pt-BR")}</span>
                                <span>•</span>
                                <span>{event.user_name}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Patrimônio</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Equipamento</Label>
                    <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input value={editForm.code || ""} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <UserSelect
                      value={editForm.assigned_to || ""}
                      onChange={(v) => setEditForm({ ...editForm, assigned_to: v })}
                    />
                  </div>
                  <div className="space-y-2 hidden">
                    <Label>Estado</Label>
                    <Select value={editForm.condition} onValueChange={(v) => setEditForm({ ...editForm, condition: v as Asset["condition"] })}>
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
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Aquisição</Label>
                    <Input type="date" value={editForm.purchase_date || ""} onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={editForm.value ?? ""} onChange={(e) => setEditForm({ ...editForm, value: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nota Fiscal</Label>
                    <Input value={editForm.invoice_number || ""} onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Garantia (meses)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.warranty_months ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, warranty_months: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={transferDialogOpen} onOpenChange={(open) => {
            setTransferDialogOpen(open);
            if (open && asset) {
              setTransferData({
                origin: asset.location || "",
                cost_center: asset.cost_center || "",
                responsible: asset.assigned_to || "",
                condition: asset.condition || "Bom",
                movement_date: new Date().toISOString().split("T")[0],
                notes: "",
                image_url: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Movimentação de Patrimônio</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Input
                    placeholder="Informe a origem..."
                    value={transferData.origin}
                    onChange={e => setTransferData({ ...transferData, origin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Novo Responsável (Opcional)</Label>
                  <UserSelect
                    value={transferData.responsible}
                    onChange={(v) => setTransferData({ ...transferData, responsible: v })}
                    placeholder="Selecione novo responsável..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Select
                    value={transferData.cost_center}
                    onValueChange={(v) => setTransferData({ ...transferData, cost_center: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {costCenters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado do Patrimônio</Label>
                  <Select
                    value={transferData.condition}
                    onValueChange={(v) => setTransferData({ ...transferData, condition: v as Asset["condition"] })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excelente">Excelente</SelectItem>
                      <SelectItem value="Bom">Bom</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Ruim">Ruim</SelectItem>
                      <SelectItem value="Manutenção">Em Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data da Movimentação</Label>
                  <Input
                    type="date"
                    value={transferData.movement_date}
                    onChange={e => setTransferData({ ...transferData, movement_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={transferData.notes}
                    onChange={e => setTransferData({ ...transferData, notes: e.target.value })}
                    placeholder="Descreva avarias, contexto da transferência ou observações relevantes..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto da Observação (Opcional)</Label>
                  <div className="flex justify-center">
                    <ImageUpload
                      bucket="public-assets"
                      folder="asset-movements"
                      defaultImage={transferData.image_url}
                      onImageChange={(url) => setTransferData({ ...transferData, image_url: url || "" })}
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleTransfer} className="w-full sm:w-auto">Confirmar Movimentação</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild variant="outline" className="h-12 w-full gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
            <Link href={`/manutencao/nova?assetId=${asset.id}`}>
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="truncate">Solicitar Manutenção</span>
            </Link>
          </Button>

          <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 gap-2" disabled={!!activeCheckout}>
                <LogOut className="h-4 w-4" />
                Checkout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Realizar Checkout</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <UserSelect
                    value={checkoutData.user_name}
                    onChange={(v) => setCheckoutData({ ...checkoutData, user_name: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Prevista Devolução</Label>
                  <Input type="date" value={checkoutData.expected_return} onChange={e => setCheckoutData({ ...checkoutData, expected_return: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={checkoutData.notes} onChange={e => setCheckoutData({ ...checkoutData, notes: e.target.value })} />
                </div>
                <Button onClick={handleCheckout}>Confirmar Checkout</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 gap-2 col-span-2 md:col-span-1 lg:col-span-1">
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden border-border p-4 sm:max-w-md sm:p-6">
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center gap-2">
                  <QrCode className="h-5 w-5 shrink-0" />
                  <span className="truncate">Etiqueta de Patrimônio</span>
                </DialogTitle>
              </DialogHeader>

              <Tabs value={labelLayout} onValueChange={(v) => setLabelLayout(v as AssetLabelLayout)} className="w-full min-w-0">
                <TabsList className="grid h-11 w-full grid-cols-2">
                  <TabsTrigger value="standard">Padrão</TabsTrigger>
                  <TabsTrigger value="compact">Compacto</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex w-full min-w-0 flex-col items-center gap-4 py-4 sm:gap-6 sm:py-6" id="qr-content">
                <div className="flex w-full justify-center overflow-hidden rounded-lg border bg-gray-50 px-2 py-3 shadow-sm sm:p-4">
                  <div
                    className={
                      labelLayout === 'compact'
                        ? "h-[100px] w-[200px] overflow-visible"
                        : "h-[132px] w-[264px] overflow-visible sm:h-[150px] sm:w-[300px]"
                    }
                  >
                    <div className={labelLayout === 'compact' ? "origin-top-left" : "origin-top-left scale-[0.88] sm:scale-100"}>
                      <div ref={printRef} className="print:m-0 flex items-center justify-center">
                        <AssetLabel asset={asset} layout={labelLayout} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invisible canvas for download */}
                <div className="hidden">
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={asset.code}
                    size={500}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>

                <div className="flex w-full items-center justify-center">
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      id="fillPage"
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={fillPage}
                      onChange={(e) => setFillPage(e.target.checked)}
                    />
                    <Label htmlFor="fillPage" className="cursor-pointer text-sm font-medium leading-snug">
                      Preencher página (A4)
                    </Label>
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Button className="w-full gap-2" onClick={async () => {
                    try {
                      const { toPng } = await import('html-to-image');
                      const jsPDF = (await import('jspdf')).default;

                      const element = printRef.current;
                      if (!element) return;

                      // Wait a bit for any re-renders
                      await new Promise(resolve => setTimeout(resolve, 100));

                      // Render at 4x scale for high quality
                      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 4 });

                      const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4' // A4: 210 x 297 mm
                      });

                      const pageWidth = 210;
                      // const pageHeight = 297; // Not used but good to know

                      // Tag dimensions (mm)
                      let tagWidth, tagHeight, gapX, gapY, cols, rows, startX, startY;

                      if (labelLayout === 'compact') {
                        // Compact: 50x25mm
                        tagWidth = 50;
                        tagHeight = 25;
                        gapX = 5;
                        gapY = 5;
                        cols = 3;
                        rows = 9;
                        startX = (pageWidth - (cols * tagWidth + (cols - 1) * gapX)) / 2;
                        startY = 15;
                      } else {
                        // Standard: 80x40mm
                        tagWidth = 80;
                        tagHeight = 40;
                        gapX = 10;
                        gapY = 10;
                        cols = 2;
                        rows = 6;
                        startX = (pageWidth - (cols * tagWidth + (cols - 1) * gapX)) / 2;
                        startY = 15;
                      }

                      const totalTags = fillPage ? cols * rows : 1;

                      for (let i = 0; i < totalTags; i++) {
                        const col = i % cols;
                        const row = Math.floor(i / cols);

                        const x = startX + col * (tagWidth + gapX);
                        const y = startY + row * (tagHeight + gapY);

                        pdf.addImage(dataUrl, 'PNG', x, y, tagWidth, tagHeight);
                      }

                      pdf.save(`${asset?.code || 'etiqueta'}.pdf`);
                      toast.success("PDF gerado com sucesso!");
                    } catch (error) {
                      console.error("Error generating PDF:", error);
                      toast.error("Erro ao gerar PDF");
                    }
                  }}>
                    <Download className="h-4 w-4" />
                    Salvar PDF
                  </Button>
                  <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={downloadQR}>
                    <Save className="h-4 w-4" />
                    PNG
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

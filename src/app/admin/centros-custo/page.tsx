"use client";

import { useState, useEffect } from "react";
import { getCostCenters, saveCostCenter } from "@/lib/db";
import { CostCenter } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
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
import { Briefcase, Search, Plus, Edit, User } from "lucide-react";
import { toast } from "sonner";

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [newCenter, setNewCenter] = useState<Partial<CostCenter>>({
    status: "ativo",
  });

  const loadData = async () => {
    setIsLoading(true);
    const data = await getCostCenters();
    setCostCenters(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCenters = costCenters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveCenter = async () => {
    if (!newCenter.name || !newCenter.code) {
      toast.error("Preencha o nome e o código");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveCostCenter(newCenter);
      if (result) {
        toast.success(editingCenter ? "Centro de custo atualizado" : "Centro de custo criado");
        loadData();
        setIsDialogOpen(false);
      } else {
        toast.error("Erro ao salvar centro de custo");
      }
    } catch (error) {
      toast.error("Ocorreu um erro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setNewCenter(center);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Centros de Custo</h1>
                <p className="text-xs text-muted-foreground">{costCenters.length} centros</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingCenter(null);
                setNewCenter({ status: "ativo" });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Código</Label>
                      <Input
                        value={newCenter.code || ""}
                        onChange={(e) => setNewCenter({ ...newCenter, code: e.target.value })}
                        placeholder="Ex: ADM001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newCenter.status}
                        onValueChange={(v) => setNewCenter({ ...newCenter, status: v as CostCenter["status"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newCenter.name || ""}
                      onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                      placeholder="Nome do centro de custo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Input
                      value={newCenter.responsible || ""}
                      onChange={(e) => setNewCenter({ ...newCenter, responsible: e.target.value })}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newCenter.description || ""}
                      onChange={(e) => setNewCenter({ ...newCenter, description: e.target.value })}
                      placeholder="Descrição do centro de custo"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveCenter} className="w-full">
                    {editingCenter ? "Salvar Alterações" : "Criar Centro de Custo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar centro de custo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 h-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="border-border/50 bg-card/50">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-500">{center.code.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{center.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] flex-shrink-0 ${center.status === "ativo" ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-gray-500/20 text-gray-500 border-gray-500/30"}`}
                      >
                        {center.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{center.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {center.code}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {center.responsible}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(center)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
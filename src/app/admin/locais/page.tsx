"use client";

import { useState, useEffect } from "react";
import { getStorageLocations, saveStorageLocation } from "@/lib/db";
import { StorageLocation } from "@/lib/store";
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
import { MapPin, Search, Plus, Edit, Warehouse, Building, Home, Truck } from "lucide-react";
import { toast } from "sonner";

const typeIcons = {
  almoxarifado: Warehouse,
  deposito: Building,
  sala: Home,
  externo: Truck,
};

const typeLabels = {
  almoxarifado: "Almoxarifado",
  deposito: "Depósito",
  sala: "Sala",
  externo: "Externo",
};

const typeColors = {
  almoxarifado: "bg-blue-500/20 text-blue-500",
  deposito: "bg-purple-500/20 text-purple-500",
  sala: "bg-green-500/20 text-green-500",
  externo: "bg-amber-500/20 text-amber-500",
};

export default function StorageLocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [newLocation, setNewLocation] = useState<Partial<StorageLocation>>({
    type: "almoxarifado",
    status: "ativo",
  });

  const loadData = async () => {
    setIsLoading(true);
    const data = await getStorageLocations();
    setLocations(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLocations = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveLocation = async () => {
    if (!newLocation.name || !newLocation.code) {
      toast.error("Preencha o nome e o código");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveStorageLocation(newLocation);
      if (result) {
        toast.success(editingLocation ? "Local atualizado" : "Local criado");
        loadData();
        setIsDialogOpen(false);
      } else {
        toast.error("Erro ao salvar local");
      }
    } catch (error) {
      toast.error("Ocorreu um erro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (location: StorageLocation) => {
    setEditingLocation(location);
    setNewLocation(location);
    setIsDialogOpen(true);
  };

  const getOccupationColor = (occupation: number, capacity: number) => {
    const percentage = (occupation / capacity) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Locais de Armazenamento</h1>
                <p className="text-xs text-muted-foreground">{locations.length} locais</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingLocation(null);
                setNewLocation({ type: "almoxarifado", status: "ativo" });
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
                    {editingLocation ? "Editar Local" : "Novo Local de Armazenamento"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Código</Label>
                      <Input
                        value={newLocation.code || ""}
                        onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
                        placeholder="Ex: ALM-A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newLocation.type}
                        onValueChange={(v) => setNewLocation({ ...newLocation, type: v as StorageLocation["type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="almoxarifado">Almoxarifado</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="sala">Sala</SelectItem>
                          <SelectItem value="externo">Externo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newLocation.name || ""}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Nome do local"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacidade</Label>
                      <Input
                        type="number"
                        value={newLocation.capacity || ""}
                        onChange={(e) => setNewLocation({ ...newLocation, capacity: parseInt(e.target.value) || 0 })}
                        placeholder="Capacidade total"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newLocation.status}
                        onValueChange={(v) => setNewLocation({ ...newLocation, status: v as StorageLocation["status"] })}
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
                    <Label>Descrição</Label>
                    <Textarea
                      value={newLocation.description || ""}
                      onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                      placeholder="Descrição do local"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveLocation} className="w-full">
                    {editingLocation ? "Salvar Alterações" : "Criar Local"}
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
            placeholder="Buscar local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 h-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {filteredLocations.map((location) => {
            const TypeIcon = typeIcons[location.type];
            const occupationPercentage = Math.round((location.current_occupation / location.capacity) * 100);

            return (
              <Card key={location.id} className="border-border/50 bg-card/50">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${typeColors[location.type]} flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{location.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] flex-shrink-0 ${location.status === "ativo" ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-gray-500/20 text-gray-500 border-gray-500/30"}`}
                        >
                          {location.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{location.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {typeLabels[location.type]}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {location.code}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Ocupação</span>
                          <span>{location.current_occupation} / {location.capacity} ({occupationPercentage}%)</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getOccupationColor(location.current_occupation, location.capacity)} transition-all`}
                            style={{ width: `${occupationPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(location)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
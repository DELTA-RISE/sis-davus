"use client";

import { useState, useEffect } from "react";
import { deleteCostCenter, getCostCenters, saveCostCenter, getUsers } from "@/lib/db";
import { CostCenter, User } from "@/lib/store";
import { costCenterSchema } from "@/lib/validations";
import { ZodError } from "zod";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Briefcase, Search, Plus, Edit, User as UserIcon, Check, ChevronsUpDown, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function generateCostCenterCode(name?: string) {
  const base = (name || "CENTRO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 24);

  return base || "CENTRO";
}

function normalizeCostCenterStatus(status?: string): CostCenter["status"] {
  return status?.toLowerCase() === "inativo" ? "inativo" : "ativo";
}

export default function CostCentersPage() {
  const { user, userName } = useAuth();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [newCenter, setNewCenter] = useState<Partial<CostCenter>>({
    status: "ativo",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedCenterForDetails, setSelectedCenterForDetails] = useState<CostCenter | null>(null);
  const [centerToDelete, setCenterToDelete] = useState<CostCenter | null>(null);

  const loadData = async () => {
    // setIsLoading(true);
    const [centersData, usersData] = await Promise.all([
      getCostCenters(),
      getUsers()
    ]);
    setCostCenters(centersData);
    setUsers(usersData);
    // setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCenters = costCenters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.responsible && c.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableUsers = users;


  const validateForm = () => {
    const payload = {
      ...newCenter,
      status: normalizeCostCenterStatus(newCenter.status)
    };

    const result = costCenterSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      (result.error as ZodError).issues.forEach((err: { path: (string | number | symbol)[]; message: string }) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSaveCenter = async () => {
    if (!validateForm()) {
      toast.error("Corrija os erros do formulário");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<CostCenter> = {
        ...newCenter,
        code: newCenter.code || generateCostCenterCode(newCenter.name),
        status: normalizeCostCenterStatus(newCenter.status),
      };

      const savedCenter = await saveCostCenter(payload, { name: userName, id: user?.id || "" });

      if (savedCenter) {
        toast.success(editingCenter ? "Centro de custo atualizado" : "Centro de custo criado");
        await loadData();
        setIsDialogOpen(false);
      } else {
        toast.error("Erro ao salvar centro de custo");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocorreu um erro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setErrors({});
    setNewCenter({
      ...center,
      responsible_id: center.responsible_id, // Ensure these are carried over
      responsible: center.responsible,
      status: normalizeCostCenterStatus(center.status),
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCenter(null);
    setNewCenter({ status: "ativo" });
    setErrors({});
    setIsDialogOpen(true);
  }

  const handleDeleteCenter = async () => {
    if (!centerToDelete) return;

    try {
      const success = await deleteCostCenter(centerToDelete.id, { name: userName, id: user?.id || "" });
      if (!success) {
        toast.error("Erro ao excluir centro de custo");
        return;
      }

      toast.success("Centro de custo excluído");
      setCenterToDelete(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir centro de custo");
    }
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
            <Button size="sm" className="h-9 gap-1" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Code field removed */}

                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newCenter.name || ""}
                      onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                      placeholder="Nome do centro de custo"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <Label>Responsável</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between"
                        >
                          {newCenter.responsible
                            ? newCenter.responsible
                            : "Selecione um responsável..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar responsável..." />
                          <CommandList>
                            <CommandEmpty>Nenhum usuário disponível encontrado.</CommandEmpty>
                            <CommandGroup>
                              {availableUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.name}
                                  onSelect={() => {
                                    setNewCenter({
                                      ...newCenter,
                                      responsible: user.name,
                                      responsible_id: user.id
                                    });
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newCenter.responsible_id === user.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {user.name}
                                  <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">
                                    {user.role || 'user'}
                                  </Badge>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-[10px] text-muted-foreground">
                      Um responsável pode acompanhar mais de um centro de custo.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={normalizeCostCenterStatus(newCenter.status)}
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

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newCenter.description || ""}
                      onChange={(e) => setNewCenter({ ...newCenter, description: e.target.value })}
                      placeholder="Descrição do centro de custo"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveCenter} className="w-full" disabled={isSaving}>
                    {isSaving ? "Salvando..." : (editingCenter ? "Salvar Alterações" : "Criar Centro de Custo")}
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
            placeholder="Buscar centro de custo ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 h-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="h-full border-border/50 bg-card/50">
              <CardContent className="flex h-full flex-col p-3 md:p-4">
                <div className="flex flex-1 items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-amber-500" />
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
                    {center.description && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{center.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserIcon className="h-3 w-3" />
                        {center.responsible || "Sem responsável"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(center)}
                    className="h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCenterForDetails(center)}
                    className="h-8 w-8 p-0"
                    title="Ver Membros"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCenterToDelete(center)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ConfirmDialog
          open={!!centerToDelete}
          onOpenChange={(open) => !open && setCenterToDelete(null)}
          title="Excluir centro de custo"
          description={`Deseja excluir "${centerToDelete?.name || "este centro de custo"}"? Essa ação remove o centro da lista de obras e escritórios.`}
          confirmText="Excluir"
          variant="destructive"
          onConfirm={handleDeleteCenter}
        />

        {/* Details Dialog */}
        <Dialog open={!!selectedCenterForDetails} onOpenChange={(open) => !open && setSelectedCenterForDetails(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-500" />
                {selectedCenterForDetails?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">Responsável</h4>
                {users.find(u => u.id === selectedCenterForDetails?.responsible_id) ? (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">
                      {users.find(u => u.id === selectedCenterForDetails?.responsible_id)?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{users.find(u => u.id === selectedCenterForDetails?.responsible_id)?.name}</p>
                      <p className="text-xs text-muted-foreground">{users.find(u => u.id === selectedCenterForDetails?.responsible_id)?.email}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-[10px]">Responsável</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhum responsável definido.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">Membros ({users.filter(u => u.cost_center === selectedCenterForDetails?.id && u.id !== selectedCenterForDetails?.responsible_id).length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {users.filter(u => u.cost_center === selectedCenterForDetails?.id && u.id !== selectedCenterForDetails?.responsible_id).map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-[10px]">{member.role}</Badge>
                    </div>
                  ))}
                  {users.filter(u => u.cost_center === selectedCenterForDetails?.id && u.id !== selectedCenterForDetails?.responsible_id).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum outro membro vinculado.</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
}

"use client";

import { useState, useEffect } from "react";
import { saveUser, getDeviceInfo, getPublicIp, syncUsers, syncCostCenters } from "@/lib/db";
import { createUserAction, deleteUserAction, updateUserPasswordAction } from "@/actions/auth";
import { useAuth } from "@/lib/auth-context";
import { useUsers, useCostCenters } from "@/hooks/use-queries";
import { User, UserRole } from "@/lib/store";
import { userSchema } from "@/lib/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Plus,
  Edit,
  Mail,
  Calendar,
  Shield,
  UserCog,
  Trash2,
  Lock,
  User as UserIcon,
  Copy,
  Check,
  ChevronsUpDown,
  RotateCcw,
  LucideIcon
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  user: "Usuário",
  manager: "Gerente",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  gestor: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  user: "bg-gray-500/20 text-gray-500 border-gray-500/30",
  manager: "bg-orange-500/20 text-orange-500 border-orange-500/30",
};

type DependencyDetails = {
  count: number;
};

const roleIcons: Record<UserRole, LucideIcon> = {
  admin: Shield,
  gestor: UserCog,
  user: UserIcon,
  manager: Shield,
};

export default function UsersPage() {
  const { userName, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Reactive Hooks
  const { users } = useUsers(searchTerm);
  const { costCenters } = useCostCenters();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openCostCenterSelect, setOpenCostCenterSelect] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: "gestor",
    status: "ativo",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dependency Resolution State
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolveStrategy, setResolveStrategy] = useState<'unassign' | 'reassign'>('unassign');
  const [newResponsibleId, setNewResponsibleId] = useState<string>("");
  const [dependencyDetails, setDependencyDetails] = useState<DependencyDetails | null>(null);


  // Background Sync on Mount
  useEffect(() => {
    syncUsers();
    syncCostCenters();
  }, []);

  const filteredUsers = users;

  const validateForm = () => {
    const payload = {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'user',
      status: newUser.status || 'ativo',
      cost_center: newUser.cost_center
    };

    const result = userSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleResetMFA = async () => {
    if (!editingUser) return;
    if (!confirm(`Desativar 2FA para o usuário ${editingUser.name}?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada");
        return;
      }

      const response = await fetch('/api/admin/mfa/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: editingUser.id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao resetar 2FA");
      }

      toast.success(`2FA resetado com sucesso.`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro desconhecido ao resetar 2FA");
      }
    }
  };

  const handleSaveUser = async () => {
    if (!validateForm()) {
      toast.error("Corrija os erros do formulário");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        const result = await saveUser(newUser, { name: userName, id: user?.id || "" });
        if (result) {
          if (newPassword) {
            const pwResult = await updateUserPasswordAction(editingUser.id, newPassword);
            if (!pwResult.success) {
              toast.error("Erro ao atualizar senha: " + pwResult.error);
            } else {
              toast.success("Senha atualizada");
            }
          }

          toast.success("Usuário atualizado");
          setIsDialogOpen(false);
          setNewPassword("");
        } else {
          toast.error("Erro ao salvar usuário");
        }
      } else {
        const result = await createUserAction({
          name: newUser.name || "",
          email: newUser.email || "",
          role: newUser.role || 'gestor',
          status: (newUser.status === 'ativo' || newUser.status === 'inativo') ? newUser.status : 'ativo',
          cost_center: newUser.role === 'gestor' && newUser.cost_center ? newUser.cost_center : null
        }, {
          userName,
          userId: user?.id || "",
          deviceInfo: getDeviceInfo(),
          ip: await getPublicIp()
        });

        if (result.success) {
          toast.success("Usuário criado com sucesso!");
          if (result.tempPassword) {
            setCreatedCredentials({
              email: newUser.email!,
              password: result.tempPassword
            });
          }
          syncUsers();
          setIsDialogOpen(false);
        } else {
          toast.error("Erro ao criar usuário: " + result.error);
        }
      }
    } catch (error) {
      toast.error("Ocorreu um erro");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDeleteUser = async (cleanupConfig?: { costCenterStrategy: 'unassign' | 'reassign', newResponsibleId?: string }) => {
    if (!editingUser) return;

    setIsDeleting(true);
    try {
      const result = await deleteUserAction(editingUser.id, {
        audit: {
          userName,
          userId: user?.id || "",
          deviceInfo: getDeviceInfo(),
          ip: await getPublicIp()
        },
        cleanupConfig
      });

      if (result.success) {
        toast.success("Usuário excluído com sucesso");
        syncUsers();
        setIsDialogOpen(false);
        setIsAlertOpen(false);
        setIsResolveDialogOpen(false);
      } else if (result.code === 'DEPENDENCY_COST_CENTER') {
        setDependencyDetails(result.details as DependencyDetails);
        setIsAlertOpen(false);
        setIsResolveDialogOpen(true);
      } else {
        toast.error("Erro ao excluir usuário: " + result.error);
      }
    } catch {
      toast.error("Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResolveAndProceed = () => {
    if (resolveStrategy === 'reassign' && !newResponsibleId) {
      toast.error("Selecione um novo responsável");
      return;
    }
    executeDeleteUser({
      costCenterStrategy: resolveStrategy,
      newResponsibleId: resolveStrategy === 'reassign' ? newResponsibleId : undefined
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewUser(user);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Gestão de Usuários</h1>
                <p className="text-xs text-muted-foreground">{users.length} usuários</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingUser(null);
                setNewUser({ role: "gestor", status: "ativo" });
                setNewPassword("");
                setErrors({});
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
                    {editingUser ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? "Faça alterações no perfil do usuário aqui. Clique em salvar quando terminar."
                      : "Preencha as informações para criar um novo usuário no sistema."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newUser.name || ""}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Nome completo"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={newUser.email || ""}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Perfil</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(v) => setNewUser({ ...newUser, role: v as User["role"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newUser.status}
                        onValueChange={(v) => setNewUser({ ...newUser, status: v as User["status"] })}
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
                    <Label>Centro de Custo (Vinculado)</Label>
                    <Popover open={openCostCenterSelect} onOpenChange={setOpenCostCenterSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCostCenterSelect}
                          className="w-full justify-between"
                        >
                          {newUser.cost_center
                            ? costCenters.find((cc) => cc.id === newUser.cost_center)?.name || "Selecione..."
                            : "Nenhum"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar centro de custo..." />
                          <CommandList>
                            <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setNewUser({ ...newUser, cost_center: undefined });
                                  setOpenCostCenterSelect(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !newUser.cost_center ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Nenhum
                              </CommandItem>
                              {costCenters.map((cc) => (
                                <CommandItem
                                  key={cc.id}
                                  value={cc.name}
                                  onSelect={() => {
                                    setNewUser({ ...newUser, cost_center: cc.id });
                                    setOpenCostCenterSelect(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newUser.cost_center === cc.id ? "opacity-100" : "opacity-0"
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
                    <p className="text-[10px] text-muted-foreground">
                      Vincula o usuário a um centro de custo específico.
                    </p>
                  </div>

                  {editingUser && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <Label>Redefinir Senha (Opcional)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nova senha para o usuário"
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se preenchido, o usuário será obrigado a trocar a senha no próximo login.
                      </p>
                    </div>
                  )}

                  {editingUser && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <Label>Segurança</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                        onClick={handleResetMFA}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Redefinir 2FA (Desabilitar)
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Remove a proteção de dois fatores deste usuário (caso tenha perdido o acesso).
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {editingUser && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setIsAlertOpen(true)}
                        disabled={isDeleting || isSaving}
                        className="w-1/3"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    )}
                    <Button onClick={handleSaveUser} className="flex-1" disabled={isDeleting || isSaving}>
                      {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário
                    <span className="font-semibold text-foreground"> {editingUser?.name} </span>
                    e todos os dados associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      executeDeleteUser();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Excluindo..." : "Sim, excluir usuário"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header >

      {/* Resolve Dependencies Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dependências Encontradas</DialogTitle>
            <DialogDescription>
              O usuário <strong>{editingUser?.name}</strong> é responsável por {dependencyDetails?.count} Centro(s) de Custo.
              Você deve decidir o que fazer com essas responsabilidades antes de excluir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select value={resolveStrategy} onValueChange={(v) => setResolveStrategy(v as typeof resolveStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Deixar sem responsável</SelectItem>
                  <SelectItem value="reassign">Atribuir a outro usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resolveStrategy === 'reassign' && (
              <div className="space-y-2">
                <Label>Novo Responsável</Label>
                <Select value={newResponsibleId} onValueChange={setNewResponsibleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => u.id !== editingUser?.id && u.role !== 'user')
                      .map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleResolveAndProceed} disabled={isDeleting}>
              {isDeleting ? "Processando..." : "Resolver e Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-green-500">
              Usuário Criado com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center">
              As credenciais abaixo foram geradas. Copie-as e envie para o usuário, pois a senha não poderá ser visualizada novamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <div className="relative">
                <Input value={createdCredentials?.email || ''} readOnly className="pr-10 bg-muted/50" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials?.email || '');
                    toast.success("E-mail copiado!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Senha Temporária</Label>
              <div className="relative">
                <Input value={createdCredentials?.password || ''} readOnly className="pr-10 font-mono bg-muted/50" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials?.password || '');
                    toast.success("Senha copiada!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-600 dark:text-yellow-400">
              <p className="flex gap-2">
                <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  O usuário será solicitado a redefinir esta senha no primeiro acesso.
                </span>
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setCreatedCredentials(null)} className="w-full sm:w-auto">
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 h-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {filteredUsers.map((user: User) => {
            const RoleIcon = roleIcons[user.role];
            return (
              <Card key={user.id} className="border-border/50 bg-card/50">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <Badge
                          variant={user.status === "ativo" ? "default" : "secondary"}
                          className={`text-[10px] ${user.status === "ativo" ? "bg-green-500/20 text-green-500" : ""}`}
                        >
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className={`text-[10px] ${roleColors[user.role]}`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[user.role]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 hidden md:flex">
                          <Calendar className="h-3 w-3" />
                          Último acesso: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
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
    </div >
  );
}

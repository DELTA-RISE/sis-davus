"use client";

import { useState, useEffect } from "react";
import { getUsers, saveUser, getDeviceInfo } from "@/lib/db";
import { createUserAction, deleteUserAction, updateUserPasswordAction } from "@/actions/auth";
import { useAuth } from "@/lib/auth-context";
import { User } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";

const roleLabels = {
  admin: "Administrador",
  gestor: "Gestor",
};

const roleColors = {
  admin: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  gestor: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

const roleIcons = {
  admin: Shield,
  gestor: UserCog,
};

export default function UsersPage() {
  const { userName, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: "gestor",
    status: "ativo",
  });

  const loadData = async () => {
    setIsLoading(true);
    const data = await getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Preencha o nome e o e-mail");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        // Edit existing user - update profile directly
        const result = await saveUser(newUser, { name: userName, id: user?.id || "" });
        if (result) {
          // If password was provided, update it
          if (newPassword) {
            const pwResult = await updateUserPasswordAction(editingUser.id, newPassword);
            if (!pwResult.success) {
              toast.error("Erro ao atualizar senha: " + pwResult.error);
            } else {
              toast.success("Senha atualizada");
            }
          }

          toast.success("Usuário atualizado");
          loadData();
          setIsDialogOpen(false);
          setNewPassword("");
        } else {
          toast.error("Erro ao salvar usuário");
        }
      } else {
        // Create new user - use Server Action
        const result = await createUserAction({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role || 'gestor',
          status: newUser.status || 'ativo'
        }, {
          userName,
          userId: user?.id || "",
          deviceInfo: getDeviceInfo(),
          ip: "127.0.0.1" // Mock IP as client can't easily get it
        });

        if (result.success) {
          toast.success("Usuário criado com sucesso!");
          if (result.tempPassword) {
            alert(`Usuário criado com sucesso.\n\nSenha temporária: ${result.tempPassword}\n\nO usuário será solicitado a alterar esta senha no primeiro acesso.`);
          }
          loadData();
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

  const handleDeleteUser = async () => {
    if (!editingUser) return;

    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserAction(editingUser.id, {
        userName,
        userId: user?.id || "",
        deviceInfo: getDeviceInfo(),
        ip: "127.0.0.1"
      });
      if (result.success) {
        toast.success("Usuário excluído com sucesso");
        loadData();
        setIsDialogOpen(false);
      } else {
        toast.error("Erro ao excluir usuário: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
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
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newUser.name || ""}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={newUser.email || ""}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
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

                  <div className="flex gap-2 pt-2">
                    {editingUser && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeleteUser}
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
          </div>
        </div>
      </header>

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
          {filteredUsers.map((user) => {
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
    </div>
  );
}
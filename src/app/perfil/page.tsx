"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveUser } from "@/lib/db";
import {
  User,
  Mail,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  HelpCircle,
  Info,
  Edit2,
  HardHat,
  UserCog,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGravatarUrl } from "@/lib/gravatar";

export default function PerfilPage() {
  const { user, currentRole, userName, email, gravatarEmail, gravatarUrl, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEditName(userName || "");
    setEditEmail(gravatarEmail || email || "");
  }, [userName, email, gravatarEmail]);

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await saveUser({
        id: user.id,
        name: editName,
        gravatar_email: editEmail
      });

      if (result) {
        toast.success("Perfil atualizado com sucesso!");
        await refreshProfile();
      } else {
        toast.error("Erro ao atualizar perfil.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    toast.success("Saindo da conta...");
    await signOut();
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Banner Profile - SIS DAVUS */}
        <Card className="border-border/50 bg-card/50 overflow-hidden relative">
          <div className="h-24 md:h-32 bg-primary/10 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/5 to-accent/10" />
            <img
              src="/davus-full-logo.svg"
              alt="DAVUS Logo"
              className="w-48 md:w-64 opacity-20 pointer-events-none select-none"
            />
          </div>

          <CardContent className="p-4 md:p-6 -mt-10 relative">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-card bg-muted shadow-lg">
                    <AvatarImage src={gravatarUrl || undefined} alt={userName} />
                    <AvatarFallback className="rounded-2xl bg-primary/20">
                      {currentRole === "admin" ? (
                        <Shield className="h-10 w-10 text-primary" />
                      ) : (
                        <HardHat className="h-10 w-10 text-primary" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-background border border-border rounded-lg shadow-sm">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-background" title="Gravatar Sync Active" />
                  </div>
                </div>
                <div className="flex-1 pb-1">
                  <h1 className="text-xl md:text-2xl font-bold">{userName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs gap-1 bg-background/50 backdrop-blur-sm">
                      <Shield className="h-3 w-3" />
                      {currentRole === "admin" ? "Administrador" : "Gestor"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Botão de Edição */}
              <Dialog onOpenChange={(open) => {
                if (open) {
                  setEditName(userName);
                  setEditEmail(email);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 bg-background/50 backdrop-blur-sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                      As alterações serão salvas nesta sessão. A foto é vinculada ao seu e-mail via Gravatar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail (Gravatar)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="seu@email.com"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use o e-mail cadastrado no Gravatar para atualizar sua foto automaticamente.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={saveProfile} disabled={isSaving}>
                      {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col gap-1 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{email || "Nenhum e-mail vinculado"}</span>
              </div>
              {gravatarEmail && gravatarEmail !== email && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 ml-6">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  Gravatar: {gravatarEmail}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu Principal */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-2 md:p-3 space-y-1">
            <Link
              href="/perfil/configuracoes"
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center">
                  <UserCog className="h-5 w-5 text-zinc-500" />
                </div>
                <span className="text-sm font-semibold">Configurações da Conta</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <HelpCircle className="h-5 v-5 text-green-500" />
                    </div>
                    <span className="text-sm font-semibold">Ajuda e Suporte</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Suporte SIS DAVUS</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq">
                      <AccordionTrigger className="text-sm">Consulte o FAQ</AccordionTrigger>
                      <AccordionContent className="text-xs space-y-2">
                        <p><strong>Como mudar minha foto?</strong> Basta alterar seu e-mail para um vinculado ao Gravatar.</p>
                        <p><strong>Esqueci minha senha?</strong> Contacte o administrador via e-mail abaixo.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                    <p className="text-xs font-medium">Suporte Administrativo:</p>
                    <p className="text-[10px] text-muted-foreground">Consulte o TI Central para problemas técnicos.</p>
                    <Button className="w-full h-8 text-xs" variant="outline" onClick={() => window.open('mailto:suporte@deltarise.com')}>
                      suporte@deltarise.com
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Link
              href="/perfil/ajustes"
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-sm font-semibold">Ajustes do App</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Info className="h-5 w-5 text-purple-500" />
                    </div>
                    <span className="text-sm font-semibold">Sobre o Aplicativo</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-10 w-10 text-primary" />
                  </div>
                  <DialogTitle className="text-xl">SIS DAVUS</DialogTitle>
                  <DialogDescription>v1.0.0 Stable</DialogDescription>
                </DialogHeader>
                <div className="text-center space-y-4 py-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Orgulhosamente desenvolvido por</p>
                    <p className="text-lg font-bold text-primary">Grupo DELTA RISE</p>
                  </div>
                  <div className="flex justify-center gap-4 pt-2">
                    <Link href="#" className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <Info className="h-5 w-5" />
                    </Link>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    "Excelência em Gestão Patrimonial"
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Botão de Sair */}
        <Button
          variant="destructive"
          className="w-full gap-2 h-12 rounded-xl transition-all active:scale-[0.98] shadow-md mt-4"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>

        <p className="text-center text-[10px] text-muted-foreground py-4 uppercase tracking-widest font-medium opacity-50">
          Crafted by Delta Rise • 2026
        </p>
      </div>
    </div>
  );
}

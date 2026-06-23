"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Checkout, Asset, User as AppUser } from "@/lib/store";
import { deleteCheckout, getCheckouts, isPendingSync, saveCheckout, getAssets, getUsers } from "@/lib/db";
import { supabase } from "@/lib/supabase";
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
  LogOut,
  Search,
  Plus,
  Calendar,
  User,
  Building2,
  Zap,
  Check,
  ChevronsUpDown,
  Trash2,
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
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { useAuth } from "@/lib/auth-context";
import { getScopedCostCenter } from "@/lib/access-scope";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function CheckoutsPage() {
  const { userName, user, currentRole, costCenter } = useAuth();
  const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checkoutToDelete, setCheckoutToDelete] = useState<Checkout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [newCheckout, setNewCheckout] = useState<Partial<Checkout>>({
    item_type: "asset",
    quantity: 1,
    checkout_date: todayStr,
  });
  const [openItemSelect, setOpenItemSelect] = useState(false);
  const [openUserSelect, setOpenUserSelect] = useState(false);

  const loadData = useCallback(async (_silent = false) => {
    // if (!silent) setIsLoading(true);
    const [c, a, u] = await Promise.all([
      getCheckouts(),
      getAssets(false, scopedCostCenter),
      getUsers()
    ]);
    const visibleAssetIds = new Set(a.map((asset) => asset.id));
    setCheckouts(c.filter((checkout) =>
      checkout.item_type === "asset" && visibleAssetIds.has(checkout.item_id)
    ));
    setAssets(a);
    setUsers(u);
    // if (!silent) setIsLoading(false);
  }, [scopedCostCenter]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = supabase.channel('checkouts').on('postgres_changes' as any, { event: '*', schema: 'public', table: 'checkouts' }, () => loadData(true)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const filteredCheckouts = useMemo(() => {
    return checkouts.filter((c) => {
      const itemName = c.item_name || "";
      const userName = c.user_name || "";
      const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) || userName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [checkouts, searchTerm]);

  const handleSaveCheckout = async () => {
    if (!newCheckout.item_id || !newCheckout.user_id || !newCheckout.checkout_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!newCheckout.notes?.trim()) {
      toast.error("O campo Motivo da Retirada é obrigatório");
      return;
    }

    const selectedUser = users.find((candidate) => candidate.id === newCheckout.user_id);
    if (!selectedUser?.id) {
      toast.error("Selecione um responsável válido");
      return;
    }

    const item = assets.find((asset) => asset.id === newCheckout.item_id);
    if (!item) return;
    const payload: Partial<Checkout> = {
      item_id: item.id,
      item_type: "asset",
      item_name: item.name,
      user_id: selectedUser.id,
      user_name: selectedUser.name,
      quantity: 1,
      checkout_date: new Date(`${newCheckout.checkout_date}T12:00:00`).toISOString(),
      status: "Ativo",
      notes: newCheckout.notes.trim(),
    };

    const saved = await saveCheckout(payload, { name: userName, id: user?.id || "" });
    if (saved) {
      if (isPendingSync(saved)) {
        toast.warning("Checkout salvo localmente.", {
          description: "A sincronizacao com o Supabase ainda esta pendente.",
        });
      } else {
        toast.success("Retirada registrada!");
      }
      setCheckouts((current) => [saved, ...current.filter((checkout) => checkout.id !== saved.id)]);
      setAssets((current) => current.map((asset) =>
        asset.id === saved.item_id ? { ...asset, status: "Baixado" } : asset
      ));
      setIsDialogOpen(false);
      setNewCheckout({ item_type: "asset", quantity: 1, checkout_date: todayStr });
    } else {
      toast.error("Erro ao registrar retirada");
    }
  };

  const handleDelete = async () => {
    if (!checkoutToDelete || isDeleting) return;

    setIsDeleting(true);
    const success = await deleteCheckout(checkoutToDelete.id, {
      name: userName,
      id: user?.id || "",
    });

    if (success) {
      setCheckouts((current) => current.filter((checkout) => checkout.id !== checkoutToDelete.id));
      if (checkoutToDelete.status === "Ativo") {
        setAssets((current) => current.map((asset) =>
          asset.id === checkoutToDelete.item_id && asset.status === "Baixado"
            ? { ...asset, status: "Disponível" }
            : asset
        ));
      }
      setCheckoutToDelete(null);
      toast.success("Retirada excluída");
    } else {
      toast.error("Não foi possível excluir a retirada");
    }
    setIsDeleting(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold">Retiradas de Patrimônio</h1>
                    <Badge variant="outline" className="h-5 px-1.5 gap-1 bg-primary/5"><Zap className="h-2 w-2 text-primary animate-pulse" /> Realtime</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{checkouts.length} registros</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-9 gap-1"><Plus className="h-4 w-4" />Nova retirada</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                  <DialogHeader><DialogTitle>Nova retirada de patrimônio</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Patrimônio <span className="text-destructive">*</span></Label>
                      <Popover open={openItemSelect} onOpenChange={setOpenItemSelect}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openItemSelect}
                            className="w-full justify-between"
                          >
                            {newCheckout.item_id
                              ? assets.find((asset) => asset.id === newCheckout.item_id)?.name
                              : "Selecione o patrimônio"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar patrimônio..." />
                            <CommandList>
                              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                              <CommandGroup>
                                {assets.filter((asset) => asset.status !== "Baixado").map((i) => (
                                  <CommandItem
                                    key={i.id}
                                    value={i.name}
                                    onSelect={() => {
                                      setNewCheckout({ ...newCheckout, item_id: i.id });
                                      setOpenItemSelect(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newCheckout.item_id === i.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {i.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Responsável <span className="text-destructive">*</span></Label>
                        <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openUserSelect}
                              className="w-full justify-between"
                            >
                              {newCheckout.user_id
                                ? users.find((candidate) => candidate.id === newCheckout.user_id)?.name
                                : "Selecione o responsável"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar usuário..." />
                              <CommandList>
                                <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {users.map((u) => (
                                    <CommandItem
                                      key={u.id}
                                      value={u.name}
                                      onSelect={() => {
                                        setNewCheckout({ ...newCheckout, user_id: u.id, user_name: u.name });
                                        setOpenUserSelect(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                        newCheckout.user_id === u.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {u.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Retirada <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        max={todayStr}
                        value={newCheckout.checkout_date ?? todayStr}
                        onChange={e => setNewCheckout({ ...newCheckout, checkout_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Motivo da Retirada{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        placeholder="Ex: Uso em obra, manutenção externa, viagem..."
                        value={newCheckout.notes ?? ""}
                        onChange={e => setNewCheckout({ ...newCheckout, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSaveCheckout} className="w-full">Registrar Retirada</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-card/50 h-10" />
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCheckouts.map((c) => {
              return (
                <StaggerItem key={c.id}>
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-chart-5/20">
                          <Building2 className="h-5 w-5 text-chart-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{c.item_name}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.user_name}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Retirada: {new Date(c.checkout_date).toLocaleDateString("pt-BR")}</span>
                          </div>
                          {c.notes && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic line-clamp-2">
                              <span className="not-italic font-medium text-foreground/70">Motivo:</span> {c.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setCheckoutToDelete(c)}
                          aria-label={`Excluir retirada de ${c.item_name}`}
                          title="Excluir retirada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

        </div>
        <ConfirmDialog
          open={!!checkoutToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setCheckoutToDelete(null);
          }}
          title="Excluir retirada"
          description={`A retirada de ${checkoutToDelete?.item_name || "este patrimônio"} será excluída permanentemente. Esta ação não pode ser desfeita.`}
          confirmText={isDeleting ? "Excluindo..." : "Excluir"}
          variant="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Checkout, Product, Asset, User as AppUser } from "@/lib/store";
import { getCheckouts, isPendingSync, saveCheckout, getProducts, getAssets, getUsers } from "@/lib/db";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  Package,
  Building2,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Check,
  ChevronsUpDown,
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

const statusColors = {
  Ativo: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Devolvido: "bg-green-500/20 text-green-500 border-green-500/30",
  Atrasado: "bg-red-500/20 text-red-500 border-red-500/30",
};

const statusLabels = {
  Ativo: "Em Uso",
  Devolvido: "Devolvido",
  Atrasado: "Atrasado",
};

const statusIcons = {
  Ativo: Clock,
  Devolvido: CheckCircle,
  Atrasado: AlertTriangle,
};

export default function CheckoutsPage() {
  const { userName, user, currentRole, costCenter } = useAuth();
  const scopedCostCenter = getScopedCostCenter(currentRole, costCenter);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCheckout, setNewCheckout] = useState<Partial<Checkout>>({
    item_type: "asset",
    quantity: 1,
  });
  const [openItemSelect, setOpenItemSelect] = useState(false);
  const [openUserSelect, setOpenUserSelect] = useState(false);

  const loadData = useCallback(async (_silent = false) => {
    // if (!silent) setIsLoading(true);
    const [c, p, a, u] = await Promise.all([
      getCheckouts(),
      getProducts(false, scopedCostCenter),
      getAssets(false, scopedCostCenter),
      getUsers()
    ]);
    const visibleProductIds = new Set(p.map((product) => product.id));
    const visibleAssetIds = new Set(a.map((asset) => asset.id));
    setCheckouts(c.filter((checkout) => {
      if (checkout.item_type === "asset") return visibleAssetIds.has(checkout.item_id);
      return visibleProductIds.has(checkout.item_id);
    }));
    setProducts(p);
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
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [checkouts, searchTerm, statusFilter]);

  const handleSaveCheckout = async () => {
    if (!newCheckout.item_id || !newCheckout.user_name || !newCheckout.expected_return_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const selectedUser = users.find((candidate) => candidate.name === newCheckout.user_name);
    if (!selectedUser?.id) {
      toast.error("Selecione um responsável válido");
      return;
    }

    const items = newCheckout.item_type === "asset" ? assets : products;
    const item = items.find((i) => i.id === newCheckout.item_id);
    if (!item) return;
    const payload: Partial<Checkout> = {
      ...newCheckout,
      item_name: item.name,
      user_id: selectedUser.id,
      quantity: newCheckout.quantity || 1,
      checkout_date: new Date().toISOString(),
      status: "Ativo",
    };

    const saved = await saveCheckout(payload, { name: userName, id: user?.id || "" });
    if (saved) {
      if (isPendingSync(saved)) {
        toast.warning("Checkout salvo localmente.", {
          description: "A sincronizacao com o Supabase ainda esta pendente.",
        });
      } else {
        toast.success("Checkout realizado!");
      }
      setCheckouts((current) => [saved, ...current.filter((checkout) => checkout.id !== saved.id)]);
      setIsDialogOpen(false);
      setNewCheckout({ item_type: "asset", quantity: 1 });
    } else {
      toast.error("Erro ao salvar checkout");
    }
  };

  const handleReturn = async (id: string) => {
    const checkout = checkouts.find(c => c.id === id);
    if (!checkout) return;

    const updated = await saveCheckout({ ...checkout, status: "Devolvido", return_date: new Date().toISOString() }, { name: userName, id: user?.id || "" });
    if (updated) {
      if (isPendingSync(updated)) {
        toast.warning("Devolucao salva localmente.", {
          description: updated.__persistenceError || "A sincronizacao com o Supabase ainda esta pendente.",
        });
      } else {
        toast.success("Item devolvido!");
      }
      setCheckouts((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
    } else {
      toast.error("Erro ao registrar devolucao");
    }
  };

  const currentItems = newCheckout.item_type === "asset" ? assets : products;

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
                    <h1 className="text-lg font-bold">Checkouts</h1>
                    <Badge variant="outline" className="h-5 px-1.5 gap-1 bg-primary/5"><Zap className="h-2 w-2 text-primary animate-pulse" /> Realtime</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{checkouts.length} registros</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-9 gap-1"><Plus className="h-4 w-4" />Nova</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                  <DialogHeader><DialogTitle>Novo Checkout</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Tipo de Item</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={newCheckout.item_type === "asset" ? "default" : "outline"} onClick={() => setNewCheckout({ ...newCheckout, item_type: "asset", item_id: "" })}>Patrimônio</Button>
                        <Button variant={newCheckout.item_type === "product" ? "default" : "outline"} onClick={() => setNewCheckout({ ...newCheckout, item_type: "product", item_id: "" })}>Produto</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Item</Label>
                      <Popover open={openItemSelect} onOpenChange={setOpenItemSelect}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openItemSelect}
                            className="w-full justify-between"
                          >
                            {newCheckout.item_id
                              ? currentItems.find((i) => i.id === newCheckout.item_id)?.name
                              : "Selecione..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar item..." />
                            <CommandList>
                              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                              <CommandGroup>
                                {currentItems.map((i) => (
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input type="number" min="1" value={newCheckout.quantity ?? 1} onChange={e => setNewCheckout({ ...newCheckout, quantity: parseInt(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openUserSelect}
                              className="w-full justify-between"
                            >
                              {newCheckout.user_name || "Selecione..."}
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
                                          newCheckout.user_name === u.name ? "opacity-100" : "opacity-0"
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
                    </div>
                    <div className="space-y-2">
                      <Label>Previsão Devolução</Label>
                      <Input type="date" value={newCheckout.expected_return_date ?? ""} onChange={e => setNewCheckout({ ...newCheckout, expected_return_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea value={newCheckout.notes ?? ""} onChange={e => setNewCheckout({ ...newCheckout, notes: e.target.value })} rows={2} />
                    </div>
                    <Button onClick={handleSaveCheckout} className="w-full">Registrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-card/50 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] bg-card/50 h-10"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Em Uso</SelectItem>
                <SelectItem value="Devolvido">Devolvido</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCheckouts.map((c) => {
              const Icon = statusIcons[c.status];
              return (
                <StaggerItem key={c.id}>
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.item_type === 'asset' ? 'bg-chart-5/20' : 'bg-primary/20'}`}>
                          {c.item_type === 'asset' ? <Building2 className="h-5 w-5 text-chart-5" /> : <Package className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{c.item_name}</p>
                            {(c.quantity || 1) > 1 && <Badge variant="secondary" className="text-[10px]">x{c.quantity}</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.user_name}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.checkout_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-[10px] ${statusColors[c.status]}`}>
                              <Icon className="h-3 w-3 mr-1" />{statusLabels[c.status]}
                            </Badge>
                            {c.status !== 'Devolvido' && <span className="text-[10px] text-muted-foreground">Retorno: {new Date(c.expected_return_date || "").toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      {c.status !== 'Devolvido' && (
                        <Button variant="outline" size="sm" onClick={() => handleReturn(c.id)} className="w-full mt-3 h-8 gap-1 text-xs"><RotateCcw className="h-3 w-3" /> Devolver</Button>
                      )}
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

        </div>
      </div>
    </PageTransition>
  );
}

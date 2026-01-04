"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Package,
  Building2,
  ArrowLeftRight,
  Plus,
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  FileBarChart,
  Sparkles,
  Activity,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/estoque"))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Estoque</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/patrimonio"))}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Patrimônio</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/movimentacoes"))}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Movimentações</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/relatorios"))}>
            <FileBarChart className="mr-2 h-4 w-4" />
            <span>Relatórios</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => router.push("/estoque?new=true"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo Produto</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/patrimonio?new=true"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo Patrimônio</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Sistema & Novidades">
          <CommandItem onSelect={() => runCommand(() => router.push("/changelog"))}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Changelog & Atualizações</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/status"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>System Status</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Conta">
          <CommandItem onSelect={() => runCommand(() => router.push("/perfil"))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/perfil/configuracoes"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";


import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Package,
    Building2,
    LogOut,
    Settings,
    FileText,
    Users,
    Search
} from "lucide-react";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden" // Hidden button to satisfy potential accessibility or testing
            >
                Search
            </button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Digite um comando ou busque..." />
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
                        <CommandItem onSelect={() => runCommand(() => router.push("/checkouts"))}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Checkouts</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/documentos"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Documentos</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/admin/usuarios"))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Usuários</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Configurações">
                        <CommandItem onSelect={() => runCommand(() => router.push("/admin/configuracoes"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}

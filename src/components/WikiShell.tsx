"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Book, Search, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WikiSidebarNav } from "@/components/WikiSidebarNav";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Doc {
    slug: string[];
    title: string;
}

export function WikiShell({
    children,
    docs
}: {
    children: React.ReactNode;
    docs: Doc[];
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("wiki_sidebar_collapsed");
        if (saved) {
            setCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem("wiki_sidebar_collapsed", String(newState));
    };

    if (!mounted) return null;

    return (
        <TooltipProvider>
            <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-primary/30">
                {/* Sidebar - Glassmorphism */}
                <aside
                    className={cn(
                        "hidden lg:flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl relative z-10 transition-all duration-300 ease-in-out",
                        collapsed ? "w-[72px]" : "w-72"
                    )}
                >
                    {/* Header */}
                    <div className={cn(
                        "border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent flex items-center transition-all duration-300",
                        collapsed ? "p-4 justify-center" : "p-6"
                    )}>
                        <Link href="/" className="flex items-center gap-3 group overflow-hidden">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 flex-shrink-0">
                                <Book className="h-4 w-4 text-white" />
                            </div>
                            <span
                                className={cn(
                                    "font-bold text-lg tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300",
                                    collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                                )}
                            >
                                SisDavus Wiki
                            </span>
                        </Link>
                    </div>

                    {/* Search or Spacer */}
                    <div className="p-4">
                        {collapsed ? (
                            <div className="h-10 w-full flex items-center justify-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-500 hover:text-white">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Buscar (Em breve)</TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="relative fade-in">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar docs..."
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <div className="flex-1 px-4 pb-6 overflow-y-auto wiki-scrollbar">
                        <WikiSidebarNav docs={docs} collapsed={collapsed} />
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/5 space-y-2">
                        {/* Collapse Toggle */}
                        <Button
                            variant="ghost"
                            size={collapsed ? "icon" : "default"}
                            onClick={toggleCollapse}
                            className={cn(
                                "w-full text-neutral-500 hover:text-white hover:bg-white/5",
                                collapsed ? "justify-center" : "justify-start gap-3"
                            )}
                        >
                            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                            {!collapsed && <span>Recolher Menu</span>}
                        </Button>

                        {/* App Link */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size={collapsed ? "icon" : "default"}
                                    className={cn(
                                        "w-full text-neutral-500 hover:text-white hover:bg-white/5",
                                        collapsed ? "justify-center" : "justify-start gap-3"
                                    )}
                                    asChild
                                >
                                    <Link href="/login">
                                        <LogOut className="h-4 w-4" />
                                        {!collapsed && <span>Ir para o App</span>}
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            {collapsed && <TooltipContent side="right">Ir para o App</TooltipContent>}
                        </Tooltip>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-neutral-950 to-neutral-950">
                    {/* Background Noise/Grid */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                    <div className="relative h-full overflow-y-auto wiki-scrollbar">
                        {children}
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
}

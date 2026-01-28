"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
    slug: string[];
    title: string;
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WikiSidebarNav({ docs, collapsed = false }: { docs: Doc[]; collapsed?: boolean }) {
    const pathname = usePathname();

    return (
        <TooltipProvider>
            <nav className="space-y-1">
                {docs.map((doc) => {
                    const href = `/wiki/${doc.slug[0]}`;
                    // Check if active. Note: pathname usually includes leading slash
                    const isActive = pathname === href;

                    const LinkContent = (
                        <div
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border w-full",
                                isActive
                                    ? "bg-primary/10 text-primary border-primary/20 font-medium"
                                    : "text-neutral-400 border-transparent hover:text-white hover:bg-white/5 hover:border-primary/10",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <div
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-colors flex-shrink-0",
                                    isActive
                                        ? "bg-primary shadow-[0_0_8px_rgba(255,93,56,0.5)]"
                                        : "bg-neutral-700 group-hover:bg-primary"
                                )}
                            />
                            {!collapsed && <span className="truncate">{doc.title}</span>}

                            {!collapsed && (
                                isActive ? (
                                    <ChevronRight className="h-3 w-3 ml-auto text-primary flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all flex-shrink-0" />
                                )
                            )}
                        </div>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={doc.slug[0]}>
                                <TooltipTrigger asChild>
                                    <Link href={href} className="block">
                                        {LinkContent}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    {doc.title}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return (
                        <Link key={doc.slug[0]} href={href} className="block">
                            {LinkContent}
                        </Link>
                    );
                })}
            </nav>
        </TooltipProvider>
    );
}

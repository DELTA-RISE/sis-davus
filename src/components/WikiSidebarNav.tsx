"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
    slug: string[];
    title: string;
}

export function WikiSidebarNav({ docs }: { docs: Doc[] }) {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {docs.map((doc) => {
                const href = `/wiki/${doc.slug[0]}`;
                // Check if active. Note: pathname usually includes leading slash
                const isActive = pathname === href;

                return (
                    <Link
                        key={doc.slug[0]}
                        href={href}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border",
                            isActive
                                ? "bg-primary/10 text-primary border-primary/20 font-medium"
                                : "text-neutral-400 border-transparent hover:text-white hover:bg-white/5 hover:border-primary/10"
                        )}
                    >
                        <div
                            className={cn(
                                "h-1.5 w-1.5 rounded-full transition-colors",
                                isActive
                                    ? "bg-primary shadow-[0_0_8px_rgba(255,93,56,0.5)]"
                                    : "bg-neutral-700 group-hover:bg-primary"
                            )}
                        />
                        <span className="truncate">{doc.title}</span>

                        {isActive ? (
                            <ChevronRight className="h-3 w-3 ml-auto text-primary" />
                        ) : (
                            <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

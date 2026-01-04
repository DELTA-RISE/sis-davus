"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Sunrise } from "lucide-react";

export function LocalizedGreeting({ name }: { name?: string }) {
    const [greeting, setGreeting] = useState("");
    const [icon, setIcon] = useState<React.ReactNode>(null);

    useEffect(() => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            setGreeting("Bom dia");
            setIcon(<Sunrise className="h-4 w-4 text-orange-400" />);
        } else if (hour >= 12 && hour < 18) {
            setGreeting("Boa tarde");
            setIcon(<Sun className="h-4 w-4 text-amber-500" />);
        } else {
            setGreeting("Boa noite");
            setIcon(<Moon className="h-4 w-4 text-indigo-400" />);
        }
    }, []);

    if (!greeting) return null;

    return (
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-accent/30 px-3 py-1.5 rounded-full border border-border/40">
            {icon}
            <span>{greeting}, {name || "Operador"}.</span>
        </div>
    );
}
